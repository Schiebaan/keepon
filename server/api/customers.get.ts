import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Get partner ID
  const { data: role } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single()

  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const tenant = event.context.tenant
    if (tenant?.id) partnerId = tenant.id
    else {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }

  if (!partnerId) return []

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data || []
})
