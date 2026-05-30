import { getServiceRoleClient } from '~~/server/utils/supabase'

const VALID_COLORS = new Set(['gray', 'blue', 'green', 'amber', 'orange', 'red', 'purple', 'sky', 'pink', 'teal'])

/** Maak een nieuw ticketlabel aan voor de partner. */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
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

  const name = String(body?.name || '').trim().slice(0, 60)
  if (!name) throw createError({ statusCode: 400, message: 'Geef het label een naam' })
  const color = VALID_COLORS.has(body?.color) ? body.color : 'gray'

  // Bepaal sort_order = max + 1 zodat nieuwe labels onderaan komen
  const { data: last } = await supabase
    .from('ticket_labels')
    .select('sort_order')
    .eq('partner_id', partnerId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle()
  const sortOrder = (last?.sort_order || 0) + 1

  const { data, error } = await supabase
    .from('ticket_labels')
    .insert({ partner_id: partnerId, name, color, sort_order: sortOrder })
    .select('id, name, color, sort_order, is_active')
    .single()
  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, message: 'Er bestaat al een label met deze naam' })
    throw createError({ statusCode: 500, message: error.message })
  }

  await auditLog(event, 'ticket_label.created', 'ticket_label', data.id, { name, color, partner_id: partnerId })
  return data
})
