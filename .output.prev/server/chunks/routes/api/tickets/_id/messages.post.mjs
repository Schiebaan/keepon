import { d as defineEventHandler, h as getRouterParam, r as readBody, c as createError, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { r as resolvePartnerId } from '../../../../_/partner-scope.mjs';
import { a as appendMessage, p as parseMessages } from '../../../../_/ticket-messages.mjs';
import { buildTicketReplyEmail, sendEmail } from '../../../../_/email.mjs';
import { resolveAdminDisplayName } from '../../../../_/admin-name.mjs';
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
import '../../../../_/aanhef.mjs';
import 'resend';

const messages_post = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const ticketId = getRouterParam(event, "id");
  const body = await readBody(event);
  const text = ((body == null ? void 0 : body.text) || "").toString().trim();
  if (!text) throw createError({ statusCode: 400, message: "Berichttekst is verplicht" });
  if (text.length > 1e4) throw createError({ statusCode: 400, message: "Bericht is te lang (max 10.000 tekens)" });
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  const { data: current, error: fetchErr } = await supabase.from("service_tickets").select("id, subject, status, response, partner_id, customer_id").eq("id", ticketId).eq("partner_id", partnerId).single();
  if (fetchErr || !current) throw createError({ statusCode: 404, message: "Ticket niet gevonden" });
  const authorName = await resolveAdminDisplayName(supabase, user.id);
  const { raw } = appendMessage(current.response, { role: "installer", text, author_name: authorName });
  const updates = { response: raw };
  if (current.status === "nieuw" || current.status === "open") {
    updates.status = "in_behandeling";
  }
  const { data, error } = await supabase.from("service_tickets").update(updates).eq("id", ticketId).select("*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)").single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "ticket.message_added", "service_ticket", ticketId, {
    role: "installer",
    auto_status: updates.status
  });
  if ((_a = data.customer) == null ? void 0 : _a.email) {
    try {
      const { data: partner } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("id", current.partner_id).single();
      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
      const ticketUrl = `https://${(partner == null ? void 0 : partner.slug) || "www"}.${baseDomain}/klant/service`;
      const ticketRef = typeof data.ticket_number === "number" ? String(data.ticket_number) : void 0;
      const email = buildTicketReplyEmail({
        customerName: data.customer.full_name || data.customer.email,
        ticketSubject: data.subject,
        ticketRef,
        replyExcerpt: text,
        ticketUrl,
        authorName,
        partner: partner ? {
          name: partner.name,
          primary_color: partner.primary_color,
          logo_url: partner.logo_url,
          support_email: partner.support_email
        } : void 0
      });
      await sendEmail({
        to: data.customer.email,
        subject: email.subject,
        html: email.html
      });
      await auditLog(event, "email.ticket_reply_sent", "service_ticket", ticketId, {
        to: data.customer.email
      });
    } catch (e) {
      console.error("[ticket-messages] Failed to send customer email:", (e == null ? void 0 : e.message) || e);
    }
  }
  return {
    ...data,
    messages: parseMessages(data.response)
  };
});

export { messages_post as default };
//# sourceMappingURL=messages.post.mjs.map
