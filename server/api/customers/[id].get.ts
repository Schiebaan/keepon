import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Fetch a single customer, fully enriched (same shape as the list endpoint).
 *
 * Used by /admin/customers/[id] to avoid loading the entire customer list
 * just to find one record. At 50 klanten this saves ~2-3KB and at 1000
 * klanten the gain becomes serious (500KB → 5KB).
 *
 * Returns the same enriched shape as the list endpoint's `rows[i]`:
 *   - product_categories
 *   - module_linkage
 *   - onboarding
 *   - latest_batch
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

  // Resolve partner id (tenant > role)
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

  const { data: customer, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()
  if (error || !customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  // Enrich in parallel
  const [{ data: products }, { data: batchHits }] = await Promise.all([
    supabase
      .from('customer_products')
      .select('customer_id, category, integration_type, serial_number')
      .eq('customer_id', customer.id),
    supabase
      .from('mailing_batch_customers')
      .select('mailing_batches!inner(id, name, partner_id, created_at)')
      .eq('customer_id', customer.id)
      .eq('mailing_batches.partner_id', partnerId)
      .order('created_at', { foreignTable: 'mailing_batches', ascending: false })
      .limit(1),
  ])

  function isLinked(p: any): boolean {
    if (p.integration_type) return true
    const s = p.serial_number
    if (typeof s !== 'string') return false
    if (p.category === 'solar_panel') return s.startsWith('sundata:')
    if (p.category === 'ev_charger')  return s.startsWith('easee:')
    if (p.category === 'heat_pump')   return s.startsWith('weheat:')
    return false
  }

  const productCats: string[] = []
  const linkage: Record<string, { has: number; linked: number }> = {}
  for (const p of (products || []) as any[]) {
    if (p.category && !productCats.includes(p.category)) productCats.push(p.category)
    const e = linkage[p.category] || { has: 0, linked: 0 }
    e.has += 1
    if (isLinked(p)) e.linked += 1
    linkage[p.category] = e
  }

  const onboarding = (customer as any).onboarding_step || (customer as any).accepted_at || (customer as any).mandate_at || (customer as any).mandate_skipped
    ? {
        step: (customer as any).onboarding_step || 'hero',
        accepted_at: (customer as any).accepted_at || null,
        accepted_modules: (customer as any).accepted_modules || null,
        mandate_at: (customer as any).mandate_at || null,
        mandate_skipped: !!(customer as any).mandate_skipped,
      }
    : null

  const latestBatchRow = (batchHits || [])[0] as any
  const latestBatch = latestBatchRow?.mailing_batches
    ? {
        id: latestBatchRow.mailing_batches.id,
        name: latestBatchRow.mailing_batches.name,
        created_at: latestBatchRow.mailing_batches.created_at,
      }
    : null

  return {
    ...customer,
    product_categories: productCats,
    module_linkage: linkage,
    onboarding,
    latest_batch: latestBatch,
  }
})
