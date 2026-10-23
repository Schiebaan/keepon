import { d as defineEventHandler, r as readBody, c as createError, g as getServiceRoleClient, a as getHeader } from '../../../nitro/nitro.mjs';
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

const magicLink_post = defineEventHandler(async (event) => {
  var _a;
  const body = await readBody(event);
  const { email } = body;
  if (!email) throw createError({ statusCode: 400, message: "Email is verplicht" });
  const supabase = getServiceRoleClient();
  const host = getHeader(event, "host") || "upsol.nl";
  const redirectTo = `https://${host}/auth/callback`;
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo }
  });
  if (error) {
    throw createError({ statusCode: 400, message: "Kan geen inloglink genereren. Controleer het e-mailadres." });
  }
  const magicLinkUrl = (_a = data == null ? void 0 : data.properties) == null ? void 0 : _a.action_link;
  if (!magicLinkUrl) {
    throw createError({ statusCode: 500, message: "Inloglink genereren mislukt" });
  }
  const tenant = event.context.tenant;
  let partner = null;
  if (tenant) {
    partner = tenant;
  } else {
    const { data: p } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("is_active", true).order("created_at").limit(1).single();
    partner = p;
  }
  const { subject, html } = buildFromCustomTemplate({
    subject: `Inloggen bij ${(partner == null ? void 0 : partner.name) || "UPsol"}`,
    heading: "Inloggen",
    body: "Klik op de knop hieronder om in te loggen. Deze link is 1 uur geldig.",
    buttonText: "Inloggen",
    buttonUrl: magicLinkUrl,
    customerName: email.split("@")[0],
    customerEmail: email,
    partner: partner || void 0
  });
  const result = await sendEmail({
    to: email,
    subject,
    html
    // Geen replyTo — magic-link mails zijn transactioneel; replies horen niet
    // in de partner-inbox te belanden.
  });
  if (!result.success) {
    throw createError({ statusCode: 500, message: "Email versturen mislukt" });
  }
  return { success: true };
});

export { magicLink_post as default };
//# sourceMappingURL=magic-link.post.mjs.map
