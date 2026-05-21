import { getServiceRoleClient } from '~~/server/utils/supabase'
import { sendMandateReminder } from '~~/server/utils/mandate-reminders'

/**
 * Daily cron: stuur incasso-reminders (day3 + day10) aan klanten die akkoord
 * hebben gegeven maar nog geen mandaat hebben.
 *
 * Endpoint wordt aangeroepen via crontab (zie scripts/cron entries). Authenticatie
 * via een gedeeld geheim in de `x-cron-secret` header — vergelijkbaar met de
 * Vercel-cron-conventie.
 *
 * Selectie-logica:
 *   - accepted_at IS NOT NULL                  (klant heeft akkoord gegeven)
 *   - mollie_mandate_id IS NULL                (er is nog geen actief mandaat)
 *   - email IS NOT NULL                        (we kunnen ze überhaupt bereiken)
 *
 * Per klant wordt op basis van leeftijd van `accepted_at` bepaald welke kind
 * we sturen (eerst de oudste die nog niet verstuurd is — sendMandateReminder
 * is zelf idempotent).
 *
 * Day3: 3..9 dagen na akkoord (zodat we geen kind=confirm overschrijven en
 *       day10 nog netjes als laatste verschijnt).
 * Day10: ≥10 dagen na akkoord.
 *
 * Slimme exit: skipped klanten krijgen óók reminders — anders blijven ze
 * onbetaald zonder ooit nog een mail te krijgen. Wie écht niet wil reageert
 * gewoon niet.
 */
export default defineEventHandler(async (event) => {
  // Auth: shared secret in header
  const expected = process.env.CRON_SECRET
  const got = getRequestHeader(event, 'x-cron-secret') || ''
  if (!expected || got !== expected) {
    throw createError({ statusCode: 401, message: 'Niet geautoriseerd' })
  }

  const supabase = getServiceRoleClient(event)

  // Selecteer kandidaten — eenvoudige query, filtering en kind-bepaling doen
  // we in JS zodat het traceerbaar blijft.
  const { data: candidates, error } = await supabase
    .from('customers')
    .select('id, accepted_at, mollie_mandate_id, mandate_at, mandate_reminders_sent, email')
    .not('accepted_at', 'is', null)
    .is('mollie_mandate_id', null)
    .not('email', 'is', null)

  if (error) {
    return { ok: false, error: error.message }
  }

  const now = Date.now()
  const stats = { checked: 0, day3_sent: 0, day10_sent: 0, skipped: 0, failed: 0 }

  for (const c of candidates || []) {
    stats.checked += 1
    const acceptedAt = c.accepted_at ? new Date(c.accepted_at).getTime() : null
    if (!acceptedAt) { stats.skipped += 1; continue }
    const daysSince = Math.floor((now - acceptedAt) / 86400000)

    let kind: 'day3' | 'day10' | null = null
    if (daysSince >= 10) kind = 'day10'
    else if (daysSince >= 3) kind = 'day3'

    if (!kind) { stats.skipped += 1; continue }

    const res = await sendMandateReminder(supabase, c.id, kind)
    if (res.sent) {
      if (kind === 'day3') stats.day3_sent += 1
      else stats.day10_sent += 1
      await auditLog(event, `email.mandate_${kind}_sent`, 'customer', c.id, {})
    } else if (res.reason === 'send_failed') {
      stats.failed += 1
      console.error('[cron/mandate-reminders] send_failed for', c.id, res.error)
    } else {
      stats.skipped += 1
    }
  }

  return { ok: true, stats }
})
