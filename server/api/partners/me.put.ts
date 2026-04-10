import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  // Get partner ID for this user
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

  if (!partnerId) throw createError({ statusCode: 404, message: 'Geen partner gevonden' })

  // Only allow updating safe fields
  const allowed = ['name', 'slug', 'logo_url', 'primary_color', 'secondary_color', 'support_email', 'support_phone', 'terms_url', 'terms_content', 'terms_placeholders']
  const updates: Record<string, any> = {}
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('partners')
    .update(updates)
    .eq('id', partnerId)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'partner.updated', 'partner', partnerId, { fields: Object.keys(updates) })

  return data
})
