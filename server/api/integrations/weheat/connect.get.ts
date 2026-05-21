import { getServiceRoleClient } from '~~/server/utils/supabase'
import { generatePkce, randomNonce, signState } from '~~/server/utils/oauth-state'

/**
 * Start the Weheat OAuth 2.0 / PKCE authorization-code flow.
 *
 * Flow:
 *   1. Partner admin clicks "Verbinden via Weheat" in /admin/settings
 *   2. We redirect them to auth.weheat.nl with PKCE parameters
 *   3. After login at Weheat, they're redirected back to /api/integrations/weheat/callback
 *   4. The callback exchanges the code for an access_token + refresh_token and
 *      stores those in `integration_credentials`.
 *
 * Password-grant tokens are rejected by Weheat's third-party API (their Keycloak
 * client requires real browser-based auth context, like `auth_time`/`acr` claims).
 * Authorization-code with PKCE is the official supported flow — exactly what the
 * Weheat API debugger at api.weheat.nl/third_party/api/debugger uses.
 */

const AUTH_URL = 'https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/auth'
const CLIENT_ID = 'weheat-backend'
const SCOPE = 'profile email'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  // Resolve partner_id (tenant > role)
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

  // Build the redirect_uri based on the request host so it matches what the
  // browser is actually using (volt4u.upsol.nl / demo.upsol.nl / ...).
  const host = getRequestHeader(event, 'host')
  if (!host) throw createError({ statusCode: 400, message: 'Geen host header' })
  const proto = (getRequestHeader(event, 'x-forwarded-proto') || 'https').toString().split(',')[0].trim()
  const redirectUri = `${proto}://${host}/api/integrations/weheat/callback`

  // Generate PKCE pair + CSRF state
  const { verifier, challenge } = generatePkce()
  const state = randomNonce()

  // Where to bounce the admin back to after success
  const returnTo = (getQuery(event).return_to as string) || '/admin/settings'

  // Sign the verifier + state + partner_id into a cookie so the callback can
  // reconstruct everything without a server-side session.
  const signed = signState({
    verifier,
    state,
    partner_id: partnerId,
    redirect_uri: redirectUri,
    return_to: returnTo,
    ts: Date.now(),
  })

  setCookie(event, '_weheat_oauth', signed, {
    httpOnly: true,
    secure: proto === 'https',
    sameSite: 'lax', // must be lax so the cookie survives the cross-site redirect back
    path: '/',
    maxAge: 10 * 60,
  })

  // Build the Weheat auth URL
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })

  // Return JSON so the (Bearer-authenticated) UI can do window.location.href.
  // We can't redirect from here directly: the browser would need the Bearer
  // header to even reach this endpoint, which a plain <a href> doesn't send.
  return { redirect_url: `${AUTH_URL}?${params.toString()}` }
})
