import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Verwijder een klant + alles wat eraan hangt.
 *
 * Scope-guard: een partner_admin mag uitsluitend klanten van de eigen partner
 * verwijderen. Zonder die check kon iedere partner-admin met een geraden UUID
 * de klant van een andere installateur wissen.
 *
 * Betalingen blokkeren bewust een delete (FK ON DELETE RESTRICT op payments).
 * Financiële historie hoort niet zomaar te verdwijnen — we vertalen die
 * database-fout naar een begrijpelijke melding.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })
  const supabase = getServiceRoleClient(event)

  // Partner-scope bepalen (tenant > rol), zelfde patroon als de andere endpoints
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

  // Klant ophalen én meteen controleren dat 'ie van deze partner is
  const { data: customer } = await supabase
    .from('customers')
    .select('id, auth_user_id, email, full_name')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()

  if (!customer) {
    throw createError({ statusCode: 404, message: 'Klant niet gevonden' })
  }

  // Betalingen blokkeren de delete — vóóraf checken zodat we een nette
  // melding kunnen geven in plaats van een ruwe FK-violation.
  const { count: paymentCount } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', customerId)
  if (paymentCount && paymentCount > 0) {
    throw createError({
      statusCode: 409,
      message: `Deze klant heeft ${paymentCount} betaling${paymentCount === 1 ? '' : 'en'} in de administratie en kan daarom niet verwijderd worden. Financiële historie moet bewaard blijven.`,
    })
  }

  // Gerelateerde data opruimen. De meeste tabellen hebben ON DELETE CASCADE,
  // maar expliciet is duidelijker en beschermt tegen ontbrekende constraints.
  await supabase.from('customer_products').delete().eq('customer_id', customerId)
  await supabase.from('customer_documents').delete().eq('customer_id', customerId)
  await supabase.from('smart_meters').delete().eq('customer_id', customerId)
  await supabase.from('customer_module_prices').delete().eq('customer_id', customerId)
  await supabase.from('user_roles').delete().eq('customer_id', customerId)

  const { error } = await supabase.from('customers').delete().eq('id', customerId)
  if (error) {
    // Vangnet voor FK's die we hierboven niet hebben afgedekt
    if (error.code === '23503') {
      throw createError({
        statusCode: 409,
        message: 'Deze klant kan niet verwijderd worden omdat er nog gekoppelde gegevens zijn. Neem contact op met support.',
      })
    }
    throw createError({ statusCode: 500, message: error.message })
  }

  // Auth-account opruimen zodat de inloglink dood is
  if (customer.auth_user_id) {
    await supabase.auth.admin.deleteUser(customer.auth_user_id).catch(() => {})
  }

  await auditLog(event, 'customer.deleted', 'customer', customerId, {
    email: customer.email,
    full_name: customer.full_name,
    partner_id: partnerId,
  })

  return { success: true }
})
