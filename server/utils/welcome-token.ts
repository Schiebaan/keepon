import { createHmac, timingSafeEqual } from 'crypto'

/**
 * Long-lived "welcome token" used in onboarding emails.
 * The Supabase magic link itself expires after 1 hour, which is too short for
 * onboarding mails — customers often click days later. So we wrap the magic-link
 * generation behind our own URL with a 30-day token: when the customer clicks,
 * we generate a fresh magic link and redirect immediately.
 *
 * Format:  {base64url(customerId)}.{base64url(exp_unix)}.{base64url(hmac)}
 * Stateless — no DB lookup needed for verification.
 */

const DEFAULT_TTL_DAYS = 30

function getSecret(): string {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!s) throw new Error('SUPABASE_SERVICE_ROLE_KEY missing — required as HMAC secret for welcome tokens')
  return s
}

function b64url(s: string | Buffer): string {
  return Buffer.from(s).toString('base64url')
}

function unb64url(s: string): string {
  return Buffer.from(s, 'base64url').toString('utf8')
}

export function createWelcomeToken(customerId: string, ttlDays = DEFAULT_TTL_DAYS): string {
  const exp = Math.floor(Date.now() / 1000) + ttlDays * 86400
  const payload = `${customerId}.${exp}`
  const sig = createHmac('sha256', getSecret()).update(payload).digest('base64url')
  return `${b64url(customerId)}.${b64url(String(exp))}.${sig}`
}

export interface VerifiedWelcomeToken {
  valid: boolean
  customerId: string | null
  reason?: 'malformed' | 'expired' | 'bad_signature'
}

export function verifyWelcomeToken(token: string | undefined | null): VerifiedWelcomeToken {
  if (!token || typeof token !== 'string') return { valid: false, customerId: null, reason: 'malformed' }
  const parts = token.split('.')
  if (parts.length !== 3) return { valid: false, customerId: null, reason: 'malformed' }

  let customerId: string, expStr: string
  try {
    customerId = unb64url(parts[0])
    expStr = unb64url(parts[1])
  } catch {
    return { valid: false, customerId: null, reason: 'malformed' }
  }

  const expected = createHmac('sha256', getSecret()).update(`${customerId}.${expStr}`).digest('base64url')
  const actual = parts[2]
  // timing-safe compare
  if (expected.length !== actual.length) return { valid: false, customerId: null, reason: 'bad_signature' }
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return { valid: false, customerId: null, reason: 'bad_signature' }
  }

  const exp = Number(expStr)
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) {
    return { valid: false, customerId, reason: 'expired' }
  }

  return { valid: true, customerId }
}
