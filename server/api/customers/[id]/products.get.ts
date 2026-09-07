import { getServiceRoleClient } from '~~/server/utils/supabase'
import { resolvePartnerId, assertCustomerInPartner } from '~~/server/utils/partner-scope'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'Klant-id ontbreekt' })

  const supabase = getServiceRoleClient(event)
  // Anders leest elke installateur de installaties van andermans klanten.
  const partnerId = await resolvePartnerId(event, supabase, user.id)
  await assertCustomerInPartner(supabase, customerId, partnerId)

  const { data, error } = await supabase
    .from('customer_products')
    .select('*')
    .eq('customer_id', customerId)
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
