import { getServiceRoleClient } from '~~/server/utils/supabase'
import { sendMandateReminder } from '~~/server/utils/mandate-reminders'

/**
 * Customer accepts the service-contract proposal. This is the binding moment.
 * - Stamps accepted_at on the auth user's metadata
 * - Advances onboarding step to 'incasso' (paying is a parallel flow)
 * - Writes an audit-log entry so we have a clear record of consent
 *
 * The actual SEPA-mandate is collected on the next screen and is NOT a blocker
 * for activation — if the customer skips, a later cron job nudges them by mail.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event).catch(() => ({}))

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  // The customer can de-select modules in the proposal UI; we keep that decision.
  const VALID_MODULES = new Set(['solar', 'heat_pump', 'ev_charger', 'battery'])
  const accepted_modules: string[] = Array.isArray(body?.accepted_modules)
    ? body.accepted_modules.filter((m: any) => VALID_MODULES.has(m))
    : []

  // Akkoord zonder modules levert een klant op die wél "actief" heet maar
  // niet gefactureerd kan worden: computeCustomerCharge() vindt geen
  // contractregels en /klant/contracten toont een lege lijst. De UI blokkeert
  // dit al (knop disabled bij 0 selectie), maar zonder deze check kan een
  // directe API-call alsnog zo'n stille breuk aanmaken.
  if (!accepted_modules.length) {
    throw createError({
      statusCode: 400,
      message: 'Kies ten minste één onderdeel om te activeren.',
    })
  }

  // Termijn-keuze van de klant — alleen 'monthly' of 'yearly' geaccepteerd.
  // Default 'monthly' als 'ie niets meegeeft of een onbekende waarde stuurt.
  const billing_interval: 'monthly' | 'yearly' =
    body?.billing_interval === 'yearly' ? 'yearly' : 'monthly'

  const meta = (user.user_metadata as any) || {}
  const current = meta.onboarding || {}

  // Idempotency: if the customer already accepted, return the original consent
  // unchanged. Prevents duplicate audit-log entries on double-click / multi-tab.
  if (current.accepted_at) {
    return {
      ok: true,
      already_accepted: true,
      accepted_at: current.accepted_at,
      accepted_modules: current.accepted_modules || [],
      next: current.step === 'done' ? 'done' : 'incasso',
    }
  }

  const acceptedAt = new Date().toISOString()

  // Dual-write: keep user_metadata in sync so the auth-guard middleware (which
  // reads useSupabaseUser().value.user_metadata client-side) sees the change
  // without a roundtrip, AND mirror to the customers table so the partner-
  // admin list endpoint can read everyone's status in one SELECT.
  await Promise.all([
    supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        onboarding: {
          ...current,
          step: 'incasso',
          accepted_at: acceptedAt,
          accepted_modules: accepted_modules.length ? accepted_modules : null,
        },
      },
    }),
    supabase.from('customers').update({
      onboarding_step: 'incasso',
      accepted_at: acceptedAt,
      accepted_modules: accepted_modules.length ? accepted_modules : null,
      billing_interval,
    }).eq('id', customer.id),
  ])

  // Capture some context for the audit trail
  const headers = getRequestHeaders(event)
  const userAgent = headers['user-agent'] || null
  const ip = (headers['x-forwarded-for'] || '').toString().split(',')[0].trim() || null

  await auditLog(event, 'onboarding.accepted', 'customer', customer.id, {
    accepted_at: acceptedAt,
    accepted_modules,
    billing_interval,
    user_agent: userAgent,
    ip,
  })

  // --- Sundata: monitoring aanzetten ------------------------------------
  //
  // De zonne-installaties van deze partner staan bij Sundata als "light": wel
  // aangemaakt, maar zonder monitored_since, dus Sundata haalt nog geen data op.
  // Dat zetten we hier aan, op de datum van het akkoord.
  //
  // Alleen als de klant zonnepanelen heeft geaccepteerd, en uitsluitend ná dit
  // akkoord: activeren is bij Sundata onomkeerbaar (4033
  // plant_turn_off_monitored_since_not_allowed).
  //
  // Mislukt het, dan blijft het akkoord staan. Monitoring kan daarna alsnog aan;
  // een akkoord laten klappen omdat een koppeling hikte is veel erger.
  if (accepted_modules.includes('solar')) {
    try {
      const { activatePlantsForCustomer } = await import('~~/server/utils/sundata-activate')
      const resultaten = await activatePlantsForCustomer(
        event, customer.partner_id,
        { id: customer.id, email: customer.email },
        acceptedAt.slice(0, 10),
      )
      if (resultaten.length) {
        await auditLog(event, 'sundata.monitoring_activated', 'customer', customer.id, {
          partner_id: customer.partner_id,
          customer_id: customer.id,
          plants: resultaten.map(r => ({ plant: r.plantId, status: r.status, error: r.error })),
        })
        const mislukt = resultaten.filter(r => r.status === 'failed')
        if (mislukt.length) {
          console.error('[accept] Sundata-activering mislukt voor', customer.email,
            mislukt.map(r => `${r.plantId}: ${r.error}`).join(' | '))
        }
      }
    } catch (e: any) {
      console.error('[accept] Sundata-activering overgeslagen:', e?.message)
    }
  }


  // Direct na akkoord: bevestigingsmail met incasso-CTA (kind='confirm').
  // Wordt door sendMandateReminder zelf overgeslagen als het mandaat al actief
  // is of als deze mail al ooit verstuurd is. Niet awaiten om de response
  // snel terug te geven; fouten loggen we naar audit.
  sendMandateReminder(supabase, customer.id, 'confirm')
    .then(async (res) => {
      if (res.sent) {
        await auditLog(event, 'email.mandate_confirm_sent', 'customer', customer.id, {})
      } else if (res.reason === 'send_failed') {
        console.error('[onboarding/accept] mandate confirm send failed:', res.error)
      }
    })
    .catch((e) => console.error('[onboarding/accept] mandate confirm unexpected:', e?.message || e))

  return { ok: true, accepted_at: acceptedAt, accepted_modules, billing_interval, next: 'incasso' }
})
