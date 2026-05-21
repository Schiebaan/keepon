import type { SupabaseClient } from '@supabase/supabase-js'
import { sendEmail, buildMandateMail } from './email'

/**
 * Centrale helper voor de mandaat-mailserie (confirm / day3 / day10).
 *
 * Gebruikt door:
 *  - /api/customer/onboarding/accept.post.ts → kind='confirm' direct na akkoord
 *  - /api/cron/mandate-reminders.post.ts → kind='day3' / 'day10' op schema
 *
 * Idempotent: leest en schrijft `customers.mandate_reminders_sent` (JSONB array)
 * zodat dezelfde mail niet twee keer verstuurd wordt — handig bij retries en
 * dubbele cron-runs.
 */

const MODULE_LABELS: Record<string, string> = {
  solar_panel: 'Zonnepanelen',
  solar: 'Zonnepanelen',
  heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal',
  battery: 'Thuisbatterij',
}

export type MandateReminderKind = 'confirm' | 'day3' | 'day10'

interface SendResult {
  sent: boolean
  reason?: 'already_sent' | 'mandate_already_active' | 'no_email' | 'send_failed'
  error?: string
}

/**
 * Verstuur één mandaat-mail aan de klant en log dat die binnen is in
 * `mandate_reminders_sent`. Retourneert {sent: false, reason} als er niets
 * verstuurd hoeft te worden (bv. omdat de klant al een mandaat heeft).
 */
export async function sendMandateReminder(
  supabase: SupabaseClient,
  customerId: string,
  kind: MandateReminderKind,
): Promise<SendResult> {
  // Laad klant + partner met alles wat we nodig hebben voor de mail
  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email, accepted_modules, accepted_at, mollie_mandate_id, mandate_at, mandate_skipped, mandate_reminders_sent')
    .eq('id', customerId)
    .single()
  if (!customer) return { sent: false, reason: 'send_failed', error: 'customer not found' }
  if (!customer.email) return { sent: false, reason: 'no_email' }

  // Geen mail meer als mandaat al actief is — dat is wat we wilden bereiken
  if (customer.mollie_mandate_id) return { sent: false, reason: 'mandate_already_active' }

  // Idempotency: kijk in de sent-array of we deze kind al verstuurd hebben
  const sentArr: any[] = Array.isArray(customer.mandate_reminders_sent) ? customer.mandate_reminders_sent : []
  if (sentArr.some(e => e?.kind === kind)) {
    return { sent: false, reason: 'already_sent' }
  }

  const { data: partner } = await supabase
    .from('partners')
    .select('name, slug, primary_color, logo_url, support_email')
    .eq('id', customer.partner_id)
    .single()

  // Module-labels voor recap; prijs optioneel uit partner_module_configs
  const accepted: string[] = Array.isArray(customer.accepted_modules) ? customer.accepted_modules : []
  const labels: string[] = []
  let totalCents = 0
  if (accepted.length) {
    const { data: configs } = await supabase
      .from('partner_module_configs')
      .select('price_monthly, is_enabled, module_definition:module_definitions(type, name)')
      .eq('partner_id', customer.partner_id)
    for (const cfg of (configs || []) as any[]) {
      const t = cfg?.module_definition?.type
      if (!t || !accepted.includes(t)) continue
      if (cfg.is_enabled === false) continue
      const label = cfg.module_definition?.name || MODULE_LABELS[t] || t
      if (!labels.includes(label)) labels.push(label)
      totalCents += cfg.price_monthly || 0
    }
    // Fallback: als er geen partner-config gevonden is, gebruik dan
    // de generieke labels uit de map zodat de mail niet kaal is
    if (!labels.length) {
      for (const t of accepted) {
        const fallback = MODULE_LABELS[t]
        if (fallback && !labels.includes(fallback)) labels.push(fallback)
      }
    }
  }

  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
  const incassoUrl = `https://${partner?.slug ? partner.slug + '.' : ''}${baseDomain}/welkom/incasso`

  const { subject, html } = buildMandateMail({
    kind,
    customerName: customer.full_name || customer.email,
    acceptedModuleLabels: labels,
    totalMonthlyEuros: totalCents ? (totalCents / 100).toFixed(2).replace('.', ',') : null,
    incassoUrl,
    partner: partner
      ? {
          name: partner.name,
          primary_color: partner.primary_color,
          logo_url: partner.logo_url,
          support_email: partner.support_email,
        }
      : undefined,
  })

  try {
    // Geen replyTo: klant-replies horen niet in de partner-inbox te belanden.
    // De mail bevat zelf een CTA terug naar het portaal.
    await sendEmail({
      to: customer.email,
      subject,
      html,
    })
  } catch (e: any) {
    return { sent: false, reason: 'send_failed', error: e?.message || String(e) }
  }

  // Mark sent — append to JSONB array
  const updated = [...sentArr, { kind, at: new Date().toISOString() }]
  await supabase
    .from('customers')
    .update({ mandate_reminders_sent: updated })
    .eq('id', customer.id)

  return { sent: true }
}
