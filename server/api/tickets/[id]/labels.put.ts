import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Zet de complete set labels voor één ticket (replace-strategie).
 *
 * Body: { label_ids: string[] }  → vervangt alle huidige toewijzingen.
 * Lege array = alle labels van het ticket halen.
 *
 * Alleen labels van de eigen partner worden geaccepteerd — id's die niet bij
 * deze partner horen worden stil genegeerd (defense tegen id-tampering).
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const ticketId = getRouterParam(event, 'id')
  if (!ticketId) throw createError({ statusCode: 400, message: 'ticket id ontbreekt' })
  const body = await readBody(event).catch(() => ({} as any))

  const tenant = (event.context as any).tenant
  let partnerId = tenant?.id
  if (!partnerId) {
    const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
    partnerId = role?.partner_id
    if (role?.role === 'platform_admin' && !partnerId) {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  // Ticket moet van deze partner zijn
  const { data: ticket } = await supabase
    .from('service_tickets')
    .select('id, partner_id')
    .eq('id', ticketId)
    .eq('partner_id', partnerId)
    .single()
  if (!ticket) throw createError({ statusCode: 404, message: 'Ticket niet gevonden' })

  const submitted: string[] = Array.isArray(body?.label_ids)
    ? body.label_ids.filter((x: any) => typeof x === 'string')
    : []

  // Alleen labels die echt van deze partner zijn toelaten
  let validIds: string[] = []
  if (submitted.length) {
    const { data: labels } = await supabase
      .from('ticket_labels')
      .select('id')
      .eq('partner_id', partnerId)
      .in('id', submitted)
    validIds = (labels || []).map((l: any) => l.id)
  }

  // Replace: eerst alles weg, dan opnieuw inserten
  const { error: delErr } = await supabase
    .from('service_ticket_labels')
    .delete()
    .eq('ticket_id', ticketId)
  if (delErr) throw createError({ statusCode: 500, message: delErr.message })

  if (validIds.length) {
    const rows = validIds.map(label_id => ({ ticket_id: ticketId, label_id }))
    const { error: insErr } = await supabase.from('service_ticket_labels').insert(rows)
    if (insErr) throw createError({ statusCode: 500, message: insErr.message })
  }

  await auditLog(event, 'ticket.labels_set', 'service_ticket', ticketId, {
    label_ids: validIds,
    partner_id: partnerId,
  })

  // Geef de volledige label-objecten terug zodat de UI direct kan renderen
  const { data: assigned } = validIds.length
    ? await supabase
        .from('ticket_labels')
        .select('id, name, color, sort_order')
        .in('id', validIds)
        .order('sort_order', { ascending: true })
    : { data: [] as any[] }

  return { ok: true, labels: assigned || [] }
})
