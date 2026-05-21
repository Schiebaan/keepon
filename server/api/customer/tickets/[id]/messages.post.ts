import { getServiceRoleClient } from '~~/server/utils/supabase'
import { appendMessage, parseMessages } from '~~/server/utils/ticket-messages'
import { sendEmail, buildNewTicketInstallerEmail } from '~~/server/utils/email'

const MODULE_LABELS: Record<string, string> = {
  solar: 'Zonnepanelen',
  heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal',
  battery: 'Batterij',
}

/**
 * Customer posts a reply on one of their own tickets.
 * - Appends to the thread
 * - Reopens the ticket if it was opgelost/gesloten (status → in_behandeling)
 * - Emails the installer (partner support inbox)
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const ticketId = getRouterParam(event, 'id')
  const body = await readBody(event)
  const text = (body?.text || '').toString().trim()

  if (!text) throw createError({ statusCode: 400, message: 'Berichttekst is verplicht' })
  if (text.length > 10000) throw createError({ statusCode: 400, message: 'Bericht is te lang (max 10.000 tekens)' })

  const supabase = getServiceRoleClient(event)

  // Verify the ticket belongs to the current customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  const { data: current, error: fetchErr } = await supabase
    .from('service_tickets')
    .select('id, subject, status, urgency, module_type, description, response, partner_id')
    .eq('id', ticketId)
    .eq('customer_id', customer.id)
    .single()
  if (fetchErr || !current) throw createError({ statusCode: 404, message: 'Ticket niet gevonden' })

  const { raw } = appendMessage(current.response, {
    role: 'customer', text, author_name: customer.full_name,
  })

  // Reopen if resolved/closed — customer is pushing back
  const updates: Record<string, any> = { response: raw }
  const wasClosed = current.status === 'opgelost' || current.status === 'gesloten'
  if (wasClosed) {
    updates.status = 'in_behandeling'
  }

  const { data, error } = await supabase
    .from('service_tickets')
    .update(updates)
    .eq('id', ticketId)
    .select('id, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at')
    .single()
  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'ticket.message_added', 'service_ticket', ticketId!, {
    role: 'customer',
    reopened: wasClosed,
  })

  // Email installer
  try {
    const { data: partner } = await supabase
      .from('partners')
      .select('name, slug, primary_color, logo_url, support_email')
      .eq('id', current.partner_id)
      .single()

    if (partner?.support_email) {
      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
      const ticketUrl = `https://${partner.slug || 'www'}.${baseDomain}/admin/service/${ticketId}`

      const ticketRef = typeof (data as any).ticket_number === 'number'
        ? String((data as any).ticket_number)
        : undefined

      const email = buildNewTicketInstallerEmail({
        customerName: customer.full_name || customer.email,
        customerEmail: customer.email,
        ticketSubject: wasClosed
          ? `[Heropend] ${current.subject}`
          : `[Reactie] ${current.subject}`,
        ticketRef,
        ticketDescription: text, // the new reply as the description of this notification
        urgency: data.urgency,
        moduleLabel: data.module_type ? MODULE_LABELS[data.module_type] || null : null,
        ticketUrl,
        partner: {
          name: partner.name,
          primary_color: partner.primary_color,
          logo_url: partner.logo_url,
        },
      })

      await sendEmail({
        to: partner.support_email,
        subject: email.subject,
        html: email.html,
        replyTo: customer.email,
      })

      await auditLog(event, 'email.ticket_customer_reply_sent', 'service_ticket', ticketId!, {
        to: partner.support_email,
        reopened: wasClosed,
      })
    }
  } catch (e: any) {
    console.error('[ticket-messages] Failed to notify installer:', e?.message || e)
  }

  return {
    ...data,
    messages: parseMessages(data.response),
  }
})
