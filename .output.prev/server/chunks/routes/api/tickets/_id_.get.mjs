import { d as defineEventHandler, h as getRouterParam, g as getServiceRoleClient, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { p as parseMessages } from '../../../_/ticket-messages.mjs';
import { l as labelsByTicket } from '../../../_/ticket-labels.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const ticketId = getRouterParam(event, "id");
  const supabase = getServiceRoleClient();
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
    partnerId = fp == null ? void 0 : fp.id;
  }
  const { data, error } = await supabase.from("service_tickets").select("*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)").eq("id", ticketId).eq("partner_id", partnerId).single();
  if (error) {
    if (error.code === "PGRST116") throw createError({ statusCode: 404, message: "Ticket niet gevonden" });
    throw createError({ statusCode: 500, message: error.message });
  }
  const labelMap = await labelsByTicket(supabase, [data.id]);
  return { ...data, messages: parseMessages(data.response), labels: labelMap.get(data.id) || [] };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
