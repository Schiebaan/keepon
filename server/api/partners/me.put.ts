import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  // Prefer tenant from subdomain: ensures editing the partner matching the current URL
  const tenant = event.context.tenant
  let partnerId = tenant?.id

  // Fallback to user's partner
  if (!partnerId) {
    const { data: role } = await supabase
      .from('user_roles')
      .select('partner_id, role')
      .eq('user_id', user.id)
      .single()

    partnerId = role?.partner_id
    if (role?.role === 'platform_admin' && !partnerId) {
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

  // Keep support_phone ↔ terms_placeholders.telefoon and support_email ↔ ...email
  // in sync. Without this, partners type the right number in one field but the
  // welcome mail keeps using a stale seed value from the other. Settings UI has
  // two inputs because terms-placeholders is a separate concept, but in practice
  // they always represent the same thing.
  if (updates.support_phone !== undefined || updates.support_email !== undefined) {
    const ph = (updates.terms_placeholders && typeof updates.terms_placeholders === 'object')
      ? { ...updates.terms_placeholders }
      : null
    if (ph) {
      if (updates.support_phone !== undefined) ph.telefoon = updates.support_phone
      if (updates.support_email !== undefined) ph.email = updates.support_email
      updates.terms_placeholders = ph
    }
  } else if (updates.terms_placeholders && typeof updates.terms_placeholders === 'object') {
    // Reverse: partner only changed the terms placeholders — mirror back to
    // the support_* fields so the mail picks them up too.
    const ph = updates.terms_placeholders
    if (typeof ph.telefoon === 'string' && ph.telefoon) updates.support_phone = ph.telefoon
    if (typeof ph.email === 'string' && ph.email) updates.support_email = ph.email
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
