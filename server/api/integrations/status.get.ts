import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
    partnerId = fp?.id
  }
  if (!partnerId) return {}

  const { data } = await supabase
    .from('integration_credentials')
    .select('integration_type, is_active')
    .eq('partner_id', partnerId)

  const status: Record<string, boolean> = {}
  for (const d of data || []) {
    status[d.integration_type] = d.is_active
  }
  return status
})
