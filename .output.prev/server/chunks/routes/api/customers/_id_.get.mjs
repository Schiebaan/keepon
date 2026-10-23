import { d as defineEventHandler, g as getServiceRoleClient, h as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "customer id ontbreekt" });
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
  const { data: customer, error } = await supabase.from("customers").select("*").eq("id", customerId).eq("partner_id", partnerId).single();
  if (error || !customer) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  const [{ data: products }, { data: batchHits }] = await Promise.all([
    supabase.from("customer_products").select("customer_id, category, integration_type, serial_number").eq("customer_id", customer.id),
    supabase.from("mailing_batch_customers").select("mailing_batches!inner(id, name, partner_id, created_at)").eq("customer_id", customer.id).eq("mailing_batches.partner_id", partnerId).order("created_at", { foreignTable: "mailing_batches", ascending: false }).limit(1)
  ]);
  function isLinked(p) {
    if (p.integration_type) return true;
    const s = p.serial_number;
    if (typeof s !== "string") return false;
    if (p.category === "solar_panel") return s.startsWith("sundata:");
    if (p.category === "ev_charger") return s.startsWith("easee:");
    if (p.category === "heat_pump") return s.startsWith("weheat:");
    return false;
  }
  const productCats = [];
  const linkage = {};
  for (const p of products || []) {
    if (p.category && !productCats.includes(p.category)) productCats.push(p.category);
    const e = linkage[p.category] || { has: 0, linked: 0 };
    e.has += 1;
    if (isLinked(p)) e.linked += 1;
    linkage[p.category] = e;
  }
  const onboarding = customer.onboarding_step || customer.accepted_at || customer.mandate_at || customer.mandate_skipped ? {
    step: customer.onboarding_step || "hero",
    accepted_at: customer.accepted_at || null,
    accepted_modules: customer.accepted_modules || null,
    mandate_at: customer.mandate_at || null,
    mandate_skipped: !!customer.mandate_skipped
  } : null;
  const latestBatchRow = (batchHits || [])[0];
  const latestBatch = (latestBatchRow == null ? void 0 : latestBatchRow.mailing_batches) ? {
    id: latestBatchRow.mailing_batches.id,
    name: latestBatchRow.mailing_batches.name,
    created_at: latestBatchRow.mailing_batches.created_at
  } : null;
  return {
    ...customer,
    product_categories: productCats,
    module_linkage: linkage,
    onboarding,
    latest_batch: latestBatch
  };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
