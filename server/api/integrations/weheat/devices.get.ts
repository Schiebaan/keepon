import { getServiceRoleClient } from '~~/server/utils/supabase'
import { weheatConnector } from '~~/server/utils/weheat'

/**
 * List Weheat heat-pumps for the current partner.
 *
 * Mirrors what /api/integrations/[type]/devices does, but we need an explicit
 * route here because Nitro's [type] catch-all is shadowed by the dedicated
 * /api/integrations/weheat directory we use for the OAuth flow + connect-headless.
 */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  const tenant = (event.context as any).tenant
  let partnerId = tenant?.id
  if (!partnerId) {
    throw createError({ statusCode: 400, message: 'Geen partner context' })
  }

  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', partnerId)
    .eq('integration_type', 'weheat')
    .eq('is_active', true)
    .single()
  if (!creds) {
    throw createError({ statusCode: 404, message: 'Weheat is niet verbonden voor deze partner.' })
  }

  return await weheatConnector.listDevices(creds.credentials)
})
