import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = getServiceRoleClient(event)

  const allowed = ['full_name', 'email', 'phone', 'street', 'house_number', 'postal_code', 'city']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'customer.updated', 'customer', customerId!, { fields: Object.keys(updates) })

  return data
})
