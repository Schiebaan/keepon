import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient, s as setHeader } from '../../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../../_/audit.mjs';
import { createWelcomeToken } from '../../../../../_/welcome-token.mjs';
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
import 'crypto';

const MODULE_LABELS = {
  solar_panel: "Zonnepanelen",
  heat_pump: "Warmtepomp",
  ev_charger: "Laadpaal",
  battery: "Thuisbatterij"
};
function csvCell(value) {
  const s = value === null || value === void 0 ? "" : String(value);
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function splitName(full) {
  const trimmed = (full || "").trim();
  if (!trimmed) return { first: "", last: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}
const download_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const batchId = getRouterParam(event, "id");
  if (!batchId) throw createError({ statusCode: 400, message: "batch id ontbreekt" });
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
  const { data: batch } = await supabase.from("mailing_batches").select("id, partner_id, name, mailchimp_tag").eq("id", batchId).eq("partner_id", partnerId).single();
  if (!batch) throw createError({ statusCode: 404, message: "Batch niet gevonden" });
  const { data: joinRows } = await supabase.from("mailing_batch_customers").select("customer_id").eq("batch_id", batch.id);
  const customerIds = (joinRows || []).map((r) => r.customer_id);
  if (!customerIds.length) throw createError({ statusCode: 404, message: "Batch is leeg" });
  const [{ data: customers }, { data: products }, { data: partner }] = await Promise.all([
    supabase.from("customers").select("id, email, full_name, city").in("id", customerIds),
    supabase.from("customer_products").select("customer_id, category").in("customer_id", customerIds),
    supabase.from("partners").select("slug, name").eq("id", partnerId).single()
  ]);
  const productsByCustomer = /* @__PURE__ */ new Map();
  for (const p of products || []) {
    const arr = productsByCustomer.get(p.customer_id) || [];
    const label = MODULE_LABELS[p.category];
    if (label && !arr.includes(label)) arr.push(label);
    productsByCustomer.set(p.customer_id, arr);
  }
  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
  const baseUrl = `https://${(partner == null ? void 0 : partner.slug) ? partner.slug + "." : ""}${baseDomain}`;
  const header = ["email", "first_name", "last_name", "full_name", "login_url", "modules", "city", "batch_name", "mailchimp_tag"];
  const rows = [header.join(",")];
  for (const c of customers || []) {
    const { first, last } = splitName(c.full_name);
    const token = createWelcomeToken(c.id, 30);
    const loginUrl = `${baseUrl}/api/welkom/start?token=${token}`;
    const modules = (productsByCustomer.get(c.id) || []).join(" / ");
    rows.push([
      csvCell(c.email),
      csvCell(first),
      csvCell(last),
      csvCell(c.full_name),
      csvCell(loginUrl),
      csvCell(modules),
      csvCell(c.city),
      csvCell(batch.name),
      csvCell(batch.mailchimp_tag || "")
    ].join(","));
  }
  const csv = "\uFEFF" + rows.join("\n") + "\n";
  await auditLog(event, "mailing.batch_redownloaded", "partner", partnerId, {
    batch_id: batch.id,
    customer_count: customerIds.length
  });
  const safeFileName = batch.name.replace(/[^A-Za-z0-9-_]+/g, "-").slice(0, 60) || "batch";
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(event, "Content-Disposition", `attachment; filename="${safeFileName}-${dateStr}.csv"`);
  setHeader(event, "Cache-Control", "no-store");
  return csv;
});

export { download_get as default };
//# sourceMappingURL=download.get.mjs.map
