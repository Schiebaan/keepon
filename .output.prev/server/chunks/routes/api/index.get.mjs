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

const index_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
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
  if (!partnerId) return { rows: [], total: 0, limit: 0, offset: 0, has_more: false };
  const q = getQuery(event);
  const limit = Math.min(Math.max(Number(q.limit) || 100, 1), 500);
  const offset = Math.max(Number(q.offset) || 0, 0);
  const status = q.status || "";
  const customerId = q.customer_id || "";
  const searchRaw = q.q || "";
  const search = searchRaw.replace(/[,()%\\]/g, "").slice(0, 80).trim();
  let query = supabase.from("payments").select(
    "id, partner_id, customer_id, mollie_payment_id, mollie_mandate_id, mollie_method, amount_cents, currency, description, status, created_at, paid_at, failed_at, refunded_at, charged_back_at, period_start, period_end, customer:customers(id, full_name, email)",
    { count: "exact" }
  ).eq("partner_id", partnerId).order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (customerId) query = query.eq("customer_id", customerId);
  if (search) {
    query = query.or(`mollie_payment_id.ilike.%${search}%,description.ilike.%${search}%`);
  }
  const { data, error, count } = await query.range(offset, offset + limit - 1);
  if (error) throw createError({ statusCode: 500, message: error.message });
  const { data: aggRows } = await supabase.from("payments").select("status, amount_cents").eq("partner_id", partnerId);
  const totals = { paid_cents: 0, open_cents: 0, failed_cents: 0, count: (aggRows == null ? void 0 : aggRows.length) || 0 };
  for (const r of aggRows || []) {
    if (r.status === "paid") totals.paid_cents += r.amount_cents || 0;
    else if (r.status === "failed" || r.status === "expired" || r.status === "canceled") totals.failed_cents += r.amount_cents || 0;
    else totals.open_cents += r.amount_cents || 0;
  }
  return {
    rows: data || [],
    total: count || 0,
    limit,
    offset,
    has_more: (count || 0) > offset + ((data == null ? void 0 : data.length) || 0),
    totals
  };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
