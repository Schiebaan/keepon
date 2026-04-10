import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')

  const body = await readBody(event)
  const { name, brand, model, category, serial_number, installation_date, notes, partner_id } = body

  if (!name || !category) {
    throw createError({ statusCode: 400, message: 'name and category are required' })
  }

  const supabase = getServiceRoleClient(event)
  const { data, error } = await supabase
    .from('customer_products')
    .insert({
      customer_id: customerId,
      partner_id: partner_id,
      name,
      brand: brand || null,
      model: model || null,
      category,
      serial_number: serial_number || null,
      installation_date: installation_date || null,
      notes: notes || null,
    })
    .select()
    .single()

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
