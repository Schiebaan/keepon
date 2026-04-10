import { getServiceRoleClient } from '~~/server/utils/supabase'

// Public endpoint - serves partner logo as an image
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const supabase = getServiceRoleClient(event)

  const { data } = await supabase
    .from('partners')
    .select('logo_url')
    .eq('slug', slug)
    .single()

  if (!data?.logo_url) {
    throw createError({ statusCode: 404, message: 'No logo' })
  }

  // If it's a data URL, convert to binary and serve
  const match = data.logo_url.match(/^data:([^;]+);base64,(.+)$/)
  if (match) {
    const mimeType = match[1]
    const buffer = Buffer.from(match[2], 'base64')
    setHeader(event, 'content-type', mimeType)
    setHeader(event, 'cache-control', 'public, max-age=3600')
    return buffer
  }

  // If it's a regular URL, redirect
  return sendRedirect(event, data.logo_url)
})
