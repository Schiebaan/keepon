import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Returns the logged-in customer's own payment history.
 *
 * RLS would already restrict the rows to this customer, but we use the
 * service-role client (like the other /api/customer endpoints) so we can
 * keep the customer lookup logic consistent — and explicitly filter on
 * customer_id ourselves.
 *
 * Used on /klant/facturen.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, mollie_customer_id, mollie_mandate_id, mandate_at, mandate_skipped')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) return { customer: null, rows: [] }

  const { data: payments } = await supabase
    .from('payments')
    .select('id, mollie_payment_id, mollie_method, amount_cents, currency, description, status, created_at, paid_at, failed_at, period_start, period_end')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(200)

  return {
    customer: {
      mandate_active: !!customer.mollie_mandate_id,
      mandate_at: customer.mandate_at,
      mandate_skipped: !!customer.mandate_skipped,
    },
    rows: payments || [],
  }
})
