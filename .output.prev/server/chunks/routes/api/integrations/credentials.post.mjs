import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
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

const credentials_post = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const { type, credentials } = body;
  if (!type || !credentials) throw createError({ statusCode: 400, message: "type and credentials required" });
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
    partnerId = fp == null ? void 0 : fp.id;
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const { data, error } = await supabase.from("integration_credentials").upsert({
    partner_id: partnerId,
    integration_type: type,
    credentials,
    is_active: true,
    last_verified_at: (/* @__PURE__ */ new Date()).toISOString()
  }, { onConflict: "partner_id,integration_type" }).select().single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "integration.connected", "integration_credentials", data.id, { type });
  return data;
});

export { credentials_post as default };
//# sourceMappingURL=credentials.post.mjs.map
