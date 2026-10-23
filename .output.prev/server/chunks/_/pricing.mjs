const MODULE_LABELS = {
  solar_panel: "Zonnepanelen",
  heat_pump: "Warmtepomp",
  ev_charger: "Laadpaal",
  battery: "Thuisbatterij"
};
function addMonths(d, n) {
  const r = new Date(d.getTime());
  r.setMonth(r.getMonth() + n);
  return r;
}
function lastDayOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
async function computeCustomerCharge(supabase, customerId, opts) {
  var _a, _b, _c, _d, _e, _f, _g;
  const now = (_a = void 0 ) != null ? _a : /* @__PURE__ */ new Date();
  const { data: customer } = await supabase.from("customers").select("id, partner_id, accepted_modules, billing_interval, yearly_discount_months, trial_months, mandate_at").eq("id", customerId).single();
  if (!customer) {
    return emptyResult({
      reason: "no_modules",
      now,
      periodStart: void 0 ,
      billing_interval: "monthly",
      yearly_discount_months: 0,
      trial: null
    });
  }
  const billing_interval = customer.billing_interval === "yearly" ? "yearly" : "monthly";
  const yearly_discount_months = Math.max(0, Number(customer.yearly_discount_months) || 0);
  const trial_months = Math.max(0, Number(customer.trial_months) || 0);
  let trial = null;
  if (trial_months > 0) {
    if (customer.mandate_at) {
      const startedAt = new Date(customer.mandate_at);
      const endsAt = addMonths(startedAt, trial_months);
      trial = {
        months: trial_months,
        started_at: customer.mandate_at,
        ends_at: endsAt.toISOString(),
        active: now < endsAt
      };
    } else {
      trial = {
        months: trial_months,
        started_at: null,
        ends_at: null,
        active: false
      };
    }
  }
  const accepted = Array.isArray(customer.accepted_modules) ? customer.accepted_modules : [];
  if (!accepted.length) {
    return emptyResult({
      reason: "no_modules",
      now,
      periodStart: void 0 ,
      billing_interval,
      yearly_discount_months,
      trial
    });
  }
  const { data: configs } = await supabase.from("partner_module_configs").select("price_monthly, is_enabled, module_definition:module_definitions(type, name)").eq("partner_id", customer.partner_id);
  const defaultByType = /* @__PURE__ */ new Map();
  for (const cfg of configs || []) {
    const t = (_b = cfg == null ? void 0 : cfg.module_definition) == null ? void 0 : _b.type;
    if (!t) continue;
    if (cfg.is_enabled === false) continue;
    defaultByType.set(t, {
      price: cfg.price_monthly || 0,
      name: cfg.module_definition.name || MODULE_LABELS[t] || t
    });
  }
  const { data: overrides } = await supabase.from("customer_module_prices").select("module_type, price_monthly_cents, reason").eq("customer_id", customer.id);
  const overrideByType = /* @__PURE__ */ new Map();
  for (const o of overrides || []) {
    overrideByType.set(o.module_type, {
      price: o.price_monthly_cents || 0,
      reason: o.reason || null
    });
  }
  const lines = [];
  let monthlyTotal = 0;
  for (const t of accepted) {
    const ov = overrideByType.get(t);
    const def = defaultByType.get(t);
    const price = (_d = (_c = ov == null ? void 0 : ov.price) != null ? _c : def == null ? void 0 : def.price) != null ? _d : 0;
    const name = (def == null ? void 0 : def.name) || MODULE_LABELS[t] || t;
    lines.push({
      module_type: t,
      name,
      price_monthly_cents: price,
      default_price_monthly_cents: ov ? (_e = def == null ? void 0 : def.price) != null ? _e : null : null,
      override_reason: (_f = ov == null ? void 0 : ov.reason) != null ? _f : null
    });
    monthlyTotal += price;
  }
  const yearlyTotal = monthlyTotal * Math.max(0, 12 - yearly_discount_months);
  const periodStart = (_g = void 0 ) != null ? _g : new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = billing_interval === "yearly" ? new Date(periodStart.getFullYear() + 1, periodStart.getMonth(), periodStart.getDate() - 1) : lastDayOfMonth(periodStart);
  const amount_cents = billing_interval === "yearly" ? yearlyTotal : monthlyTotal;
  let skip_reason = null;
  if (!lines.length) skip_reason = "no_modules";
  else if (amount_cents <= 0) skip_reason = "no_price";
  else if (trial == null ? void 0 : trial.active) skip_reason = "trial";
  const moduleNames = lines.map((l) => l.name).join(" + ");
  const description = billing_interval === "yearly" ? `Servicekosten ${moduleNames} (jaarbedrag)` : `Servicekosten ${moduleNames}`;
  return {
    amount_cents: skip_reason ? 0 : amount_cents,
    monthly_total_cents: monthlyTotal,
    yearly_total_cents: yearlyTotal,
    yearly_discount_months,
    billing_interval,
    period_start: isoDate(periodStart),
    period_end: isoDate(periodEnd),
    lines,
    trial,
    skip_reason,
    description
  };
}
function emptyResult(args) {
  var _a;
  const ps = (_a = args.periodStart) != null ? _a : new Date(args.now.getFullYear(), args.now.getMonth(), 1);
  const pe = args.billing_interval === "yearly" ? new Date(ps.getFullYear() + 1, ps.getMonth(), ps.getDate() - 1) : lastDayOfMonth(ps);
  return {
    amount_cents: 0,
    monthly_total_cents: 0,
    yearly_total_cents: 0,
    yearly_discount_months: args.yearly_discount_months,
    billing_interval: args.billing_interval,
    period_start: isoDate(ps),
    period_end: isoDate(pe),
    lines: [],
    trial: args.trial,
    skip_reason: args.reason,
    description: "Servicekosten"
  };
}

export { computeCustomerCharge as c };
//# sourceMappingURL=pricing.mjs.map
