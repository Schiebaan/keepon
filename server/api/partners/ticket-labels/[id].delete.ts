import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Verwijder een ticketlabel. De FK op service_ticket_labels heeft ON DELETE
 * CASCADE, dus toewijzingen aan tickets verdwijnen automatisch mee.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const labelId = getRouterParam(event, 'id')
  if (!labelId) throw createError({ statusCode: 400, message: 'label id ontbreekt' })

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

  const { error } = await supabase
    .from('ticket_labels')
    .delete()
    .eq('id', labelId)
    .eq('partner_id', partnerId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'ticket_label.deleted', 'ticket_label', labelId, { partner_id: partnerId })
  return { ok: true }
})
