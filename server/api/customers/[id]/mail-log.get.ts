import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Geeft alle mail-events terug die we hebben gestuurd naar één klant.
 * Bron: audit_log (action LIKE 'email.%' voor entity_type='customer').
 *
 * Geen nieuwe infra — we hergebruiken de audit-trail die we bij elke
 * verzending al schrijven. Dit is voldoende voor "is de mail überhaupt
 * verstuurd?" — voor delivery/bounce/open-status hebben we later een
 * Resend-webhook nodig; dat is nog niet aangesloten.
 */

const ACTION_LABELS: Record<string, string> = {
  'email.welcome_sent':                    'Welkomstmail (nieuwe klant)',
  'email.welcome_resent':                  'Welkomstmail opnieuw',
  'email.welcome_resent_public':           'Welkomstmail opnieuw (via publieke link)',
  'email.installation_connected_sent':     'Installatie gekoppeld',
  'email.ticket_reply_sent':               'Reactie op ticket',
  'email.ticket_customer_reply_sent':      'Klant heeft ticket beantwoord',
  'email.mandate_confirm_sent':            'Incasso-bevestiging',
  'email.mandate_day3_sent':               'Incasso-herinnering (dag 3)',
  'email.mandate_day10_sent':              'Incasso-laatste-herinnering (dag 10)',
  'email.password_changed_sent':           'Wachtwoord gewijzigd',
}

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

  // Partner-scope guard: alleen mail-log tonen van eigen klanten
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

  const { data: customer } = await supabase
    .from('customers')
    .select('id, email')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  // audit_log filteren. LIKE-filter kan PostgREST met ilike-operator.
  const { data, error } = await supabase
    .from('audit_log')
    .select('id, action, meta, created_at')
    .eq('entity_type', 'customer')
    .eq('entity_id', customerId)
    .ilike('action', 'email.%')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return {
    customer_email: customer.email,
    events: (data || []).map(r => ({
      id: r.id,
      at: r.created_at,
      action: r.action,
      label: ACTION_LABELS[r.action] || r.action,
      to: (r.meta as any)?.to || null,
      // Legacy audit-entries missen soms de success-vlag → dan tonen we 'success'
      // omdat er destijds alleen op succes ge-audit werd.
      success: (r.meta as any)?.success !== false,
      subject: (r.meta as any)?.subject || null,
    })),
  }
})
