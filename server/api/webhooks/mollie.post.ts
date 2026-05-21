import { getMollie, redactMollieResponse } from '~~/server/utils/mollie'
import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Mollie webhook receiver.
 *
 * Mollie sends a tiny POST with just `id=tr_xxxx` whenever a payment's status
 * changes. We fetch the full payment details from Mollie (their advice — don't
 * trust the body) and mirror the relevant fields into our `payments` table.
 *
 * On a successful first-payment (mandate-validation €0.01) we capture the
 * `mollie_mandate_id` onto the customer so we can use it for the recurring
 * monthly charges later.
 *
 * Webhook URLs at Mollie don't carry auth headers — security comes from
 *   (a) the URL being kept private,
 *   (b) us re-fetching the payment from Mollie (so a forged POST can only
 *       trigger us to refresh real data, never to fabricate it).
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({} as any))
  // Mollie sends form-encoded `id=tr_xxxx`. Nuxt's readBody parses both
  // form-data and JSON, so this works either way.
  const paymentId = (body?.id || '').toString()
  if (!paymentId) {
    throw createError({ statusCode: 400, message: 'Payment ID ontbreekt' })
  }

  const supabase = getServiceRoleClient(event)
  const mollie = getMollie()

  let payment: any
  try {
    payment = await mollie.payments.get(paymentId)
  } catch (e: any) {
    // Mollie returned 404 / 403 → silently 200 so they don't retry forever.
    console.error('[webhooks/mollie] payment fetch failed:', e?.message)
    return { received: true, status: 'fetch_failed' }
  }

  // Map Mollie status → mirror columns. We strippen PII (IBAN, naam op rekening,
  // BIC) uit de raw-payload — die zit al bij Mollie en hebben we niet zelf
  // nodig voor onze admin- of debug-flow. Zie redactMollieResponse().
  const updates: Record<string, any> = {
    status: payment.status,
    mollie_method: payment.method || null,
    raw: redactMollieResponse(payment),
  }
  if (payment.status === 'paid' && payment.paidAt) updates.paid_at = payment.paidAt
  if (payment.status === 'failed' && payment.failedAt) updates.failed_at = payment.failedAt
  if ((payment.status === 'expired' || payment.status === 'canceled') && payment.expiredAt) updates.failed_at = payment.expiredAt
  if (payment.amountRefunded?.value && parseFloat(payment.amountRefunded.value) > 0) updates.refunded_at = new Date().toISOString()
  if (payment.amountChargedBack?.value && parseFloat(payment.amountChargedBack.value) > 0) updates.charged_back_at = new Date().toISOString()
  if (payment.mandateId) updates.mollie_mandate_id = payment.mandateId

  await supabase.from('payments')
    .update(updates)
    .eq('mollie_payment_id', payment.id)

  // If this is the first-payment (mandate validation), capture the mandate
  // onto the customer so the admin can trigger recurring charges later.
  if (payment.status === 'paid' && payment.sequenceType === 'first' && payment.mandateId && payment.metadata?.upsol_customer_id) {
    await supabase.from('customers')
      .update({ mollie_mandate_id: payment.mandateId })
      .eq('id', payment.metadata.upsol_customer_id)
  }

  await auditLog(event, `payment.${payment.status}`, 'payment', null, {
    mollie_payment_id: payment.id,
    sequence_type: payment.sequenceType,
    amount: payment.amount,
    customer_id: payment.metadata?.upsol_customer_id,
  })

  return { received: true }
})
