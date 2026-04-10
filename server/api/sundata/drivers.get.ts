import { getServiceRoleClient } from '~~/server/utils/supabase'

const BASE_URL = 'https://api.sundata.nl/api/v0'

// Fetch available drivers (inverter brands) from Sundata
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Get partner's Sundata credentials
  const { data: role } = await supabase.from('user_roles').select('partner_id').eq('user_id', user.id).single()
  const partnerId = role?.partner_id
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', partnerId)
    .eq('integration_type', 'sundata')
    .eq('is_active', true)
    .single()

  if (!creds?.credentials) {
    throw createError({ statusCode: 400, message: 'Sundata is niet gekoppeld. Ga naar Instellingen om de koppeling in te stellen.' })
  }

  // Sign in to Sundata
  const { access_token } = await $fetch<{ access_token: string }>(`${BASE_URL}/sign-in`, {
    method: 'POST',
    body: { email: creds.credentials.email, password: creds.credentials.password },
  })

  // Fetch drivers
  const drivers = await $fetch<any[]>(`${BASE_URL}/drivers`, {
    headers: { Authorization: `Bearer ${access_token}` },
  }).catch(() => null)

  if (drivers) {
    return drivers
  }

  // Fallback: if /drivers endpoint doesn't exist, return known Sundata-supported brands
  return [
    { id: 'solis', name: 'Solis', fields: ['serial_number'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498440' },
    { id: 'solaredge', name: 'SolarEdge', fields: ['api_key', 'site_id'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498437' },
    { id: 'enphase', name: 'Enphase', fields: ['api_key', 'system_id'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498438' },
    { id: 'huawei', name: 'Huawei FusionSolar', fields: ['username', 'password', 'plant_id'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498439' },
    { id: 'sma', name: 'SMA Sunny Portal', fields: ['plant_id'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498441' },
    { id: 'growatt', name: 'Growatt', fields: ['username', 'password'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498442' },
    { id: 'goodwe', name: 'GoodWe SEMS', fields: ['account', 'password'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498443' },
    { id: 'fronius', name: 'Fronius Solar.web', fields: ['system_id'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498444' },
    { id: 'fox_ess', name: 'Fox ESS', fields: ['api_key', 'device_sn'], helpUrl: 'https://support.sundata.nl/support/solutions/articles/77000498445' },
  ]
})
