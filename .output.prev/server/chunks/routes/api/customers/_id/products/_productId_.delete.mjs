import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../../_/audit.mjs';
import { r as resolvePartnerId } from '../../../../../_/partner-scope.mjs';
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

const _productId__delete = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const productId = getRouterParam(event, "productId");
  if (!productId) throw createError({ statusCode: 400, message: "Product-id ontbreekt" });
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  const { data: product } = await supabase.from("customer_products").select("id, customer_id, name, category").eq("id", productId).eq("partner_id", partnerId).maybeSingle();
  if (!product) throw createError({ statusCode: 404, message: "Product niet gevonden" });
  const { error } = await supabase.from("customer_products").delete().eq("id", productId).eq("partner_id", partnerId);
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "product.deleted", "customer_product", productId, {
    partner_id: partnerId,
    customer_id: product.customer_id,
    name: product.name,
    category: product.category
  });
  return { success: true };
});

export { _productId__delete as default };
//# sourceMappingURL=_productId_.delete.mjs.map
