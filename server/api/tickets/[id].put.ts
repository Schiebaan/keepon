import { getServiceRoleClient } from '~~/server/utils/supabase'
import { parseMessages } from '~~/server/utils/ticket-messages'

/**
 * Update a ticket's metadata (status, urgency, subject, description).
 * Reply/message posting goes through POST /api/tickets/[id]/messages instead.
 */
const VALID_STATUS = new Set(['nieuw', 'open', 'in_behandeling', 'opgelost', 'gesloten'])
const VALID_URGENCY = new Set(['laag', 'normaal', 'hoog'])

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const ticketId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = getServiceRoleClient(event)

  const updates: Record<string, any> = {}

  if (body.status !== undefined) {
    if (!VALID_STATUS.has(body.status)) throw createError({ statusCode: 400, message: `Onbekende status: ${body.status}` })
    // DB check-constraint accepts 'open'; UI sometimes sends 'nieuw' — normalize to 'open'
    updates.status = body.status === 'nieuw' ? 'open' : body.status
  }
  if (body.urgency !== undefined) {
    if (!VALID_URGENCY.has(body.urgency)) throw createError({ statusCode: 400, message: `Onbekende urgentie: ${body.urgency}` })
    updates.urgency = body.urgency
  }
  if (body.subject !== undefined) {
    const s = (body.subject || '').toString().trim()
    if (!s) throw createError({ statusCode: 400, message: 'Onderwerp mag niet leeg zijn' })
    updates.subject = s.slice(0, 200)
  }
  if (body.description !== undefined) {
    updates.description = (body.description || '').toString().trim().slice(0, 5000) || null
  }
  if (body.module_type !== undefined) {
    const valid = ['solar', 'heat_pump', 'ev_charger', 'battery']
    updates.module_type = valid.includes(body.module_type) ? body.module_type : null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Geen velden om bij te werken' })
  }

  const { data, error } = await supabase
    .from('service_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select('*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'ticket.updated', 'service_ticket', ticketId!, { fields: Object.keys(updates) })

  return { ...data, messages: parseMessages(data.response) }
})
