import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const query = getQuery(event)
  const subscriptionId = query.subscription_id as string

  if (!subscriptionId) {
    throw createError({ statusCode: 400, message: 'subscription_id is required' })
  }

  const supabase = getServiceRoleClient(event)

  // Get latest payment for this subscription
  const { data, error } = await supabase
    .from('payments')
    .select('id, status, amount_cents, paid_at, payment_method, is_first_payment, created_at')
    .eq('subscription_id', subscriptionId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw createError({ statusCode: 500, message: error.message })

  return { payments: data || [] }
})
