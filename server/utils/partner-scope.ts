import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Partnerafbakening op één plek.
 *
 * Dit patroon stond in elk endpoint apart overgeschreven, en juist daardoor
 * ontbrak het op zeven plekken volledig: wie het vergat, kreeg een endpoint
 * dat op UUID werkte zonder te controleren van wie dat UUID was. Een
 * installateur kon met een geraden id de klant, het product of het teamlid van
 * een andere installateur aanpassen.
 */

/** De partner waarvoor deze aanroep werkt. Werpt als die niet vast te stellen is. */
export async function resolvePartnerId(
  event: H3Event,
  supabase: SupabaseClient,
  userId: string,
): Promise<string> {
  // Het subdomein is leidend; een directe aanroep zonder tenant valt terug op
  // de rol van de gebruiker.
  const tenant = (event.context as any).tenant
  let partnerId: string | undefined = tenant?.id

  if (!partnerId) {
    const { data: role } = await supabase
      .from('user_roles')
      .select('partner_id, role')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()
    partnerId = role?.partner_id || undefined

    // Een platform_admin zonder eigen partner werkt op de eerste partner —
    // bestaand gedrag, hier alleen samengebracht.
    if (!partnerId && role?.role === 'platform_admin') {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).maybeSingle()
      partnerId = fp?.id || undefined
    }
  }

  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })
  return partnerId
}

/**
 * Hoort deze klant bij deze partner? Zo niet: 404, niet 403.
 *
 * Bewust 404. Een 403 bevestigt dat het id bestaat maar van iemand anders is,
 * en dat is precies wat iemand die ids afloopt wil weten.
 */
export async function assertCustomerInPartner(
  supabase: SupabaseClient,
  customerId: string,
  partnerId: string,
): Promise<{ id: string; partner_id: string }> {
  const { data } = await supabase
    .from('customers')
    .select('id, partner_id')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .maybeSingle()
  if (!data) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })
  return data as { id: string; partner_id: string }
}

/**
 * Mag deze gebruiker bij deze slimme meter?
 *
 * Twee soorten aanroepers delen dit endpoint: de klant zelf, en de
 * installateur. Beide moeten alleen bij hun eigen meters kunnen. Zonder deze
 * controle kon iedere ingelogde gebruiker — ook een klant van een andere
 * installateur — elke meter uitlezen of verwijderen op UUID.
 */
export async function assertSmartMeterAccess(
  event: H3Event,
  supabase: SupabaseClient,
  meterId: string,
  userId: string,
): Promise<{ id: string; customer_id: string | null; partner_id: string | null }> {
  const { data: meter } = await supabase
    .from('smart_meters')
    .select('id, customer_id, partner_id')
    .eq('id', meterId)
    .maybeSingle()
  if (!meter) throw createError({ statusCode: 404, message: 'Meter niet gevonden' })

  // Is het zijn eigen meter?
  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', userId)
    .maybeSingle()
  if (customer && meter.customer_id === customer.id) return meter as any

  // Of beheert hij de partner waar de meter onder valt?
  const { data: role } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle()
  const beheert = role && ['partner_admin', 'platform_admin'].includes(role.role)
  if (beheert && meter.partner_id && meter.partner_id === role.partner_id) return meter as any

  // 404 en niet 403 — zie assertCustomerInPartner.
  throw createError({ statusCode: 404, message: 'Meter niet gevonden' })
}
