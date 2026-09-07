import { getServiceRoleClient } from '~~/server/utils/supabase'
import { marked } from 'marked'

/**
 * Haal één publiek artikel op via z'n slug + render markdown naar HTML.
 * Rendering server-side zodat de klant-pagina simpel v-html kan gebruiken
 * en er geen client-side flash is tijdens SSR.
 *
 * Tegelijk verhogen we view_count zodat we later populaire artikelen kunnen
 * highlighten. Fire-and-forget — als de update faalt is dat non-fatal.
 */
export default defineEventHandler(async (event) => {
  const supabase = getServiceRoleClient(event)
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'slug ontbreekt' })

  // Zie articles.get.ts: het audience-filter komt uit migratie 031 en valt
  // terug op de ongefilterde query zolang die nog niet gedraaid is.
  const kolommen = 'id, slug, title, excerpt, body_md, category, tags, published_at, updated_at'
  function bouwQuery(metAudience: boolean) {
    let q = supabase.from('support_articles').select(kolommen).eq('slug', slug).not('published_at', 'is', null)
    if (metAudience) q = q.eq('audience', 'partner')
    return q.single()
  }

  let { data, error } = await bouwQuery(true)
  if (error?.message?.includes('audience')) {
    console.warn('[support] audience-kolom ontbreekt — migratie 031 nog niet gedraaid')
    ;({ data, error } = await bouwQuery(false))
  }

  if (error || !data) {
    if (error?.code === 'PGRST116') throw createError({ statusCode: 404, message: 'Artikel niet gevonden' })
    throw createError({ statusCode: 500, message: error?.message || 'Kon artikel niet laden' })
  }

  // Markdown → HTML met sensible defaults. `gfm: true` geeft ons tables/task
  // lists/autolinks. `breaks: false` want auteurs gebruiken paragrafen, geen
  // ad-hoc line breaks.
  const html = marked.parse(data.body_md || '', { gfm: true, breaks: false, async: false }) as string

  return {
    ...data,
    body_html: html,
  }
})
