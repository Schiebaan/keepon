import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Log een individuele welkomstmail-verzending als size-1 mailing_batch + join.
 *
 * De /admin/uitnodigingen pagina derived 'laatst gemaild' uit `latest_batch`,
 * dat is `mailing_batches × mailing_batch_customers`. Als je een single
 * 'Stuur uitnodiging' doet zonder hier een rij achter te laten, blijft die
 * klant voor altijd "Nooit gemaild" volgens de UI — terwijl de mail wel weg
 * is. Deze helper voorkomt die mismatch.
 *
 * Geen exception laten escapen: het versturen zelf is al gelukt, de log is
 * secundair. Bij fout: console.error en doorgaan.
 */
export async function logIndividualInvitation(args: {
  supabase: SupabaseClient
  partnerId: string
  customerId: string
  customerLabel: string  // e.g. customer name or email, voor de batch-naam
  actorUserId?: string | null
}): Promise<void> {
  const { supabase, partnerId, customerId, customerLabel, actorUserId } = args
  try {
    const now = new Date()
    const dateStr = now.toLocaleString('nl-NL', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    const name = `Individueel — ${customerLabel} (${dateStr})`

    const { data: batch, error: batchErr } = await supabase
      .from('mailing_batches')
      .insert({
        partner_id: partnerId,
        name,
        description: 'Individuele uitnodiging via portaal',
        customer_count: 1,
        // segment_filter krijgt een marker zodat we later in de UI deze
        // single-sends apart kunnen filteren als ze de batchlijst vervuilen.
        segment_filter: { kind: 'individual_send' },
        created_by: actorUserId || null,
      })
      .select('id')
      .single()
    if (batchErr || !batch) {
      console.error('[mailing-batch-log] batch insert faalde:', batchErr?.message)
      return
    }

    const { error: joinErr } = await supabase
      .from('mailing_batch_customers')
      .insert({ batch_id: batch.id, customer_id: customerId })
    if (joinErr) {
      // Rol de batch-rij terug zodat we geen orphan houden
      await supabase.from('mailing_batches').delete().eq('id', batch.id)
      console.error('[mailing-batch-log] join insert faalde:', joinErr.message)
    }
  } catch (e: any) {
    console.error('[mailing-batch-log] onverwachte fout:', e?.message || e)
  }
}
