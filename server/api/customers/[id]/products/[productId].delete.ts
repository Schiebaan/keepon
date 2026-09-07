import { getServiceRoleClient } from '~~/server/utils/supabase'
import { resolvePartnerId } from '~~/server/utils/partner-scope'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const productId = getRouterParam(event, 'productId')
  if (!productId) throw createError({ statusCode: 400, message: 'Product-id ontbreekt' })
  const supabase = getServiceRoleClient(event)

  // Verwijderde onvoorwaardelijk op id. Elke installateur kon daarmee de
  // installatie van een klant van een andere installateur wegpoetsen.
  const partnerId = await resolvePartnerId(event, supabase, user.id)

  const { data: product } = await supabase
    .from('customer_products')
    .select('id, customer_id, name, category')
    .eq('id', productId)
    .eq('partner_id', partnerId)
    .maybeSingle()
  if (!product) throw createError({ statusCode: 404, message: 'Product niet gevonden' })

  const { error } = await supabase
    .from('customer_products')
    .delete()
    .eq('id', productId)
    .eq('partner_id', partnerId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'product.deleted', 'customer_product', productId, {
    partner_id: partnerId,
    customer_id: product.customer_id,
    name: product.name,
    category: product.category,
  })

  return { success: true }
})
