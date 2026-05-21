import { getServiceRoleClient } from '~~/server/utils/supabase'
import { parseMessages, latestMessage, messageCount } from '~~/server/utils/ticket-messages'

/** List tickets for the currently logged-in customer. */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer) return []

  const { data } = await supabase
    .from('service_tickets')
    .select('id, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at')
    .eq('customer_id', customer.id)
    .eq('partner_id', customer.partner_id)
    .order('updated_at', { ascending: false })

  return (data || []).map(t => ({
    ...t,
    messages: parseMessages(t.response),
    latest_message: latestMessage(t.response),
    message_count: messageCount(t.response),
  }))
})
