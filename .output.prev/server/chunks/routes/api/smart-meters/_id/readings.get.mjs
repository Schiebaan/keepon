import { d as defineEventHandler, h as getRouterParam, c as createError, e as getQuery, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../_/auth-guard.mjs';
import { b as assertSmartMeterAccess } from '../../../../_/partner-scope.mjs';
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

const readings_get = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const meterId = getRouterParam(event, "id");
  if (!meterId) throw createError({ statusCode: 400, message: "Meter-id ontbreekt" });
  const query = getQuery(event);
  const from = query.from;
  const to = query.to;
  const supabase = getServiceRoleClient();
  await assertSmartMeterAccess(event, supabase, meterId, user.id);
  let q = supabase.from("smart_meter_readings").select("timestamp, consumption_wh, production_wh, gas_m3").eq("meter_id", meterId).order("timestamp", { ascending: true });
  if (from) q = q.gte("timestamp", from);
  if (to) q = q.lte("timestamp", to);
  const { data, error } = await q.limit(2e3);
  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});

export { readings_get as default };
//# sourceMappingURL=readings.get.mjs.map
