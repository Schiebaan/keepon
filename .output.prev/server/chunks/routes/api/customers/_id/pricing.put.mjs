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

const pricing_put = defineEventHandler(async (event) => {
  var _a, _b;
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "customer id ontbreekt" });
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
  const { data: customer } = await supabase.from("customers").select("id, partner_id").eq("id", customerId).eq("partner_id", partnerId).single();
  if (!customer) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  const updates = {};
  if ((body == null ? void 0 : body.billing_interval) === "monthly" || (body == null ? void 0 : body.billing_interval) === "yearly") {
    updates.billing_interval = body.billing_interval;
  }
  if ((body == null ? void 0 : body.yearly_discount_months) !== void 0) {
    const v = Math.max(0, Math.min(12, Number(body.yearly_discount_months) || 0));
    updates.yearly_discount_months = v;
  }
  if ((body == null ? void 0 : body.trial_months) !== void 0) {
    const v = Math.max(0, Math.min(60, Math.floor(Number(body.trial_months) || 0)));
    updates.trial_months = v;
  }
  if (Object.keys(updates).length) {
    const { error } = await supabase.from("customers").update(updates).eq("id", customerId);
    if (error) throw createError({ statusCode: 500, message: "Tarief opslaan mislukt: " + error.message });
  }
  let overrideStats = null;
  if (Array.isArray(body == null ? void 0 : body.module_price_overrides)) {
    const rows = body.module_price_overrides.map((o) => {
      const t = String((o == null ? void 0 : o.module_type) || "").trim();
      const price = Math.max(0, Math.floor(Number(o == null ? void 0 : o.price_monthly_cents) || 0));
      if (!t || !price) return null;
      return {
        customer_id: customerId,
        module_type: t,
        price_monthly_cents: price,
        reason: typeof (o == null ? void 0 : o.reason) === "string" ? o.reason.trim().slice(0, 200) || null : null
      };
    }).filter(Boolean);
    const { error: delErr } = await supabase.from("customer_module_prices").delete().eq("customer_id", customerId);
    if (delErr) throw createError({ statusCode: 500, message: "Oude overrides wissen mislukt: " + delErr.message });
    if (rows.length) {
      const { error: insErr } = await supabase.from("customer_module_prices").insert(rows);
      if (insErr) throw createError({ statusCode: 500, message: "Overrides opslaan mislukt: " + insErr.message });
    }
    overrideStats = {
      kept: rows.length,
      removed: 0
      /* niet exact, maar volstaat voor audit */
    };
  }
  await auditLog(event, "customer.pricing_updated", "customer", customerId, {
    updates,
    override_count: (_a = overrideStats == null ? void 0 : overrideStats.kept) != null ? _a : null
  });
  return { ok: true, updates, override_count: (_b = overrideStats == null ? void 0 : overrideStats.kept) != null ? _b : null };
});

export { pricing_put as default };
//# sourceMappingURL=pricing.put.mjs.map
