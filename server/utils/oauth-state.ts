import { createHmac, createHash, randomBytes, timingSafeEqual } from 'crypto'

/**
 * Helpers for OAuth 2.0 / OIDC authorization-code flow with PKCE.
 *
 * - `generatePkce()` returns a fresh `verifier` + `challenge` pair.
 * - The flow's state (verifier + partner_id + nonce) is serialized as a signed
 *   token and round-tripped through a cookie so the callback handler can
 *   reconstruct it without a DB session table.
 */

function getSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — required for OAuth state signing')
  return s
}

export function generatePkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export interface OAuthState {
  verifier: string
  state: string
  partner_id: string
  redirect_uri: string
  return_to: string
  ts: number
}

export function signState(payload: OAuthState): string {
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = createHmac('sha256', getSecret()).update(b64).digest('base64url')
  return `${b64}.${sig}`
}

export function verifyState(signed: string | undefined | null, maxAgeMs = 10 * 60 * 1000): OAuthState | null {
  if (!signed || typeof signed !== 'string') return null
  const dot = signed.indexOf('.')
  if (dot < 1) return null
  const b64 = signed.slice(0, dot)
  const sig = signed.slice(dot + 1)
  const expected = createHmac('sha256', getSecret()).update(b64).digest('base64url')

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  try {
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString()) as OAuthState
    if (typeof payload?.ts !== 'number') return null
    if (Date.now() - payload.ts > maxAgeMs) return null
    return payload
  } catch {
    return null
  }
}

export function randomNonce(bytes = 16): string {
  return randomBytes(bytes).toString('base64url')
}
