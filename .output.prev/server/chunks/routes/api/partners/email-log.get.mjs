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

const ACTION_MAP = {
  "email.welcome_sent": { type: "welkomstmail", label: "Welkomstmail", subjectFallback: "Welkomstmail verstuurd" },
  "email.welcome_resent": { type: "welkomstmail", label: "Welkomstmail", subjectFallback: "Welkomstmail opnieuw verstuurd" },
  "email.welcome_resent_public": { type: "welkomstmail", label: "Welkomstmail", subjectFallback: "Welkomstmail (zelf aangevraagd)" },
  "email.ticket_reply_sent": { type: "ticket", label: "Ticket-antwoord", subjectFallback: "Antwoord op servicemelding" },
  "email.new_ticket_installer_sent": { type: "ticket", label: "Nieuwe melding", subjectFallback: "Nieuwe servicemelding van klant" },
  "email.ticket_customer_reply_sent": { type: "ticket", label: "Klantreactie", subjectFallback: "Reactie van klant op ticket" },
  "email.installation_connected_sent": { type: "installatie", label: "Installatie live", subjectFallback: "Installatie is gekoppeld" },
  "email.password_changed_sent": { type: "wachtwoord", label: "Wachtwoord", subjectFallback: "Wachtwoord gewijzigd" }
};
const emailLog_get = defineEventHandler(async (event) => {
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
  if (!partnerId) return { entries: [], stats: { total: 0, this_month: 0, failed: 0 } };
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1e3).toISOString();
  const { data: rows } = await supabase.from("audit_log").select("id, action, entity_type, entity_id, meta, created_at").eq("partner_id", partnerId).like("action", "email.%").gte("created_at", since).order("created_at", { ascending: false }).limit(200);
  const safeRows = rows || [];
  const customerIds = /* @__PURE__ */ new Set();
  const ticketIds = /* @__PURE__ */ new Set();
  for (const r of safeRows) {
    if (r.entity_type === "customer" && r.entity_id) customerIds.add(r.entity_id);
    if (r.entity_type === "service_ticket" && r.entity_id) ticketIds.add(r.entity_id);
  }
  let customerMap = /* @__PURE__ */ new Map();
  if (customerIds.size) {
    const { data: customers } = await supabase.from("customers").select("id, full_name, email").in("id", Array.from(customerIds));
    customerMap = new Map((customers || []).map((c) => [c.id, { full_name: c.full_name, email: c.email }]));
  }
  let ticketCustomerMap = /* @__PURE__ */ new Map();
  if (ticketIds.size) {
    const { data: tickets } = await supabase.from("service_tickets").select("id, customer_id").in("id", Array.from(ticketIds));
    ticketCustomerMap = new Map((tickets || []).map((t) => [t.id, t.customer_id]));
    const extraIds = Array.from(ticketCustomerMap.values()).filter((id) => id && !customerMap.has(id));
    if (extraIds.length) {
      const { data: customers } = await supabase.from("customers").select("id, full_name, email").in("id", extraIds);
      for (const c of customers || []) {
        customerMap.set(c.id, { full_name: c.full_name, email: c.email });
      }
    }
  }
  const entries = [];
  let failedCount = 0;
  const monthStart = /* @__PURE__ */ new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  let thisMonthCount = 0;
  for (const r of safeRows) {
    const mapping = ACTION_MAP[r.action] || { type: "overig", label: "E-mail", subjectFallback: "Bericht verstuurd" };
    const meta = r.meta || {};
    const recipientEmail = (meta.to || "").toString() || "";
    let customerId = null;
    if (r.entity_type === "customer") customerId = r.entity_id;
    else if (r.entity_type === "service_ticket" && r.entity_id) customerId = ticketCustomerMap.get(r.entity_id) || null;
    const customer = customerId ? customerMap.get(customerId) : null;
    const recipientName = (customer == null ? void 0 : customer.full_name) || null;
    const status = meta.success === false ? "mislukt" : "verzonden";
    if (status === "mislukt") failedCount++;
    if (new Date(r.created_at) >= monthStart) thisMonthCount++;
    let entityLink = null;
    if (r.entity_type === "service_ticket" && r.entity_id) entityLink = `/admin/service/${r.entity_id}`;
    else if (customerId) entityLink = `/admin/customers/${customerId}`;
    entries.push({
      id: r.id,
      type: mapping.type,
      type_label: mapping.label,
      recipient_email: recipientEmail || (customer == null ? void 0 : customer.email) || "",
      recipient_name: recipientName,
      subject: meta.subject || mapping.subjectFallback,
      status,
      created_at: r.created_at,
      entity_link: entityLink
    });
  }
  return {
    entries,
    stats: {
      total: entries.length,
      this_month: thisMonthCount,
      failed: failedCount
    }
  };
});

export { emailLog_get as default };
//# sourceMappingURL=email-log.get.mjs.map
