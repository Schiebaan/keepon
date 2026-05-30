import { getServiceRoleClient } from '~~/server/utils/supabase'

const VALID_COLORS = new Set(['gray', 'blue', 'green', 'amber', 'orange', 'red', 'purple', 'sky', 'pink', 'teal'])

/** Wijzig een ticketlabel (naam / kleur / volgorde / actief). */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const labelId = getRouterParam(event, 'id')
  if (!labelId) throw createError({ statusCode: 400, message: 'label id ontbreekt' })
  const body = await readBody(event).catch(() => ({} as any))

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
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (typeof body?.name === 'string') {
    const n = body.name.trim().slice(0, 60)
    if (!n) throw createError({ statusCode: 400, message: 'Naam mag niet leeg zijn' })
    updates.name = n
  }
  if (body?.color !== undefined) updates.color = VALID_COLORS.has(body.color) ? body.color : 'gray'
  if (body?.sort_order !== undefined) updates.sort_order = Math.max(0, Number(body.sort_order) || 0)
  if (body?.is_active !== undefined) updates.is_active = !!body.is_active

  const { data, error } = await supabase
    .from('ticket_labels')
    .update(updates)
    .eq('id', labelId)
    .eq('partner_id', partnerId)   // scope-guard: alleen eigen labels
    .select('id, name, color, sort_order, is_active')
    .single()
  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, message: 'Er bestaat al een label met deze naam' })
    if (error.code === 'PGRST116') throw createError({ statusCode: 404, message: 'Label niet gevonden' })
    throw createError({ statusCode: 500, message: error.message })
  }

  await auditLog(event, 'ticket_label.updated', 'ticket_label', labelId, { updates, partner_id: partnerId })
  return data
})
