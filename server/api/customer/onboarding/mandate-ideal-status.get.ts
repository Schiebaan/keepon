import { getMollie, redactMollieResponse } from '~~/server/utils/mollie'
import { getServiceRoleClient } from '~~/server/utils/supabase'
import { finalizeMandateFromPayment } from '~~/server/utils/mandate'

/**
 * Controleer hoe de iDEAL-machtiging is afgelopen, nadat de klant terugkeert
 * van zijn bank.
 *
 * We wachten hier bewust niet op de webhook. Die is leidend voor de
 * administratie, maar kan een paar seconden later komen — en zolang zou de
 * klant naar een laadscherm kijken zonder te weten of het gelukt is. Dus halen
 * we de betaling hier zelf op bij Mollie en leggen we het mandaat vast via
 * dezelfde functie die de webhook gebruikt. Wie er eerst is maakt niet uit.
 *
 * Welke betaling? Niet één uit de URL — die is door de klant te bewerken. We
 * pakken de laatste mandaatvalidatie van déze ingelogde klant.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, mollie_mandate_id, mandate_at')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Geen klantaccount' })

  // Al rond — bijvoorbeeld doordat de webhook ons voor was.
  if (customer.mollie_mandate_id) {
    return { status: 'paid', mandate: true, mandate_at: customer.mandate_at }
  }

  const { data: row } = await supabase
    .from('payments')
    .select('mollie_payment_id, status')
    .eq('customer_id', customer.id)
    .eq('description', 'Machtiging automatische incasso')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!row) return { status: 'none', mandate: false }

  let payment: any
  try {
    payment = await getMollie().payments.get(row.mollie_payment_id)
  } catch (e: any) {
    console.error('[mandate-ideal-status] fetch failed:', e?.message)
    return { status: row.status || 'open', mandate: false }
  }

  await supabase.from('payments').update({
    status: payment.status,
    mollie_mandate_id: payment.mandateId || null,
    paid_at: payment.paidAt || null,
    raw: redactMollieResponse(payment) as any,
  }).eq('mollie_payment_id', payment.id)

  const result = await finalizeMandateFromPayment(supabase, payment)
  if (result.changed) {
    await auditLog(event, 'onboarding.mandate_ideal_completed', 'customer', customer.id, {
      mollie_payment_id: payment.id,
      mollie_mandate_id: result.mandate_id,
      via: 'return',
    })
  }

  return {
    status: payment.status,
    mandate: result.ok,
    mandate_at: result.ok ? new Date().toISOString() : null,
  }
})
