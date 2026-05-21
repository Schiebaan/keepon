import { getServiceRoleClient } from '~~/server/utils/supabase'
import { getWeheatAccessToken } from '~~/server/utils/weheat'
import { memoryCache } from '~~/server/utils/cache'

const API_URL = 'https://api.weheat.nl/third_party/api/v1'

// Cache live + totals data for 60s. Customer-side polling has a manual
// refresh button which sends ?fresh=1 to bypass this cache.
const heatpumpMetaCache = memoryCache<any>(5 * 60 * 1000)   // 5 min: metadata barely changes
const heatpumpLogCache = memoryCache<any>(60 * 1000)        // 1 min: live values
const heatpumpTotalCache = memoryCache<any>(2 * 60 * 1000)  // 2 min: lifetime totals

/**
 * Live Weheat data for the customer's heat pump.
 *
 * Combines three endpoints:
 *   GET /heat-pumps/{id}              → metadata (serial, model, commissionedAt)
 *   GET /heat-pumps/{id}/logs/latest  → live values (temperatures, rpm, state)
 *   GET /energy-logs/{id}/total       → lifetime kWh breakdown
 *
 * The /heat-pumps/{id}/{daily,monthly} energy endpoints are NOT exposed to
 * third parties (403). So we don't ship a monthly bar chart for heat pumps —
 * just the totals (per use-case) plus the current snapshot.
 */

