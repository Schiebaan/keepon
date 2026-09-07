import { getServiceRoleClient } from '~~/server/utils/supabase'
import { resolvePartnerId, assertCustomerInPartner } from '~~/server/utils/partner-scope'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'Klant-id ontbreekt' })
  const body = await readBody(event)
  const supabase = getServiceRoleClient(event)

  // Zonder deze controle kon elke installateur de gegevens van een klant van
  // een andere installateur overschrijven — naam, e-mail, adres — door een
  // UUID te raden.
  const partnerId = await resolvePartnerId(event, supabase, user.id)
  await assertCustomerInPartner(supabase, customerId, partnerId)

  const allowed = ['full_name', 'email', 'phone', 'street', 'house_number', 'postal_code', 'city']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }
  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Geen velden om bij te werken' })
  }

  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'customer.updated', 'customer', customerId, {
    fields: Object.keys(updates),
    partner_id: partnerId,
    customer_id: customerId,
  })

  return data
})
