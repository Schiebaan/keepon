import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { getPartnerTemplate, buildFromCustomTemplate, buildWelcomeEmail, sendEmail } from '../../../../_/email.mjs';
import { createWelcomeToken } from '../../../../_/welcome-token.mjs';
import { l as logIndividualInvitation } from '../../../../_/mailing-batch-log.mjs';
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
import 'crypto';

const MODULE_LABELS = {
  solar_panel: "Zonnepanelen",
  heat_pump: "Warmtepomp",
  ev_charger: "Laadpaal",
  battery: "Thuisbatterij"
};
const CATEGORY_TO_MODULE = {
  solar_panel: "solar",
  heat_pump: "heat_pump",
  ev_charger: "ev_charger",
  battery: "battery"
};
const sendWelcome_post = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "customer id ontbreekt" });
  const supabase = getServiceRoleClient();
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const tenant = event.context.tenant;
    if (tenant == null ? void 0 : tenant.id) partnerId = tenant.id;
    else {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const { data: customer } = await supabase.from("customers").select("id, email, full_name, partner_id").eq("id", customerId).eq("partner_id", partnerId).single();
  if (!customer) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  const { data: partnerData } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email, support_phone").eq("id", partnerId).single();
  const { data: products } = await supabase.from("customer_products").select("category").eq("customer_id", customer.id);
  const seen = /* @__PURE__ */ new Set();
  const modulesForEmail = [];
  for (const p of products || []) {
    const m = CATEGORY_TO_MODULE[p.category];
    if (m && !seen.has(m)) {
      seen.add(m);
      modulesForEmail.push(m);
    }
  }
  const moduleNames = modulesForEmail.map((m) => {
    var _a2;
    return (_a2 = Object.entries(CATEGORY_TO_MODULE).find(([_, v]) => v === m)) == null ? void 0 : _a2[0];
  }).map((c) => c ? MODULE_LABELS[c] : null).filter(Boolean).join(" & ") || "installatie";
  const baseUrl = `https://${(partnerData == null ? void 0 : partnerData.slug) ? partnerData.slug + "." : ""}upsol.nl`;
  const welcomeToken = createWelcomeToken(customer.id, 30);
  const magicLinkUrl = `${baseUrl}/api/welkom/start?token=${welcomeToken}`;
  const customTemplate = await getPartnerTemplate(supabase, partnerId, "welkomstmail");
  let emailContent;
  if (customTemplate && customTemplate.enabled) {
    emailContent = buildFromCustomTemplate({
      subject: customTemplate.subject,
      heading: customTemplate.heading,
      body: customTemplate.body,
      buttonText: customTemplate.button_text,
      buttonUrl: magicLinkUrl,
      customerName: customer.full_name || customer.email,
      customerEmail: customer.email,
      moduleName: moduleNames,
      partner: partnerData || void 0
    });
  } else {
    emailContent = buildWelcomeEmail({
      customerName: customer.full_name || customer.email,
      customerEmail: customer.email,
      onboardingUrl: magicLinkUrl,
      moduleName: moduleNames,
      modules: modulesForEmail,
      partner: partnerData || void 0
    });
  }
  const result = await sendEmail({
    to: customer.email,
    subject: emailContent.subject,
    html: emailContent.html,
    fromName: partnerData == null ? void 0 : partnerData.name
    // Geen replyTo — welkomstmail wijst direct naar portaal-login.
  });
  if ((result == null ? void 0 : result.success) !== false) {
    await supabase.from("customers").update({ invite_sent_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", customer.id);
  }
  await auditLog(event, "email.welcome_resent", "customer", customer.id, {
    to: customer.email,
    success: result.success,
    actor: user.id
  });
  if (!result.success) {
    throw createError({ statusCode: 500, message: "E-mail versturen mislukt: " + (result.reason || "onbekende fout") });
  }
  await logIndividualInvitation({
    supabase,
    partnerId,
    customerId: customer.id,
    customerLabel: customer.full_name || customer.email,
    actorUserId: user.id
  });
  return {
    sent: true,
    to: customer.email,
    expires_in_days: 30
  };
});

export { sendWelcome_post as default };
//# sourceMappingURL=send-welcome.post.mjs.map
