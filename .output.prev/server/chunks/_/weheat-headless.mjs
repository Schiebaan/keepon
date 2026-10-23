import { randomBytes, createHash } from 'crypto';
import { d as WEHEAT_REALM, e as WEHEAT_REDIRECT_URI, f as WEHEAT_CLIENT_ID, w as weheatClientParams } from './weheat-config.mjs';

var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, key + "" , value);
const REALM_BASE = WEHEAT_REALM;
const CLIENT_ID = WEHEAT_CLIENT_ID;
const REDIRECT_URI = WEHEAT_REDIRECT_URI;
const SCOPE = "profile email";
class CookieJar {
  constructor() {
    __publicField(this, "store", /* @__PURE__ */ new Map());
  }
  ingestSetCookies(headers) {
    var _a, _b;
    const anyHeaders = headers;
    const list = typeof anyHeaders.getSetCookie === "function" ? anyHeaders.getSetCookie() : (_b = (_a = headers.get("set-cookie")) == null ? void 0 : _a.split(/, (?=[A-Za-z0-9_-]+=)/)) != null ? _b : [];
    for (const c of list) {
      const pair = c.split(";")[0];
      const eq = pair.indexOf("=");
      if (eq < 0) continue;
      this.store.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
  }
  toHeader() {
    return Array.from(this.store.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
  }
}
function parseLoginAction(html) {
  const formMatch = html.match(/<form[^>]+id=["']kc-form-login["'][^>]*action=["']([^"']+)["']/i) || html.match(/<form[^>]+action=["']([^"']+)["'][^>]+id=["']kc-form-login["']/i);
  if (formMatch) {
    return formMatch[1].replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x?\d+;/g, "");
  }
  const jsonMatch = html.match(/"loginAction"\s*:\s*"([^"]+)"/);
  if (jsonMatch) {
    return jsonMatch[1].replace(/\\\//g, "/").replace(/\\"/g, '"').replace(/&amp;/g, "&");
  }
  return null;
}
function looksLikeLoginError(html) {
  const m = html.match(/<(?:span|div)[^>]+class=["'][^"']*kc-feedback-text[^"']*["'][^>]*>([^<]+)</i) || html.match(/<span[^>]+id=["']input-error["'][^>]*>([^<]+)</i);
  return m ? m[1].trim() : null;
}
async function loginWeheatHeadless(username, password) {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  const state = randomBytes(16).toString("base64url");
  const jar = new CookieJar();
  const authUrl = `${REALM_BASE}/auth?` + new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: SCOPE,
    redirect_uri: REDIRECT_URI,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state
  }).toString();
  const authRes = await fetch(authUrl, {
    redirect: "follow",
    headers: { "User-Agent": "UPsol-Weheat-Connector/1.0" }
  });
  jar.ingestSetCookies(authRes.headers);
  const html = await authRes.text();
  const formAction = parseLoginAction(html);
  if (!formAction) {
    throw new Error("Login-formulier van Weheat niet gevonden (mogelijk 2FA toegevoegd?)");
  }
  const loginRes = await fetch(formAction, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cookie": jar.toHeader(),
      "User-Agent": "UPsol-Weheat-Connector/1.0",
      "Accept": "text/html,application/xhtml+xml"
    },
    body: new URLSearchParams({ username, password, credentialId: "" }).toString()
  });
  jar.ingestSetCookies(loginRes.headers);
  if (loginRes.status !== 302 && loginRes.status !== 303) {
    const errHtml = await loginRes.text();
    const errMsg = looksLikeLoginError(errHtml) || "Login mislukt. Controleer e-mail en wachtwoord.";
    throw new Error(`Weheat: ${errMsg}`);
  }
  const location = loginRes.headers.get("location") || "";
  const codeMatch = location.match(/[?&]code=([^&]+)/);
  if (!codeMatch) {
    throw new Error("Geen authorisatiecode ontvangen van Weheat.");
  }
  const code = decodeURIComponent(codeMatch[1]);
  const tokenResp = await $fetch(`${REALM_BASE}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      ...weheatClientParams(),
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    }).toString()
  });
  if (!(tokenResp == null ? void 0 : tokenResp.access_token) || !(tokenResp == null ? void 0 : tokenResp.refresh_token)) {
    throw new Error("Geen tokens ontvangen van Weheat.");
  }
  return {
    access_token: tokenResp.access_token,
    refresh_token: tokenResp.refresh_token,
    expires_in: tokenResp.expires_in || 3600,
    // 30 dagen bij de third-party-client. Bewaren, zodat we een verlopen
    // refresh-token niet eerst nog proberen.
    refresh_expires_in: tokenResp.refresh_expires_in
  };
}

export { loginWeheatHeadless };
//# sourceMappingURL=weheat-headless.mjs.map
