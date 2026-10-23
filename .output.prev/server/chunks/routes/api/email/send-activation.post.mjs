import { d as defineEventHandler, r as readBody, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { r as resolvePartnerId } from '../../../_/partner-scope.mjs';
import { getPartnerTemplate, buildFromCustomTemplate, buildActivationConfirmEmail, sendEmail, moduleTypeLabel } from '../../../_/email.mjs';
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

const sendActivation_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const body = await readBody(event);
  const { customerEmail, customerName, moduleType, partnerId } = body;
  if (!customerEmail || !customerName || !moduleType) {
    throw createError({ statusCode: 400, message: "customerEmail, customerName, and moduleType are required" });
  }
  const supabase = getServiceRoleClient();
  const supabaseScope = getServiceRoleClient();
  const eigenPartner = await resolvePartnerId(event, supabaseScope, user.id);
  if (partnerId && partnerId !== eigenPartner) {
    throw createError({ statusCode: 403, message: "Geen toegang tot deze partner" });
  }
  let partner = null;
  if (partnerId) {
    const { data } = await supabase.from("partners").select("name, slug, primary_color, secondary_color, logo_url, support_email").eq("id", partnerId).single();
    partner = data;
  }
  const loginUrl = `https://${(partner == null ? void 0 : partner.slug) ? partner.slug + "." : ""}upsol.nl/login`;
  let emailContent;
  const customTemplate = partnerId ? await getPartnerTemplate(supabase, partnerId, "activatie_bevestiging") : null;
  if (customTemplate) {
    if (!customTemplate.enabled) return { success: false, reason: "template_disabled" };
    emailContent = buildFromCustomTemplate({
      subject: customTemplate.subject,
      heading: customTemplate.heading,
      body: customTemplate.body,
      buttonText: customTemplate.button_text,
      buttonUrl: loginUrl,
      customerName,
      customerEmail,
      moduleName: moduleTypeLabel(moduleType),
      partner: partner || void 0
    });
  } else {
    emailContent = buildActivationConfirmEmail({
      customerName,
      loginUrl,
      moduleName: moduleTypeLabel(moduleType),
      partner: partner || void 0
    });
  }
  const result = await sendEmail({
    to: customerEmail,
    subject: emailContent.subject,
    html: emailContent.html
    // Geen replyTo — activatie-mail wijst klant rechtstreeks naar portaal.
  });
  return result;
});

export { sendActivation_post as default };
//# sourceMappingURL=send-activation.post.mjs.map
