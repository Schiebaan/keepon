import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Update a partner_admin's display name (only field editable for now).
 *
 * The name is used to attribute their replies on customer-facing surfaces —
 * "Reactie van Mark" instead of "Reactie van Volt4u". An admin can only edit
 * names of users within their own partner.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const targetUserId = getRouterParam(event, 'id')
  if (!targetUserId) throw createError({ statusCode: 400, message: 'user id ontbreekt' })

  const body = await readBody(event).catch(() => ({} as any))
  const fullName = typeof body?.full_name === 'string' ? body.full_name.trim().slice(0, 80) : ''

  // Resolve partner scope from caller
  const { data: callerRole } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single()
  let partnerId = callerRole?.partner_id
  if (callerRole?.role === 'platform_admin' && !partnerId) {
    const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
    partnerId = fp?.id
  }
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  // Verify target is partner_admin of the same partner
  const { data: targetRole } = await supabase
    .from('user_roles')
    .select('user_id, partner_id, role')
    .eq('user_id', targetUserId)
    .eq('partner_id', partnerId)
    .single()
  if (!targetRole) throw createError({ statusCode: 404, message: 'Gebruiker niet gevonden bij deze partner' })

  const { error } = await supabase
    .from('user_roles')
    .update({ full_name: fullName || null })
    .eq('user_id', targetUserId)
    .eq('partner_id', partnerId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'partner_user.renamed', 'user_role', targetUserId, {
    full_name: fullName || null,
    partner_id: partnerId,
  })

  return { ok: true, id: targetUserId, full_name: fullName || null }
})
