import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Get partner ID
  const { data: role } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single()

  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const tenant = event.context.tenant
    if (tenant?.id) partnerId = tenant.id
    else {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }

  if (!partnerId) return { rows: [], total: 0, limit: 0, offset: 0, has_more: false }

  // --- Server-side filters + pagination -------------------------------------
  const q = getQuery(event)
  const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500)
  const offset = Math.max(Number(q.offset) || 0, 0)
  const accepted = (q.accepted as string) || 'any'  // 'true' | 'false' | 'any'
  const moduleFilter = (q.module as string) || ''
  const searchRaw = (q.q as string) || ''
  // PostgREST .or() takes a comma-separated string; commas + parens in input
  // would break parsing. Strip them and the SQL wildcards we don't want users
  // controlling. Whitelist a safe set.
  const search = searchRaw.replace(/[,()%\\]/g, '').slice(0, 80).trim()

  let baseQuery = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (accepted === 'true') baseQuery = baseQuery.not('accepted_at', 'is', null)
  else if (accepted === 'false') baseQuery = baseQuery.is('accepted_at', null)

  if (search) {
    baseQuery = baseQuery.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`,
    )
  }

  // Module filter requires a join; do that via an explicit subquery on
  // customer_products with .in() of pre-filtered customer ids.
  if (moduleFilter) {
    const { data: matchingProducts } = await supabase
      .from('customer_products')
      .select('customer_id')
      .eq('category', moduleFilter)
    const ids = Array.from(new Set((matchingProducts || []).map((p: any) => p.customer_id)))
    if (!ids.length) {
      return { rows: [], total: 0, limit, offset, has_more: false }
    }
    baseQuery = baseQuery.in('id', ids)
  }

  baseQuery = baseQuery.range(offset, offset + limit - 1)

  const { data, error, count } = await baseQuery
  if (error) throw createError({ statusCode: 500, message: error.message })
  const customers = data || []
  const total = count ?? customers.length
  if (!customers.length) {
    return { rows: [], total, limit, offset, has_more: false }
  }

  // Enrich with per-customer products (for the "Modules" column in the list)
  // and onboarding status (for "Mail verstuurd / Akkoord / Incasso" badges).
  const customerIds = customers.map(c => c.id)

  const { data: products } = await supabase
    .from('customer_products')
    .select('customer_id, category, integration_type, serial_number')
    .in('customer_id', customerIds)

  // Per customer, per category: are there any products at all, and is at
  // least one of them linked to its monitoring platform?
  //
  // "Linked" detection today is solar-only via the `serial_number`-hack
  // (`sundata:companyId/plantId/meterId`). Heat pump / EV / battery have no
  // linkage indicator yet, so they always read as not-linked. That's still
  // useful: it surfaces what the installer still needs to connect.
  const productsByCustomer = new Map<string, string[]>()
  const linkageByCustomer = new Map<string, Record<string, { has: number; linked: number }>>()

  // Linkage state lives on the proper `integration_type` column (mig 021).
  // Fall back to the legacy `serial_number = 'integration:<id>'` prefix for
  // rows the migration's backfill couldn't cover (shouldn't happen in
  // production, but defensive).
  function isLinked(p: { category: string | null; integration_type: string | null; serial_number: string | null }): boolean {
    if (p.integration_type) return true
    const s = p.serial_number
    if (typeof s !== 'string') return false
    if (p.category === 'solar_panel') return s.startsWith('sundata:')
    if (p.category === 'ev_charger')  return s.startsWith('easee:')
    if (p.category === 'heat_pump')   return s.startsWith('weheat:')
    return false
  }

  for (const p of products || []) {
    if (!p.category) continue
    const arr = productsByCustomer.get(p.customer_id) || []
    if (!arr.includes(p.category)) arr.push(p.category)
    productsByCustomer.set(p.customer_id, arr)

    const m = linkageByCustomer.get(p.customer_id) || {}
    const e = m[p.category] || { has: 0, linked: 0 }
    e.has += 1
    if (isLinked(p)) e.linked += 1
    m[p.category] = e
    linkageByCustomer.set(p.customer_id, m)
  }

  // Onboarding state now lives directly on `customers` (cols added in mig 020),
  // so no more N+1 auth-call per row. Build the same shape the UI expects
  // straight from the row.

  // Latest mailing-batch per customer (used by /admin/uitnodigingen to show
  // "Laatste batch: 12 dagen geleden" chip + to warn about overlap).
  // One indexed query gets it for the whole partner.
  const { data: batchHits } = await supabase
    .from('mailing_batch_customers')
    .select('customer_id, mailing_batches!inner(id, name, partner_id, created_at)')
    .in('customer_id', customerIds)
    .eq('mailing_batches.partner_id', partnerId)
    .order('created_at', { foreignTable: 'mailing_batches', ascending: false })

  const latestBatchByCustomer = new Map<string, { id: string; name: string; created_at: string }>()
  for (const r of (batchHits || []) as any[]) {
    if (latestBatchByCustomer.has(r.customer_id)) continue // already have a more-recent hit
    const b = r.mailing_batches
    if (b) latestBatchByCustomer.set(r.customer_id, { id: b.id, name: b.name, created_at: b.created_at })
  }

  const rows = customers.map(c => {
    // Reconstruct the `onboarding` shape the UI uses. `null` for legacy rows
    // without any onboarding columns set (pre-mig 020).
    const onboarding = c.onboarding_step || c.accepted_at || c.mandate_at || c.mandate_skipped
      ? {
          step: c.onboarding_step || 'hero',
          accepted_at: c.accepted_at || null,
          accepted_modules: c.accepted_modules || null,
          mandate_at: c.mandate_at || null,
          mandate_skipped: !!c.mandate_skipped,
        }
      : null
    return {
      ...c,
      product_categories: productsByCustomer.get(c.id) || [],
      module_linkage: linkageByCustomer.get(c.id) || {},
      onboarding,
      latest_batch: latestBatchByCustomer.get(c.id) || null,
    }
  })

  return {
    rows,
    total,
    limit,
    offset,
    has_more: offset + rows.length < total,
  }
})
