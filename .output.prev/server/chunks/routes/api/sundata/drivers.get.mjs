import { d as defineEventHandler, g as getServiceRoleClient, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
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

const BASE_URL = "https://api.sundata.nl/api/v0";
const HELP_URLS = {
  solaredge: "https://support.sundata.nl/nl/articles/5695178-solaredge-installatie-aanmelden-op-sundata",
  sma: "https://support.sundata.nl/nl/articles/5148193-sma-installatie-aanmelden-op-sundata",
  solarweb: "https://support.sundata.nl/nl/articles/5139981-fronius-installatie-aanmelden-op-sundata",
  fronius: "https://support.sundata.nl/nl/articles/5139981-fronius-installatie-aanmelden-op-sundata",
  enphase: "https://support.sundata.nl/nl/articles/5139942-enphase-installatie-aanmelden-op-sundata",
  solis: "https://support.sundata.nl/nl/articles/5695320-solis-installatie-aanmelden-op-sundata",
  huawei: "https://support.sundata.nl/nl/articles/5140055-huawei-fusionsolar-installatie-aanmelden-op-sundata",
  huawei_neteco: "https://support.sundata.nl/nl/articles/6211747-huawei-neteco-installatie-aanmelden-op-sundata",
  solax: "https://support.sundata.nl/nl/articles/5775774-solax-installatie-aanmelden-op-sundata",
  sundata_cast4all: "https://support.sundata.nl/nl/articles/5794722-installatie-sungate",
  // Sundata has no dedicated article for these — fall back to the support homepage
  growatt: "https://support.sundata.nl/",
  goodwe: "https://support.sundata.nl/",
  fox_ess: "https://support.sundata.nl/"
};
const drivers_get = defineEventHandler(async (event) => {
  var _a, _b;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
    partnerId = fp == null ? void 0 : fp.id;
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const { data: cred } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", partnerId).eq("integration_type", "sundata").eq("is_active", true).single();
  if (!((_b = cred == null ? void 0 : cred.credentials) == null ? void 0 : _b.email)) {
    throw createError({ statusCode: 400, message: "Sundata is niet gekoppeld. Ga naar Instellingen om de koppeling in te stellen." });
  }
  const signin = await $fetch(`${BASE_URL}/sign-in`, {
    method: "POST",
    body: { email: cred.credentials.email, password: cred.credentials.password }
  });
  const token = signin.access_token;
  const headers = { Authorization: `Bearer ${token}` };
  const companies = await $fetch(`${BASE_URL}/users/me/companies`, { headers });
  if (!(companies == null ? void 0 : companies.length)) return [];
  const companyId = companies[0].id;
  const driverAccounts = await $fetch(`${BASE_URL}/companies/${companyId}/driver-accounts`, { headers });
  const result = [];
  for (const da of driverAccounts) {
    try {
      const compositions = await $fetch(
        `${BASE_URL}/companies/${companyId}/driver-accounts/${da.id}/credential-compositions`,
        { headers }
      );
      for (const comp of compositions || []) {
        if (!comp.creation_enabled) continue;
        result.push({
          id: comp.alias,
          // unique per composition
          driver_name: da.driver_name,
          driver_account_id: da.id,
          driver_account_name: da.name,
          composition_alias: comp.alias,
          // Prefer composition display_name (e.g. "SolarWeb: Device"), fall back to driver display_name
          name: comp.display_name || da.display_name || da.driver_name,
          fields: (comp.credential_fields || []).filter((f) => f.editable !== false).sort((a, b) => {
            var _a2, _b2;
            return ((_a2 = a.nr) != null ? _a2 : 0) - ((_b2 = b.nr) != null ? _b2 : 0);
          }).map((f) => ({ name: f.name, label: f.display_name || f.name })),
          helpUrl: HELP_URLS[da.driver_name] || ""
        });
      }
    } catch {
    }
  }
  return result;
});

export { drivers_get as default };
//# sourceMappingURL=drivers.get.mjs.map
