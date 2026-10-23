import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { r as resolvePartnerId, a as assertCustomerInPartner } from '../../../../_/partner-scope.mjs';
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

const products_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "Klant-id ontbreekt" });
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  await assertCustomerInPartner(supabase, customerId, partnerId);
  const { data, error } = await supabase.from("customer_products").select("*").eq("customer_id", customerId).eq("partner_id", partnerId).order("created_at", { ascending: false });
  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});

export { products_get as default };
//# sourceMappingURL=products.get.mjs.map
