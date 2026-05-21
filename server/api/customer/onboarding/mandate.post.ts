import { getServiceRoleClient } from '~~/server/utils/supabase'
import { getMollie, isMollieTestMode } from '~~/server/utils/mollie'

/**
 * Capture (or skip) the SEPA-mandate for this customer.
 *
 * Booking-model setup: UPsol is the merchant. The mandate authorizes UPsol to
 * direct-debit this customer for monthly service fees.
 *
 * Flow when the customer provides IBAN:
 *   1. Create (or re-use) a Mollie customer on UPsol's account
 *   2. Create a SEPA mandate via Mollie's Mandates API (IBAN + naam +
 *      signatureDate). Geen €0.01 "first payment" meer nodig — Mollie
 *      ondersteunt directdebit niet als first-payment-methode; de Mandates-
 *      API is hier het juiste pad. Mollie geeft direct een mandate.id terug;
 *      in test-mode is status='valid', in live-mode 'pending' tot de bank
 *      bevestigt. De webhook werkt de status later bij.
 *   3. Persist mollie_customer_id + mollie_mandate_id op de customer-rij
 *   4. Mark onboarding.step = 'done' en stamp mandate_at
 *
 * Skip path: customer chooses "doe ik later" — we just stamp mandate_skipped.
 *
 * De /api/cron/mandate-reminders job stuurt na 3 en 10 dagen herinneringen
 * naar klanten zonder actief mandaat.
 */

function isValidIban(iban: string): boolean {
  const v = iban.replace(/\s+/g, '').toUpperCase()
  return /^NL\d{2}[A-Z]{4}\d{10}$/.test(v) || /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(v)
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email, mollie_customer_id, mollie_mandate_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  const skip: boolean = !!body?.skip
  const iban: string = (body?.iban || '').toString().replace(/\s+/g, '').toUpperCase()
  const account_holder: string = (body?.account_holder || '').toString().trim()

  // --- Skip path -----------------------------------------------------------
  if (skip) {
    const now = new Date().toISOString()
    const meta = (user.user_metadata as any) || {}
    const current = meta.onboarding || {}
    await Promise.all([
      supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta,
          onboarding: { ...current, step: 'done', mandate_at: null, mandate_skipped: true },
        },
      }),
      supabase.from('customers').update({
        onboarding_step: 'done',
        mandate_at: null,
        mandate_skipped: true,
      }).eq('id', customer.id),
    ])
    await auditLog(event, 'onboarding.mandate_skipped', 'customer', customer.id, { at: now })
    return { ok: true, mandate_at: null, mandate_skipped: true, next: 'klaar' }
  }

  // --- Validate input ------------------------------------------------------
  if (!iban || !isValidIban(iban)) {
    throw createError({ statusCode: 400, message: 'Vul een geldig IBAN in (bv. NL91ABNA0417164300)' })
  }
  if (!account_holder) {
    throw createError({ statusCode: 400, message: 'Vul de naam op het rekeningnummer in' })
  }

  // --- Mollie: customer + first-payment mandate ----------------------------
  const mollie = getMollie()

  // Re-use existing Mollie customer if we already created one (e.g. retry)
  let mollieCustomerId = customer.mollie_customer_id || null
  if (!mollieCustomerId) {
    try {
      const created = await mollie.customers.create({
        name: customer.full_name || account_holder,
        email: customer.email || undefined,
        metadata: { upsol_customer_id: customer.id, upsol_partner_id: customer.partner_id },
      })
      mollieCustomerId = created.id
    } catch (e: any) {
      throw createError({ statusCode: 502, message: 'Mollie-customer aanmaken mislukt: ' + (e?.message || 'onbekend') })
    }
  }

  // Mandate aanmaken via de Mandates-API in plaats van de €0.01 first-payment
  // dans. Direct debit ondersteunt namelijk geen sequenceType='first' meer in
  // de huidige Mollie API — daar is de Mandates-API juist voor bedoeld. We
  // schrijven het IBAN + de tenaamstelling + de signatureDate (vandaag, want
  // de klant heeft net "Geef incasso af" geklikt) en krijgen meteen een
  // mandate.id terug die we voor recurring charges kunnen gebruiken.
  let mandate
  try {
    mandate = await mollie.customerMandates.create({
      customerId: mollieCustomerId,
      method: 'directdebit',
      consumerName: account_holder,
      consumerAccount: iban,
      signatureDate: new Date().toISOString().slice(0, 10),
    } as any)
  } catch (e: any) {
    throw createError({ statusCode: 502, message: 'Mollie-mandaat aanmaken mislukt: ' + (e?.message || 'onbekend') })
  }

  const now = new Date().toISOString()
  const meta = (user.user_metadata as any) || {}
  const current = meta.onboarding || {}

  // Mark the customer as "mandate set" in user_metadata + customers table.
  // Mollie geeft direct een mandate-id terug; status='valid' (test) of
  // 'pending' (live, tot de bank bevestigt). Beide stempelen we vast — de
  // webhook werkt status later bij als 'ie van pending naar valid/invalid
  // springt.
  const mandateActive = (mandate as any)?.status === 'valid'
  await Promise.all([
    supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        onboarding: { ...current, step: 'done', mandate_at: now, mandate_skipped: false },
      },
    }),
    supabase.from('customers').update({
      mollie_customer_id: mollieCustomerId,
      mollie_mandate_id: mandate.id,
      onboarding_step: 'done',
      mandate_at: now,
      mandate_skipped: false,
    }).eq('id', customer.id),
  ])

  await auditLog(event, 'onboarding.mandate_created', 'customer', customer.id, {
    iban: iban.slice(0, 4) + '****' + iban.slice(-4),
    account_holder,
    mollie_customer_id: mollieCustomerId,
    mollie_mandate_id: mandate.id,
    mandate_status: (mandate as any)?.status || null,
    test_mode: isMollieTestMode(),
    at: now,
  })

  return {
    ok: true,
    mandate_at: now,
    mandate_skipped: false,
    mandate_active: mandateActive,
    next: 'klaar',
  }
})
