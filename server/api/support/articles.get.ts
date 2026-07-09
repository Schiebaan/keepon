import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Publieke lijst van support-artikelen. Auth niet vereist.
 *
 * ?q=<zoekterm>   → filter op title/excerpt/body_md (ilike). Voor MVP;
 *                   later kunnen we upgraden naar FTS via de tsvector-
 *                   index die de migratie al aangelegd heeft.
 * ?category=<x>   → filter op category (exact)
 *
 * Response is gegroepeerd per category zodat de UI meteen kan renderen.
 */
export default defineEventHandler(async (event) => {
  const supabase = getServiceRoleClient(event)
  const q = getQuery(event)
  const search = String(q.q || '').trim()
  const category = String(q.category || '').trim()

  let query = supabase
    .from('support_articles')
    .select('id, slug, title, excerpt, category, tags, sort_order, published_at, updated_at')
    .not('published_at', 'is', null)
    .order('sort_order', { ascending: true })
    .order('title', { ascending: true })

  if (category) query = query.eq('category', category)
  if (search) {
    // Escape PostgREST-special chars, cap length
    const s = search.replace(/[,()%\\]/g, '').slice(0, 80)
    query = query.or(
      `title.ilike.%${s}%,excerpt.ilike.%${s}%,body_md.ilike.%${s}%`,
    )
  }

  const { data, error } = await query.limit(200)
  if (error) throw createError({ statusCode: 500, message: error.message })
  const articles = data || []

  // Groepeer per category voor makkelijke render
  const byCategory = new Map<string, any[]>()
  for (const a of articles) {
    const key = a.category || 'Overig'
    const arr = byCategory.get(key) || []
    arr.push(a)
    byCategory.set(key, arr)
  }
  const categories = Array.from(byCategory.entries()).map(([name, items]) => ({ name, items }))

  return {
    articles,       // Platte lijst (voor search-view)
    categories,     // Gegroepeerd (voor default index-view)
    total: articles.length,
    query: search || null,
  }
})
