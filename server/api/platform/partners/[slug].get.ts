import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'platform_admin')
  const slug = getRouterParam(event, 'slug')
  const supabase = getServiceRoleClient(event)

  const { data: partner, error } = await supabase
    .from('partners')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !partner) throw createError({ statusCode: 404, message: 'Partner niet gevonden' })

  // Get customer count
  const { count: customerCount } = await supabase
    .from('customers')
    .select('id', { count: 'exact', head: true })
    .eq('partner_id', partner.id)

  // Get partner admin users
  const { data: adminRoles } = await supabase
    .from('user_roles')
    .select('user_id')
    .eq('partner_id', partner.id)
    .eq('role', 'partner_admin')

  return {
    ...partner,
    customer_count: customerCount || 0,
    admin_count: adminRoles?.length || 0,
  }
})
