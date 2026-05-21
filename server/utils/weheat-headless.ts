import { createHash, randomBytes } from 'crypto'

/**
 * Headless Weheat OAuth-code-with-PKCE login. Re-used by both the
 * /admin/settings "Verbinden via Weheat" flow AND the connector's
 * auto-reauth path when the stored refresh_token has expired (Weheat's
 * refresh tokens live for only 1 hour).
 *
 * Mirrors the official api.weheat.nl/third_party/api/debugger flow.
 */

const REALM_BASE = 'https://auth.weheat.nl/realms/Weheat/protocol/openid-connect'
const CLIENT_ID = 'weheat-backend'
const REDIRECT_URI = 'https://api.weheat.nl/third_party/api/debugger'
const SCOPE = 'profile email'

class CookieJar {
  private store = new Map<string, string>()
  ingestSetCookies(headers: Headers) {
    const anyHeaders = headers as any
    const list: string[] = typeof anyHeaders.getSetCookie === 'function'
      ? anyHeaders.getSetCookie()
      : (headers.get('set-cookie')?.split(/, (?=[A-Za-z0-9_-]+=)/) ?? [])
    for (const c of list) {
      const pair = c.split(';')[0]
      const eq = pair.indexOf('=')
      if (eq < 0) continue
      this.store.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim())
    }
  }
  toHeader(): string {
    return Array.from(this.store.entries()).map(([k, v]) => `${k}=${v}`).join('; ')
  }
}

function parseLoginAction(html: string): string | null {
  const formMatch =
    html.match(/<form[^>]+id=["']kc-form-login["'][^>]*action=["']([^"']+)["']/i)
    || html.match(/<form[^>]+action=["']([^"']+)["'][^>]+id=["']kc-form-login["']/i)
  if (formMatch) {
    return formMatch[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x?\d+;/g, '')
  }
  const jsonMatch = html.match(/"loginAction"\s*:\s*"([^"]+)"/)
  if (jsonMatch) {
    return jsonMatch[1].replace(/\\\//g, '/').replace(/\\"/g, '"').replace(/&amp;/g, '&')
  }
  return null
}

function looksLikeLoginError(html: string): string | null {
  const m = html.match(/<(?:span|div)[^>]+class=["'][^"']*kc-feedback-text[^"']*["'][^>]*>([^<]+)</i)
    || html.match(/<span[^>]+id=["']input-error["'][^>]*>([^<]+)</i)
  return m ? m[1].trim() : null
}

export interface WeheatTokens {
  access_token: string
  refresh_token: string
  expires_in: number
}

/**
 * Perform the full headless code-flow against Weheat's Keycloak. Throws with
 * a human-readable Dutch message on failure.
 */
export async function loginWeheatHeadless(username: string, password: string): Promise<WeheatTokens> {
  // PKCE pair
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  const state = randomBytes(16).toString('base64url')

  const jar = new CookieJar()

  // 1. GET /auth — follow redirects until login HTML
  const authUrl = `${REALM_BASE}/auth?` + new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  }).toString()

  const authRes = await fetch(authUrl, {
    redirect: 'follow',
    headers: { 'User-Agent': 'UPsol-Weheat-Connector/1.0' },
  })
  jar.ingestSetCookies(authRes.headers)
  const html = await authRes.text()
  const formAction = parseLoginAction(html)
  if (!formAction) {
    throw new Error('Login-formulier van Weheat niet gevonden (mogelijk 2FA toegevoegd?)')
  }

  // 2. POST credentials
  const loginRes = await fetch(formAction, {
    method: 'POST',
    redirect: 'manual',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': jar.toHeader(),
      'User-Agent': 'UPsol-Weheat-Connector/1.0',
      'Accept': 'text/html,application/xhtml+xml',
    },
    body: new URLSearchParams({ username, password, credentialId: '' }).toString(),
  })
  jar.ingestSetCookies(loginRes.headers)

  if (loginRes.status !== 302 && loginRes.status !== 303) {
    const errHtml = await loginRes.text()
    const errMsg = looksLikeLoginError(errHtml) || 'Login mislukt. Controleer e-mail en wachtwoord.'
    throw new Error(`Weheat: ${errMsg}`)
  }

  const location = loginRes.headers.get('location') || ''
  const codeMatch = location.match(/[?&]code=([^&]+)/)
  if (!codeMatch) {
    throw new Error('Geen authorisatiecode ontvangen van Weheat.')
  }
  const code = decodeURIComponent(codeMatch[1])

  // 3. Exchange code → tokens
  const tokenResp: any = await $fetch(`${REALM_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier,
    }).toString(),
  })

  if (!tokenResp?.access_token || !tokenResp?.refresh_token) {
    throw new Error('Geen tokens ontvangen van Weheat.')
  }

  return {
    access_token: tokenResp.access_token,
    refresh_token: tokenResp.refresh_token,
    expires_in: tokenResp.expires_in || 3600,
  }
}
