import { getServiceRoleClient } from '~~/server/utils/supabase'

const BASE_URL = 'https://api.sundata.nl/api/v0'

// Create a plant in Sundata and add a meter
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { customer_id, plant_name, driver_id, driver_credentials, capacity_kwp, orientation, tilt } = body

  if (!customer_id || !plant_name || !driver_id) {
    throw createError({ statusCode: 400, message: 'customer_id, plant_name, and driver_id are required' })
  }

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
    throw createError({ statusCode: 400, message: 'Sundata is niet gekoppeld' })
  }

  // Sign in to Sundata
  const { access_token } = await $fetch<{ access_token: string }>(`${BASE_URL}/sign-in`, {
    method: 'POST',
    body: { email: creds.credentials.email, password: creds.credentials.password },
  })

  const headers = { Authorization: `Bearer ${access_token}` }

  // Get the company (first one)
  const companies = await $fetch<any[]>(`${BASE_URL}/users/me/companies`, { headers })
  if (!companies?.length) {
    throw createError({ statusCode: 400, message: 'Geen bedrijf gevonden in Sundata. Maak eerst een bedrijf aan.' })
  }
  const companyId = companies[0].id

  // Step 1: Create the plant
  let plant: any
  try {
    plant = await $fetch<any>(`${BASE_URL}/companies/${companyId}/plants`, {
      method: 'POST',
      headers,
      body: {
        name: plant_name,
        capacity_kwp: capacity_kwp || 0,
        orientation: orientation || undefined,
        tilt: tilt || undefined,
      },
    })
  } catch (err: any) {
    throw createError({ statusCode: 500, message: `Plant aanmaken mislukt: ${err?.data?.message || err?.message || 'Onbekende fout'}` })
  }

  // Step 2: Add a meter to the plant
  let meter: any
  try {
    meter = await $fetch<any>(`${BASE_URL}/companies/${companyId}/plants/${plant.id}/meters`, {
      method: 'POST',
      headers,
      body: {
        driver: driver_id,
        credentials: driver_credentials || {},
      },
    })
  } catch (err: any) {
    // Plant was created but meter failed — return partial success
    return {
      success: false,
      step: 'meter',
      plant_id: plant.id,
      company_id: companyId,
      error: `Meter koppelen mislukt: ${err?.data?.message || err?.message || 'Controleer de credentials'}`,
    }
  }

  // Step 3: Verify the connection
  let status = 'pending'
  try {
    const plantStatus = await $fetch<any>(`${BASE_URL}/companies/${companyId}/plants/${plant.id}`, { headers })
    status = plantStatus?.status || 'active'
  } catch {}

  await auditLog(event, 'sundata.plant_created', 'customer', customer_id, {
    plant_id: plant.id,
    plant_name,
    driver_id,
    company_id: companyId,
  })

  return {
    success: true,
    plant_id: plant.id,
    meter_id: meter?.id,
    company_id: companyId,
    device_id: `${companyId}:${plant.id}`,
    status,
  }
})
