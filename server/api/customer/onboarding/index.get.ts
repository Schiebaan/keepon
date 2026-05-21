import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Onboarding state + proposal for the currently logged-in customer.
 * Returns:
 *   - step: where the customer is in the flow (hero | voorstel | incasso | done)
 *   - customer: name + first name
 *   - partner: branding (name, logo, support contact, primary color)
 *   - products: per-module entries with the partner's monthly + yearly price
 *   - totals: summed monthly + yearly across modules
 *   - timestamps: accepted_at / mandate_at
 */

const CATEGORY_TO_MODULE: Record<string, string> = {
  solar_panel: 'solar',
  heat_pump: 'heat_pump',
  ev_charger: 'ev_charger',
  battery: 'battery',
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email, street, house_number, postal_code, city, billing_interval, yearly_discount_months, trial_months')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer) {
    throw createError({ statusCode: 404, message: 'Geen klantaccount gevonden' })
  }

  // Onboarding state lives on the auth user metadata so it's session-independent
  const onboarding = (user.user_metadata as any)?.onboarding || {
    step: 'hero',
    accepted_at: null,
    mandate_at: null,
    mandate_skipped: false,
    accepted_modules: null,
  }

  const [{ data: partner }, { data: products }, { data: pricing }, { data: overrides }] = await Promise.all([
    supabase.from('partners')
      .select('id, name, slug, logo_url, primary_color, secondary_color, support_email, support_phone, terms_url, terms_placeholders')
      .eq('id', customer.partner_id)
      .single(),
    supabase.from('customer_products')
      .select('id, category, brand, model, notes')
      .eq('customer_id', customer.id),
    // Partner's pricing per module: join module_definitions for the type code
    supabase.from('partner_module_configs')
      .select('id, price_monthly, price_yearly, is_enabled, min_contract_months, module_definition:module_definitions(type, name, description)')
      .eq('partner_id', customer.partner_id),
    // Klant-specifieke prijsoverrides — admin kan ze gezet hebben bij uitnodigen
    supabase.from('customer_module_prices')
      .select('module_type, price_monthly_cents, reason')
      .eq('customer_id', customer.id),
  ])

  // Build a price map keyed by module type. Override → standaardtarief.
  const overrideByModule = new Map<string, number>()
  for (const o of (overrides || []) as any[]) {
    overrideByModule.set(o.module_type, o.price_monthly_cents || 0)
  }

  const priceByModule = new Map<string, { monthly: number; yearly: number; minMonths: number; description?: string; enabled: boolean; isCustom: boolean }>()
  for (const p of pricing || []) {
    const def: any = (p as any).module_definition
    const moduleType = def?.type
    if (!moduleType) continue
    const override = overrideByModule.get(moduleType)
    const monthly = override ?? (p.price_monthly || 0)
    // Yearly = monthly × (12 − discount_months). We rekenen 'm hier alvast uit
    // zodat de UI niets hoeft te weten over de korting-formule. NB: gebruik
    // de KLANT-specifieke yearly_discount_months (default 0 als niet gezet).
    const discountMonths = Math.max(0, Number(customer.yearly_discount_months) || 0)
    const yearly = monthly * Math.max(0, 12 - discountMonths)
    priceByModule.set(moduleType, {
      monthly,
      yearly,
      minMonths: p.min_contract_months || 0,
      description: def?.description,
      enabled: p.is_enabled !== false,
      isCustom: override !== undefined,
    })
  }

  const moduleProducts = (products || [])
    .map(p => {
      const moduleType = CATEGORY_TO_MODULE[p.category as string]
      if (!moduleType) return null
      const price = priceByModule.get(moduleType)
      return {
        id: p.id,
        category: p.category,
        module: moduleType,
        brand: p.brand,
        model: p.model,
        notes: p.notes,
        price: price ? {
          monthly_cents: price.monthly,
          yearly_cents: price.yearly,
          min_months: price.minMonths,
          enabled: price.enabled,
          is_custom: price.isCustom,
        } : null,
      }
    })
    .filter(Boolean) as any[]

  // Deduplicate to one entry per module type for the proposal (a customer can have
  // multiple solar products but typically one service tier per module).
  const seen = new Set<string>()
  const proposalModules = moduleProducts.filter(p => {
    if (seen.has(p.module)) return false
    seen.add(p.module)
    return true
  })

  const totalMonthly = proposalModules.reduce((s, p) => s + (p.price?.monthly_cents || 0), 0)
  const totalYearly = proposalModules.reduce((s, p) => s + (p.price?.yearly_cents || 0), 0)

  // Compose a single-line address (e.g. "Torenmolenpad 8")
  const addressShort = customer.street && customer.house_number
    ? `${customer.street} ${customer.house_number}`
    : null

  return {
    step: onboarding.step || 'hero',
    accepted_at: onboarding.accepted_at,
    accepted_modules: Array.isArray(onboarding.accepted_modules) ? onboarding.accepted_modules : null,
    mandate_at: onboarding.mandate_at,
    mandate_skipped: !!onboarding.mandate_skipped,
    customer: {
      full_name: customer.full_name,
      first_name: (customer.full_name || customer.email || '').split(' ')[0],
      email: customer.email,
      address_short: addressShort,
      street: customer.street,
      house_number: customer.house_number,
      postal_code: customer.postal_code,
      city: customer.city,
    },
    partner: partner ? {
      name: partner.name,
      slug: partner.slug,
      logo_url: partner.logo_url,
      primary_color: partner.primary_color,
      secondary_color: partner.secondary_color,
      support_email: partner.support_email,
      support_phone: partner.support_phone,
      terms_url: partner.terms_url || `/voorwaarden/${partner.slug}`,
    } : null,
    proposal: {
      modules: proposalModules,
      total_monthly_cents: totalMonthly,
      total_yearly_cents: totalYearly,
      // Pricing-flexibility velden — UI gebruikt 'm voor termijn-keuze + trial
      billing_interval: (customer.billing_interval === 'yearly' ? 'yearly' : 'monthly') as 'monthly' | 'yearly',
      yearly_discount_months: Math.max(0, Number(customer.yearly_discount_months) || 0),
      trial_months: Math.max(0, Number(customer.trial_months) || 0),
    },
  }
})
