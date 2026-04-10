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

    // Get partner context
    const tenant = event.context.tenant
    const partnerId = tenant?.id || null

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
