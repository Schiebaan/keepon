import { getServiceRoleClient } from '~~/server/utils/supabase'
import { loginWeheatHeadless } from '~~/server/utils/weheat-headless'

/**
 * Headless Weheat connect: ask the partner once for their Weheat portal
 * email + password, then run the same auth-code-flow the official
 * api.weheat.nl/third_party/api/debugger uses — server-side, behind the scenes.
 *
 * We store BOTH the resulting refresh_token AND the username/password.
 * Weheat's refresh tokens only live ~1 hour, so without password-on-file the
 * connector would break for the rest of the day until someone re-clicks the
 * "Verbinden" button. With them stored, the connector transparently
 * re-authenticates when the refresh token expires.
 *
 * The password lives in `integration_credentials.credentials.password` and
 * is only ever sent back out to auth.weheat.nl. Future hardening: encrypt
 * with a server-side key separate from the service-role JWT.
 */

const HEAT_PUMPS_URL = 'https://api.weheat.nl/third_party/api/v1/heat-pumps'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)
  const username = (body?.username || body?.email || '').toString().trim()
  const password = (body?.password || '').toString()
  if (!username || !password) {
    throw createError({ statusCode: 400, message: 'E-mail en wachtwoord zijn verplicht.' })
  }

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

  // Do the actual headless login
  let tokens
  try {
    tokens = await loginWeheatHeadless(username, password)
  } catch (e: any) {
    throw createError({ statusCode: 400, message: e?.message || 'Verbinden mislukt' })
  }

  // Smoke test: does this token reach /heat-pumps?
  try {
    await $fetch(HEAT_PUMPS_URL, { headers: { Authorization: `Bearer ${tokens.access_token}` } })
  } catch (e: any) {
    const status = e?.statusCode || e?.response?.status
    if (status === 403) {
      throw createError({ statusCode: 403, message: 'Inloggen lukt maar Weheat weigert API-toegang voor dit account.' })
    }
    // Other errors → not fatal, save and retry on demand
  }

  const credentials = {
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    access_token_expires_at: new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString(),
    // Stored so the connector can transparently re-auth when refresh expires
    username,
    password,
    connected_at: new Date().toISOString(),
  }

  const { data: existing } = await supabase
    .from('integration_credentials')
    .select('id')
    .eq('partner_id', partnerId)
    .eq('integration_type', 'weheat')
    .maybeSingle()

  if (existing) {
    await supabase.from('integration_credentials').update({ credentials, is_active: true }).eq('id', existing.id)
  } else {
    await supabase.from('integration_credentials').insert({
      partner_id: partnerId, integration_type: 'weheat', credentials, is_active: true,
    })
  }

  await auditLog(event, 'integration.connected', 'integration_credentials', null, { type: 'weheat', flow: 'headless' })

  return { connected: true }
})
