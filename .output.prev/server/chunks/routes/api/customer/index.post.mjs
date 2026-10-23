import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { buildNewTicketInstallerEmail, sendEmail } from '../../../_/email.mjs';
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
import '../../../_/aanhef.mjs';
import 'resend';

const MODULE_LABELS = {
  solar: "Zonnepanelen",
  heat_pump: "Warmtepomp",
  ev_charger: "Laadpaal",
  battery: "Batterij"
};
const index_post = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const { subject, description, module_type, urgency } = body;
  if (!subject || typeof subject !== "string" || !subject.trim()) {
    throw createError({ statusCode: 400, message: "Onderwerp is verplicht" });
  }
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email").eq("auth_user_id", user.id).single();
  if (!customer) {
    throw createError({ statusCode: 404, message: "Geen klantaccount gevonden" });
  }
  const drempel = new Date(Date.now() - 2 * 60 * 1e3).toISOString();
  const { data: bestaand } = await supabase.from("service_tickets").select("id, ticket_number, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at").eq("customer_id", customer.id).eq("subject", subject.trim().slice(0, 200)).gte("created_at", drempel).order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (bestaand) {
    await auditLog(event, "ticket.duplicate_suppressed", "service_ticket", bestaand.id, {
      customer_id: customer.id,
      subject
    });
    return bestaand;
  }
  const { data, error } = await supabase.from("service_tickets").insert({
    customer_id: customer.id,
    partner_id: customer.partner_id,
    subject: subject.trim().slice(0, 200),
    description: (description || "").trim().slice(0, 5e3) || null,
    urgency: ["laag", "normaal", "hoog"].includes(urgency) ? urgency : "normaal",
    module_type: ["solar", "heat_pump", "ev_charger", "battery"].includes(module_type) ? module_type : null,
    status: "open"
    // DB check-constraint accepts 'open'; UI displays this as "Nieuw"
  }).select("id, ticket_number, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at").single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "ticket.created", "service_ticket", data.id, {
    customer_id: customer.id,
    subject,
    origin: "customer_portal"
  });
  try {
    const { data: partner } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("id", customer.partner_id).single();
    if (partner == null ? void 0 : partner.support_email) {
      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
      const ticketUrl = `https://${partner.slug || "www"}.${baseDomain}/admin/service/${data.id}`;
      const ticketRef = typeof data.ticket_number === "number" ? String(data.ticket_number) : void 0;
      const email = buildNewTicketInstallerEmail({
        customerName: customer.full_name || customer.email,
        customerEmail: customer.email,
        ticketSubject: data.subject,
        ticketRef,
        ticketDescription: data.description,
        urgency: data.urgency,
        moduleLabel: data.module_type ? MODULE_LABELS[data.module_type] || null : null,
        ticketUrl,
        partner: {
          name: partner.name,
          primary_color: partner.primary_color,
          logo_url: partner.logo_url
        }
      });
      await sendEmail({
        to: partner.support_email,
        subject: email.subject,
        html: email.html,
        replyTo: customer.email
      });
      await auditLog(event, "email.new_ticket_installer_sent", "service_ticket", data.id, {
        to: partner.support_email
      });
    }
  } catch (e) {
    console.error("[tickets] Failed to notify installer:", (e == null ? void 0 : e.message) || e);
  }
  return data;
});

export { index_post as default };
//# sourceMappingURL=index.post.mjs.map
