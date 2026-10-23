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

const linkEasee_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "customer id ontbreekt" });
  const supabase = getServiceRoleClient();
  const body = await readBody(event).catch(() => ({}));
  const chargerId = String((body == null ? void 0 : body.charger_id) || "").trim();
  if (!chargerId) throw createError({ statusCode: 400, message: "charger_id ontbreekt" });
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
  const { data: clash } = await supabase.from("customer_products").select("id, customer_id, customers(full_name, email)").eq("partner_id", partnerId).eq("category", "ev_charger").eq("serial_number", `easee:${chargerId}`).neq("customer_id", customer.id).limit(1).maybeSingle();
  if (clash) {
    const other = clash.customers;
    throw createError({
      statusCode: 409,
      message: `Deze laadpaal is al gekoppeld aan ${(other == null ? void 0 : other.full_name) || (other == null ? void 0 : other.email) || "een andere klant"}. Ontkoppel die eerst.`
    });
  }
  const { data: existing } = await supabase.from("customer_products").select("id").eq("customer_id", customer.id).eq("category", "ev_charger").order("updated_at", { ascending: false }).limit(1).maybeSingle();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const updates = {
    integration_type: "easee",
    external_id: chargerId,
    linked_at: now,
    serial_number: `easee:${chargerId}`,
    notes: "Gekoppeld via Easee"
  };
  if (body == null ? void 0 : body.name) updates.name = body.name;
  if (body == null ? void 0 : body.brand) updates.brand = body.brand;
  if (body == null ? void 0 : body.model) updates.model = body.model;
  let productId;
  if (existing) {
    const { data, error } = await supabase.from("customer_products").update(updates).eq("id", existing.id).select("id").single();
    if (error || !data) throw createError({ statusCode: 500, message: (error == null ? void 0 : error.message) || "Koppelen mislukt" });
    productId = data.id;
  } else {
    const { data, error } = await supabase.from("customer_products").insert({
      customer_id: customer.id,
      partner_id: partnerId,
      category: "ev_charger",
      name: (body == null ? void 0 : body.name) || "Laadpaal",
      brand: (body == null ? void 0 : body.brand) || "Easee",
      model: (body == null ? void 0 : body.model) || null,
      ...updates
    }).select("id").single();
    if (error || !data) throw createError({ statusCode: 500, message: (error == null ? void 0 : error.message) || "Aanmaken mislukt" });
    productId = data.id;
  }
  await auditLog(event, "product.linked_easee", "customer_product", productId, {
    customer_id: customer.id,
    charger_id: chargerId,
    partner_id: partnerId
  });
  return { success: true, product_id: productId, charger_id: chargerId };
});

export { linkEasee_post as default };
//# sourceMappingURL=link-easee.post.mjs.map
