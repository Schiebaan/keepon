import { d as defineEventHandler, e as getQuery, j as getCookie, k as deleteCookie, g as getServiceRoleClient, l as sendRedirect } from '../../../../nitro/nitro.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { v as verifyState } from '../../../../_/oauth-state.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@supabase/functions-js';
import '@supabase/postgrest-js';
import '@supabase/realtime-js';
import '@supabase/storage-js';
import '@supabase/auth-js';
import 'crypto';

const TOKEN_URL = "https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/token";
const CLIENT_ID = "weheat-backend";
function backToSettings(event, returnTo, status, reason) {
  const safe = returnTo && returnTo.startsWith("/") ? returnTo : "/admin/settings";
  const sep = safe.includes("?") ? "&" : "?";
  const params = new URLSearchParams({ weheat: status });
  if (reason) params.set("reason", reason);
  return sendRedirect(event, `${safe}${sep}${params.toString()}`, 302);
}
const callback_get = defineEventHandler(async (event) => {
  var _a, _b;
  const query = getQuery(event);
  const code = query.code || "";
  const state = query.state || "";
  const err = query.error || "";
  const signed = getCookie(event, "_weheat_oauth");
  const session = verifyState(signed);
  deleteCookie(event, "_weheat_oauth", { path: "/" });
  if (!session) {
    return backToSettings(event, "/admin/settings", "fail", "session_expired");
  }
  if (err) {
    return backToSettings(event, session.return_to, "fail", err);
  }
  if (!code || !state || state !== session.state) {
    return backToSettings(event, session.return_to, "fail", "invalid_state");
  }
  let tokenResp;
  try {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: CLIENT_ID,
      code,
      redirect_uri: session.redirect_uri,
      code_verifier: session.verifier
    });
    tokenResp = await $fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
  } catch (e) {
    const reason = ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.error) || "token_exchange_failed";
    return backToSettings(event, session.return_to, "fail", reason);
  }
  const accessToken = (tokenResp == null ? void 0 : tokenResp.access_token) || "";
  const refreshToken = (tokenResp == null ? void 0 : tokenResp.refresh_token) || "";
  const expiresIn = (tokenResp == null ? void 0 : tokenResp.expires_in) || 3600;
  if (!accessToken || !refreshToken) {
    return backToSettings(event, session.return_to, "fail", "no_tokens");
  }
  try {
    await $fetch("https://api.weheat.nl/third_party/api/v1/heat-pumps", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (e) {
    const status = (e == null ? void 0 : e.statusCode) || ((_b = e == null ? void 0 : e.response) == null ? void 0 : _b.status);
    if (status === 403) {
      return backToSettings(event, session.return_to, "fail", "api_forbidden");
    }
  }
  const supabase = getServiceRoleClient();
  const credentials = {
    refresh_token: refreshToken,
    access_token: accessToken,
    access_token_expires_at: new Date(Date.now() + (expiresIn - 60) * 1e3).toISOString(),
    connected_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const { data: existing } = await supabase.from("integration_credentials").select("id").eq("partner_id", session.partner_id).eq("integration_type", "weheat").maybeSingle();
  if (existing) {
    await supabase.from("integration_credentials").update({ credentials, is_active: true }).eq("id", existing.id);
  } else {
    await supabase.from("integration_credentials").insert({
      partner_id: session.partner_id,
      integration_type: "weheat",
      credentials,
      is_active: true
    });
  }
  await auditLog(event, "integration.connected", "integration_credentials", null, { type: "weheat", flow: "oauth_code_pkce" });
  return backToSettings(event, session.return_to, "ok");
});

export { callback_get as default };
//# sourceMappingURL=callback.get.mjs.map
