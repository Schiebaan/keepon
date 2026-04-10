import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { id, price_monthly, price_yearly, is_enabled, min_contract_months } = body
  if (!id) throw createError({ statusCode: 400, message: 'id is required' })

  const updates: Record<string, any> = {}
  if (price_monthly !== undefined) updates.price_monthly = price_monthly
  if (price_yearly !== undefined) updates.price_yearly = price_yearly
  if (is_enabled !== undefined) updates.is_enabled = is_enabled
  if (min_contract_months !== undefined) updates.min_contract_months = min_contract_months

  const { data, error } = await supabase
    .from('partner_module_configs')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data
})
