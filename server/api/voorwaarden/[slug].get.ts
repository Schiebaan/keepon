import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Public endpoint for the /voorwaarden/[slug] page.
 * Returns general terms + module-specific terms + the placeholder values (including
 * uurtarief and voorrijkosten) used to render them.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'Slug ontbreekt' })

  const supabase = getServiceRoleClient(event)
  const { data, error } = await supabase
    .from('partners')
    .select('id, name, slug, logo_url, primary_color, terms_content, terms_placeholders, support_email, support_phone')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    throw createError({ statusCode: 404, message: 'Voorwaardenpagina niet gevonden' })
  }

  return data
})
