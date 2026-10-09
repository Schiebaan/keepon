import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Haalt de afleverstatus van recente mails op uit Resend en zet die in
 * `email_status`. Resend geeft per mail alleen de laatste gebeurtenis
 * (`last_event`), en die verandert nog na verzending (afgeleverd → geopend),
 * dus we lopen telkens de laatste twee weken opnieuw door.
 *
 * Wordt aangeroepen vanuit het endpoint dat de status toont. Per worker
 * hooguit eens per minuut, en nooit twee tegelijk.
 */

const SYNC_INTERVAL_MS = 60_000
const LOOKBACK_MS = 14 * 24 * 60 * 60 * 1000
const MAX_PAGES = 10

let lastSync = 0
let inFlight: Promise<void> | null = null

export function syncResendStatus(event: any): Promise<void> {
  if (inFlight) return inFlight
  if (Date.now() - lastSync < SYNC_INTERVAL_MS) return Promise.resolve()
  inFlight = doSync(event)
    .catch((e) => console.error('[resend-status] sync mislukt:', e?.message))
    .finally(() => { lastSync = Date.now(); inFlight = null })
  return inFlight
}

async function doSync(event: any) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  const supabase = getServiceRoleClient(event)
  const cutoff = Date.now() - LOOKBACK_MS

  let after: string | null = null
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = 'https://api.resend.com/emails?limit=100' + (after ? `&after=${after}` : '')
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } })
    if (!res.ok) throw new Error(`Resend ${res.status}`)
    const json: any = await res.json()
    const mails: any[] = json.data || []

    const rows = mails
      .filter(m => Array.isArray(m.to) && m.to[0])
      .map(m => ({
        resend_id: m.id,
        to_email: String(m.to[0]).toLowerCase(),
        subject: m.subject || null,
        last_event: m.last_event || null,
        sent_at: new Date(m.created_at.replace(' ', 'T').replace(/\+00$/, 'Z')).toISOString(),
        synced_at: new Date().toISOString(),
      }))
    if (rows.length) {
      const { error } = await supabase.from('email_status').upsert(rows, { onConflict: 'resend_id' })
      if (error) throw new Error(error.message)
    }

    const oldest = rows.at(-1)?.sent_at
    if (!json.has_more || !mails.length || (oldest && new Date(oldest).getTime() < cutoff)) break
    after = mails.at(-1).id
  }
}
