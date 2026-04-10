import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const productId = getRouterParam(event, 'productId')
  const supabase = getServiceRoleClient(event)

  const { error } = await supabase.from('customer_products').delete().eq('id', productId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
