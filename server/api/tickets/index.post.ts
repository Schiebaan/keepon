import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { customer_id, subject, description, urgency, module_type } = body
  if (!customer_id || !subject) {
    throw createError({ statusCode: 400, message: 'customer_id en subject zijn verplicht' })
  }

  const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
    partnerId = fp?.id
  }

  const { data, error } = await supabase
    .from('service_tickets')
    .insert({
      customer_id,
      partner_id: partnerId,
      subject,
      description: description || null,
      urgency: urgency || 'normaal',
      module_type: module_type || null,
      status: 'open', // DB check-constraint accepts 'open'; UI displays this as "Nieuw"
    })
    .select('*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'ticket.created', 'service_ticket', data.id, { customer_id, subject })

  return data
})
