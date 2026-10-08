import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
  let partnerId = role?.partner_id
  // Het subdomein bepaalt de partner, altijd. requireRole heeft al gecontroleerd
  // dat deze gebruiker bij die partner hoort of platformbeheerder is. Zonder dit
  // won het account: een platformbeheerder die aan Volt4U gekoppeld is zag op
  // demo.upsol.nl de gegevens van Volt4U.
  const subdomeinPartner = (event.context as any).tenant?.id
  if (subdomeinPartner) partnerId = subdomeinPartner
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
