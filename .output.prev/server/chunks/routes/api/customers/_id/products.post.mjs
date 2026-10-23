import { d as defineEventHandler, h as getRouterParam, c as createError, r as readBody, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
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

const products_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "Klant-id ontbreekt" });
  const body = await readBody(event);
  const { name, brand, model, category, serial_number, installation_date, notes, partner_id } = body;
  if (!name || !category) {
    throw createError({ statusCode: 400, message: "name and category are required" });
  }
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  await assertCustomerInPartner(supabase, customerId, partnerId);
  const { data, error } = await supabase.from("customer_products").insert({
    customer_id: customerId,
    partner_id: partnerId,
    name,
    brand: brand || null,
    model: model || null,
    category,
    serial_number: serial_number || null,
    installation_date: installation_date || null,
    notes: notes || null
  }).select().single();
  if (error) {
    throw createError({ statusCode: 500, message: error.message });
  }
  return data;
});

export { products_post as default };
//# sourceMappingURL=products.post.mjs.map
