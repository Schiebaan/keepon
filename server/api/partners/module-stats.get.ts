import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Per-partner module statistics for the admin dashboard.
 * Returns: for each category, the total number of customer_products in that category
 * plus the number currently connected to a monitoring platform (recognized via the
 * 'sundata:' prefix on serial_number for solar panels).
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  const tenant = (event.context as any).tenant
  let partnerId = tenant?.id
  if (!partnerId) {
    const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
    partnerId = role?.partner_id
    if (role?.role === 'platform_admin' && !partnerId) {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }

  const empty = { solar_panel: { total: 0, monitored: 0 }, heat_pump: { total: 0, monitored: 0 }, ev_charger: { total: 0, monitored: 0 }, battery: { total: 0, monitored: 0 } }
  if (!partnerId) return empty

  const { data: products } = await supabase
    .from('customer_products')
    .select('category, serial_number')
    .eq('partner_id', partnerId)

  const stats: Record<string, { total: number; monitored: number }> = {
    solar_panel: { total: 0, monitored: 0 },
    heat_pump:   { total: 0, monitored: 0 },
    ev_charger:  { total: 0, monitored: 0 },
    battery:     { total: 0, monitored: 0 },
  }

  for (const p of products || []) {
    const cat = p.category as keyof typeof stats
    if (!stats[cat]) continue
    stats[cat].total += 1
    // Currently only solar has a monitoring marker (sundata link in serial_number).
    // Others will get their own markers when Weheat/Easee onboarding lands.
    if (p.serial_number && typeof p.serial_number === 'string' && p.serial_number.startsWith('sundata:')) {
      stats[cat].monitored += 1
    }
  }

  return stats
})
