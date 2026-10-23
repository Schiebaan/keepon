import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
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

const TOONBARE_ACTIES = [
  "customer.created",
  "customer.updated",
  "customer.deleted",
  "ticket.created",
  "ticket.message_added",
  "ticket.closed_by_customer",
  "sundata.plant_created",
  "sundata.meter_created"
];
const SKIP_ACTIONS = /* @__PURE__ */ new Set([
  "email.ticket_reply_sent",
  "email.new_ticket_installer_sent",
  "email.ticket_customer_reply_sent",
  "email.installation_connected_sent",
  "email.password_changed_sent",
  "partner.updated",
  "ticket.updated"
  // only show create + message_added, skip status-only updates
]);
function describe(action, entityType, meta, customerName) {
  const m = meta || {};
  const who = customerName || "Klant";
  switch (action) {
    case "customer.created":
      return { type: "customer", icon: "user", text: `Nieuwe klant toegevoegd: ${who}` };
    case "customer.updated":
      return { type: "customer", icon: "settings", text: `Klantgegevens bijgewerkt: ${who}` };
    case "customer.deleted":
      return { type: "customer", icon: "trash", text: `Klant verwijderd: ${who}` };
    case "ticket.created": {
      const subject = m.subject || "Nieuwe melding";
      const origin = m.origin === "customer_portal" ? " (via portaal)" : "";
      return { type: "ticket", icon: "message", text: `Nieuwe servicemelding van ${who}${origin}: ${subject}` };
    }
    case "ticket.closed_by_customer":
      return { type: "ticket", icon: "check-circle", text: `${who} sloot melding zelf af: ${m.subject || "melding"}` };
    case "ticket.message_added": {
      if (m.role === "customer") {
        return { type: "ticket", icon: "message", text: m.reopened ? `${who} heropende ticket met nieuwe reactie` : `Reactie op ticket van ${who}` };
      }
      return { type: "ticket", icon: "send", text: `Reactie verstuurd naar ${who}` };
    }
    case "sundata.plant_created":
      return { type: "installation", icon: "solar", text: `Sundata-plant aangemaakt voor ${who}` };
    case "sundata.meter_created":
      if (m.first_link) {
        return { type: "installation", icon: "zap", text: `Zonnepanelen gekoppeld voor ${who}` };
      }
      return { type: "installation", icon: "solar", text: `Sundata-meter bijgewerkt voor ${who}` };
    default:
      return null;
  }
}
const activity_get = defineEventHandler(async (event) => {
  var _a, _b, _c, _d;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
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
  if (!partnerId) return [];
  const { data: rows } = await supabase.from("audit_log").select("id, action, entity_type, entity_id, meta, created_at").eq("partner_id", partnerId).in("action", TOONBARE_ACTIES).order("created_at", { ascending: false }).limit(40);
  if (!(rows == null ? void 0 : rows.length)) return [];
  const customerIds = /* @__PURE__ */ new Set();
  for (const r of rows) {
    if (r.entity_type === "customer" && r.entity_id) customerIds.add(r.entity_id);
    if ((_a = r.meta) == null ? void 0 : _a.customer_id) customerIds.add(r.meta.customer_id);
  }
  let customerMap = /* @__PURE__ */ new Map();
  if (customerIds.size) {
    const { data: customers } = await supabase.from("customers").select("id, full_name, email").in("id", Array.from(customerIds));
    customerMap = new Map((customers || []).map((c) => [c.id, c.full_name || c.email || "Klant"]));
  }
  const ticketIds = /* @__PURE__ */ new Set();
  for (const r of rows) {
    if (r.entity_type === "service_ticket" && r.entity_id) ticketIds.add(r.entity_id);
  }
  let ticketMap = /* @__PURE__ */ new Map();
  if (ticketIds.size) {
    const { data: tickets } = await supabase.from("service_tickets").select("id, customer_id").in("id", Array.from(ticketIds));
    ticketMap = new Map((tickets || []).map((t) => [t.id, { customer_id: t.customer_id }]));
  }
  const out = [];
  for (const r of rows) {
    if (SKIP_ACTIONS.has(r.action)) continue;
    let customerId = null;
    if (r.entity_type === "customer") customerId = r.entity_id;
    else if (r.entity_type === "service_ticket") customerId = ((_b = ticketMap.get(r.entity_id)) == null ? void 0 : _b.customer_id) || null;
    if (!customerId && ((_c = r.meta) == null ? void 0 : _c.customer_id)) customerId = r.meta.customer_id;
    const customerName = customerId ? customerMap.get(customerId) || null : null;
    const described = describe(r.action, r.entity_type, r.meta, customerName);
    if (!described) continue;
    let link = null;
    const ticketId = r.entity_type === "service_ticket" && r.entity_id ? r.entity_id : ((_d = r.meta) == null ? void 0 : _d.ticket_id) || null;
    if (ticketId) link = `/admin/service/${ticketId}`;
    else if (customerId) link = `/admin/customers/${customerId}`;
    out.push({
      id: r.id,
      type: described.type,
      icon: described.icon,
      text: described.text,
      entity_type: r.entity_type,
      entity_id: r.entity_id,
      link,
      at: r.created_at
    });
    if (out.length >= 15) break;
  }
  return out;
});

export { activity_get as default };
//# sourceMappingURL=activity.get.mjs.map
