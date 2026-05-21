import { getServiceRoleClient } from '~~/server/utils/supabase'
import { memoryCache } from '~~/server/utils/cache'

/**
 * Live Easee data for the logged-in customer's charger.
 *
 * Pulls:
 *   - current state (online, opMode, session energy)
 *   - month-by-month history (last 12 months) via /api/sessions/charger/{id}/monthly
 *
 * Uses the partner's stored Easee credentials. The customer never sees those.
 * Calls are cached for 60s (state) and 30 min (monthly history) — manual
 * refresh sends ?fresh=1 to bypass.
 */

const EASEE_API = 'https://api.easee.com/api'
const EASEE_TOKEN_URL = 'https://auth.easee.com/realms/easee/protocol/openid-connect/token'

const chargerStateCache = memoryCache<any>(60 * 1000)        // 1 min: live
const chargerMonthlyCache = memoryCache<any[]>(30 * 60 * 1000) // 30 min: history

// Easee opMode codes → human-friendly Dutch labels + a short explainer the
// UI shows underneath for status codes that can confuse a layman.
const OP_MODE_LABELS: Record<number, { label: string; hint?: string; tone: 'idle' | 'ready' | 'charging' | 'done' | 'error' }> = {
  0: { label: 'Niet bereikbaar', hint: 'Geen verbinding met internet of stroom.',     tone: 'error' },
  1: { label: 'Wacht op auto',   hint: 'Sluit een auto aan om te beginnen met laden.', tone: 'idle' },
  2: { label: 'Auto aangesloten', hint: 'Auto staat klaar, laden begint zo.',          tone: 'ready' },
  3: { label: 'Aan het laden',   hint: 'Stroom gaat nu naar je auto.',                 tone: 'charging' },
  4: { label: 'Sessie klaar',    hint: 'Laden voltooid. Stekker kan eruit.',           tone: 'done' },
  5: { label: 'Storing',         hint: 'Laadpaal kan niet laden. Neem contact op.',    tone: 'error' },
  6: { label: 'Klaar om te laden', hint: 'Klaar voor de volgende laadsessie.',         tone: 'ready' },
  7: { label: 'Wacht op autorisatie', hint: 'Houd je laadpas voor de paal of bevestig in de app.', tone: 'ready' },
}

async function getEaseeToken(creds: any): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: 'easee',
    username: (creds.username || creds.email || '').trim(),
    password: (creds.password || '').trim(),
    scope: 'email offline_access',
  })
  const res = await $fetch<{ access_token: string }>(EASEE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return res.access_token
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  // 1. Resolve customer + their linked ev_charger
  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  const { data: product } = await supabase
    .from('customer_products')
    .select('id, category, serial_number')
    .eq('customer_id', customer.id)
    .eq('category', 'ev_charger')
    .order('updated_at', { ascending: false })
    .limit(1)
    .single()

  const s = product?.serial_number || ''
  if (!s.startsWith('easee:')) {
    return { linked: false }
  }
  const chargerId = s.slice('easee:'.length)

  // 2. Fetch partner's Easee credentials
  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', customer.partner_id)
    .eq('integration_type', 'easee')
    .eq('is_active', true)
    .single()
  if (!creds?.credentials) {
    return { linked: true, charger_id: chargerId, error: 'Geen Easee-credentials voor deze partner' }
  }

  // 3. Auth + fetch state + monthly history in parallel
  let token: string
  try {
    token = await getEaseeToken(creds.credentials)
  } catch (e: any) {
    return { linked: true, charger_id: chargerId, error: 'Inloggen bij Easee mislukt' }
  }

  const fromYear = new Date()
  fromYear.setFullYear(fromYear.getFullYear() - 1)
  const from = fromYear.toISOString().slice(0, 19)
  const to = new Date().toISOString().slice(0, 19)

  const fresh = getQuery(event).fresh === '1'
  if (fresh) {
    chargerStateCache.invalidate(chargerId)
    chargerMonthlyCache.invalidate(chargerId)
  }

  const headers = { Authorization: `Bearer ${token}` }
  const [stateRes, monthlyRes] = await Promise.allSettled([
    chargerStateCache.getOrLoad(chargerId, () =>
      $fetch<any>(`${EASEE_API}/chargers/${chargerId}/state`, { headers }),
    ),
    chargerMonthlyCache.getOrLoad(chargerId, () =>
      $fetch<any[]>(`${EASEE_API}/sessions/charger/${chargerId}/monthly?from=${from}&to=${to}`, { headers }),
    ),
  ])

  const state = stateRes.status === 'fulfilled' ? stateRes.value : null
  const monthly = monthlyRes.status === 'fulfilled' ? (monthlyRes.value || []) : []

  // 4. Aggregate
  const now = new Date()
  const thisYear = now.getFullYear()
  const thisMonth = now.getMonth() + 1
  const current = monthly.find(m => m.year === thisYear && m.month === thisMonth)
    || { totalEnergyUsage: 0, totalCost: 0, currencyId: 'EUR' }

  const monthlyHistory = monthly
    .map(m => ({
      year: m.year,
      month: m.month,
      kwh: Math.round((m.totalEnergyUsage || 0) * 10) / 10,
      cost_eur: Math.round((m.totalCost || 0) * 100) / 100,
    }))
    .sort((a, b) => (a.year - b.year) || (a.month - b.month))

  const opMode = state?.chargerOpMode
  const opModeInfo = typeof opMode === 'number' ? OP_MODE_LABELS[opMode] : null

  return {
    linked: true,
    charger_id: chargerId,
    online: !!state?.isOnline,
    op_mode: opMode ?? null,
    op_mode_label: opModeInfo?.label || 'Onbekend',
    op_mode_hint: opModeInfo?.hint || null,
    op_mode_tone: opModeInfo?.tone || 'idle',
    current_session_kwh: state?.sessionEnergy ? Math.round(state.sessionEnergy * 100) / 100 : 0,
    current_power_w: state?.totalPower ? Math.round(state.totalPower) : 0,
    lifetime_kwh: state?.lifetimeEnergy ? Math.round(state.lifetimeEnergy) : 0,
    voltage: state?.voltage ? Math.round(state.voltage * 10) / 10 : 0,
    current_month: {
      kwh: Math.round((current.totalEnergyUsage || 0) * 10) / 10,
      cost_eur: Math.round((current.totalCost || 0) * 100) / 100,
    },
    monthly_history: monthlyHistory,
  }
})
