import { d as defineEventHandler, h as getRouterParam, r as readBody, c as createError, g as getServiceRoleClient } from '../../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../../_/audit.mjs';
import { a as appendMessage, p as parseMessages } from '../../../../../_/ticket-messages.mjs';
import { buildNewTicketInstallerEmail, sendEmail } from '../../../../../_/email.mjs';
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
import '../../../../../_/aanhef.mjs';
import 'resend';

const MODULE_LABELS = {
  solar: "Zonnepanelen",
  heat_pump: "Warmtepomp",
  ev_charger: "Laadpaal",
  battery: "Batterij"
};
const messages_post = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const ticketId = getRouterParam(event, "id");
  const body = await readBody(event);
  const text = ((body == null ? void 0 : body.text) || "").toString().trim();
  if (!text) throw createError({ statusCode: 400, message: "Berichttekst is verplicht" });
  if (text.length > 1e4) throw createError({ statusCode: 400, message: "Bericht is te lang (max 10.000 tekens)" });
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  const { data: current, error: fetchErr } = await supabase.from("service_tickets").select("id, subject, status, urgency, module_type, description, response, partner_id").eq("id", ticketId).eq("customer_id", customer.id).single();
  if (fetchErr || !current) throw createError({ statusCode: 404, message: "Ticket niet gevonden" });
  const { raw } = appendMessage(current.response, {
    role: "customer",
    text,
    author_name: customer.full_name
  });
  const updates = { response: raw };
  const wasClosed = current.status === "opgelost" || current.status === "gesloten";
  if (wasClosed) {
    updates.status = "in_behandeling";
  }
  const { data, error } = await supabase.from("service_tickets").update(updates).eq("id", ticketId).select("id, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at").single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "ticket.message_added", "service_ticket", ticketId, {
    role: "customer",
    reopened: wasClosed
  });
  try {
    const { data: partner } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("id", current.partner_id).single();
    if (partner == null ? void 0 : partner.support_email) {
      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
      const ticketUrl = `https://${partner.slug || "www"}.${baseDomain}/admin/service/${ticketId}`;
      const ticketRef = typeof data.ticket_number === "number" ? String(data.ticket_number) : void 0;
      const email = buildNewTicketInstallerEmail({
        customerName: customer.full_name || customer.email,
        customerEmail: customer.email,
        ticketSubject: wasClosed ? `[Heropend] ${current.subject}` : `[Reactie] ${current.subject}`,
        ticketRef,
        ticketDescription: text,
        // the new reply as the description of this notification
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
      await auditLog(event, "email.ticket_customer_reply_sent", "service_ticket", ticketId, {
        to: partner.support_email,
        reopened: wasClosed
      });
    }
  } catch (e) {
    console.error("[ticket-messages] Failed to notify installer:", (e == null ? void 0 : e.message) || e);
  }
  return {
    ...data,
    messages: parseMessages(data.response)
  };
});

export { messages_post as default };
//# sourceMappingURL=messages.post.mjs.map
