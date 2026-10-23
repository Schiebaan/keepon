import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient, r as readBody } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
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

const linkWeheat_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "customer id ontbreekt" });
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const heatpumpId = ((body == null ? void 0 : body.heatpump_id) || "").toString().trim();
  if (!heatpumpId) throw createError({ statusCode: 400, message: "heatpump_id ontbreekt" });
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
  const { data: customer } = await supabase.from("customers").select("id").eq("id", customerId).eq("partner_id", partnerId).single();
  if (!customer) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  const { data: existing } = await supabase.from("customer_products").select("id").eq("customer_id", customer.id).eq("category", "heat_pump").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updates = {
    integration_type: "weheat",
    external_id: heatpumpId,
    linked_at: now,
    // Keep the legacy serial_number-hack in sync so older code paths that
    // still parse it (e.g. ProductList.vue) keep showing the green badge.
    serial_number: `weheat:${heatpumpId}`,
    notes: `Gekoppeld via Weheat`
  };
  if (body == null ? void 0 : body.name) updates.name = body.name;
  if (body == null ? void 0 : body.brand) updates.brand = body.brand;
  if (body == null ? void 0 : body.model) updates.model = body.model;
  let productId;
  if (existing) {
    const { data, error } = await supabase.from("customer_products").update(updates).eq("id", existing.id).select("id").single();
    if (error || !data) throw createError({ statusCode: 500, message: (error == null ? void 0 : error.message) || "Update mislukt" });
    productId = data.id;
  } else {
    const { data, error } = await supabase.from("customer_products").insert({
      customer_id: customer.id,
      partner_id: partnerId,
      category: "heat_pump",
      name: (body == null ? void 0 : body.name) || "Warmtepomp",
      brand: (body == null ? void 0 : body.brand) || null,
      model: (body == null ? void 0 : body.model) || null,
      integration_type: "weheat",
      external_id: heatpumpId,
      linked_at: now,
      serial_number: `weheat:${heatpumpId}`,
      notes: "Gekoppeld via Weheat"
    }).select("id").single();
    if (error || !data) throw createError({ statusCode: 500, message: (error == null ? void 0 : error.message) || "Aanmaken mislukt" });
    productId = data.id;
  }
  await auditLog(event, "weheat.heatpump_linked", "customer_product", productId, {
    customer_id: customer.id,
    heatpump_id: heatpumpId,
    name: body == null ? void 0 : body.name,
    model: body == null ? void 0 : body.model
  });
  return { ok: true, product_id: productId, heatpump_id: heatpumpId };
});

export { linkWeheat_post as default };
//# sourceMappingURL=link-weheat.post.mjs.map
