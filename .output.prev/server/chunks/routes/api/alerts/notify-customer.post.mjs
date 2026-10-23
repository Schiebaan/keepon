import { d as defineEventHandler, r as readBody, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { r as resolvePartnerId } from '../../../_/partner-scope.mjs';
import { buildFromCustomTemplate, sendEmail } from '../../../_/email.mjs';
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

const notifyCustomer_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const body = await readBody(event);
  const { customerEmail, customerName, moduleName, message, partnerId } = body;
  if (!customerEmail || !customerName || !message) {
    throw createError({ statusCode: 400, message: "customerEmail, customerName, and message are required" });
  }
  const supabase = getServiceRoleClient();
  const supabaseScope = getServiceRoleClient();
  const eigenPartner = await resolvePartnerId(event, supabaseScope, user.id);
  if (partnerId && partnerId !== eigenPartner) {
    throw createError({ statusCode: 403, message: "Geen toegang tot deze partner" });
  }
  let partner = null;
  if (partnerId) {
    const { data } = await supabase.from("partners").select("name, primary_color, logo_url, support_email").eq("id", partnerId).single();
    partner = data;
  }
  const emailContent = buildFromCustomTemplate({
    subject: `Update over je ${moduleName || "systeem"}`,
    heading: "Bericht van je installateur",
    body: message,
    buttonText: "Naar mijn dashboard",
    buttonUrl: "https://upsol.nl/klant",
    customerName,
    customerEmail,
    moduleName: moduleName || "",
    partner: partner || void 0
  });
  const result = await sendEmail({
    to: customerEmail,
    subject: emailContent.subject,
    html: emailContent.html
    // Geen replyTo — alerts zijn transactioneel; reageren gaat via het portaal.
  });
  return result;
});

export { notifyCustomer_post as default };
//# sourceMappingURL=notify-customer.post.mjs.map
