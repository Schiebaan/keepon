import { d as defineEventHandler, h as getRouterParam, e as getQuery, c as createError, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../_/auth-guard.mjs';
import { g as getConnector } from '../../../../_/connectors.mjs';
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

const status_get = defineEventHandler(async (event) => {
  await requireAuth(event);
  const type = getRouterParam(event, "type");
  const query = getQuery(event);
  const deviceId = query.device_id;
  if (!deviceId) {
    throw createError({ statusCode: 400, message: "device_id is verplicht" });
  }
  const tenant = event.context.tenant;
  if (!tenant) {
    throw createError({ statusCode: 400, message: "Geen partner omgeving" });
  }
  const supabase = getServiceRoleClient();
  const { data: creds } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", tenant.id).eq("integration_type", type).eq("is_active", true).single();
  if (!creds) {
    throw createError({ statusCode: 404, message: `Geen ${type} credentials geconfigureerd` });
  }
  const connector = getConnector(type);
  return await connector.getDeviceStatus(creds.credentials, deviceId);
});

export { status_get as default };
//# sourceMappingURL=status.get.mjs.map
