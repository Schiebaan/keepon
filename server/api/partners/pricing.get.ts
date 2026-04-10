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
  if (!partnerId) return []

  const { data } = await supabase
    .from('partner_module_configs')
    .select('id, is_enabled, price_monthly, price_yearly, min_contract_months, module_definition:module_definitions(type, name)')
    .eq('partner_id', partnerId)

  return data || []
})
