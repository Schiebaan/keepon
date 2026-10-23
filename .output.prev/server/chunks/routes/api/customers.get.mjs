import { d as defineEventHandler, g as getServiceRoleClient, e as getQuery, c as createError } from '../../nitro/nitro.mjs';
import { r as requireRole } from '../../_/auth-guard.mjs';
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

const customers_get = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const tenant = event.context.tenant;
    if (tenant == null ? void 0 : tenant.id) partnerId = tenant.id;
    else {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) return { rows: [], total: 0, limit: 0, offset: 0, has_more: false };
  const q = getQuery(event);
  const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
  const offset = Math.max(Number(q.offset) || 0, 0);
  const accepted = q.accepted || "any";
  const moduleFilter = q.module || "";
  const searchRaw = q.q || "";
  const search = searchRaw.replace(/[,()%\\]/g, "").slice(0, 80).trim();
  let baseQuery = supabase.from("customers").select("*", { count: "exact" }).eq("partner_id", partnerId).order("created_at", { ascending: false });
  if (accepted === "true") baseQuery = baseQuery.not("accepted_at", "is", null);
  else if (accepted === "false") baseQuery = baseQuery.is("accepted_at", null);
  if (search) {
    baseQuery = baseQuery.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,city.ilike.%${search}%`
    );
  }
  if (moduleFilter) {
    const { data: matchingProducts } = await supabase.from("customer_products").select("customer_id").eq("category", moduleFilter);
    const ids = Array.from(new Set((matchingProducts || []).map((p) => p.customer_id)));
    if (!ids.length) {
      return { rows: [], total: 0, limit, offset, has_more: false };
    }
    baseQuery = baseQuery.in("id", ids);
  }
  baseQuery = baseQuery.range(offset, offset + limit - 1);
  const { data, error, count } = await baseQuery;
  if (error) throw createError({ statusCode: 500, message: error.message });
  const customers = data || [];
  const total = count != null ? count : customers.length;
  if (!customers.length) {
    return { rows: [], total, limit, offset, has_more: false };
  }
  const customerIds = customers.map((c) => c.id);
  const { data: products } = await supabase.from("customer_products").select("customer_id, category, integration_type, serial_number").in("customer_id", customerIds);
  const productsByCustomer = /* @__PURE__ */ new Map();
  const linkageByCustomer = /* @__PURE__ */ new Map();
  function isLinked(p) {
    if (p.integration_type) return true;
    const s = p.serial_number;
    if (typeof s !== "string") return false;
    if (p.category === "solar_panel") return s.startsWith("sundata:");
    if (p.category === "ev_charger") return s.startsWith("easee:");
    if (p.category === "heat_pump") return s.startsWith("weheat:");
    return false;
  }
  for (const p of products || []) {
    if (!p.category) continue;
    const arr = productsByCustomer.get(p.customer_id) || [];
    if (!arr.includes(p.category)) arr.push(p.category);
    productsByCustomer.set(p.customer_id, arr);
    const m = linkageByCustomer.get(p.customer_id) || {};
    const e = m[p.category] || { has: 0, linked: 0 };
    e.has += 1;
    if (isLinked(p)) e.linked += 1;
    m[p.category] = e;
    linkageByCustomer.set(p.customer_id, m);
  }
  const { data: batchHits } = await supabase.from("mailing_batch_customers").select("customer_id, mailing_batches!inner(id, name, partner_id, created_at)").in("customer_id", customerIds).eq("mailing_batches.partner_id", partnerId).order("created_at", { foreignTable: "mailing_batches", ascending: false });
  const latestBatchByCustomer = /* @__PURE__ */ new Map();
  for (const r of batchHits || []) {
    if (latestBatchByCustomer.has(r.customer_id)) continue;
    const b = r.mailing_batches;
    if (b) latestBatchByCustomer.set(r.customer_id, { id: b.id, name: b.name, created_at: b.created_at });
  }
  const rows = customers.map((c) => {
    const onboarding = c.onboarding_step || c.accepted_at || c.mandate_at || c.mandate_skipped ? {
      step: c.onboarding_step || "hero",
      accepted_at: c.accepted_at || null,
      accepted_modules: c.accepted_modules || null,
      mandate_at: c.mandate_at || null,
      mandate_skipped: !!c.mandate_skipped
    } : null;
    return {
      ...c,
      product_categories: productsByCustomer.get(c.id) || [],
      module_linkage: linkageByCustomer.get(c.id) || {},
      onboarding,
      latest_batch: latestBatchByCustomer.get(c.id) || null
    };
  });
  return {
    rows,
    total,
    limit,
    offset,
    has_more: offset + rows.length < total
  };
});

export { customers_get as default };
//# sourceMappingURL=customers.get.mjs.map
