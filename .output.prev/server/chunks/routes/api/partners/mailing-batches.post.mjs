import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError, s as setHeader } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { createWelcomeToken } from '../../../_/welcome-token.mjs';
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
const mailingBatches_post = defineEventHandler(async (event) => {
  var _a, _b;
  try {
    return await handle(event);
  } catch (e) {
    console.error("[mailing-batches.post] error:", {
      statusCode: e == null ? void 0 : e.statusCode,
      message: (e == null ? void 0 : e.message) || ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message),
      cause: (_b = e == null ? void 0 : e.cause) == null ? void 0 : _b.message,
      stack: e == null ? void 0 : e.stack
    });
    throw e;
  }
});
async function handle(event) {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event).catch(() => ({}));
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
  const name = String((body == null ? void 0 : body.name) || "").trim();
  if (!name) throw createError({ statusCode: 400, message: "Geef de batch een naam" });
  const submittedIds = Array.isArray(body == null ? void 0 : body.customer_ids) ? body.customer_ids.filter((x) => typeof x === "string") : [];
  if (!submittedIds.length) throw createError({ statusCode: 400, message: "Selecteer ten minste \xE9\xE9n klant" });
  const { data: customers } = await supabase.from("customers").select("id, email, full_name, city").eq("partner_id", partnerId).in("id", submittedIds);
  const safeCustomers = customers || [];
  if (!safeCustomers.length) throw createError({ statusCode: 400, message: "Geen geldige klanten in selectie" });
  const customerIds = safeCustomers.map((c) => c.id);
  const { data: batch, error: batchErr } = await supabase.from("mailing_batches").insert({
    partner_id: partnerId,
    name,
    description: (body == null ? void 0 : body.description) || null,
    customer_count: customerIds.length,
    segment_filter: (body == null ? void 0 : body.segment_filter) || null,
    mailchimp_tag: (body == null ? void 0 : body.mailchimp_tag) || null,
    created_by: user.id
  }).select().single();
  if (batchErr || !batch) throw createError({ statusCode: 500, message: (batchErr == null ? void 0 : batchErr.message) || "Batch aanmaken mislukt" });
  const joinRows = customerIds.map((cid) => ({ batch_id: batch.id, customer_id: cid }));
  const { error: joinErr } = await supabase.from("mailing_batch_customers").insert(joinRows);
  if (joinErr) {
    await supabase.from("mailing_batches").delete().eq("id", batch.id);
    throw createError({ statusCode: 500, message: "Batch-koppeling mislukt: " + joinErr.message });
  }
  const [{ data: products }, { data: partner }] = await Promise.all([
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
  for (const c of safeCustomers) {
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
      csvCell(name),
      csvCell((body == null ? void 0 : body.mailchimp_tag) || "")
    ].join(","));
  }
  const csv = "\uFEFF" + rows.join("\n") + "\n";
  await auditLog(event, "mailing.batch_created", "partner", partnerId, {
    batch_id: batch.id,
    name,
    customer_count: customerIds.length,
    mailchimp_tag: (body == null ? void 0 : body.mailchimp_tag) || null
  });
  const safeFileName = name.replace(/[^A-Za-z0-9-_]+/g, "-").slice(0, 60) || "batch";
  const dateStr = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  setHeader(event, "Content-Type", "text/csv; charset=utf-8");
  setHeader(event, "Content-Disposition", `attachment; filename="${safeFileName}-${dateStr}.csv"`);
  setHeader(event, "Cache-Control", "no-store");
  setHeader(event, "X-Batch-Id", batch.id);
  return csv;
}

export { mailingBatches_post as default };
//# sourceMappingURL=mailing-batches.post.mjs.map
