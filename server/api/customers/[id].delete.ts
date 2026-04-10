import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  const supabase = getServiceRoleClient(event)

  // Get customer to find auth_user_id
  const { data: customer } = await supabase
    .from('customers')
    .select('id, auth_user_id, email')
    .eq('id', customerId)
    .single()

  if (!customer) {
    throw createError({ statusCode: 404, message: 'Klant niet gevonden' })
  }

  // Delete related data (cascades handle most, but be explicit)
  await supabase.from('customer_products').delete().eq('customer_id', customerId)
  await supabase.from('customer_documents').delete().eq('customer_id', customerId)
  await supabase.from('smart_meters').delete().eq('customer_id', customerId)
  await supabase.from('user_roles').delete().eq('customer_id', customerId)

  // Delete customer record
  const { error } = await supabase.from('customers').delete().eq('id', customerId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  // Delete auth user
  if (customer.auth_user_id) {
    await supabase.auth.admin.deleteUser(customer.auth_user_id).catch(() => {})
  }

  await auditLog(event, 'customer.deleted', 'customer', customerId!, { email: customer.email })

  return { success: true }
})
