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

const VALID_COLORS = /* @__PURE__ */ new Set(["gray", "blue", "green", "amber", "orange", "red", "purple", "sky", "pink", "teal"]);
const ticketLabels_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
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
  const name = String((body == null ? void 0 : body.name) || "").trim().slice(0, 60);
  if (!name) throw createError({ statusCode: 400, message: "Geef het label een naam" });
  const color = VALID_COLORS.has(body == null ? void 0 : body.color) ? body.color : "gray";
  const { data: last } = await supabase.from("ticket_labels").select("sort_order").eq("partner_id", partnerId).order("sort_order", { ascending: false }).limit(1).maybeSingle();
  const sortOrder = ((last == null ? void 0 : last.sort_order) || 0) + 1;
  const { data, error } = await supabase.from("ticket_labels").insert({ partner_id: partnerId, name, color, sort_order: sortOrder }).select("id, name, color, sort_order, is_active").single();
  if (error) {
    if (error.code === "23505") throw createError({ statusCode: 409, message: "Er bestaat al een label met deze naam" });
    throw createError({ statusCode: 500, message: error.message });
  }
  await auditLog(event, "ticket_label.created", "ticket_label", data.id, { name, color, partner_id: partnerId });
  return data;
});

export { ticketLabels_post as default };
//# sourceMappingURL=ticket-labels.post.mjs.map
