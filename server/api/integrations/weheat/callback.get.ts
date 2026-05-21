import { getServiceRoleClient } from '~~/server/utils/supabase'
import { verifyState } from '~~/server/utils/oauth-state'

/**
 * Receives the authorization code from Weheat, exchanges it for tokens
 * (access_token + refresh_token), and stores the refresh_token on the
 * partner's integration_credentials row.
 *
 * We use the refresh_token for all subsequent API calls (see weheat.ts).
 * Refresh tokens from this client are long-lived (~24h-30d depending on the
 * Weheat realm config); when one expires the partner reconnects.
 */

const TOKEN_URL = 'https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/token'
const CLIENT_ID = 'weheat-backend'

function backToSettings(event: any, returnTo: string, status: 'ok' | 'fail', reason?: string): any {
  // Keep the return path inside our app to prevent open-redirect via cookie tampering
  const safe = (returnTo && returnTo.startsWith('/')) ? returnTo : '/admin/settings'
  const sep = safe.includes('?') ? '&' : '?'
  const params = new URLSearchParams({ weheat: status })
  if (reason) params.set('reason', reason)
  return sendRedirect(event, `${safe}${sep}${params.toString()}`, 302)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = (query.code as string) || ''
  const state = (query.state as string) || ''
  const err = (query.error as string) || ''

  // Read the signed cookie containing verifier + state + partner_id
  const signed = getCookie(event, '_weheat_oauth')
  const session = verifyState(signed)
  deleteCookie(event, '_weheat_oauth', { path: '/' })

  if (!session) {
    return backToSettings(event, '/admin/settings', 'fail', 'session_expired')
  }

  if (err) {
    return backToSettings(event, session.return_to, 'fail', err)
  }
  if (!code || !state || state !== session.state) {
    return backToSettings(event, session.return_to, 'fail', 'invalid_state')
  }

  // Exchange the authorization code for tokens
  let tokenResp: any
  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: session.redirect_uri,
      code_verifier: session.verifier,
    })
    tokenResp = await $fetch<any>(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
  } catch (e: any) {
    const reason = e?.data?.error || 'token_exchange_failed'
    return backToSettings(event, session.return_to, 'fail', reason)
  }

  const accessToken: string = tokenResp?.access_token || ''
  const refreshToken: string = tokenResp?.refresh_token || ''
  const expiresIn: number = tokenResp?.expires_in || 3600
  if (!accessToken || !refreshToken) {
    return backToSettings(event, session.return_to, 'fail', 'no_tokens')
  }

  // Sanity check: can we actually call the third-party API with this token?
  try {
    await $fetch('https://api.weheat.nl/third_party/api/v1/heat-pumps', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (e: any) {
    const status = e?.statusCode || e?.response?.status
    if (status === 403) {
      return backToSettings(event, session.return_to, 'fail', 'api_forbidden')
    }
    // Other errors (5xx etc.) we still proceed — store the token and let the
    // user retry data fetches; this verification is just a smoke check.
  }

  // Store refresh_token (and the latest access_token + its expiry) on the partner's
  // integration record. Upsert so reconnecting just overwrites the previous tokens.
  const supabase = getServiceRoleClient(event)
  const credentials = {
    refresh_token: refreshToken,
    access_token: accessToken,
    access_token_expires_at: new Date(Date.now() + (expiresIn - 60) * 1000).toISOString(),
    connected_at: new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from('integration_credentials')
    .select('id')
    .eq('partner_id', session.partner_id)
    .eq('integration_type', 'weheat')
    .maybeSingle()

  if (existing) {
    await supabase
      .from('integration_credentials')
      .update({ credentials, is_active: true })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('integration_credentials')
      .insert({
        partner_id: session.partner_id,
        integration_type: 'weheat',
        credentials,
        is_active: true,
      })
  }

  await auditLog(event, 'integration.connected', 'integration_credentials', null, { type: 'weheat', flow: 'oauth_code_pkce' })

  return backToSettings(event, session.return_to, 'ok')
})
