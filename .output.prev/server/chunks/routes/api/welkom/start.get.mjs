import { d as defineEventHandler, e as getQuery, l as sendRedirect, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { verifyWelcomeToken } from '../../../_/welcome-token.mjs';
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
import 'crypto';

const start_get = defineEventHandler(async (event) => {
  var _a, _b;
  const query = getQuery(event);
  const token = query.token || "";
  const result = verifyWelcomeToken(token);
  if (!result.valid || !result.customerId) {
    const reason = result.reason || "unknown";
    return sendRedirect(event, `/welkom/verlopen?reason=${reason}`, 302);
  }
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, email, partner_id, partners:partners(slug)").eq("id", result.customerId).single();
  if (!(customer == null ? void 0 : customer.email)) {
    return sendRedirect(event, "/welkom/verlopen?reason=missing", 302);
  }
  const slug = ((_a = customer.partners) == null ? void 0 : _a.slug) || "";
  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
  const baseUrl = `https://${slug ? slug + "." : ""}${baseDomain}`;
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: customer.email,
    options: { redirectTo: `${baseUrl}/auth/callback` }
  });
  if (error || !((_b = data == null ? void 0 : data.properties) == null ? void 0 : _b.action_link)) {
    return sendRedirect(event, "/welkom/verlopen?reason=generate", 302);
  }
  return sendRedirect(event, data.properties.action_link, 302);
});

export { start_get as default };
//# sourceMappingURL=start.get.mjs.map
