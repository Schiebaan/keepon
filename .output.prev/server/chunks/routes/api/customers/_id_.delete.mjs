import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
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
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "customer id ontbreekt" });
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
  const { data: customer } = await supabase.from("customers").select("id, auth_user_id, email, full_name").eq("id", customerId).eq("partner_id", partnerId).single();
  if (!customer) {
    throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  }
  const { count: paymentCount } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("customer_id", customerId);
  if (paymentCount && paymentCount > 0) {
    throw createError({
      statusCode: 409,
      message: `Deze klant heeft ${paymentCount} betaling${paymentCount === 1 ? "" : "en"} in de administratie en kan daarom niet verwijderd worden. Financi\xEBle historie moet bewaard blijven.`
    });
  }
  await supabase.from("customer_products").delete().eq("customer_id", customerId);
  await supabase.from("customer_documents").delete().eq("customer_id", customerId);
  await supabase.from("smart_meters").delete().eq("customer_id", customerId);
  await supabase.from("customer_module_prices").delete().eq("customer_id", customerId);
  await supabase.from("user_roles").delete().eq("customer_id", customerId);
  const { error } = await supabase.from("customers").delete().eq("id", customerId);
  if (error) {
    if (error.code === "23503") {
      throw createError({
        statusCode: 409,
        message: "Deze klant kan niet verwijderd worden omdat er nog gekoppelde gegevens zijn. Neem contact op met support."
      });
    }
    throw createError({ statusCode: 500, message: error.message });
  }
  if (customer.auth_user_id) {
    await supabase.auth.admin.deleteUser(customer.auth_user_id).catch(() => {
    });
  }
  await auditLog(event, "customer.deleted", "customer", customerId, {
    email: customer.email,
    full_name: customer.full_name,
    partner_id: partnerId
  });
  return { success: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
