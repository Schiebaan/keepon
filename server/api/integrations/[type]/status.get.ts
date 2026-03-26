import type { IntegrationType } from '~~/shared/types/database'

export default defineEventHandler(async (event) => {
  await requireAuth(event)

  const type = getRouterParam(event, 'type') as IntegrationType
  const query = getQuery(event)
  const deviceId = query.device_id as string

  if (!deviceId) {
    throw createError({ statusCode: 400, message: 'device_id is verplicht' })
  }

  const tenant = event.context.tenant
  if (!tenant) {
    throw createError({ statusCode: 400, message: 'Geen partner omgeving' })
  }

  const supabase = getServiceRoleClient(event)
  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', tenant.id)
    .eq('integration_type', type)
    .eq('is_active', true)
    .single()

  if (!creds) {
    throw createError({ statusCode: 404, message: `Geen ${type} credentials geconfigureerd` })
  }

  const connector = getConnector(type)
  return await connector.getDeviceStatus(creds.credentials, deviceId)
})
