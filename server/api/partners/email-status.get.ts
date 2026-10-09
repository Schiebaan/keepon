import { getServiceRoleClient } from '~~/server/utils/supabase'
import { syncResendStatus } from '~~/server/utils/resend-status'

/**
 * Afleverstatus van de laatste mail per klant van deze partner, voor de
 * badges op /admin/uitnodigingen. Bron is Resend (zie resend-status.ts).
 *
 * Het Resend-account is gedeeld tussen partners. We geven daarom alleen
 * status terug voor adressen van klanten van de eigen partner.
 *
 * Response: { [email]: { last_event, sent_at, subject } }
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const partnerId = await resolvePartnerId(event, supabase, user.id)
  if (!partnerId) return {}

  await syncResendStatus(event)

  const { data: klanten, error: kErr } = await supabase
    .from('customers')
    .select('email')
    .eq('partner_id', partnerId)
    .not('email', 'is', null)
  if (kErr) throw createError({ statusCode: 500, message: kErr.message })

  const adressen = [...new Set((klanten || []).map(k => String(k.email).toLowerCase()))]
  const result: Record<string, { last_event: string | null; sent_at: string; subject: string | null }> = {}

  // In stukken, anders wordt de querystring van PostgREST te lang.
  for (let i = 0; i < adressen.length; i += 150) {
    const stuk = adressen.slice(i, i + 150)
    const { data, error } = await supabase
      .from('email_status')
      .select('to_email, last_event, sent_at, subject')
      .in('to_email', stuk)
      .order('sent_at', { ascending: false })
    if (error) throw createError({ statusCode: 500, message: error.message })
    for (const r of data || []) {
      if (!result[r.to_email]) result[r.to_email] = { last_event: r.last_event, sent_at: r.sent_at, subject: r.subject }
    }
  }
  return result
})
