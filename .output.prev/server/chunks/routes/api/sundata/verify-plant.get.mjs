import { d as defineEventHandler, g as getServiceRoleClient, e as getQuery, c as createError } from '../../../nitro/nitro.mjs';
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
const verifyPlant_get = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const query = getQuery(event);
  const deviceId = query.device_id;
  if (!deviceId) throw createError({ statusCode: 400, message: "device_id is required" });
  const [companyId, plantId] = deviceId.split(":");
  const { data: role } = await supabase.from("user_roles").select("partner_id").eq("user_id", user.id).single();
  const { data: creds } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", ((_a = event.context.tenant) == null ? void 0 : _a.id) || (role == null ? void 0 : role.partner_id)).eq("integration_type", "sundata").eq("is_active", true).single();
  if (!(creds == null ? void 0 : creds.credentials)) throw createError({ statusCode: 400, message: "Sundata niet gekoppeld" });
  const { access_token } = await $fetch(`${BASE_URL}/sign-in`, {
    method: "POST",
    body: { email: creds.credentials.email, password: creds.credentials.password }
  });
  const plant = await $fetch(`${BASE_URL}/companies/${companyId}/plants/${plantId}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  const meters = await $fetch(`${BASE_URL}/companies/${companyId}/plants/${plantId}/meters`, {
    headers: { Authorization: `Bearer ${access_token}` }
  }).catch(() => []);
  return {
    plant_name: plant == null ? void 0 : plant.name,
    capacity_kwp: plant == null ? void 0 : plant.capacity_kwp,
    status: (plant == null ? void 0 : plant.status) || "unknown",
    meters: (meters == null ? void 0 : meters.length) || 0,
    connected: meters && meters.length > 0
  };
});

export { verifyPlant_get as default };
//# sourceMappingURL=verify-plant.get.mjs.map
