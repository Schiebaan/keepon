import { d as defineEventHandler, g as getServiceRoleClient, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { w as weheatConnector } from '../../../../_/weheat.mjs';
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
import '../../../../_/weheat-config.mjs';

const devices_get = defineEventHandler(async (event) => {
  await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const tenant = event.context.tenant;
  let partnerId = tenant == null ? void 0 : tenant.id;
  if (!partnerId) {
    throw createError({ statusCode: 400, message: "Geen partner context" });
  }
  const { data: creds } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", partnerId).eq("integration_type", "weheat").eq("is_active", true).single();
  if (!creds) {
    throw createError({ statusCode: 404, message: "Weheat is niet verbonden voor deze partner." });
  }
  return await weheatConnector.listDevices(creds.credentials);
});

export { devices_get as default };
//# sourceMappingURL=devices.get.mjs.map
