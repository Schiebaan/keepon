import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Email log for the /admin/communicatie page. Pulled from audit_log entries
 * that start with `email.`. We don't keep a separate emails table — every
 * email send is audit-logged with the recipient + success flag, which is
 * enough for the partner-facing log view.
 */

interface EmailLogEntry {
  id: string
  type: string                  // 'welkomstmail' | 'ticket_reply' | ...
  type_label: string            // human label
  recipient_email: string
  recipient_name: string | null
  subject: string
  status: 'verzonden' | 'mislukt'
  created_at: string
  entity_link: string | null
}

// Map audit-log actions to a UI type + Dutch label + default subject
const ACTION_MAP: Record<string, { type: string; label: string; subjectFallback: string }> = {
  'email.welcome_sent':                  { type: 'welkomstmail',         label: 'Welkomstmail',     subjectFallback: 'Welkomstmail verstuurd' },
  'email.welcome_resent':                { type: 'welkomstmail',         label: 'Welkomstmail',     subjectFallback: 'Welkomstmail opnieuw verstuurd' },
  'email.welcome_resent_public':         { type: 'welkomstmail',         label: 'Welkomstmail',     subjectFallback: 'Welkomstmail (zelf aangevraagd)' },
  'email.ticket_reply_sent':             { type: 'ticket',               label: 'Ticket-antwoord',  subjectFallback: 'Antwoord op servicemelding' },
  'email.new_ticket_installer_sent':     { type: 'ticket',               label: 'Nieuwe melding',   subjectFallback: 'Nieuwe servicemelding van klant' },
  'email.ticket_customer_reply_sent':    { type: 'ticket',               label: 'Klantreactie',     subjectFallback: 'Reactie van klant op ticket' },
  'email.installation_connected_sent':   { type: 'installatie',          label: 'Installatie live', subjectFallback: 'Installatie is gekoppeld' },
  'email.password_changed_sent':         { type: 'wachtwoord',           label: 'Wachtwoord',       subjectFallback: 'Wachtwoord gewijzigd' },
}

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Resolve partner id (prefer tenant > user role)
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
  if (!partnerId) return { entries: [], stats: { total: 0, this_month: 0, failed: 0 } }

  // Pull last 200 email-events (90 days). Plenty for the admin overview;
  // older history is still in audit_log if anyone needs to dig deeper.
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows } = await supabase
    .from('audit_log')
    .select('id, action, entity_type, entity_id, meta, created_at')
    .eq('partner_id', partnerId)
    .like('action', 'email.%')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(200)

  const safeRows = rows || []

  // Look up customer + ticket → customer mapping for recipient names + deep links
  const customerIds = new Set<string>()
  const ticketIds = new Set<string>()
  for (const r of safeRows) {
    if (r.entity_type === 'customer' && r.entity_id) customerIds.add(r.entity_id)
    if (r.entity_type === 'service_ticket' && r.entity_id) ticketIds.add(r.entity_id)
  }

  let customerMap = new Map<string, { full_name: string | null; email: string }>()
  if (customerIds.size) {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, full_name, email')
      .in('id', Array.from(customerIds))
    customerMap = new Map((customers || []).map(c => [c.id, { full_name: c.full_name, email: c.email }]))
  }

  let ticketCustomerMap = new Map<string, string>()
  if (ticketIds.size) {
    const { data: tickets } = await supabase
      .from('service_tickets')
      .select('id, customer_id')
      .in('id', Array.from(ticketIds))
    ticketCustomerMap = new Map((tickets || []).map(t => [t.id, t.customer_id]))
    // Pull names for ticket-derived customers too
    const extraIds = Array.from(ticketCustomerMap.values()).filter(id => id && !customerMap.has(id))
    if (extraIds.length) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name, email')
        .in('id', extraIds)
      for (const c of customers || []) {
        customerMap.set(c.id, { full_name: c.full_name, email: c.email })
      }
    }
  }

  const entries: EmailLogEntry[] = []
  let failedCount = 0
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  let thisMonthCount = 0

  for (const r of safeRows) {
    const mapping = ACTION_MAP[r.action] || { type: 'overig', label: 'E-mail', subjectFallback: 'Bericht verstuurd' }
    const meta = (r.meta || {}) as Record<string, any>

    // Resolve recipient
    const recipientEmail = (meta.to || '').toString() || ''
    let customerId: string | null = null
    if (r.entity_type === 'customer') customerId = r.entity_id
    else if (r.entity_type === 'service_ticket' && r.entity_id) customerId = ticketCustomerMap.get(r.entity_id) || null
    const customer = customerId ? customerMap.get(customerId) : null
    const recipientName = customer?.full_name || null

    // Status: success: true | undefined → verzonden, success: false → mislukt
    const status: 'verzonden' | 'mislukt' = meta.success === false ? 'mislukt' : 'verzonden'
    if (status === 'mislukt') failedCount++
    if (new Date(r.created_at) >= monthStart) thisMonthCount++

    let entityLink: string | null = null
    if (r.entity_type === 'service_ticket' && r.entity_id) entityLink = `/admin/service/${r.entity_id}`
    else if (customerId) entityLink = `/admin/customers/${customerId}`

    entries.push({
      id: r.id,
      type: mapping.type,
      type_label: mapping.label,
      recipient_email: recipientEmail || customer?.email || '',
      recipient_name: recipientName,
      subject: (meta.subject as string) || mapping.subjectFallback,
      status,
      created_at: r.created_at,
      entity_link: entityLink,
    })
  }

  return {
    entries,
    stats: {
      total: entries.length,
      this_month: thisMonthCount,
      failed: failedCount,
    },
  }
})
