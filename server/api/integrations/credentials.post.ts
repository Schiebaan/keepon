import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { type, credentials } = body
  if (!type || !credentials) throw createError({ statusCode: 400, message: 'type and credentials required' })

  // Get partner ID
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
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  // Upsert credentials
  const { data, error } = await supabase
    .from('integration_credentials')
    .upsert({
      partner_id: partnerId,
      integration_type: type,
      credentials,
      is_active: true,
      last_verified_at: new Date().toISOString(),
    }, { onConflict: 'partner_id,integration_type' })
    .select()
    .single()

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'integration.connected', 'integration_credentials', data.id, { type })

  return data
})
