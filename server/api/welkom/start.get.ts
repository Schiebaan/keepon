import { getServiceRoleClient } from '~~/server/utils/supabase'
import { verifyWelcomeToken } from '~~/server/utils/welcome-token'

/**
 * Welcome-link landing endpoint.
 * Exchanges a long-lived welcome token (30 days) for a fresh Supabase magic link
 * and 302-redirects the browser there. The Supabase link is then consumed within
 * seconds, so its 1-hour TTL is never a problem.
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const token = (query.token as string) || ''
  const result = verifyWelcomeToken(token)

  if (!result.valid || !result.customerId) {
    // Show a friendly fail page instead of a raw error
    const reason = result.reason || 'unknown'
    return sendRedirect(event, `/welkom/verlopen?reason=${reason}`, 302)
  }

  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id, email, partner_id, partners:partners(slug)')
    .eq('id', result.customerId)
    .single()

  if (!customer?.email) {
    return sendRedirect(event, '/welkom/verlopen?reason=missing', 302)
  }

  const slug = (customer as any).partners?.slug || ''
  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
  const baseUrl = `https://${slug ? slug + '.' : ''}${baseDomain}`

  // Generate a fresh magic link — the customer's browser will follow it within seconds
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: customer.email,
    options: { redirectTo: `${baseUrl}/auth/callback` },
  })

  if (error || !data?.properties?.action_link) {
    return sendRedirect(event, '/welkom/verlopen?reason=generate', 302)
  }

  return sendRedirect(event, data.properties.action_link, 302)
})
