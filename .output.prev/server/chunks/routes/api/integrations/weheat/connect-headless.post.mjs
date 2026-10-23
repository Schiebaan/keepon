import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { loginWeheatHeadless } from '../../../../_/weheat-headless.mjs';
import { W as WEHEAT_API_URL } from '../../../../_/weheat-config.mjs';
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

const HEAT_PUMPS_URL = `${WEHEAT_API_URL}/heat-pumps`;
const connectHeadless_post = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const username = ((body == null ? void 0 : body.username) || (body == null ? void 0 : body.email) || "").toString().trim();
  const password = ((body == null ? void 0 : body.password) || "").toString();
  if (!username || !password) {
    throw createError({ statusCode: 400, message: "E-mail en wachtwoord zijn verplicht." });
  }
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
  let tokens;
  try {
    tokens = await loginWeheatHeadless(username, password);
  } catch (e) {
    throw createError({ statusCode: 400, message: (e == null ? void 0 : e.message) || "Verbinden mislukt" });
  }
  try {
    await $fetch(HEAT_PUMPS_URL, { headers: { Authorization: `Bearer ${tokens.access_token}` } });
  } catch (e) {
    const status = (e == null ? void 0 : e.statusCode) || ((_a = e == null ? void 0 : e.response) == null ? void 0 : _a.status);
    if (status === 403) {
      throw createError({ statusCode: 403, message: "Inloggen lukt maar Weheat weigert API-toegang voor dit account." });
    }
  }
  const credentials = {
    refresh_token: tokens.refresh_token,
    access_token: tokens.access_token,
    access_token_expires_at: new Date(Date.now() + (tokens.expires_in - 60) * 1e3).toISOString(),
    // Stored so the connector can transparently re-auth when refresh expires
    username,
    password,
    connected_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const { data: existing } = await supabase.from("integration_credentials").select("id").eq("partner_id", partnerId).eq("integration_type", "weheat").maybeSingle();
  if (existing) {
    await supabase.from("integration_credentials").update({ credentials, is_active: true }).eq("id", existing.id);
  } else {
    await supabase.from("integration_credentials").insert({
      partner_id: partnerId,
      integration_type: "weheat",
      credentials,
      is_active: true
    });
  }
  await auditLog(event, "integration.connected", "integration_credentials", null, { type: "weheat", flow: "headless" });
  return { connected: true };
});

export { connectHeadless_post as default };
//# sourceMappingURL=connect-headless.post.mjs.map
