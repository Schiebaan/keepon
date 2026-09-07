import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Koppel een Easee-laadpaal aan een klant.
 *
 * Schrijft zowel de nette kolommen (integration_type / external_id /
 * linked_at) als de legacy `serial_number`-marker `easee:<chargerId>`, omdat
 * oudere codepaden — o.a. ProductList en /klant/laadpaal — die nog parsen.
 *
 * Body: { charger_id: string, name?, brand?, model? }
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

  const supabase = getServiceRoleClient(event)
  const body = await readBody(event).catch(() => ({} as any))
  const chargerId = String(body?.charger_id || '').trim()
  if (!chargerId) throw createError({ statusCode: 400, message: 'charger_id ontbreekt' })

  // Partner-scope
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
    .select('id')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  // Waarschuw als deze laadpaal al aan een ándere klant hangt — dubbele
  // koppeling levert verwarrende data op in beide portalen.
  const { data: clash } = await supabase
    .from('customer_products')
    .select('id, customer_id, customers(full_name, email)')
    .eq('partner_id', partnerId)
    .eq('category', 'ev_charger')
    .eq('serial_number', `easee:${chargerId}`)
    .neq('customer_id', customer.id)
    .limit(1)
    .maybeSingle()
  if (clash) {
    const other = (clash as any).customers
    throw createError({
      statusCode: 409,
      message: `Deze laadpaal is al gekoppeld aan ${other?.full_name || other?.email || 'een andere klant'}. Ontkoppel die eerst.`,
    })
  }

  // Bestaand ev_charger-product bijwerken, of er een aanmaken
  const { data: existing } = await supabase
    .from('customer_products')
    .select('id')
    .eq('customer_id', customer.id)
    .eq('category', 'ev_charger')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date().toISOString()
  const updates: Record<string, any> = {
    integration_type: 'easee',
    external_id: chargerId,
    linked_at: now,
    serial_number: `easee:${chargerId}`,
    notes: 'Gekoppeld via Easee',
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
    if (error || !data) throw createError({ statusCode: 500, message: error?.message || 'Koppelen mislukt' })
    productId = data.id
  } else {
    const { data, error } = await supabase
      .from('customer_products')
      .insert({
        customer_id: customer.id,
        partner_id: partnerId,
        category: 'ev_charger',
        name: body?.name || 'Laadpaal',
        brand: body?.brand || 'Easee',
        model: body?.model || null,
        ...updates,
      })
      .select('id')
      .single()
    if (error || !data) throw createError({ statusCode: 500, message: error?.message || 'Aanmaken mislukt' })
    productId = data.id
  }

  await auditLog(event, 'product.linked_easee', 'customer_product', productId, {
    customer_id: customer.id,
    charger_id: chargerId,
    partner_id: partnerId,
  })

  return { success: true, product_id: productId, charger_id: chargerId }
})
