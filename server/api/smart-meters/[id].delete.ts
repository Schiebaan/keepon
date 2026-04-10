import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireAuth(event)
  const meterId = getRouterParam(event, 'id')

  const supabase = getServiceRoleClient(event)

  // Delete readings first (cascade should handle this, but be explicit)
  await supabase.from('smart_meter_readings').delete().eq('meter_id', meterId)

  const { error } = await supabase.from('smart_meters').delete().eq('id', meterId)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { success: true }
})
