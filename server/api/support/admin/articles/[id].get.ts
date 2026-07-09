import { getServiceRoleClient } from '~~/server/utils/supabase'

/** Admin: haal één artikel op (inclusief concept). Platform-admin only. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'platform_admin')
  const supabase = getServiceRoleClient(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id ontbreekt' })

  const { data, error } = await supabase
    .from('support_articles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) {
    if (error.code === 'PGRST116') throw createError({ statusCode: 404, message: 'Artikel niet gevonden' })
    throw createError({ statusCode: 500, message: error.message })
  }
  return data
})
