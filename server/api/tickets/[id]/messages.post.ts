import { getServiceRoleClient } from '~~/server/utils/supabase'
import { appendMessage, parseMessages } from '~~/server/utils/ticket-messages'
import { sendEmail, buildTicketReplyEmail } from '~~/server/utils/email'
import { resolveAdminDisplayName } from '~~/server/utils/admin-name'

/**
 * Installer posts a reply on a ticket.
 * - Appends a message to the thread (stored as JSON in service_tickets.response)
 * - Transitions status nieuw → in_behandeling automatically (but never out of opgelost/gesloten)
 * - Emails the customer
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const ticketId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const text = (body?.text || '').toString().trim()

  if (!text) throw createError({ statusCode: 400, message: 'Berichttekst is verplicht' })
  if (text.length > 10000) throw createError({ statusCode: 400, message: 'Bericht is te lang (max 10.000 tekens)' })

  const supabase = getServiceRoleClient(event)

  // Fetch current ticket
  const { data: current, error: fetchErr } = await supabase
    .from('service_tickets')
    .select('id, subject, status, response, partner_id, customer_id')
    .eq('id', ticketId)
    .single()
  if (fetchErr || !current) throw createError({ statusCode: 404, message: 'Ticket niet gevonden' })

  // Look up the posting admin's display name (real name > email-derived)
  const authorName = await resolveAdminDisplayName(supabase, user.id)

  const { raw } = appendMessage(current.response, { role: 'installer', text, author_name: authorName })

  // Auto-advance status: nieuw → in_behandeling on first installer reply
  const updates: Record<string, any> = { response: raw }
  if (current.status === 'nieuw' || current.status === 'open') {
    updates.status = 'in_behandeling'
  }

  const { data, error } = await supabase
    .from('service_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select('*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)')
    .single()
  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'ticket.message_added', 'service_ticket', ticketId!, {
    role: 'installer',
    auto_status: updates.status,
  })

  // Email the customer
  if (data.customer?.email) {
    try {
      const { data: partner } = await supabase
        .from('partners')
        .select('name, slug, primary_color, logo_url, support_email')
        .eq('id', current.partner_id)
        .single()

      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
      const ticketUrl = `https://${partner?.slug || 'www'}.${baseDomain}/klant/service`

      const ticketRef = typeof (data as any).ticket_number === 'number'
        ? String((data as any).ticket_number)
        : undefined

      const email = buildTicketReplyEmail({
        customerName: data.customer.full_name || data.customer.email,
        ticketSubject: data.subject,
        ticketRef,
        replyExcerpt: text,
        ticketUrl,
        authorName,
        partner: partner ? {
          name: partner.name,
          primary_color: partner.primary_color,
          logo_url: partner.logo_url,
          support_email: partner.support_email,
        } : undefined,
      })

      // Bewust GEEN replyTo: we willen niet dat klant-replies in de partner-
      // inbox belanden (zie ROADMAP.md "inbound mail parsing"). De mail-body
      // verwijst expliciet naar het portaal voor antwoorden.
      await sendEmail({
        to: data.customer.email,
        subject: email.subject,
        html: email.html,
      })

      await auditLog(event, 'email.ticket_reply_sent', 'service_ticket', ticketId!, {
        to: data.customer.email,
      })
    } catch (e: any) {
      console.error('[ticket-messages] Failed to send customer email:', e?.message || e)
    }
  }

  // Return the ticket with a parsed messages array for convenience
  return {
    ...data,
    messages: parseMessages(data.response),
  }
})
