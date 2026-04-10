import { getServiceRoleClient } from '~~/server/utils/supabase'

const BASE_URL = 'https://api.sundata.nl/api/v0'

// Verify a plant is connected and receiving data
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const query = getQuery(event)

  const deviceId = query.device_id as string
  if (!deviceId) throw createError({ statusCode: 400, message: 'device_id is required' })

  const [companyId, plantId] = deviceId.split(':')

  // Get Sundata credentials
  const { data: role } = await supabase.from('user_roles').select('partner_id').eq('user_id', user.id).single()
  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', role?.partner_id)
    .eq('integration_type', 'sundata')
    .eq('is_active', true)
    .single()

  if (!creds?.credentials) throw createError({ statusCode: 400, message: 'Sundata niet gekoppeld' })

  const { access_token } = await $fetch<{ access_token: string }>(`${BASE_URL}/sign-in`, {
    method: 'POST',
    body: { email: creds.credentials.email, password: creds.credentials.password },
  })

  // Get plant details
  const plant = await $fetch<any>(`${BASE_URL}/companies/${companyId}/plants/${plantId}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  })

  // Get meters
  const meters = await $fetch<any[]>(`${BASE_URL}/companies/${companyId}/plants/${plantId}/meters`, {
    headers: { Authorization: `Bearer ${access_token}` },
  }).catch(() => [])

  return {
    plant_name: plant?.name,
    capacity_kwp: plant?.capacity_kwp,
    status: plant?.status || 'unknown',
    meters: meters?.length || 0,
    connected: meters && meters.length > 0,
  }
})
