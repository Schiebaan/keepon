import {
  SUNDATA_BASE_URL,
  resolvePartnerId,
  sundataSession,
  parseSundataError,
  findExistingPlantByName,
} from '~~/server/utils/sundata'
import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Create a plant in Sundata for a customer — or return the existing one if it
 * already exists (matched by name). This is IDEMPOTENT so repeated submissions
 * from the wizard do NOT spawn duplicate plants.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { customer_id, plant_name } = body
  if (!customer_id || !plant_name) {
    throw createError({ statusCode: 400, message: 'customer_id en plant_name zijn verplicht' })
  }

  const partnerId = await resolvePartnerId(event, user.id)
  const { headers, companyId } = await sundataSession(event, partnerId)

  // Look up address
  const { data: customer } = await supabase
    .from('customers')
    .select('street, house_number, postal_code, city')
    .eq('id', customer_id)
    .single()

  if (!customer?.street || !customer?.house_number || !customer?.postal_code || !customer?.city) {
    throw createError({
      statusCode: 400,
      message: 'Adres van de klant is niet compleet. Vul straat, huisnummer, postcode en woonplaats in bij de klantgegevens.',
    })
  }

  // Reuse an existing plant with the same name to avoid duplicates
  const existing = await findExistingPlantByName(headers, companyId, plant_name)
  if (existing?.id) {
    return {
      success: true,
      reused: true,
      plant_id: existing.id,
      company_id: companyId,
    }
  }

  // Create new plant
  try {
    const plant = await $fetch<any>(`${SUNDATA_BASE_URL}/companies/${companyId}/plants`, {
      method: 'POST',
      headers,
      body: {
        name: plant_name,
        time_zone: 'Europe/Amsterdam',
        address: {
          street: customer.street,
          street_number: customer.house_number,
          city: customer.city,
          postal_code: customer.postal_code.replace(/\s/g, ''),
          country: 'NL',
        },
      },
    })

    await auditLog(event, 'sundata.plant_created', 'customer', customer_id, {
      plant_id: plant.id,
      plant_name,
      company_id: companyId,
    })

    return {
      success: true,
      reused: false,
      plant_id: plant.id,
      company_id: companyId,
    }
  } catch (err: any) {
    throw createError({ statusCode: 400, message: parseSundataError(err, 'Plant aanmaken mislukt') })
  }
})
