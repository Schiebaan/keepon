import { getServiceRoleClient } from '~~/server/utils/supabase'
import { computeCustomerCharge } from '~~/server/utils/pricing'

/**
 * Lees pricing-instellingen van één klant + de afgeleide totalen.
 *
 * Geeft genoeg terug om de "Tarief"-kaart op /admin/customers/[id] te
 * renderen zonder een tweede call: zowel de rauwe configuratie (interval,
 * trial, overrides) als wat de helper er nu mee uitrekent (maand/jaar-totalen,
 * trial-status, prijs per regel).
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

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
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, accepted_modules, billing_interval, yearly_discount_months, trial_months, mandate_at')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  const compute = await computeCustomerCharge(supabase, customer.id)

  // Standaard partner-prijzen voor weergave naast de overrides
  const { data: configs } = await supabase
    .from('partner_module_configs')
    .select('price_monthly, is_enabled, module_definition:module_definitions(type, name)')
    .eq('partner_id', partnerId)
  const partnerDefaults: { module_type: string; name: string; price_monthly_cents: number }[] = []
  for (const cfg of (configs || []) as any[]) {
    const t = cfg?.module_definition?.type
    if (!t) continue
    if (cfg.is_enabled === false) continue
    partnerDefaults.push({
      module_type: t,
      name: cfg.module_definition.name || t,
      price_monthly_cents: cfg.price_monthly || 0,
    })
  }

  return {
    billing_interval: compute.billing_interval,
    yearly_discount_months: compute.yearly_discount_months,
    trial_months: customer.trial_months || 0,
    mandate_at: customer.mandate_at,
    trial: compute.trial,
    lines: compute.lines,
    monthly_total_cents: compute.monthly_total_cents,
    yearly_total_cents: compute.yearly_total_cents,
    accepted_modules: Array.isArray(customer.accepted_modules) ? customer.accepted_modules : [],
    partner_defaults: partnerDefaults,
  }
})
