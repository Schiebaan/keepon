import { getServiceRoleClient } from '~~/server/utils/supabase'

/** Verwijder een support-artikel. Platform-admin only. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'platform_admin')
  const supabase = getServiceRoleClient(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id ontbreekt' })

  const { error } = await supabase.from('support_articles').delete().eq('id', id)
  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'support_article.deleted', 'support_article', id, {})
  return { ok: true }
})
