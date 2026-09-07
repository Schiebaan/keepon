import type { H3Event } from 'h3'
import { getServiceRoleClient } from './supabase'

export async function auditLog(
  event: H3Event,
  action: string,
  entityType: string,
  entityId: string | null,
  meta: Record<string, any> = {}
) {
  try {
    const supabase = getServiceRoleClient(event)

    // Get actor from auth
    let actorId: string | null = null
    const authHeader = getHeader(event, 'authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7))
      actorId = user?.id || null
    }

    // Partnercontext. De tenant komt uit het subdomein, maar niet elke
    // aanroep heeft er een: cron-jobs, webhooks en interne aanroepen draaien
    // zonder. Die regels kregen partner_id null en waren daardoor onzichtbaar
    // op het dashboard — juist meldingen die vanzelf binnenkomen.
    //
    // Valt de tenant weg, dan leiden we de partner af uit de meegegeven meta,
    // en anders uit de klant waar het over gaat.
    const tenant = event.context.tenant
    let partnerId: string | null = tenant?.id || null

    if (!partnerId && meta?.partner_id) {
      partnerId = meta.partner_id
    }
    if (!partnerId && meta?.customer_id) {
      const { data: c } = await supabase
        .from('customers')
        .select('partner_id')
        .eq('id', meta.customer_id)
        .single()
      partnerId = c?.partner_id || null
    }

    await supabase.from('audit_log').insert({
      actor_id: actorId,
      partner_id: partnerId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      meta,
    })
  } catch (e) {
    // Never let audit logging break the main flow
    console.error('[audit] Failed to log:', action, entityType, entityId, e)
  }
}
