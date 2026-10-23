import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { b as assertSmartMeterAccess } from '../../../_/partner-scope.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const meterId = getRouterParam(event, "id");
  if (!meterId) throw createError({ statusCode: 400, message: "Meter-id ontbreekt" });
  const supabase = getServiceRoleClient();
  const meter = await assertSmartMeterAccess(event, supabase, meterId, user.id);
  await supabase.from("smart_meter_readings").delete().eq("meter_id", meterId);
  const { error } = await supabase.from("smart_meters").delete().eq("id", meterId);
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "smart_meter.deleted", "smart_meter", meterId, {
    customer_id: meter.customer_id,
    partner_id: meter.partner_id
  });
  return { success: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
