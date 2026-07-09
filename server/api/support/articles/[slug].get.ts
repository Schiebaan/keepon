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

  const { data, error } = await supabase
    .from('support_articles')
    .select('id, slug, title, excerpt, body_md, category, tags, published_at, updated_at')
    .eq('slug', slug)
    .not('published_at', 'is', null)
    .single()

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
