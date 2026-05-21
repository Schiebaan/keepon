import { getServiceRoleClient } from '~~/server/utils/supabase'
import { parseMessages, latestMessage, messageCount } from '~~/server/utils/ticket-messages'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
    partnerId = fp?.id
  }
  if (!partnerId) return []

  const { data } = await supabase
    .from('service_tickets')
    .select('*, customer:customers(id, full_name, email, phone)')
    .eq('partner_id', partnerId)
    .order('updated_at', { ascending: false })

  return (data || []).map(t => ({
    ...t,
    messages: parseMessages(t.response),
    latest_message: latestMessage(t.response),
    message_count: messageCount(t.response),
  }))
})
