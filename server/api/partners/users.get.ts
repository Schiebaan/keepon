import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Get partner ID for this user
  const { data: role } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single()

  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin') {
    const query = getQuery(event)
    partnerId = (query.partner_id as string) || partnerId
    if (!partnerId) {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }

  if (!partnerId) return []

  // Get all users with partner_admin role for this partner
  const { data: roles } = await supabase
    .from('user_roles')
    .select('user_id, role, full_name, created_at')
    .eq('partner_id', partnerId)
    .eq('role', 'partner_admin')

  if (!roles?.length) return []

  // Get auth user details + derive a clean display name when full_name is null
  const { deriveNameFromEmail } = await import('~~/server/utils/admin-name')
  const users = []
  for (const r of roles) {
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(r.user_id)
    if (authUser) {
      const metaName = (authUser.user_metadata as any)?.full_name
        || (authUser.user_metadata as any)?.name
        || null
      users.push({
        id: r.user_id,
        email: authUser.email,
        full_name: r.full_name || metaName || null,
        display_name: r.full_name || metaName || deriveNameFromEmail(authUser.email || ''),
        created_at: r.created_at,
        last_sign_in: authUser.last_sign_in_at,
      })
    }
  }

  return users
})
