import { getServiceRoleClient } from '~~/server/utils/supabase'
import { computeCustomerCharge } from '~~/server/utils/pricing'

/**
 * Contracten-overzicht voor de ingelogde klant.
 *
 * Pricing-logic (per-module overrides, jaarkorting, trial) leeft volledig in
 * computeCustomerCharge — hier voegen we alleen mandaat-status toe.
 *
 * `mandate.state` is:
 *   - mandate_active     → mollie_mandate_id is gevuld
 *   - mandate_pending    → mandate_at gevuld maar bank nog niet bevestigd
 *   - mandate_skipped    → klant koos "later"
 *   - mandate_not_set    → klant is na akkoord nooit langs incasso geweest
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, mollie_customer_id, mollie_mandate_id, mandate_at, mandate_skipped')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) {
    return {
      mandate: { state: 'mandate_not_set', mandate_at: null, mandate_skipped: false, active: false },
      lines: [],
      total_monthly_cents: 0,
      total_yearly_cents: 0,
      billing_interval: 'monthly',
      yearly_discount_months: 0,
      trial: null,
      accepted_at: null,
    }
  }

  const compute = await computeCustomerCharge(supabase, customer.id)

  // Haal accepted_at apart op zodat klant kan zien wanneer 'ie akkoord gaf
  const { data: acceptedRow } = await supabase
    .from('customers')
    .select('accepted_at')
    .eq('id', customer.id)
    .single()

  // Mandate-status — afgeleid uit drie kolommen op customers
  let state: 'mandate_active' | 'mandate_pending' | 'mandate_skipped' | 'mandate_not_set'
  if (customer.mollie_mandate_id) state = 'mandate_active'
  else if (customer.mandate_at) state = 'mandate_pending'
  else if (customer.mandate_skipped) state = 'mandate_skipped'
  else state = 'mandate_not_set'

  // Klant-zicht: per-module prijs + indicatie of het een afwijkend tarief is.
  // We tonen wel "afwijkend tarief" maar NIET het standaard partnertarief
  // (geen "korting van X naar Y" suggereren — dat is een verkoopgesprek, niet
  // iets dat hier hoort).
  const lines = compute.lines.map(l => ({
    module_type: l.module_type,
    name: l.name,
    price_monthly_cents: l.price_monthly_cents,
    is_custom_price: l.default_price_monthly_cents !== null,
  }))

  return {
    mandate: {
      state,
      active: state === 'mandate_active',
      mandate_at: customer.mandate_at,
      mandate_skipped: !!customer.mandate_skipped,
    },
    lines,
    total_monthly_cents: compute.monthly_total_cents,
    total_yearly_cents: compute.yearly_total_cents,
    billing_interval: compute.billing_interval,
    yearly_discount_months: compute.yearly_discount_months,
    trial: compute.trial,
    accepted_at: acceptedRow?.accepted_at || null,
  }
})
