import { getServiceRoleClient } from '~~/server/utils/supabase'
import { parseMessages } from '~~/server/utils/ticket-messages'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const ticketId = getRouterParam(event, 'id')
  const supabase = getServiceRoleClient(event)

  const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
    partnerId = fp?.id
  }

  const { data, error } = await supabase
    .from('service_tickets')
    .select('*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)')
    .eq('id', ticketId)
    .eq('partner_id', partnerId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') throw createError({ statusCode: 404, message: 'Ticket niet gevonden' })
    throw createError({ statusCode: 500, message: error.message })
  }

  return { ...data, messages: parseMessages(data.response) }
})
