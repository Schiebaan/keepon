import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Customer marks WHO helped them on a (resolved) ticket. Voornaam is genoeg.
 *
 * Body: { name: string }
 *
 * Rules:
 *   - Only the owning customer can set this (we re-derive customer_id from auth).
 *   - Trimmed name, max 80 chars; empty string clears the value again.
 *   - Audit-logged so partner_admins can trace who said what.
 *   - Does NOT change ticket status — that's a separate concern.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, message: 'Ticket-id ontbreekt' })

  const body = await readBody(event).catch(() => ({} as any))
  const rawName = String(body?.name ?? '').trim().slice(0, 80)

  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  // Verify the ticket belongs to this customer
  const { data: ticket, error: ticketErr } = await supabase
    .from('service_tickets')
    .select('id, customer_id, partner_id')
    .eq('id', ticketId)
    .eq('customer_id', customer.id)
    .single()
  if (ticketErr || !ticket) throw createError({ statusCode: 404, message: 'Ticket niet gevonden' })

  const value = rawName || null
  const { error: updErr } = await supabase
    .from('service_tickets')
    .update({ helped_by_name: value, updated_at: new Date().toISOString() })
    .eq('id', ticketId)
  if (updErr) throw createError({ statusCode: 500, message: updErr.message })

  await auditLog(event, 'ticket.helped_by_set', 'ticket', ticketId, {
    helped_by_name: value,
    partner_id: ticket.partner_id,
  })

  return { ok: true, helped_by_name: value }
})
