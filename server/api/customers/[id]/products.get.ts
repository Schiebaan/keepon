import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')

  const supabase = getServiceRoleClient(event)
  const { data, error } = await supabase
    .from('customer_products')
    .select('*')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })

  if (error) {
    throw createError({ statusCode: 500, message: error.message })
  }

  return data
})
