import { getServiceRoleClient } from '~~/server/utils/supabase'

/** Wijzig een support-artikel. Platform-admin only. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'platform_admin')
  const supabase = getServiceRoleClient(event)
  const id = getRouterParam(event, 'id')
  if (!id) throw createError({ statusCode: 400, message: 'id ontbreekt' })
  const body = await readBody(event).catch(() => ({} as any))

  const updates: Record<string, any> = {}
  if (typeof body?.title === 'string') updates.title = body.title.trim().slice(0, 200)
  if (typeof body?.excerpt === 'string') updates.excerpt = body.excerpt.trim().slice(0, 400) || null
  if (typeof body?.body_md === 'string') updates.body_md = body.body_md
  if (typeof body?.category === 'string') updates.category = body.category.trim().slice(0, 60) || null
  if (typeof body?.slug === 'string' && body.slug.trim()) updates.slug = body.slug.trim().slice(0, 80)
  if (body?.sort_order !== undefined) updates.sort_order = Number(body.sort_order) || 100

  // Publish/unpublish
  if (body?.publish === true) updates.published_at = new Date().toISOString()
  if (body?.publish === false) updates.published_at = null

  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: 'Geen wijzigingen meegegeven' })

  const { data, error } = await supabase
    .from('support_articles')
    .update(updates)
    .eq('id', id)
    .select('id, slug, title, excerpt, category, sort_order, published_at, updated_at')
    .single()

  if (error) {
    if (error.code === '23505') throw createError({ statusCode: 409, message: 'Deze slug bestaat al' })
    throw createError({ statusCode: 500, message: error.message })
  }

  await auditLog(event, 'support_article.updated', 'support_article', id, { updates })
  return data
})
