import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Link a Weheat heat-pump to one of this customer's heat_pump products.
 *
 * Body: { heatpump_id: string, name?: string, brand?: string, model?: string }
 *
 * Mirrors the Sundata + Easee pattern: stores the integration linkage in the
 * `serial_number` field as `weheat:<heatpump_id>`. The /klant/warmtepomp page
 * and /admin/customers list both detect this pattern and switch to "Gekoppeld".
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)
  const heatpumpId = (body?.heatpump_id || '').toString().trim()
  if (!heatpumpId) throw createError({ statusCode: 400, message: 'heatpump_id ontbreekt' })

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
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  // Confirm the customer belongs to this partner
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  // Find an existing heat_pump product to update; create one if there isn't.
  const { data: existing } = await supabase
    .from('customer_products')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('category', 'heat_pump')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date().toISOString()
  const updates: Record<string, any> = {
    integration_type: 'weheat',
    external_id: heatpumpId,
    linked_at: now,
    // Keep the legacy serial_number-hack in sync so older code paths that
    // still parse it (e.g. ProductList.vue) keep showing the green badge.
    serial_number: `weheat:${heatpumpId}`,
    notes: `Gekoppeld via Weheat`,
  }
  if (body?.name)  updates.name = body.name
  if (body?.brand) updates.brand = body.brand
  if (body?.model) updates.model = body.model

  let productId: string
  if (existing) {
    const { data, error } = await supabase
      .from('customer_products')
      .update(updates)
      .eq('id', existing.id)
      .select('id')
      .single()
    if (error || !data) throw createError({ statusCode: 500, message: error?.message || 'Update mislukt' })
    productId = data.id
  } else {
    const { data, error } = await supabase
      .from('customer_products')
      .insert({
        customer_id: customer.id,
        partner_id: partnerId,
        category: 'heat_pump',
        name: body?.name || 'Warmtepomp',
        brand: body?.brand || null,
        model: body?.model || null,
        integration_type: 'weheat',
        external_id: heatpumpId,
        linked_at: now,
        serial_number: `weheat:${heatpumpId}`,
        notes: 'Gekoppeld via Weheat',
      })
      .select('id')
      .single()
    if (error || !data) throw createError({ statusCode: 500, message: error?.message || 'Aanmaken mislukt' })
    productId = data.id
  }

  await auditLog(event, 'weheat.heatpump_linked', 'customer_product', productId, {
    customer_id: customer.id,
    heatpump_id: heatpumpId,
    name: body?.name,
    model: body?.model,
  })

  return { ok: true, product_id: productId, heatpump_id: heatpumpId }
})
