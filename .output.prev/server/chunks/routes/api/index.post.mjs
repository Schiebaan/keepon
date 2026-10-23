import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { r as requireRole } from '../../_/auth-guard.mjs';
import { a as auditLog } from '../../_/audit.mjs';
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

const index_post = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const { customer_id, subject, description, urgency, module_type } = body;
  if (!customer_id || !subject) {
    throw createError({ statusCode: 400, message: "customer_id en subject zijn verplicht" });
  }
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
    partnerId = fp == null ? void 0 : fp.id;
  }
  const { data, error } = await supabase.from("service_tickets").insert({
    customer_id,
    partner_id: partnerId,
    subject,
    description: description || null,
    urgency: urgency || "normaal",
    module_type: module_type || null,
    status: "open"
    // DB check-constraint accepts 'open'; UI displays this as "Nieuw"
  }).select("*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)").single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "ticket.created", "service_ticket", data.id, { customer_id, subject });
  return data;
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
