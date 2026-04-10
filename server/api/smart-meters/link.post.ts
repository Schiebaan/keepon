import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const body = await readBody(event)
  const { postcode, meter_id, customer_id, partner_id } = body

  if (!postcode || !meter_id || !customer_id) {
    throw createError({ statusCode: 400, message: 'postcode, meter_id, and customer_id are required' })
  }

  if (!/^\d{6}$/.test(meter_id)) {
    throw createError({ statusCode: 400, message: 'meter_id must be exactly 6 digits' })
  }

  const supabase = getServiceRoleClient(event)

  // Check if customer already has a meter
  const { data: existing } = await supabase
    .from('smart_meters')
    .select('id')
    .eq('customer_id', customer_id)
    .single()

  if (existing) {
    // Update existing
    const { data, error } = await supabase
      .from('smart_meters')
      .update({
        postcode,
        meter_id,
        status: 'pending',
        error_message: null,
      })
      .eq('customer_id', customer_id)
      .select()
      .single()

    if (error) throw createError({ statusCode: 500, message: error.message })

    // TODO: Trigger async Sundata meter validation here
    // For now, simulate activation after a delay
    setTimeout(async () => {
      await supabase
        .from('smart_meters')
        .update({ status: 'active', linked_at: new Date().toISOString() })
        .eq('customer_id', customer_id)
    }, 3000)

    return data
  }

  // Create new meter
  const { data, error } = await supabase
    .from('smart_meters')
    .insert({
      customer_id,
      partner_id: partner_id || null,
      postcode,
      meter_id,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  // TODO: Trigger async Sundata meter validation
  setTimeout(async () => {
    await supabase
      .from('smart_meters')
      .update({ status: 'active', linked_at: new Date().toISOString() })
      .eq('id', data.id)
  }, 3000)

  return data
})
