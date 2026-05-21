import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Save a Weheat refresh_token (copied from the Weheat API debugger) directly
 * to this partner's integration_credentials row.
 *
 * Why: the third-party API only accepts tokens minted via the browser-based
 * auth-code flow (auth_time + acr claims must be present). Building that flow
 * inside our app requires Weheat to whitelist a redirect_uri per partner — a
 * back-and-forth we don't need.
 *
 * Instead the partner logs in to api.weheat.nl/third_party/api/debugger,
 * copies the refresh_token from DevTools (Network tab → token response), and
 * pastes it here. We validate by doing a refresh-grant, then store the
 * resulting access_token + (possibly rotated) refresh_token.
 */
const TOKEN_URL = 'https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/token'
const CLIENT_ID = 'weheat-backend'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)
  const refreshToken = (body?.refresh_token || '').toString().trim()
  if (!refreshToken) throw createError({ statusCode: 400, message: 'Plak je refresh_token uit de Weheat debugger.' })

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

  // Validate by doing a refresh-grant — confirms the token is real and active.
  let tokenResp: any
  try {
    tokenResp = await $fetch<any>(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: CLIENT_ID,
        refresh_token: refreshToken,
      }).toString(),
    })
  } catch (e: any) {
    const code = e?.data?.error
    if (code === 'invalid_grant') {
      throw createError({ statusCode: 400, message: 'Refresh-token is verlopen of ongeldig. Pak een verse uit de Weheat debugger.' })
    }
    throw createError({ statusCode: 400, message: 'Token-validatie mislukt: ' + (e?.data?.error_description || e?.message || 'onbekend') })
  }

  const accessToken: string = tokenResp?.access_token || ''
  // Keycloak rotates refresh tokens — use the new one if returned, else the one we got
  const newRefreshToken: string = tokenResp?.refresh_token || refreshToken
  const expiresIn: number = tokenResp?.expires_in || 3600
  if (!accessToken) throw createError({ statusCode: 500, message: 'Geen access_token ontvangen' })

  // Sanity check: does this token actually reach /heat-pumps?
  try {
    await $fetch('https://api.weheat.nl/third_party/api/v1/heat-pumps', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
  } catch (e: any) {
    const status = e?.statusCode || e?.response?.status
    if (status === 403) {
      throw createError({ statusCode: 403, message: 'Token werkt op auth-niveau maar /heat-pumps geeft 403. Controleer of dit het token van de debugger is.' })
    }
    // Other errors: still proceed, store the token. The connector retries on demand.
  }

  const credentials = {
    refresh_token: newRefreshToken,
    access_token: accessToken,
    access_token_expires_at: new Date(Date.now() + (expiresIn - 60) * 1000).toISOString(),
    connected_at: new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from('integration_credentials')
    .select('id')
    .eq('partner_id', partnerId)
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
      .insert({ partner_id: partnerId, integration_type: 'weheat', credentials, is_active: true })
  }

  await auditLog(event, 'integration.connected', 'integration_credentials', null, { type: 'weheat', flow: 'paste_refresh_token' })

  return { connected: true }
})
