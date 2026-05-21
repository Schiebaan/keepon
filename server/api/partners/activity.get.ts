import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Recent activity feed for the admin dashboard.
 * Aggregates relevant audit-log events for the current partner into a clean list
 * with human-readable labels and entity links.
 */

interface ActivityItem {
  id: string
  type: 'customer' | 'ticket' | 'installation' | 'email' | 'partner' | 'other'
  icon: string
  text: string
  entity_type: string | null
  entity_id: string | null
  link: string | null
  at: string
}

// Actions that are too noisy / not useful in a feed
const SKIP_ACTIONS = new Set<string>([
  'email.ticket_reply_sent',
  'email.new_ticket_installer_sent',
  'email.ticket_customer_reply_sent',
  'email.installation_connected_sent',
  'email.password_changed_sent',
  'partner.updated',
  'ticket.updated', // only show create + message_added, skip status-only updates
])

function describe(
  action: string,
  entityType: string | null,
  meta: Record<string, any> | null,
  customerName: string | null,
): { type: ActivityItem['type']; icon: string; text: string } | null {
  const m = meta || {}
  const who = customerName || 'Klant'

  switch (action) {
    case 'customer.created':
      return { type: 'customer', icon: 'user', text: `Nieuwe klant toegevoegd: ${who}` }
    case 'customer.updated':
      return { type: 'customer', icon: 'settings', text: `Klantgegevens bijgewerkt: ${who}` }
    case 'customer.deleted':
      return { type: 'customer', icon: 'trash', text: `Klant verwijderd: ${who}` }

    case 'ticket.created': {
      const subject = m.subject || 'Nieuwe melding'
      const origin = m.origin === 'customer_portal' ? ' (via portaal)' : ''
      return { type: 'ticket', icon: 'message', text: `Nieuwe servicemelding van ${who}${origin}: ${subject}` }
    }
    case 'ticket.message_added': {
      if (m.role === 'customer') {
        return { type: 'ticket', icon: 'message', text: m.reopened
          ? `${who} heropende ticket met nieuwe reactie`
          : `Reactie op ticket van ${who}` }
      }
      return { type: 'ticket', icon: 'send', text: `Reactie verstuurd naar ${who}` }
    }

    case 'sundata.plant_created':
      return { type: 'installation', icon: 'solar', text: `Sundata-plant aangemaakt voor ${who}` }
    case 'sundata.meter_created':
      if (m.first_link) {
        return { type: 'installation', icon: 'zap', text: `Zonnepanelen gekoppeld voor ${who}` }
      }
      return { type: 'installation', icon: 'solar', text: `Sundata-meter bijgewerkt voor ${who}` }

    default:
      return null
  }
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
  if (!partnerId) return []

  // Fetch recent audit log entries (last 30 days, up to 50 — we'll filter to top 15 after labeling)
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows } = await supabase
    .from('audit_log')
    .select('id, action, entity_type, entity_id, meta, created_at')
    .eq('partner_id', partnerId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!rows?.length) return []

  // Collect distinct customer_ids to look up names in one query
  const customerIds = new Set<string>()
  for (const r of rows) {
    if (r.entity_type === 'customer' && r.entity_id) customerIds.add(r.entity_id)
    if (r.meta?.customer_id) customerIds.add(r.meta.customer_id)
  }

  let customerMap = new Map<string, string>()
  if (customerIds.size) {
    const { data: customers } = await supabase
      .from('customers')
      .select('id, full_name, email')
      .in('id', Array.from(customerIds))
    customerMap = new Map((customers || []).map(c => [c.id, c.full_name || c.email || 'Klant']))
  }

  // Also look up ticket subjects for ticket-related audit entries that only carry a ticket id
  const ticketIds = new Set<string>()
  for (const r of rows) {
    if (r.entity_type === 'service_ticket' && r.entity_id) ticketIds.add(r.entity_id)
  }
  let ticketMap = new Map<string, { customer_id: string | null }>()
  if (ticketIds.size) {
    const { data: tickets } = await supabase
      .from('service_tickets')
      .select('id, customer_id')
      .in('id', Array.from(ticketIds))
    ticketMap = new Map((tickets || []).map(t => [t.id, { customer_id: t.customer_id }]))
  }

  const out: ActivityItem[] = []
  for (const r of rows) {
    if (SKIP_ACTIONS.has(r.action)) continue

    // Resolve the "who" for this entry
    let customerId: string | null = null
    if (r.entity_type === 'customer') customerId = r.entity_id
    else if (r.entity_type === 'service_ticket') customerId = ticketMap.get(r.entity_id!)?.customer_id || null
    if (!customerId && r.meta?.customer_id) customerId = r.meta.customer_id
    const customerName = customerId ? (customerMap.get(customerId) || null) : null

    const described = describe(r.action, r.entity_type, r.meta, customerName)
    if (!described) continue

    // Build deep-link
    let link: string | null = null
    if (r.entity_type === 'service_ticket' && r.entity_id) link = `/admin/service/${r.entity_id}`
    else if (customerId) link = `/admin/customers/${customerId}`

    out.push({
      id: r.id,
      type: described.type,
      icon: described.icon,
      text: described.text,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      link,
      at: r.created_at,
    })

    if (out.length >= 15) break
  }

  return out
})
