import { d as defineEventHandler, g as getServiceRoleClient, c as createError } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { a as aanspreeknaam } from '../../../_/aanhef.mjs';
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

const CATEGORY_TO_MODULE = {
  solar_panel: "solar",
  heat_pump: "heat_pump",
  ev_charger: "ev_charger",
  battery: "battery"
};
const index_get = defineEventHandler(async (event) => {
  var _a;
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email, street, house_number, postal_code, city, billing_interval, yearly_discount_months, trial_months").eq("auth_user_id", user.id).single();
  if (!customer) {
    throw createError({ statusCode: 404, message: "Geen klantaccount gevonden" });
  }
  const onboarding = ((_a = user.user_metadata) == null ? void 0 : _a.onboarding) || {
    step: "hero",
    accepted_at: null,
    mandate_at: null,
    mandate_skipped: false,
    accepted_modules: null
  };
  const [{ data: partner }, { data: products }, { data: pricing }, { data: overrides }] = await Promise.all([
    supabase.from("partners").select("id, name, slug, logo_url, primary_color, secondary_color, support_email, support_phone, terms_url, terms_placeholders").eq("id", customer.partner_id).single(),
    supabase.from("customer_products").select("id, category, brand, model, notes").eq("customer_id", customer.id),
    // Partner's pricing per module: join module_definitions for the type code
    supabase.from("partner_module_configs").select("id, price_monthly, price_yearly, is_enabled, min_contract_months, module_definition:module_definitions(type, name, description)").eq("partner_id", customer.partner_id),
    // Klant-specifieke prijsoverrides — admin kan ze gezet hebben bij uitnodigen
    supabase.from("customer_module_prices").select("module_type, price_monthly_cents, reason").eq("customer_id", customer.id)
  ]);
  const overrideByModule = /* @__PURE__ */ new Map();
  for (const o of overrides || []) {
    overrideByModule.set(o.module_type, o.price_monthly_cents || 0);
  }
  const priceByModule = /* @__PURE__ */ new Map();
  for (const p of pricing || []) {
    const def = p.module_definition;
    const moduleType = def == null ? void 0 : def.type;
    if (!moduleType) continue;
    const override = overrideByModule.get(moduleType);
    const monthly = override != null ? override : p.price_monthly || 0;
    const discountMonths = Math.max(0, Number(customer.yearly_discount_months) || 0);
    const yearly = monthly * Math.max(0, 12 - discountMonths);
    priceByModule.set(moduleType, {
      monthly,
      yearly,
      minMonths: p.min_contract_months || 0,
      description: def == null ? void 0 : def.description,
      enabled: p.is_enabled !== false,
      isCustom: override !== void 0
    });
  }
  const moduleProducts = (products || []).map((p) => {
    const moduleType = CATEGORY_TO_MODULE[p.category];
    if (!moduleType) return null;
    const price = priceByModule.get(moduleType);
    return {
      id: p.id,
      category: p.category,
      module: moduleType,
      brand: p.brand,
      model: p.model,
      notes: p.notes,
      price: price ? {
        monthly_cents: price.monthly,
        yearly_cents: price.yearly,
        min_months: price.minMonths,
        enabled: price.enabled,
        is_custom: price.isCustom
      } : null
    };
  }).filter(Boolean);
  const seen = /* @__PURE__ */ new Set();
  const proposalModules = moduleProducts.filter((p) => {
    if (seen.has(p.module)) return false;
    seen.add(p.module);
    return true;
  });
  const totalMonthly = proposalModules.reduce((s, p) => {
    var _a2;
    return s + (((_a2 = p.price) == null ? void 0 : _a2.monthly_cents) || 0);
  }, 0);
  const totalYearly = proposalModules.reduce((s, p) => {
    var _a2;
    return s + (((_a2 = p.price) == null ? void 0 : _a2.yearly_cents) || 0);
  }, 0);
  const addressShort = customer.street && customer.house_number ? `${customer.street} ${customer.house_number}` : null;
  const { isDirectDebitEnabled } = await import('../../../_/mollie.mjs');
  const incassoAvailable = await isDirectDebitEnabled();
  return {
    incasso_available: incassoAvailable,
    step: onboarding.step || "hero",
    accepted_at: onboarding.accepted_at,
    accepted_modules: Array.isArray(onboarding.accepted_modules) ? onboarding.accepted_modules : null,
    mandate_at: onboarding.mandate_at,
    mandate_skipped: !!onboarding.mandate_skipped,
    customer: {
      full_name: customer.full_name,
      // Voornaam, "familie De Graaf", of leeg als er geen bruikbare naam is.
      first_name: aanspreeknaam(customer.full_name) || "",
      email: customer.email,
      address_short: addressShort,
      street: customer.street,
      house_number: customer.house_number,
      postal_code: customer.postal_code,
      city: customer.city
    },
    partner: partner ? {
      name: partner.name,
      slug: partner.slug,
      logo_url: partner.logo_url,
      primary_color: partner.primary_color,
      secondary_color: partner.secondary_color,
      support_email: partner.support_email,
      support_phone: partner.support_phone,
      terms_url: partner.terms_url || `/voorwaarden/${partner.slug}`
    } : null,
    proposal: {
      modules: proposalModules,
      total_monthly_cents: totalMonthly,
      total_yearly_cents: totalYearly,
      // Pricing-flexibility velden — UI gebruikt 'm voor termijn-keuze + trial
      billing_interval: customer.billing_interval === "yearly" ? "yearly" : "monthly",
      yearly_discount_months: Math.max(0, Number(customer.yearly_discount_months) || 0),
      trial_months: Math.max(0, Number(customer.trial_months) || 0)
    }
  };
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
