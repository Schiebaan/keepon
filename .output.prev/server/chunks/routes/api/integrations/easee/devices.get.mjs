import { d as defineEventHandler, g as getServiceRoleClient, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { e as easeeConnector } from '../../../../_/easee.mjs';
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

const devices_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const tenant = event.context.tenant;
  let partnerId = tenant == null ? void 0 : tenant.id;
  if (!partnerId) {
    const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
    partnerId = role == null ? void 0 : role.partner_id;
    if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const { data: creds } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", partnerId).eq("integration_type", "easee").eq("is_active", true).single();
  if (!creds) {
    throw createError({
      statusCode: 404,
      message: "Easee is nog niet gekoppeld. Ga naar Instellingen \u2192 Monitoring integraties om je Easee-account te verbinden."
    });
  }
  try {
    return await easeeConnector.listDevices(creds.credentials);
  } catch (e) {
    throw createError({
      statusCode: 502,
      message: (e == null ? void 0 : e.message) || "Kon de laadpalen niet ophalen bij Easee."
    });
  }
});

export { devices_get as default };
//# sourceMappingURL=devices.get.mjs.map
