import { getServiceRoleClient } from '~~/server/utils/supabase'
import { easeeConnector } from '~~/server/utils/easee'

/**
 * Lijst de laadpalen van de partner op via het Easee-installateursaccount.
 *
 * Spiegelt /api/integrations/weheat/devices. Een expliciete route omdat de
 * generieke [type]-catch-all niet gebruikt wordt voor de wizards.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

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
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', partnerId)
    .eq('integration_type', 'easee')
    .eq('is_active', true)
    .single()
  if (!creds) {
    throw createError({
      statusCode: 404,
      message: 'Easee is nog niet gekoppeld. Ga naar Instellingen → Monitoring integraties om je Easee-account te verbinden.',
    })
  }

  try {
    return await easeeConnector.listDevices(creds.credentials)
  } catch (e: any) {
    throw createError({
      statusCode: 502,
      message: e?.message || 'Kon de laadpalen niet ophalen bij Easee.',
    })
  }
})
