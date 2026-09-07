import { getServiceRoleClient } from '~~/server/utils/supabase'
import { assertSmartMeterAccess } from '~~/server/utils/partner-scope'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const meterId = getRouterParam(event, 'id')
  if (!meterId) throw createError({ statusCode: 400, message: 'Meter-id ontbreekt' })

  const supabase = getServiceRoleClient(event)
  // Stond hier niet: elke ingelogde gebruiker kon elke meter én al zijn
  // metingen verwijderen door het UUID te raden.
  const meter = await assertSmartMeterAccess(event, supabase, meterId, user.id)

  // Metingen eerst (cascade zou het afhandelen, maar expliciet is duidelijker)
  await supabase.from('smart_meter_readings').delete().eq('meter_id', meterId)

  const { error } = await supabase.from('smart_meters').delete().eq('id', meterId)
  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'smart_meter.deleted', 'smart_meter', meterId, {
    customer_id: meter.customer_id,
    partner_id: meter.partner_id,
  })

  return { success: true }
})
