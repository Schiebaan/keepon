import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
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

const check_post = defineEventHandler(async (event) => {
  var _a, _b;
  await requireRole(event, "platform_admin");
  const supabase = getServiceRoleClient();
  const { data: errorSubs } = await supabase.from("subscriptions").select(`
      id, integration_status, integration_meta,
      customer:customers(id, email, full_name, partner_id),
      partner_module_config:partner_module_configs(
        module_definition:module_definitions(name, type)
      )
    `).eq("status", "active").eq("integration_status", "error");
  if (!(errorSubs == null ? void 0 : errorSubs.length)) {
    return { checked: true, alerts_sent: 0 };
  }
  let alertsSent = 0;
  for (const sub of errorSubs) {
    const customer = sub.customer;
    const moduleName = ((_b = (_a = sub.partner_module_config) == null ? void 0 : _a.module_definition) == null ? void 0 : _b.name) || "je systeem";
    if (!(customer == null ? void 0 : customer.email)) continue;
    const { data: partner } = await supabase.from("partners").select("name, primary_color, logo_url, support_email").eq("id", customer.partner_id).single();
    const emailContent = buildFromCustomTemplate({
      subject: `Let op: ${moduleName} meldt een storing`,
      heading: "Er is een storing gedetecteerd",
      body: `Hallo {{voornaam}}, we hebben een probleem gedetecteerd met je ${moduleName}. Ons team is op de hoogte gebracht en neemt zo nodig contact met je op.`,
      buttonText: "Bekijk status",
      buttonUrl: `https://upsol.nl/klant`,
      customerName: customer.full_name || "Klant",
      customerEmail: customer.email,
      moduleName,
      partner: partner || void 0
    });
    const result = await sendEmail({
      to: customer.email,
      subject: emailContent.subject,
      html: emailContent.html
      // Geen replyTo — alert-mail; opvolgen gaat via portaal.
    });
    if (result.success) alertsSent++;
  }
  return { checked: true, alerts_sent: alertsSent, errors_found: errorSubs.length };
});

export { check_post as default };
//# sourceMappingURL=check.post.mjs.map
