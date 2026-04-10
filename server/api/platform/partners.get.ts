import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'platform_admin')
  const supabase = getServiceRoleClient(event)

  const { data, error } = await supabase
    .from('partners')
    .select('*')
    .order('created_at')

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data || []
})
