import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { c as computeCustomerCharge } from '../../../../_/pricing.mjs';
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

const pricing_get = defineEventHandler(async (event) => {
  var _a;
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
  const { data: customer } = await supabase.from("customers").select("id, partner_id, accepted_modules, billing_interval, yearly_discount_months, trial_months, mandate_at").eq("id", customerId).eq("partner_id", partnerId).single();
  if (!customer) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  const compute = await computeCustomerCharge(supabase, customer.id);
  const { data: configs } = await supabase.from("partner_module_configs").select("price_monthly, is_enabled, module_definition:module_definitions(type, name)").eq("partner_id", partnerId);
  const partnerDefaults = [];
  for (const cfg of configs || []) {
    const t = (_a = cfg == null ? void 0 : cfg.module_definition) == null ? void 0 : _a.type;
    if (!t) continue;
    if (cfg.is_enabled === false) continue;
    partnerDefaults.push({
      module_type: t,
      name: cfg.module_definition.name || t,
      price_monthly_cents: cfg.price_monthly || 0
    });
  }
  return {
    billing_interval: compute.billing_interval,
    yearly_discount_months: compute.yearly_discount_months,
    trial_months: customer.trial_months || 0,
    mandate_at: customer.mandate_at,
    trial: compute.trial,
    lines: compute.lines,
    monthly_total_cents: compute.monthly_total_cents,
    yearly_total_cents: compute.yearly_total_cents,
    accepted_modules: Array.isArray(customer.accepted_modules) ? customer.accepted_modules : [],
    partner_defaults: partnerDefaults
  };
});

export { pricing_get as default };
//# sourceMappingURL=pricing.get.mjs.map
