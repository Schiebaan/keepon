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

const labels_put = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const ticketId = getRouterParam(event, "id");
  if (!ticketId) throw createError({ statusCode: 400, message: "ticket id ontbreekt" });
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
  const { data: ticket } = await supabase.from("service_tickets").select("id, partner_id").eq("id", ticketId).eq("partner_id", partnerId).single();
  if (!ticket) throw createError({ statusCode: 404, message: "Ticket niet gevonden" });
  const submitted = Array.isArray(body == null ? void 0 : body.label_ids) ? body.label_ids.filter((x) => typeof x === "string") : [];
  let validIds = [];
  if (submitted.length) {
    const { data: labels } = await supabase.from("ticket_labels").select("id").eq("partner_id", partnerId).in("id", submitted);
    validIds = (labels || []).map((l) => l.id);
  }
  const { error: delErr } = await supabase.from("service_ticket_labels").delete().eq("ticket_id", ticketId);
  if (delErr) throw createError({ statusCode: 500, message: delErr.message });
  if (validIds.length) {
    const rows = validIds.map((label_id) => ({ ticket_id: ticketId, label_id }));
    const { error: insErr } = await supabase.from("service_ticket_labels").insert(rows);
    if (insErr) throw createError({ statusCode: 500, message: insErr.message });
  }
  await auditLog(event, "ticket.labels_set", "service_ticket", ticketId, {
    label_ids: validIds,
    partner_id: partnerId
  });
  const { data: assigned } = validIds.length ? await supabase.from("ticket_labels").select("id, name, color, sort_order").in("id", validIds).order("sort_order", { ascending: true }) : { data: [] };
  return { ok: true, labels: assigned || [] };
});

export { labels_put as default };
//# sourceMappingURL=labels.put.mjs.map
