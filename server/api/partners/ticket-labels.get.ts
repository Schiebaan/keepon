import { getServiceRoleClient } from '~~/server/utils/supabase'

/** Lijst alle ticketlabels van de partner (catalogus voor picker + settings). */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

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
  if (!partnerId) return []

  const q = getQuery(event)
  let query = supabase
    .from('ticket_labels')
    .select('id, name, color, sort_order, is_active')
    .eq('partner_id', partnerId)
    .order('sort_order', { ascending: true })

  // Default: alleen actieve labels. ?include_inactive=1 voor de settings-UI.
  if (q.include_inactive !== '1') query = query.eq('is_active', true)

  const { data, error } = await query
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data || []
})
