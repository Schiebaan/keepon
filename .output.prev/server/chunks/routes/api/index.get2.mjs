import { d as defineEventHandler, g as getServiceRoleClient } from '../../nitro/nitro.mjs';
import { r as requireRole } from '../../_/auth-guard.mjs';
import { m as messageCount, l as latestMessage, p as parseMessages } from '../../_/ticket-messages.mjs';
import { l as labelsByTicket } from '../../_/ticket-labels.mjs';
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

const index_get = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
    partnerId = fp == null ? void 0 : fp.id;
  }
  if (!partnerId) return [];
  const { data } = await supabase.from("service_tickets").select("*, customer:customers(id, full_name, email, phone)").eq("partner_id", partnerId).order("updated_at", { ascending: false });
  const rows = data || [];
  const labelMap = await labelsByTicket(supabase, rows.map((t) => t.id));
  return rows.map((t) => ({
    ...t,
    messages: parseMessages(t.response),
    latest_message: latestMessage(t.response),
    message_count: messageCount(t.response),
    labels: labelMap.get(t.id) || []
  }));
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
