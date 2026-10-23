import { d as defineEventHandler, g as getServiceRoleClient, h as getRouterParam, c as createError } from '../../../../../nitro/nitro.mjs';
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

const resolve_post = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const ticketId = getRouterParam(event, "id");
  if (!ticketId) throw createError({ statusCode: 400, message: "Ticket-id ontbreekt" });
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  const { data: ticket } = await supabase.from("service_tickets").select("id, subject, status").eq("id", ticketId).eq("customer_id", customer.id).single();
  if (!ticket) throw createError({ statusCode: 404, message: "Melding niet gevonden" });
  if (ticket.status === "opgelost" || ticket.status === "gesloten") {
    const { data: huidig } = await supabase.from("service_tickets").select("id, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at").eq("id", ticket.id).single();
    return huidig;
  }
  const { data, error } = await supabase.from("service_tickets").update({ status: "opgelost", updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", ticket.id).select("id, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at").single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "ticket.closed_by_customer", "service_ticket", ticket.id, {
    customer_id: customer.id,
    partner_id: customer.partner_id,
    subject: ticket.subject
  });
  return data;
});

export { resolve_post as default };
//# sourceMappingURL=resolve.post.mjs.map
