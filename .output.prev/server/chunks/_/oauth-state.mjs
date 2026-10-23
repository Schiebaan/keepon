import { createHmac, timingSafeEqual, randomBytes, createHash } from 'crypto';

function getSecret() {
  const s = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing \u2014 required for OAuth state signing");
  return s;
}
function generatePkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
function signState(payload) {
  const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(b64).digest("base64url");
  return `${b64}.${sig}`;
}
function verifyState(signed, maxAgeMs = 10 * 60 * 1e3) {
  if (!signed || typeof signed !== "string") return null;
  const dot = signed.indexOf(".");
  if (dot < 1) return null;
  const b64 = signed.slice(0, dot);
  const sig = signed.slice(dot + 1);
  const expected = createHmac("sha256", getSecret()).update(b64).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(b64, "base64url").toString());
    if (typeof (payload == null ? void 0 : payload.ts) !== "number") return null;
    if (Date.now() - payload.ts > maxAgeMs) return null;
    return payload;
  } catch {
    return null;
  }
}
function randomNonce(bytes = 16) {
  return randomBytes(bytes).toString("base64url");
}

export { generatePkce as g, randomNonce as r, signState as s, verifyState as v };
//# sourceMappingURL=oauth-state.mjs.map
