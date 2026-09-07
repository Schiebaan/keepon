import { getMollie, formatMollieAmount, redactMollieResponse, isMollieTestMode } from '~~/server/utils/mollie'
import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Start een iDEAL-machtiging: de geverifieerde route naar een SEPA-mandaat.
 *
 * Waarom niet gewoon het IBAN laten intypen (zie mandate.post.ts)? Omdat daar
 * niets aan gecontroleerd wordt. De klant kan een typefout maken, of het
 * rekeningnummer van iemand anders invullen, en wij merken dat pas bij de
 * eerste incasso — weken later.
 *
 * Bij iDEAL logt de klant in bij zijn eigen bank. Mollie krijgt daardoor het
 * geverifieerde IBAN én de geverifieerde tenaamstelling terug, en maakt daar
 * automatisch een geldig SEPA-mandaat van. Dat scheelt niet alleen mislukte
 * incasso's: bij SEPA Core kan een consument tot 13 maanden terug een
 * afschrijving als "niet gemachtigd" terugvorderen, en een bank-geauthenticeerde
 * transactie is daartegen een stuk sterker bewijs dan een ingetypt nummer.
 *
 * Mollie's eis: een mandaat ontstaat alleen uit een échte betaling, dus
 * incasseren we €0,01. Dat bedrag houden we aan — een refund van één cent kost
 * meer aan transactiekosten dan hij waard is.
 *
 * De klant komt terug op /welkom/incasso?mandate=<paymentId>. Zowel die
 * terugkeer als de webhook leiden naar finalizeMandateFromPayment().
 */
const VALIDATION_AMOUNT_CENTS = 1

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email, mollie_customer_id, mollie_mandate_id')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  if (customer.mollie_mandate_id) {
    throw createError({ statusCode: 409, message: 'Er is al een machtiging afgegeven.' })
  }

  const mollie = getMollie()

  // Mollie-klant hergebruiken bij een tweede poging — anders stapelen we
  // wees-klanten op bij Mollie voor iedereen die halverwege afhaakt.
  let mollieCustomerId = customer.mollie_customer_id || null
  if (!mollieCustomerId) {
    try {
      const created = await mollie.customers.create({
        name: customer.full_name || customer.email || 'Klant',
        email: customer.email || undefined,
        metadata: { upsol_customer_id: customer.id, upsol_partner_id: customer.partner_id },
      })
      mollieCustomerId = created.id
      await supabase.from('customers').update({ mollie_customer_id: mollieCustomerId }).eq('id', customer.id)
    } catch (e: any) {
      throw createError({ statusCode: 502, message: 'Mollie-klant aanmaken mislukt: ' + (e?.message || 'onbekend') })
    }
  }

  // Terugkeer- en webhook-URL afleiden van de host waarop de klant zit, zodat
  // een partner-subdomein (volt4u.upsol.nl) ook op zijn eigen domein terugkomt.
  const host = getRequestHeader(event, 'x-forwarded-host') || getRequestHeader(event, 'host')
  const proto = (getRequestHeader(event, 'x-forwarded-proto') || 'https').toString().split(',')[0].trim()
  if (!host) throw createError({ statusCode: 500, message: 'Kan de terugkeer-URL niet bepalen.' })
  const baseUrl = `${proto}://${host}`

  let payment: any
  try {
    payment = await mollie.customerPayments.create({
      customerId: mollieCustomerId,
      amount: { currency: 'EUR', value: formatMollieAmount(VALIDATION_AMOUNT_CENTS) },
      description: 'Machtiging automatische incasso',
      sequenceType: 'first',
      method: 'ideal',
      redirectUrl: `${baseUrl}/welkom/incasso?mandate=pending`,
      webhookUrl: `${baseUrl}/api/webhooks/mollie`,
      metadata: {
        upsol_customer_id: customer.id,
        upsol_partner_id: customer.partner_id,
        purpose: 'mandate_validation',
      },
    } as any)
  } catch (e: any) {
    // De meest voorkomende oorzaak is een niet-geactiveerde betaalmethode op
    // het Mollie-profiel. Dat is niets wat de klant kan oplossen, dus zeggen we
    // niet "probeer opnieuw" maar geven we de echte reden door aan de logs.
    console.error('[mandate-ideal] payment create failed:', e?.message)
    throw createError({
      statusCode: 502,
      message: 'De iDEAL-machtiging kon niet worden gestart. Probeer het later opnieuw of vul je IBAN handmatig in.',
      data: { code: 'IDEAL_UNAVAILABLE', detail: isMollieTestMode() ? e?.message : undefined },
    })
  }

  await supabase.from('payments').insert({
    partner_id: customer.partner_id,
    customer_id: customer.id,
    mollie_payment_id: payment.id,
    mollie_method: 'ideal',
    amount_cents: VALIDATION_AMOUNT_CENTS,
    currency: 'EUR',
    description: 'Machtiging automatische incasso',
    status: payment.status || 'open',
    raw: redactMollieResponse(payment) as any,
  })

  await auditLog(event, 'onboarding.mandate_ideal_started', 'customer', customer.id, {
    mollie_payment_id: payment.id,
    mollie_customer_id: mollieCustomerId,
    test_mode: isMollieTestMode(),
  })

  const checkoutUrl = payment.getCheckoutUrl?.() || payment._links?.checkout?.href
  if (!checkoutUrl) {
    throw createError({ statusCode: 502, message: 'Mollie gaf geen betaallink terug.' })
  }

  return { ok: true, checkout_url: checkoutUrl, payment_id: payment.id }
})
