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

const me_put = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
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
  if (!partnerId) throw createError({ statusCode: 404, message: "Geen partner gevonden" });
  const allowed = ["name", "slug", "logo_url", "primary_color", "secondary_color", "support_email", "support_phone", "terms_url", "terms_content", "terms_placeholders"];
  const updates = {};
  for (const key of allowed) {
    if (body[key] !== void 0) updates[key] = body[key];
  }
  if (updates.support_phone !== void 0 || updates.support_email !== void 0) {
    const ph = updates.terms_placeholders && typeof updates.terms_placeholders === "object" ? { ...updates.terms_placeholders } : null;
    if (ph) {
      if (updates.support_phone !== void 0) ph.telefoon = updates.support_phone;
      if (updates.support_email !== void 0) ph.email = updates.support_email;
      updates.terms_placeholders = ph;
    }
  } else if (updates.terms_placeholders && typeof updates.terms_placeholders === "object") {
    const ph = updates.terms_placeholders;
    if (typeof ph.telefoon === "string" && ph.telefoon) updates.support_phone = ph.telefoon;
    if (typeof ph.email === "string" && ph.email) updates.support_email = ph.email;
  }
  const { data, error } = await supabase.from("partners").update(updates).eq("id", partnerId).select().single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "partner.updated", "partner", partnerId, { fields: Object.keys(updates) });
  return data;
});

export { me_put as default };
//# sourceMappingURL=me.put.mjs.map
