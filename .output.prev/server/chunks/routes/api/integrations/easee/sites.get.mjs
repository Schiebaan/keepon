import { d as defineEventHandler, g as getServiceRoleClient, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as listEaseeSites } from '../../../../_/easee.mjs';
import { r as resolvePartnerId } from '../../../../_/partner-scope.mjs';
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
import '../../../../_/connectors.mjs';

const cache = /* @__PURE__ */ new Map();
const CACHE_MS = 5 * 60 * 1e3;
const sites_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  const { data: creds } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", partnerId).eq("integration_type", "easee").eq("is_active", true).maybeSingle();
  if (!creds) {
    throw createError({
      statusCode: 404,
      message: "Easee is nog niet gekoppeld. Ga naar Instellingen \u2192 Monitoring integraties om je Easee-account te verbinden."
    });
  }
  const gecachet = cache.get(partnerId);
  if (gecachet && Date.now() - gecachet.at < CACHE_MS) return gecachet.data;
  try {
    const sites = await listEaseeSites(creds.credentials);
    cache.set(partnerId, { at: Date.now(), data: sites });
    return sites;
  } catch (e) {
    throw createError({ statusCode: 502, message: (e == null ? void 0 : e.message) || "Kon de installaties niet ophalen bij Easee." });
  }
});

export { sites_get as default };
//# sourceMappingURL=sites.get.mjs.map
