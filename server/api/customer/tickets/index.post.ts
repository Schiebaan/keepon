import { getServiceRoleClient } from '~~/server/utils/supabase'
import { sendEmail, buildNewTicketInstallerEmail } from '~~/server/utils/email'

const MODULE_LABELS: Record<string, string> = {
  solar: 'Zonnepanelen',
  heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal',
  battery: 'Batterij',
}

/** Let a customer file a new service ticket for themselves. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { subject, description, module_type, urgency } = body
  if (!subject || typeof subject !== 'string' || !subject.trim()) {
    throw createError({ statusCode: 400, message: 'Onderwerp is verplicht' })
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer) {
    throw createError({ statusCode: 404, message: 'Geen klantaccount gevonden' })
  }

  // Dubbele aanmelding afvangen.
  //
  // Een knop die niet reageert wordt drie keer aangeklikt — dat is geen
  // gebruikersfout maar ontbrekende terugkoppeling. De knop heeft nu een slot,
  // maar dat helpt niet bij een haperend netwerk of een dubbele tik op mobiel.
  // Vandaar hier het echte vangnet.
  //
  // We weigeren niet, we geven het bestaande ticket terug. Voor de klant ziet
  // een tweede klik er dan gewoon uit alsof het gelukt is — wat ook zo is — en
  // hij krijgt geen foutmelding over iets wat prima ging.
  const drempel = new Date(Date.now() - 2 * 60 * 1000).toISOString()
  const { data: bestaand } = await supabase
    .from('service_tickets')
    .select('id, ticket_number, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at')
    .eq('customer_id', customer.id)
    .eq('subject', subject.trim().slice(0, 200))
    .gte('created_at', drempel)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (bestaand) {
    await auditLog(event, 'ticket.duplicate_suppressed', 'service_ticket', bestaand.id, {
      customer_id: customer.id,
      subject,
    })
    // Geen tweede mail naar de installateur: die zit niet te wachten op
    // dezelfde melding in drievoud.
    return bestaand
  }

  const { data, error } = await supabase
    .from('service_tickets')
    .insert({
      customer_id: customer.id,
      partner_id: customer.partner_id,
      subject: subject.trim().slice(0, 200),
      description: (description || '').trim().slice(0, 5000) || null,
      urgency: ['laag', 'normaal', 'hoog'].includes(urgency) ? urgency : 'normaal',
      module_type: ['solar', 'heat_pump', 'ev_charger', 'battery'].includes(module_type) ? module_type : null,
      status: 'open', // DB check-constraint accepts 'open'; UI displays this as "Nieuw"
    })
    .select('id, ticket_number, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'ticket.created', 'service_ticket', data.id, {
    customer_id: customer.id,
    subject,
    origin: 'customer_portal',
  })

  // --- Notify installer ---
  // Send to the partner's support_email (configured in settings). If not set, skip silently
  // so we don't spam a random inbox.
  try {
    const { data: partner } = await supabase
      .from('partners')
      .select('name, slug, primary_color, logo_url, support_email')
      .eq('id', customer.partner_id)
      .single()

    if (partner?.support_email) {
      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
      const ticketUrl = `https://${partner.slug || 'www'}.${baseDomain}/admin/service/${data.id}`

      const ticketRef = typeof (data as any).ticket_number === 'number'
        ? String((data as any).ticket_number)
        : undefined

      const email = buildNewTicketInstallerEmail({
        customerName: customer.full_name || customer.email,
        customerEmail: customer.email,
        ticketSubject: data.subject,
        ticketRef,
        ticketDescription: data.description,
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

      await auditLog(event, 'email.new_ticket_installer_sent', 'service_ticket', data.id, {
        to: partner.support_email,
      })
    }
  } catch (e: any) {
    console.error('[tickets] Failed to notify installer:', e?.message || e)
  }

  return data
})
