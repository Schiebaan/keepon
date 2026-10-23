import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { createWelcomeToken } from '../../../../_/welcome-token.mjs';
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

const portalLink_get = defineEventHandler(async (event) => {
  var _a, _b;
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
  const { data: customer } = await supabase.from("customers").select("id, partner_id, partners:partners(slug)").eq("id", customerId).eq("partner_id", partnerId).single();
  if (!customer) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  const slug = ((_b = customer.partners) == null ? void 0 : _b.slug) || "";
  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
  const baseUrl = `https://${slug ? slug + "." : ""}${baseDomain}`;
  const token = createWelcomeToken(customer.id, 30);
  return {
    url: `${baseUrl}/api/welkom/start?token=${token}`,
    expires_in_days: 30
  };
});

export { portalLink_get as default };
//# sourceMappingURL=portal-link.get.mjs.map
