import { createHmac, timingSafeEqual } from 'crypto';

const DEFAULT_TTL_DAYS = 30;
function getSecret() {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing \u2014 required as HMAC secret for welcome tokens");
  return s;
}
function b64url(s) {
  return Buffer.from(s).toString("base64url");
}
function unb64url(s) {
  return Buffer.from(s, "base64url").toString("utf8");
}
function createWelcomeToken(customerId, ttlDays = DEFAULT_TTL_DAYS) {
  const exp = Math.floor(Date.now() / 1e3) + ttlDays * 86400;
  const payload = `${customerId}.${exp}`;
  const sig = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${b64url(customerId)}.${b64url(String(exp))}.${sig}`;
}
function verifyWelcomeToken(token) {
  if (!token || typeof token !== "string") return { valid: false, customerId: null, reason: "malformed" };
  const parts = token.split(".");
  if (parts.length !== 3) return { valid: false, customerId: null, reason: "malformed" };
  let customerId, expStr;
  try {
    customerId = unb64url(parts[0]);
    expStr = unb64url(parts[1]);
  } catch {
    return { valid: false, customerId: null, reason: "malformed" };
  }
  const expected = createHmac("sha256", getSecret()).update(`${customerId}.${expStr}`).digest("base64url");
  const actual = parts[2];
  if (expected.length !== actual.length) return { valid: false, customerId: null, reason: "bad_signature" };
  if (!timingSafeEqual(Buffer.from(expected), Buffer.from(actual))) {
    return { valid: false, customerId: null, reason: "bad_signature" };
  }
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1e3)) {
    return { valid: false, customerId, reason: "expired" };
  }
  return { valid: true, customerId };
}

export { createWelcomeToken, verifyWelcomeToken };
//# sourceMappingURL=welcome-token.mjs.map
