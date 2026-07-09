import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Upload een afbeelding voor gebruik in een support-artikel.
 *
 * Content-type: multipart/form-data, veld 'file'.
 * Response: { url: string }  — publieke Supabase Storage URL, klaar om als
 * ![](url) in de markdown te plakken.
 *
 * Alleen platform-admins mogen uploaden. Max 5MB, alleen images.
 */

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])

function extForType(type: string): string {
  switch (type) {
    case 'image/png':     return 'png'
    case 'image/jpeg':    return 'jpg'
    case 'image/webp':    return 'webp'
    case 'image/gif':     return 'gif'
    case 'image/svg+xml': return 'svg'
    default:              return 'bin'
  }
}

function randomName(): string {
  // Kort random pad — Date.now() + Math.random() volstaat voor collision-veiligheid
  // op onze schaal (paar uploads per dag). We plakken de originele extensie erachter.
  const stamp = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${stamp}-${rand}`
}

export default defineEventHandler(async (event) => {
  await requireRole(event, 'platform_admin')
  const supabase = getServiceRoleClient(event)

  const form = await readMultipartFormData(event)
  const file = form?.find(p => p.name === 'file')
  if (!file || !file.data) throw createError({ statusCode: 400, message: 'Geen bestand ontvangen' })
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, message: 'Bestand is groter dan 5MB' })

  const type = (file.type || '').toLowerCase()
  if (!ALLOWED_TYPES.has(type)) {
    throw createError({ statusCode: 400, message: 'Alleen PNG, JPG, WEBP, GIF of SVG toegestaan' })
  }

  const ext = extForType(type)
  const path = `${new Date().getFullYear()}/${randomName()}.${ext}`

  const { error } = await supabase.storage
    .from('support-images')
    .upload(path, file.data, {
      contentType: type,
      cacheControl: '31536000',  // 1 jaar — bestanden zijn immutable (unieke naam)
      upsert: false,
    })
  if (error) throw createError({ statusCode: 500, message: 'Upload mislukt: ' + error.message })

  const { data: publicUrlData } = supabase.storage.from('support-images').getPublicUrl(path)

  await auditLog(event, 'support_image.uploaded', 'support_image', null, {
    path,
    size: file.data.length,
    type,
  })

  return { url: publicUrlData.publicUrl, path }
})
