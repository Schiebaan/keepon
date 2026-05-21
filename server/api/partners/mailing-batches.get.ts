import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * List recent mailing batches for the current partner.
 * Used by /admin/uitnodigingen to show "Eerdere batches" panel + by the
 * "Nieuwe batch"-modal to warn about overlap with recent batches.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Resolve partner id
  const tenant = (event.context as any).tenant
  let partnerId = tenant?.id
  if (!partnerId) {
    const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
    partnerId = role?.partner_id
    if (role?.role === 'platform_admin' && !partnerId) {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }
  if (!partnerId) return []

  const { data, error } = await supabase
    .from('mailing_batches')
    .select('id, name, description, customer_count, mailchimp_tag, segment_filter, created_at')
    .eq('partner_id', partnerId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw createError({ statusCode: 500, message: error.message })
  return data || []
})
