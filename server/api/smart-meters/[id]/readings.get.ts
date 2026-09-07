import { getServiceRoleClient } from '~~/server/utils/supabase'
import { assertSmartMeterAccess } from '~~/server/utils/partner-scope'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const meterId = getRouterParam(event, 'id')
  if (!meterId) throw createError({ statusCode: 400, message: 'Meter-id ontbreekt' })
  const query = getQuery(event)
  const from = query.from as string
  const to = query.to as string

  const supabase = getServiceRoleClient(event)
  // Verbruiksdata zegt precies wanneer iemand thuis is. Alleen de klant zelf
  // en zijn eigen installateur horen erbij te kunnen.
  await assertSmartMeterAccess(event, supabase, meterId, user.id)

  let q = supabase
    .from('smart_meter_readings')
    .select('timestamp, consumption_wh, production_wh, gas_m3')
    .eq('meter_id', meterId)
    .order('timestamp', { ascending: true })

  if (from) q = q.gte('timestamp', from)
  if (to) q = q.lte('timestamp', to)

  const { data, error } = await q.limit(2000)
  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
