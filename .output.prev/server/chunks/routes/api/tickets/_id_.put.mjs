import { d as defineEventHandler, h as getRouterParam, r as readBody, g as getServiceRoleClient, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { p as parseMessages } from '../../../_/ticket-messages.mjs';
import { buildTicketResolvedEmail, sendEmail } from '../../../_/email.mjs';
import { resolveAdminDisplayName } from '../../../_/admin-name.mjs';
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

const VALID_STATUS = /* @__PURE__ */ new Set(["nieuw", "open", "in_behandeling", "opgelost", "gesloten"]);
const VALID_URGENCY = /* @__PURE__ */ new Set(["laag", "normaal", "hoog"]);
const AFGEROND = /* @__PURE__ */ new Set(["opgelost", "gesloten"]);
const _id__put = defineEventHandler(async (event) => {
  var _a, _b;
  const { user } = await requireRole(event, "partner_admin");
  const ticketId = getRouterParam(event, "id");
  const body = await readBody(event);
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
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const { data: huidig } = await supabase.from("service_tickets").select("id, status, response, partner_id").eq("id", ticketId).eq("partner_id", partnerId).single();
  if (!huidig) throw createError({ statusCode: 404, message: "Ticket niet gevonden" });
  const updates = {};
  if (body.status !== void 0) {
    if (!VALID_STATUS.has(body.status)) throw createError({ statusCode: 400, message: `Onbekende status: ${body.status}` });
    updates.status = body.status === "nieuw" ? "open" : body.status;
  }
  if (body.urgency !== void 0) {
    if (!VALID_URGENCY.has(body.urgency)) throw createError({ statusCode: 400, message: `Onbekende urgentie: ${body.urgency}` });
    updates.urgency = body.urgency;
  }
  if (body.subject !== void 0) {
    const s = String(body.subject).trim();
    if (!s) throw createError({ statusCode: 400, message: "Onderwerp mag niet leeg zijn" });
    updates.subject = s.slice(0, 200);
  }
  if (body.description !== void 0) {
    updates.description = String(body.description).trim().slice(0, 5e3) || null;
  }
  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: "Geen velden om bij te werken" });
  }
  const { data, error } = await supabase.from("service_tickets").update(updates).eq("id", ticketId).eq("partner_id", partnerId).select("*, customer:customers(id, full_name, email, phone, street, house_number, postal_code, city)").single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "ticket.updated", "service_ticket", ticketId, {
    fields: Object.keys(updates),
    partner_id: partnerId,
    customer_id: (_a = data.customer) == null ? void 0 : _a.id
  });
  const wordtAfgerond = updates.status && AFGEROND.has(updates.status) && !AFGEROND.has(huidig.status);
  if (wordtAfgerond && ((_b = data.customer) == null ? void 0 : _b.email)) {
    try {
      const { data: partner } = await supabase.from("partners").select("name, slug, primary_color, logo_url").eq("id", partnerId).single();
      const berichten = parseMessages(huidig.response);
      const laatsteTeam = [...berichten].reverse().find((m) => m.role === "installer");
      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
      const email = buildTicketResolvedEmail({
        customerName: data.customer.full_name || data.customer.email,
        ticketSubject: data.subject,
        ticketRef: typeof data.ticket_number === "number" ? String(data.ticket_number) : void 0,
        lastReply: (laatsteTeam == null ? void 0 : laatsteTeam.text) || null,
        authorName: await resolveAdminDisplayName(supabase, user.id),
        ticketUrl: `https://${(partner == null ? void 0 : partner.slug) || "www"}.${baseDomain}/klant/service`,
        partner: partner ? { name: partner.name, primary_color: partner.primary_color, logo_url: partner.logo_url } : void 0
      });
      await sendEmail({ to: data.customer.email, subject: email.subject, html: email.html });
      await auditLog(event, "email.ticket_resolved_sent", "service_ticket", ticketId, {
        to: data.customer.email,
        status: updates.status
      });
    } catch (e) {
      console.error("[tickets] Kon afrondingsmail niet versturen:", (e == null ? void 0 : e.message) || e);
    }
  }
  return { ...data, messages: parseMessages(data.response) };
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