// Derive a friendly state from `isOnline` + `rpm` + raw state code. The raw
// state-code mapping isn't documented; we use the live numerics to decide.
function deriveState(log: any): { key: string; label: string; hint: string; tone: 'idle' | 'standby' | 'heating' | 'error' } {
  if (!log || log.isOnline === false) {
    return { key: 'offline', label: 'Niet bereikbaar', hint: 'Geen verbinding met internet of stroom.', tone: 'error' }
  }
  const rpm = Number(log.rpm) || 0
  const powerOut = Number(log.cmMassPowerOut) || 0
  if (rpm > 50 || powerOut > 0) {
    return { key: 'heating', label: 'Aan het verwarmen', hint: 'Stroom wordt nu omgezet in warmte.', tone: 'heating' }
  }
  return { key: 'standby', label: 'Stand-by', hint: 'Online en klaar voor warmtevraag.', tone: 'standby' }
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  // 1. Customer + linked heat pump
  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  const { data: product } = await supabase
    .from('customer_products')
    .select('id, category, serial_number, brand, model, name')
    .eq('customer_id', customer.id)
    .eq('category', 'heat_pump')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const s = product?.serial_number || ''
  if (!s.startsWith('weheat:')) {
    return { linked: false }
  }
  const heatpumpId = s.slice('weheat:'.length)

  // 2. Partner credentials
  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', customer.partner_id)
    .eq('integration_type', 'weheat')
    .eq('is_active', true)
    .single()
  if (!creds?.credentials?.refresh_token) {
    return { linked: true, heatpump_id: heatpumpId, error: 'Weheat is nog niet verbonden voor deze partner.' }
  }

  let token: string
  try {
    token = await getWeheatAccessToken(creds.credentials, event, customer.partner_id)
  } catch {
    return { linked: true, heatpump_id: heatpumpId, error: 'Inloggen bij Weheat mislukt. Verbind opnieuw via Settings.' }
  }

  // 3. Pull metadata, latest log, and totals in parallel (cached unless the
  // caller asked for a forced refresh via ?fresh=1)
  const headers = { Authorization: `Bearer ${token}` }
  const fresh = getQuery(event).fresh === '1'

  async function fetchMeta() {
    return await $fetch<any>(`${API_URL}/heat-pumps/${heatpumpId}`, { headers })
  }
  async function fetchLog() {
    return await $fetch<any>(`${API_URL}/heat-pumps/${heatpumpId}/logs/latest`, { headers })
  }
  async function fetchTotal() {
    return await $fetch<any>(`${API_URL}/energy-logs/${heatpumpId}/total`, { headers })
  }

  if (fresh) {
    heatpumpMetaCache.invalidate(heatpumpId)
    heatpumpLogCache.invalidate(heatpumpId)
    heatpumpTotalCache.invalidate(heatpumpId)
  }

  const [metaRes, logRes, totalRes] = await Promise.allSettled([
    heatpumpMetaCache.getOrLoad(heatpumpId, fetchMeta),
    heatpumpLogCache.getOrLoad(heatpumpId, fetchLog),
    heatpumpTotalCache.getOrLoad(heatpumpId, fetchTotal),
  ])

  const meta = metaRes.status === 'fulfilled' ? metaRes.value : null
  const log = logRes.status === 'fulfilled' ? logRes.value : null
  const total = totalRes.status === 'fulfilled' ? totalRes.value : null

  const state = deriveState(log)

  // Lifetime totals: sum the per-mode buckets
  const eIn = total ? (
    (total.totalEInHeating || 0)
    + (total.totalEInStandby || 0)
    + (total.totalEInDhw || 0)
    + (total.totalEInHeatingDefrost || 0)
    + (total.totalEInDhwDefrost || 0)
    + (total.totalEInCooling || 0)
  ) : 0
  const eOut = total ? (
    (total.totalEOutHeating || 0)
    + (total.totalEOutDhw || 0)
    + (total.totalEOutHeatingDefrost || 0)
    + (total.totalEOutDhwDefrost || 0)
    + (total.totalEOutCooling || 0)
  ) : 0
  const scop = eIn > 0 ? Math.round((eOut / eIn) * 10) / 10 : 0

  // Round helpers
  const r1 = (v: any) => v == null ? null : Math.round(Number(v) * 10) / 10
  const r0 = (v: any) => v == null ? null : Math.round(Number(v))

  // --- Snapshots: write one if the previous is > 12 h old; then return
  // diffs against snapshots that bracket "this week" and "this month".
  let weekKwhIn = 0, weekKwhOut = 0, monthKwhIn = 0, monthKwhOut = 0
  let hasWeekData = false, hasMonthData = false
  if (total) {
    try {
      const { data: lastSnap } = await supabase
        .from('weheat_snapshots')
        .select('taken_at')
        .eq('heatpump_id', heatpumpId)
        .order('taken_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      const lastAge = lastSnap ? Date.now() - new Date(lastSnap.taken_at).getTime() : Infinity
      if (lastAge > 12 * 60 * 60 * 1000) {
        await supabase.from('weheat_snapshots').insert({
          partner_id: customer.partner_id,
          heatpump_id: heatpumpId,
          e_in_total: eIn,
          e_out_total: eOut,
          e_in_heating: total.totalEInHeating || 0,
          e_in_standby: total.totalEInStandby || 0,
          e_in_dhw: total.totalEInDhw || 0,
          e_in_defrost: (total.totalEInHeatingDefrost || 0) + (total.totalEInDhwDefrost || 0),
          e_in_cooling: total.totalEInCooling || 0,
          e_out_heating: total.totalEOutHeating || 0,
          e_out_dhw: total.totalEOutDhw || 0,
          e_out_defrost: (total.totalEOutHeatingDefrost || 0) + (total.totalEOutDhwDefrost || 0),
          e_out_cooling: total.totalEOutCooling || 0,
        })
      }

      // For week/month diffs: find the oldest snapshot within the period and
      // diff it against the current totals.
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

      const { data: weekRef } = await supabase
        .from('weheat_snapshots')
        .select('e_in_total, e_out_total, taken_at')
        .eq('heatpump_id', heatpumpId)
        .lte('taken_at', weekAgo)
        .order('taken_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (weekRef) {
        weekKwhIn = eIn - Number(weekRef.e_in_total || 0)
        weekKwhOut = eOut - Number(weekRef.e_out_total || 0)
        hasWeekData = weekKwhIn >= 0 && weekKwhOut >= 0
      }

      const { data: monthRef } = await supabase
        .from('weheat_snapshots')
        .select('e_in_total, e_out_total, taken_at')
        .eq('heatpump_id', heatpumpId)
        .lte('taken_at', monthAgo)
        .order('taken_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (monthRef) {
        monthKwhIn = eIn - Number(monthRef.e_in_total || 0)
        monthKwhOut = eOut - Number(monthRef.e_out_total || 0)
        hasMonthData = monthKwhIn >= 0 && monthKwhOut >= 0
      }
    } catch {
      // Snapshot table missing or insert blocked → not fatal, keep going.
    }
  }

  // Days since commissioning (for "gemiddeld per dag" math)
  let daysActive: number | null = null
  if (meta?.commissionedAt) {
    const ms = Date.now() - new Date(meta.commissionedAt).getTime()
    daysActive = Math.max(1, Math.floor(ms / (1000 * 60 * 60 * 24)))
  }
  const avgKwhOutPerDay = daysActive && eOut > 0 ? Math.round((eOut / daysActive) * 10) / 10 : null
  const avgKwhInPerDay = daysActive && eIn > 0 ? Math.round((eIn / daysActive) * 10) / 10 : null

  // --- Gas-savings comparison (rough but conservative). Numbers tuned for NL 2026:
  //   Average gas boiler at ~95% efficiency → 1 kWh heat = 0.108 m³ gas
  //   Avg gas price = €1.45/m³, avg electricity = €0.30/kWh
  const GAS_PRICE_PER_M3 = 1.45
  const ELEC_PRICE_PER_KWH = 0.30
  const M3_PER_KWH_HEAT_GAS = 0.108  // 1 / (9.77 * 0.95)
  const gasM3Avoided = eOut > 0 ? Math.round(eOut * M3_PER_KWH_HEAT_GAS) : 0
  const gasCostAvoided = Math.round(gasM3Avoided * GAS_PRICE_PER_M3)
  const electricityCost = Math.round(eIn * ELEC_PRICE_PER_KWH)
  const netSavings = Math.max(0, gasCostAvoided - electricityCost)

  return {
    linked: true,
    heatpump_id: heatpumpId,
    serial_number: meta?.serialNumber || null,
    model: meta?.model || null,
    part_number: meta?.partNumber || null,
    commissioned_at: meta?.commissionedAt || null,

    // State
    state: state.key,
    state_label: state.label,
    state_hint: state.hint,
    state_tone: state.tone,
    online: log?.isOnline !== false,
    last_update: log?.timestamp || null,

    // Live snapshot
    rpm: r0(log?.rpm),
    air_in_c: r1(log?.tAirIn),
    water_out_c: r1(log?.tWaterOut),       // aanvoer (naar huis)
    water_return_c: r1(log?.tWaterIn),     // retour (terug uit huis)
    water_house_in_c: r1(log?.tWaterHouseIn),
    room_c: r1(log?.tRoom),
    room_target_c: r1(log?.tRoomTarget),
    compressor_in_c: r1(log?.tCompressorIn),
    compressor_out_c: r1(log?.tCompressorOut),
    signal_strength: log?.signalStrength ?? null,

    // Lifetime totals
    lifetime_kwh_in: Math.round(eIn * 10) / 10,
    lifetime_kwh_out: Math.round(eOut * 10) / 10,
    scop,

    // How long has the heat pump been working?
    days_active: daysActive,
    avg_kwh_out_per_day: avgKwhOutPerDay,
    avg_kwh_in_per_day: avgKwhInPerDay,

    // Period totals (from our own snapshots — empty arrays until we have history)
    week: hasWeekData ? {
      kwh_in: Math.round(weekKwhIn * 10) / 10,
      kwh_out: Math.round(weekKwhOut * 10) / 10,
    } : null,
    month: hasMonthData ? {
      kwh_in: Math.round(monthKwhIn * 10) / 10,
      kwh_out: Math.round(monthKwhOut * 10) / 10,
    } : null,

    // Cost / gas comparison
    savings: {
      gas_m3_avoided: gasM3Avoided,
      gas_cost_avoided_eur: gasCostAvoided,
      electricity_cost_eur: electricityCost,
      net_savings_eur: netSavings,
    },

    // Breakdown of where the lifetime energy went (kWh in by category)
    breakdown_in: total ? {
      heating: Math.round((total.totalEInHeating || 0) * 10) / 10,
      standby: Math.round((total.totalEInStandby || 0) * 10) / 10,
      dhw: Math.round((total.totalEInDhw || 0) * 10) / 10,
      defrost: Math.round(((total.totalEInHeatingDefrost || 0) + (total.totalEInDhwDefrost || 0)) * 10) / 10,
      cooling: Math.round((total.totalEInCooling || 0) * 10) / 10,
    } : null,
  }
})
