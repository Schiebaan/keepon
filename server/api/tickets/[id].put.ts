import { getServiceRoleClient } from '~~/server/utils/supabase'
import { parseMessages } from '~~/server/utils/ticket-messages'
import { sendEmail, buildTicketResolvedEmail } from '~~/server/utils/email'
import { resolveAdminDisplayName } from '~~/server/utils/admin-name'

/**
 * Update a ticket's metadata (status, urgency, subject, description).
 * Reply/message posting goes through POST /api/tickets/[id]/messages instead.
 *
 * Zet de installateur de melding op afgehandeld, dan krijgt de klant daar
 * bericht van. Zonder die mail hoorde hij er niets over: hij zag het alleen
 * als hij toevallig het portaal opende, en bleef anders denken dat het liep.
 */
const VALID_STATUS = new Set(['nieuw', 'open', 'in_behandeling', 'opgelost', 'gesloten'])
const VALID_URGENCY = new Set(['laag', 'normaal', 'hoog'])
const AFGEROND = new Set(['opgelost', 'gesloten'])

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const ticketId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const supabase = getServiceRoleClient(event)

  // Partnercontext — zonder deze controle kon elke installateur met een
  // geraden UUID het ticket van een andere partner bijwerken.
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

  const { data: huidig } = await supabase
    .from('service_tickets')
    .select('id, status, response, partner_id')
    .eq('id', ticketId)
    .eq('partner_id', partnerId)
    .single()
  if (!huidig) throw createError({ statusCode: 404, message: 'Ticket niet gevonden' })

  const updates: Record<string, any> = {}

  if (body.status !== undefined) {
    if (!VALID_STATUS.has(body.status)) throw createError({ statusCode: 400, message: `Onbekende status: ${body.status}` })
    updates.status = body.status === 'nieuw' ? 'open' : body.status
  }
  if (body.urgency !== undefined) {
    if (!VALID_URGENCY.has(body.urgency)) throw createError({ statusCode: 400, message: `Onbekende urgentie: ${body.urgency}` })
    updates.urgency = body.urgency
  }
  if (body.subject !== undefined) {
    const s = String(body.subject).trim()
    if (!s) throw createError({ statusCode: 400, message: 'Onderwerp mag niet leeg zijn' })
    updates.subject = s.slice(0, 200)
  }
  if (body.description !== undefined) {
    updates.description = String(body.description).trim().slice(0, 5000) || null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'Geen velden om bij te werken' })
  }

  const { data, error } = await supabase
    .from('service_tickets')
    .update(updates)
    .eq('id', ticketId)
    .eq('partner_id', partnerId)
    .select('*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'ticket.updated', 'service_ticket', ticketId!, {
    fields: Object.keys(updates),
    partner_id: partnerId,
    customer_id: data.customer?.id,
  })

  // --- Klant informeren bij afronden -----------------------------------
  // Alleen op de overgang naar afgerond. Een tweede opslag op een al
  // afgehandelde melding stuurt niets — anders krijgt de klant een mail
  // telkens als er een label wordt bijgewerkt.
  const wordtAfgerond = updates.status && AFGEROND.has(updates.status) && !AFGEROND.has(huidig.status)
  if (wordtAfgerond && data.customer?.email) {
    try {
      const { data: partner } = await supabase
        .from('partners')
        .select('name, slug, primary_color, logo_url')
        .eq('id', partnerId)
        .single()

      // Laatste reactie van het team als context in de mail — dat is meestal
      // precies de uitleg waarom 'ie dicht kan.
      const berichten = parseMessages(huidig.response)
      const laatsteTeam = [...berichten].reverse().find((m: any) => m.role === 'installer')

      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
      const email = buildTicketResolvedEmail({
        customerName: data.customer.full_name || data.customer.email,
        ticketSubject: data.subject,
        ticketRef: typeof data.ticket_number === 'number' ? String(data.ticket_number) : undefined,
        lastReply: laatsteTeam?.text || null,
        authorName: await resolveAdminDisplayName(supabase, user.id),
        ticketUrl: `https://${partner?.slug || 'www'}.${baseDomain}/klant/service`,
        partner: partner
          ? { name: partner.name, primary_color: partner.primary_color, logo_url: partner.logo_url }
          : undefined,
      })

      await sendEmail({ to: data.customer.email, subject: email.subject, html: email.html })
      await auditLog(event, 'email.ticket_resolved_sent', 'service_ticket', ticketId!, {
        to: data.customer.email,
        status: updates.status,
      })
    } catch (e: any) {
      // De statuswijziging is al opgeslagen; een mislukte mail mag die niet
      // terugdraaien.
      console.error('[tickets] Kon afrondingsmail niet versturen:', e?.message || e)
    }
  }

  return { ...data, messages: parseMessages(data.response) }
})
