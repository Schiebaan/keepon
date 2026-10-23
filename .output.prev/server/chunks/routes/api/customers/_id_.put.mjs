import { d as defineEventHandler, h as getRouterParam, c as createError, r as readBody, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { r as resolvePartnerId, a as assertCustomerInPartner } from '../../../_/partner-scope.mjs';
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

const _id__put = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "Klant-id ontbreekt" });
  const body = await readBody(event);
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  await assertCustomerInPartner(supabase, customerId, partnerId);
  const allowed = ["full_name", "email", "phone", "street", "house_number", "postal_code", "city"];
  const updates = {};
  for (const key of allowed) {
    if (body[key] !== void 0) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: "Geen velden om bij te werken" });
  }
  const { data, error } = await supabase.from("customers").update(updates).eq("id", customerId).eq("partner_id", partnerId).select().single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "customer.updated", "customer", customerId, {
    fields: Object.keys(updates),
    partner_id: partnerId,
    customer_id: customerId
  });
  return data;
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
