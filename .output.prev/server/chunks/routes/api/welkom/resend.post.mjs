import { d as defineEventHandler, r as readBody, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { getPartnerTemplate, buildFromCustomTemplate, buildWelcomeEmail, sendEmail } from '../../../_/email.mjs';
import { createWelcomeToken } from '../../../_/welcome-token.mjs';
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
const resend_post = defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}));
  const email = ((body == null ? void 0 : body.email) || "").toString().trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw createError({ statusCode: 400, message: "Vul een geldig e-mailadres in" });
  }
  const supabase = getServiceRoleClient();
  const tenant = event.context.tenant;
  let customer = null;
  if (tenant == null ? void 0 : tenant.id) {
    const { data } = await supabase.from("customers").select("id, email, partner_id, full_name").eq("email", email).eq("partner_id", tenant.id).single();
    customer = data;
  } else {
    const { data } = await supabase.from("customers").select("id, email, partner_id, full_name").eq("email", email).order("created_at", { ascending: false }).limit(1).single();
    customer = data;
  }
  if (!customer) {
    return { sent: true };
  }
  const { data: partnerData } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email, support_phone").eq("id", customer.partner_id).single();
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
    var _a;
    return (_a = Object.entries(CATEGORY_TO_MODULE).find(([_, v]) => v === m)) == null ? void 0 : _a[0];
  }).map((c) => c ? MODULE_LABELS[c] : null).filter(Boolean).join(" & ") || "installatie";
  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
  const baseUrl = `https://${(partnerData == null ? void 0 : partnerData.slug) ? partnerData.slug + "." : ""}${baseDomain}`;
  const welcomeToken = createWelcomeToken(customer.id, 30);
  const magicLinkUrl = `${baseUrl}/api/welkom/start?token=${welcomeToken}`;
  const customTemplate = await getPartnerTemplate(supabase, customer.partner_id, "welkomstmail");
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
    // Geen replyTo — welkomstmail-CTA voert direct naar het portaal.
  });
  try {
    await auditLog(event, "email.welcome_resent_public", "customer", customer.id, {
      to: customer.email,
      success: result.success
    });
  } catch {
  }
  return { sent: true };
});

export { resend_post as default };
//# sourceMappingURL=resend.post.mjs.map
