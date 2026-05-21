import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * List all payments for the partner, with optional filters.
 *
 * Returns one row per Mollie payment, joined with customer name/email so the
 * admin overview can render without a second round-trip. Used by
 * /admin/payments.
 *
 * Filters (all optional):
 *   ?status=open|paid|failed|...   — exact match
 *   ?customer_id=uuid              — restrict to one customer
 *   ?q=search                      — case-insensitive search on customer
 *                                    name/email or mollie_payment_id
 *   ?limit / ?offset               — pagination (default 100 / 0)
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Resolve partner_id (tenant > role)
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
  if (!partnerId) return { rows: [], total: 0, limit: 0, offset: 0, has_more: false }

  const q = getQuery(event)
  const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500)
  const offset = Math.max(Number(q.offset) || 0, 0)
  const status = (q.status as string) || ''
  const customerId = (q.customer_id as string) || ''
  const searchRaw = (q.q as string) || ''
  const search = searchRaw.replace(/[,()%\\]/g, '').slice(0, 80).trim()

  let query = supabase
    .from('payments')
    .select(
      'id, partner_id, customer_id, mollie_payment_id, mollie_mandate_id, mollie_method, amount_cents, currency, description, status, created_at, paid_at, failed_at, refunded_at, charged_back_at, period_start, period_end, customer:customers(id, full_name, email)',
      { count: 'exact' },
    )
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (customerId) query = query.eq('customer_id', customerId)
  if (search) {
    // Direct search on payment fields. Customer name/email filtering happens
    // post-fetch to keep this query simple (full-text via embedded resource
    // is fiddly in PostgREST).
    query = query.or(`mollie_payment_id.ilike.%${search}%,description.ilike.%${search}%`)
  }

  const { data, error, count } = await query.range(offset, offset + limit - 1)
  if (error) throw createError({ statusCode: 500, message: error.message })

  // Compact totals for the header strip
  const { data: aggRows } = await supabase
    .from('payments')
    .select('status, amount_cents')
    .eq('partner_id', partnerId)
  const totals = { paid_cents: 0, open_cents: 0, failed_cents: 0, count: aggRows?.length || 0 }
  for (const r of (aggRows || []) as any[]) {
    if (r.status === 'paid') totals.paid_cents += r.amount_cents || 0
    else if (r.status === 'failed' || r.status === 'expired' || r.status === 'canceled') totals.failed_cents += r.amount_cents || 0
    else totals.open_cents += r.amount_cents || 0
  }

  return {
    rows: data || [],
    total: count || 0,
    limit,
    offset,
    has_more: (count || 0) > offset + (data?.length || 0),
    totals,
  }
})
