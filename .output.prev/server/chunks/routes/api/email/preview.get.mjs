import { d as defineEventHandler, e as getQuery, c as createError, s as setHeader } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { buildActivationConfirmEmail, buildPasswordResetEmail, buildWelcomeEmail } from '../../../_/email.mjs';
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

const preview_get = defineEventHandler(async (event) => {
  await requireRole(event, "partner_admin");
  const query = getQuery(event);
  const template = query.template || "welcome";
  const demoPartner = {
    name: "Volt4U",
    primary_color: "#f97316",
    logo_url: "",
    support_email: "info@volt4u.nl"
  };
  let result;
  switch (template) {
    case "welcome":
      result = buildWelcomeEmail({
        customerName: "Jan de Vries",
        onboardingUrl: "https://upsol.nl/welkom/demo-token-123",
        moduleName: "Zonnepanelen monitoring",
        partner: demoPartner
      });
      break;
    case "reset":
      result = buildPasswordResetEmail({
        customerName: "Jan de Vries",
        resetUrl: "https://upsol.nl/auth/reset-password?token=demo",
        partner: demoPartner
      });
      break;
    case "activation":
      result = buildActivationConfirmEmail({
        customerName: "Jan de Vries",
        loginUrl: "https://upsol.nl/login",
        moduleName: "Zonnepanelen monitoring",
        partner: demoPartner
      });
      break;
    default:
      throw createError({ statusCode: 400, message: `Unknown template: ${template}. Use: welcome, reset, activation` });
  }
  setHeader(event, "content-type", "text/html");
  return result.html;
});

export { preview_get as default };
//# sourceMappingURL=preview.get.mjs.map
