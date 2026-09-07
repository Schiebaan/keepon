import { getServiceRoleClient } from '~~/server/utils/supabase'
import { resolvePartnerId } from '~~/server/utils/partner-scope'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const userId = getRouterParam(event, 'id')
  if (!userId) throw createError({ statusCode: 400, message: 'Gebruiker-id ontbreekt' })
  const supabase = getServiceRoleClient(event)

  // Dit verwijderde de partner_admin-rol op user_id alleen. Elke installateur
  // kon daarmee een collega van een ándere installateur uit het systeem gooien.
  const partnerId = await resolvePartnerId(event, supabase, user.id)

  // Jezelf verwijderen sluit je buiten je eigen omgeving.
  if (userId === user.id) {
    throw createError({ statusCode: 400, message: 'Je kunt je eigen toegang niet verwijderen. Vraag een collega dit te doen.' })
  }

  const { data: doelwit } = await supabase
    .from('user_roles')
    .select('user_id, full_name, role')
    .eq('user_id', userId)
    .eq('partner_id', partnerId)
    .eq('role', 'partner_admin')
    .maybeSingle()
  if (!doelwit) throw createError({ statusCode: 404, message: 'Teamlid niet gevonden' })

  // Laat het team niet zonder beheerder achter.
  const { count } = await supabase
    .from('user_roles')
    .select('user_id', { count: 'exact', head: true })
    .eq('partner_id', partnerId)
    .eq('role', 'partner_admin')
  if ((count || 0) <= 1) {
    throw createError({ statusCode: 409, message: 'Dit is de laatste beheerder. Voeg eerst een collega toe voordat je deze verwijdert.' })
  }

  // De rol weghalen, niet de auth-gebruiker: die kan ook klant zijn.
  const { error } = await supabase
    .from('user_roles')
    .delete()
    .eq('user_id', userId)
    .eq('partner_id', partnerId)
    .eq('role', 'partner_admin')

  if (error) throw createError({ statusCode: 500, message: error.message })

  await auditLog(event, 'partner_user.removed', 'user_role', userId, {
    partner_id: partnerId,
    removed_name: doelwit.full_name || null,
  })

  return { success: true }
})
