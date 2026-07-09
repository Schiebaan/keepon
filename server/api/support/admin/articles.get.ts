import { getServiceRoleClient } from '~~/server/utils/supabase'

/** Admin lijst — inclusief concepten (published_at IS NULL). Platform-admin only. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'platform_admin')
  const supabase = getServiceRoleClient(event)

  const { data, error } = await supabase
    .from('support_articles')
    .select('id, slug, title, excerpt, category, sort_order, published_at, updated_at')
    .order('published_at', { ascending: false, nullsFirst: true })
    .order('sort_order', { ascending: true })
    .limit(500)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data || []
})
