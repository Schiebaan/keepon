import { getServiceRoleClient } from '~~/server/utils/supabase'
import { listEaseeSiteChargers } from '~~/server/utils/easee'
import { resolvePartnerId } from '~~/server/utils/partner-scope'

/** De laadpalen onder één Easee-site. Pas ophalen als de installateur kiest. */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const partnerId = await resolvePartnerId(event, supabase, user.id)

  const siteId = getQuery(event).site_id
  if (!siteId) throw createError({ statusCode: 400, message: 'site_id ontbreekt' })

  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', partnerId)
    .eq('integration_type', 'easee')
    .eq('is_active', true)
    .maybeSingle()
  if (!creds) throw createError({ statusCode: 404, message: 'Easee is nog niet gekoppeld.' })

  try {
    return await listEaseeSiteChargers(creds.credentials, String(siteId))
  } catch (e: any) {
    throw createError({ statusCode: 502, message: e?.message || 'Kon de laadpalen van deze installatie niet ophalen.' })
  }
})
