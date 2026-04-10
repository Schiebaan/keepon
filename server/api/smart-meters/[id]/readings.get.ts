import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const meterId = getRouterParam(event, 'id')
  const query = getQuery(event)
  const from = query.from as string
  const to = query.to as string

  const supabase = getServiceRoleClient(event)

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
