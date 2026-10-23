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

const VALID_COLORS = /* @__PURE__ */ new Set(["gray", "blue", "green", "amber", "orange", "red", "purple", "sky", "pink", "teal"]);
const _id__put = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const labelId = getRouterParam(event, "id");
  if (!labelId) throw createError({ statusCode: 400, message: "label id ontbreekt" });
  const body = await readBody(event).catch(() => ({}));
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
  const updates = { updated_at: (/* @__PURE__ */ new Date()).toISOString() };
  if (typeof (body == null ? void 0 : body.name) === "string") {
    const n = body.name.trim().slice(0, 60);
    if (!n) throw createError({ statusCode: 400, message: "Naam mag niet leeg zijn" });
    updates.name = n;
  }
  if ((body == null ? void 0 : body.color) !== void 0) updates.color = VALID_COLORS.has(body.color) ? body.color : "gray";
  if ((body == null ? void 0 : body.sort_order) !== void 0) updates.sort_order = Math.max(0, Number(body.sort_order) || 0);
  if ((body == null ? void 0 : body.is_active) !== void 0) updates.is_active = !!body.is_active;
  const { data, error } = await supabase.from("ticket_labels").update(updates).eq("id", labelId).eq("partner_id", partnerId).select("id, name, color, sort_order, is_active").single();
  if (error) {
    if (error.code === "23505") throw createError({ statusCode: 409, message: "Er bestaat al een label met deze naam" });
    if (error.code === "PGRST116") throw createError({ statusCode: 404, message: "Label niet gevonden" });
    throw createError({ statusCode: 500, message: error.message });
  }
  await auditLog(event, "ticket_label.updated", "ticket_label", labelId, { updates, partner_id: partnerId });
  return data;
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
