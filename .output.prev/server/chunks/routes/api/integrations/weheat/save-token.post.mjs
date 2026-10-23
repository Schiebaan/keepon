import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
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

const TOKEN_URL = "https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/token";
const CLIENT_ID = "weheat-backend";
const saveToken_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const refreshToken = ((body == null ? void 0 : body.refresh_token) || "").toString().trim();
  if (!refreshToken) throw createError({ statusCode: 400, message: "Plak je refresh_token uit de Weheat debugger." });
  const tenant = event.context.tenant;
  let partnerId = tenant == null ? void 0 : tenant.id;
  if (!partnerId) {
    const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
    partnerId = role == null ? void 0 : role.partner_id;
    if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  let tokenResp;
  try {
    tokenResp = await $fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: CLIENT_ID,
        refresh_token: refreshToken
      }).toString()
    });
  } catch (e) {
    const code = (_a = e == null ? void 0 : e.data) == null ? void 0 : _a.error;
    if (code === "invalid_grant") {
      throw createError({ statusCode: 400, message: "Refresh-token is verlopen of ongeldig. Pak een verse uit de Weheat debugger." });
    }
    throw createError({ statusCode: 400, message: "Token-validatie mislukt: " + (((_b = e == null ? void 0 : e.data) == null ? void 0 : _b.error_description) || (e == null ? void 0 : e.message) || "onbekend") });
  }
  const accessToken = (tokenResp == null ? void 0 : tokenResp.access_token) || "";
  const newRefreshToken = (tokenResp == null ? void 0 : tokenResp.refresh_token) || refreshToken;
  const expiresIn = (tokenResp == null ? void 0 : tokenResp.expires_in) || 3600;
  if (!accessToken) throw createError({ statusCode: 500, message: "Geen access_token ontvangen" });
  try {
    await $fetch("https://api.weheat.nl/third_party/api/v1/heat-pumps", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
  } catch (e) {
    const status = (e == null ? void 0 : e.statusCode) || ((_c = e == null ? void 0 : e.response) == null ? void 0 : _c.status);
    if (status === 403) {
      throw createError({ statusCode: 403, message: "Token werkt op auth-niveau maar /heat-pumps geeft 403. Controleer of dit het token van de debugger is." });
    }
  }
  const credentials = {
    refresh_token: newRefreshToken,
    access_token: accessToken,
    access_token_expires_at: new Date(Date.now() + (expiresIn - 60) * 1e3).toISOString(),
    connected_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const { data: existing } = await supabase.from("integration_credentials").select("id").eq("partner_id", partnerId).eq("integration_type", "weheat").maybeSingle();
  if (existing) {
    await supabase.from("integration_credentials").update({ credentials, is_active: true }).eq("id", existing.id);
  } else {
    await supabase.from("integration_credentials").insert({ partner_id: partnerId, integration_type: "weheat", credentials, is_active: true });
  }
  await auditLog(event, "integration.connected", "integration_credentials", null, { type: "weheat", flow: "paste_refresh_token" });
  return { connected: true };
});

export { saveToken_post as default };
//# sourceMappingURL=save-token.post.mjs.map
