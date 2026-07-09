import { getServiceRoleClient } from '~~/server/utils/supabase'

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')  // diacritics weg
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'artikel'
}

/** Nieuw support-artikel aanmaken. Platform-admin only. */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'platform_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event).catch(() => ({} as any))

  const title = String(body?.title || '').trim().slice(0, 200)
  if (!title) throw createError({ statusCode: 400, message: 'Titel ontbreekt' })

  const body_md = String(body?.body_md || '').trim()
  if (!body_md) throw createError({ statusCode: 400, message: 'Inhoud ontbreekt' })

  const excerpt = typeof body?.excerpt === 'string' ? body.excerpt.trim().slice(0, 400) : null
  const category = typeof body?.category === 'string' ? body.category.trim().slice(0, 60) || null : null
  const requestedSlug = typeof body?.slug === 'string' && body.slug.trim() ? slugify(body.slug) : slugify(title)

  // Uniek maken indien nodig
  let slug = requestedSlug
  let n = 2
  while (true) {
    const { data: existing } = await supabase.from('support_articles').select('id').eq('slug', slug).maybeSingle()
    if (!existing) break
    slug = `${requestedSlug}-${n++}`
    if (n > 100) throw createError({ statusCode: 500, message: 'Kon geen unieke slug maken' })
  }

  const publish = body?.publish === true
  const { data, error } = await supabase
    .from('support_articles')
    .insert({
      slug,
      title,
      excerpt,
      body_md,
      category,
      sort_order: Number(body?.sort_order) || 100,
      published_at: publish ? new Date().toISOString() : null,
      author_id: user.id,
    })
    .select('id, slug, title, excerpt, category, sort_order, published_at, updated_at')
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'support_article.created', 'support_article', data.id, {
    slug, title, published: publish,
  })
  return data
})
