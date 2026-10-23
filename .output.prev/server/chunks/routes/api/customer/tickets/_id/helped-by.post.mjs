import { d as defineEventHandler, h as getRouterParam, c as createError, r as readBody, g as getServiceRoleClient } from '../../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../../_/audit.mjs';
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

const helpedBy_post = defineEventHandler(async (event) => {
  var _a;
  const user = await requireAuth(event);
  const ticketId = getRouterParam(event, "id");
  if (!ticketId) throw createError({ statusCode: 400, message: "Ticket-id ontbreekt" });
  const body = await readBody(event).catch(() => ({}));
  const rawName = String((_a = body == null ? void 0 : body.name) != null ? _a : "").trim().slice(0, 80);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, partner_id").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  const { data: ticket, error: ticketErr } = await supabase.from("service_tickets").select("id, customer_id, partner_id").eq("id", ticketId).eq("customer_id", customer.id).single();
  if (ticketErr || !ticket) throw createError({ statusCode: 404, message: "Ticket niet gevonden" });
  const value = rawName || null;
  const { error: updErr } = await supabase.from("service_tickets").update({ helped_by_name: value, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ticketId);
  if (updErr) throw createError({ statusCode: 500, message: updErr.message });
  await auditLog(event, "ticket.helped_by_set", "ticket", ticketId, {
    helped_by_name: value,
    partner_id: ticket.partner_id
  });
  return { ok: true, helped_by_name: value };
});

export { helpedBy_post as default };
//# sourceMappingURL=helped-by.post.mjs.map
