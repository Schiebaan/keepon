import { d as defineEventHandler, g as getServiceRoleClient, h as getRouterParam, c as createError, r as readBody } from '../../../../nitro/nitro.mjs';
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

const _id__put = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const targetUserId = getRouterParam(event, "id");
  if (!targetUserId) throw createError({ statusCode: 400, message: "user id ontbreekt" });
  const body = await readBody(event).catch(() => ({}));
  const fullName = typeof (body == null ? void 0 : body.full_name) === "string" ? body.full_name.trim().slice(0, 80) : "";
  const { data: callerRole } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = callerRole == null ? void 0 : callerRole.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((callerRole == null ? void 0 : callerRole.role) === "platform_admin" && !partnerId) {
    const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
    partnerId = fp == null ? void 0 : fp.id;
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const { data: targetRole } = await supabase.from("user_roles").select("user_id, partner_id, role").eq("user_id", targetUserId).eq("partner_id", partnerId).single();
  if (!targetRole) throw createError({ statusCode: 404, message: "Gebruiker niet gevonden bij deze partner" });
  const { error } = await supabase.from("user_roles").update({ full_name: fullName || null }).eq("user_id", targetUserId).eq("partner_id", partnerId);
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "partner_user.renamed", "user_role", targetUserId, {
    full_name: fullName || null,
    partner_id: partnerId
  });
  return { ok: true, id: targetUserId, full_name: fullName || null };
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
