import { d as defineEventHandler, g as getServiceRoleClient, e as getQuery, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { l as listEaseeSiteChargers } from '../../../../_/easee.mjs';
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

const siteChargers_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  const siteId = getQuery(event).site_id;
  if (!siteId) throw createError({ statusCode: 400, message: "site_id ontbreekt" });
  const { data: creds } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", partnerId).eq("integration_type", "easee").eq("is_active", true).maybeSingle();
  if (!creds) throw createError({ statusCode: 404, message: "Easee is nog niet gekoppeld." });
  try {
    return await listEaseeSiteChargers(creds.credentials, String(siteId));
  } catch (e) {
    throw createError({ statusCode: 502, message: (e == null ? void 0 : e.message) || "Kon de laadpalen van deze installatie niet ophalen." });
  }
});

export { siteChargers_get as default };
//# sourceMappingURL=site-chargers.get.mjs.map
