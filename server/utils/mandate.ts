import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Eén plek waar een geslaagde iDEAL-mandaatvalidatie wordt vastgelegd.
 *
 * Dit moment kan ons langs twee kanten bereiken:
 *   1. de Mollie-webhook (betrouwbaar, maar kan seconden later komen)
 *   2. de klant die terugkeert van zijn bank naar /welkom/incasso
 *
 * Welke er ook eerst is, het resultaat moet identiek zijn. Vandaar deze
 * gedeelde functie: één set kolommen, één auditregel, en idempotent — twee
 * keer aanroepen met dezelfde payment levert geen dubbele administratie op.
 */
export interface MandateFinalizeResult {
  ok: boolean
  /** Was dit de aanroep die het mandaat daadwerkelijk vastlegde? */
  changed: boolean
  mandate_id: string | null
}

export async function finalizeMandateFromPayment(
  supabase: SupabaseClient,
  payment: any,
): Promise<MandateFinalizeResult> {
  const customerId = payment?.metadata?.upsol_customer_id
  const mandateId = payment?.mandateId

  if (!customerId || !mandateId) return { ok: false, changed: false, mandate_id: null }
  if (payment?.status !== 'paid') return { ok: false, changed: false, mandate_id: null }
  if (payment?.sequenceType !== 'first') return { ok: false, changed: false, mandate_id: null }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, auth_user_id, mollie_mandate_id')
    .eq('id', customerId)
    .single()
  if (!customer) return { ok: false, changed: false, mandate_id: null }

  // Al vastgelegd door de andere route — niets meer te doen.
  if (customer.mollie_mandate_id === mandateId) {
    return { ok: true, changed: false, mandate_id: mandateId }
  }

  const now = new Date().toISOString()

  await supabase.from('customers').update({
    mollie_mandate_id: mandateId,
    onboarding_step: 'done',
    mandate_at: now,
    mandate_skipped: false,
  }).eq('id', customer.id)

  // user_metadata bijwerken zodat de onboarding-router de klant niet opnieuw
  // naar de incassostap stuurt. Faalt dit, dan is de customers-rij nog steeds
  // leidend — daarom geen throw.
  if (customer.auth_user_id) {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(customer.auth_user_id)
      const meta = (u?.user?.user_metadata as any) || {}
      await supabase.auth.admin.updateUserById(customer.auth_user_id, {
        user_metadata: {
          ...meta,
          onboarding: { ...(meta.onboarding || {}), step: 'done', mandate_at: now, mandate_skipped: false },
        },
      })
    } catch (e: any) {
      console.error('[mandate] user_metadata bijwerken mislukt:', e?.message)
    }
  }

  return { ok: true, changed: true, mandate_id: mandateId }
}
