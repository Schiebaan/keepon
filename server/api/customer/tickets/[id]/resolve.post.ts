import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Laat de klant zijn eigen melding sluiten.
 *
 * Tot nu toe kon alleen de installateur een ticket afsluiten. Een klant die
 * zijn probleem zelf had opgelost — of die inmiddels gebeld had — bleef in de
 * lijst staan als openstaande melding. Dat vervuilt het overzicht van de
 * installateur en laat de klant achter met iets wat "nog loopt".
 *
 * We zetten 'opgelost' en niet 'gesloten': 'gesloten' is het administratieve
 * eindpunt dat de installateur zelf trekt. Reageert de klant hierna alsnog,
 * dan zet messages.post.ts het ticket automatisch terug op 'in_behandeling' —
 * sluiten is dus nooit definitief voor de klant.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)
  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, message: 'Ticket-id ontbreekt' })

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  // Alleen je eigen melding, uiteraard.
  const { data: ticket } = await supabase
    .from('service_tickets')
    .select('id, subject, status')
    .eq('id', ticketId)
    .eq('customer_id', customer.id)
    .single()
  if (!ticket) throw createError({ statusCode: 404, message: 'Melding niet gevonden' })

  // Al dicht? Dan is er niets te doen. Geen foutmelding: voor de klant is het
  // resultaat precies wat 'ie wilde.
  if (ticket.status === 'opgelost' || ticket.status === 'gesloten') {
    const { data: huidig } = await supabase
      .from('service_tickets')
      .select('id, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at')
      .eq('id', ticket.id)
      .single()
    return huidig
  }

  const { data, error } = await supabase
    .from('service_tickets')
    .update({ status: 'opgelost', updated_at: new Date().toISOString() })
    .eq('id', ticket.id)
    .select('id, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at')
    .single()
  if (error) throw createError({ statusCode: 500, message: error.message })

  // Eigen actienaam, geen generieke ticket.updated: de installateur hoort op
  // zijn dashboard te zien dat de klant zélf afsloot.
  await auditLog(event, 'ticket.closed_by_customer', 'service_ticket', ticket.id, {
    customer_id: customer.id,
    partner_id: customer.partner_id,
    subject: ticket.subject,
  })

  return data
})
