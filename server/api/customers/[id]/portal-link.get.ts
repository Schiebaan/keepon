import { getServiceRoleClient } from '~~/server/utils/supabase'
import { createWelcomeToken } from '~~/server/utils/welcome-token'

/**
 * Generate a fresh customer-portal magic-link for the partner admin to preview.
 * Returns a 30-day welcome-token URL. The admin should open this in an
 * INCOGNITO tab — clicking it in the same browser as the admin session will
 * log the admin out and log the customer in.
 *
 * This is the same URL the welcome mail sends, so partner support can use it
 * to mirror exactly what the customer sees.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

  const supabase = getServiceRoleClient(event)

  const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const tenant = (event.context as any).tenant
    if (tenant?.id) partnerId = tenant.id
    else {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, partners:partners(slug)')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  const slug = (customer as any).partners?.slug || ''
  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
  const baseUrl = `https://${slug ? slug + '.' : ''}${baseDomain}`
  const token = createWelcomeToken(customer.id, 30)

  return {
    url: `${baseUrl}/api/welkom/start?token=${token}`,
    expires_in_days: 30,
  }
})
