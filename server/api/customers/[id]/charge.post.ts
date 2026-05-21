import { getServiceRoleClient } from '~~/server/utils/supabase'
import { getMollie, formatMollieAmount, redactMollieResponse } from '~~/server/utils/mollie'
import { computeCustomerCharge } from '~~/server/utils/pricing'

/**
 * Charge a recurring fee for one customer.
 *
 * Booking-model: UPsol bills the customer (via the mandate on UPsol's Mollie
 * account) and pays the partner separately under their B2B agreement.
 *
 * Pricing-logica leeft in computeCustomerCharge(). Hier interesseert ons
 * alleen: hoeveel + welke periode → Mollie aansturen → payments-rij wegschrijven.
 *
 * Admin kan in de body een override meegeven:
 *   - amount_cents   → eenmalige correctie (skipt pricing-helper)
 *   - description    → idem voor de Mollie-omschrijving
 *   - period_start / period_end → expliciete periode
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

  const supabase = getServiceRoleClient(event)
  const body = await readBody(event).catch(() => ({} as any))

  // Resolve partner_id (tenant > role)
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

  // Load minimal customer for mandate-check
  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name, email, mollie_customer_id, mollie_mandate_id')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  if (!customer.mollie_customer_id) {
    throw createError({ statusCode: 400, message: 'Deze klant heeft nog geen incasso ingesteld.' })
  }

  // --- Bedrag bepalen ------------------------------------------------------
  // Override-pad: admin geeft expliciet amount_cents → we trusten dat en
  // gebruiken alleen de helper voor de periode/description-defaults.
  const overrideAmount = Number(body?.amount_cents) || 0
  const overrideDescription = (body?.description || '').toString().trim() || ''

  const compute = await computeCustomerCharge(supabase, customer.id)

  // Skip-redenen — alleen relevant als admin GEEN expliciet bedrag forceert.
  if (!overrideAmount) {
    if (compute.skip_reason === 'no_modules') {
      throw createError({ statusCode: 400, message: 'Klant heeft geen geaccepteerde modules — kies een bedrag of accepteer eerst modules.' })
    }
    if (compute.skip_reason === 'no_price') {
      throw createError({ statusCode: 400, message: 'Geen prijs gevonden voor de modules van deze klant.' })
    }
    if (compute.skip_reason === 'trial') {
      const endsAt = compute.trial?.ends_at
        ? new Date(compute.trial.ends_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
        : 'einde proefperiode'
      throw createError({
        statusCode: 400,
        message: `Klant zit nog in z'n proefperiode tot ${endsAt}. Wil je tóch incasseren? Geef dan amount_cents mee.`,
      })
    }
  }

  const amountCents = overrideAmount || compute.amount_cents
  if (!amountCents) {
    throw createError({ statusCode: 400, message: 'Geen bedrag om te incasseren.' })
  }
  const description = overrideDescription || compute.description
  const periodStart = (body?.period_start as string) || compute.period_start
  const periodEnd = (body?.period_end as string) || compute.period_end

  // Webhook URL — bounce back to whichever host the admin is on
  const host = getRequestHeader(event, 'host') || ''
  const proto = (getRequestHeader(event, 'x-forwarded-proto') || 'https').toString().split(',')[0].trim()
  const webhookUrl = host ? `${proto}://${host}/api/webhooks/mollie` : undefined

  // Create the recurring payment via Mollie. Uses the mandate that was created
  // during onboarding — Mollie will execute the SEPA direct debit automatically.
  const mollie = getMollie()
  let payment: any
  try {
    payment = await mollie.customerPayments.create({
      customerId: customer.mollie_customer_id,
      amount: { currency: 'EUR', value: formatMollieAmount(amountCents) },
      description,
      sequenceType: 'recurring',
      webhookUrl,
      metadata: {
        upsol_customer_id: customer.id,
        upsol_partner_id: customer.partner_id,
        period_start: periodStart,
        period_end: periodEnd,
        billing_interval: compute.billing_interval,
      },
    } as any)
  } catch (e: any) {
    throw createError({ statusCode: 502, message: 'Mollie-incasso aanmaken mislukt: ' + (e?.message || 'onbekend') })
  }

  const { data: row } = await supabase.from('payments').insert({
    partner_id: partnerId,
    customer_id: customer.id,
    mollie_payment_id: payment.id,
    mollie_mandate_id: customer.mollie_mandate_id,
    mollie_method: 'directdebit',
    amount_cents: amountCents,
    currency: 'EUR',
    description,
    status: payment.status || 'open',
    period_start: periodStart,
    period_end: periodEnd,
    raw: redactMollieResponse(payment) as any,
  }).select('id, mollie_payment_id, amount_cents, status, period_start, period_end').single()

  await auditLog(event, 'payment.created', 'payment', row?.id || null, {
    customer_id: customer.id,
    amount_cents: amountCents,
    mollie_payment_id: payment.id,
    period_start: periodStart,
    period_end: periodEnd,
    billing_interval: compute.billing_interval,
    via: overrideAmount ? 'manual_override' : 'computed',
  })

  return { ok: true, payment: row, billing_interval: compute.billing_interval }
})
