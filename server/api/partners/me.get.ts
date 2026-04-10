import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Get the partner for this admin user
  const { data: role } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single()

  if (!role) throw createError({ statusCode: 403, message: 'Geen partner gekoppeld' })

  // Platform admins: use tenant context or first partner
  let partnerId = role.partner_id
  if (role.role === 'platform_admin' && !partnerId) {
    const tenant = event.context.tenant
    if (tenant?.id) {
      partnerId = tenant.id
    } else {
      // Fallback: first partner
      const { data: firstPartner } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = firstPartner?.id
    }
  }

  if (!partnerId) throw createError({ statusCode: 404, message: 'Geen partner gevonden' })

  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
