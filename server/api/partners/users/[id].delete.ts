import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const userId = getRouterParam(event, 'id')
  const supabase = getServiceRoleClient(event)

  // Remove the partner_admin role (don't delete the auth user — they might be a customer too)
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('role', 'partner_admin')

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'partner_user.removed', 'user_role', userId!, {})

  return { success: true }
})
