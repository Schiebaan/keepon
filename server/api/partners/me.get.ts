import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // If on a subdomain (e.g. volt4u.upsol.nl), use that tenant's partner
  // This prevents showing the wrong partner when a platform_admin or partner_admin
  // visits a different partner's subdomain
  const tenant = event.context.tenant
  let partnerId = tenant?.id


  // Otherwise: use the user's assigned partner
  if (!partnerId) {
    const { data: role } = await supabase
      .from('user_roles')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .single()

    partnerId = role?.partner_id

    // Platform admin fallback: first partner
    if (role?.role === 'platform_admin' && !partnerId) {
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
