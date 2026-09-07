import { getServiceRoleClient } from '~~/server/utils/supabase'
import { resolvePartnerId } from '~~/server/utils/partner-scope'

/** Openstaande storingen van deze partner, voor het dashboard. */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const partnerId = await resolvePartnerId(event, supabase, user.id)

  const { data, error } = await supabase
    .from('device_alerts')
    .select('id, kind, detail, first_seen_at, last_seen_at, customer_id, customer_product_id, customers(full_name, email), customer_products(name, category)')
    .eq('partner_id', partnerId)
    .is('resolved_at', null)
    .order('first_seen_at', { ascending: false })
    .limit(25)

  if (error) {
    // Draait migratie 033 nog niet, dan is een lege lijst het eerlijke antwoord
    // — beter dan een kapot dashboard.
    console.error('[alerts] kon storingen niet laden:', error.message)
    return []
  }

  return (data || []).map((a: any) => ({
    id: a.id,
    kind: a.kind,
    detail: a.detail,
    since: a.first_seen_at,
    customerId: a.customer_id,
    customerName: a.customers?.full_name || a.customers?.email || 'Klant',
    productName: a.customer_products?.name || a.customer_products?.category || 'Installatie',
    category: a.customer_products?.category || null,
  }))
})
