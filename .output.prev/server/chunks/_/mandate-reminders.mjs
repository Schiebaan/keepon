import { buildMandateMail, sendEmail } from './email.mjs';

const MODULE_LABELS = {
  solar_panel: "Zonnepanelen",
  solar: "Zonnepanelen",
  heat_pump: "Warmtepomp",
  ev_charger: "Laadpaal",
  battery: "Thuisbatterij"
};
async function sendMandateReminder(supabase, customerId, kind) {
  var _a, _b;
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email, accepted_modules, accepted_at, mollie_mandate_id, mandate_at, mandate_skipped, mandate_reminders_sent").eq("id", customerId).single();
  if (!customer) return { sent: false, reason: "send_failed", error: "customer not found" };
  if (!customer.email) return { sent: false, reason: "no_email" };
  if (customer.mollie_mandate_id) return { sent: false, reason: "mandate_already_active" };
  const sentArr = Array.isArray(customer.mandate_reminders_sent) ? customer.mandate_reminders_sent : [];
  if (sentArr.some((e) => (e == null ? void 0 : e.kind) === kind)) {
    return { sent: false, reason: "already_sent" };
  }
  const { data: partner } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("id", customer.partner_id).single();
  const accepted = Array.isArray(customer.accepted_modules) ? customer.accepted_modules : [];
  const labels = [];
  let totalCents = 0;
  if (accepted.length) {
    const { data: configs } = await supabase.from("partner_module_configs").select("price_monthly, is_enabled, module_definition:module_definitions(type, name)").eq("partner_id", customer.partner_id);
    for (const cfg of configs || []) {
      const t = (_a = cfg == null ? void 0 : cfg.module_definition) == null ? void 0 : _a.type;
      if (!t || !accepted.includes(t)) continue;
      if (cfg.is_enabled === false) continue;
      const label = ((_b = cfg.module_definition) == null ? void 0 : _b.name) || MODULE_LABELS[t] || t;
      if (!labels.includes(label)) labels.push(label);
      totalCents += cfg.price_monthly || 0;
    }
    if (!labels.length) {
      for (const t of accepted) {
        const fallback = MODULE_LABELS[t];
        if (fallback && !labels.includes(fallback)) labels.push(fallback);
      }
    }
  }
  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
  const incassoUrl = `https://${(partner == null ? void 0 : partner.slug) ? partner.slug + "." : ""}${baseDomain}/welkom/incasso`;
  const { subject, html } = buildMandateMail({
    kind,
    customerName: customer.full_name || customer.email,
    acceptedModuleLabels: labels,
    totalMonthlyEuros: totalCents ? (totalCents / 100).toFixed(2).replace(".", ",") : null,
    incassoUrl,
    partner: partner ? {
      name: partner.name,
      primary_color: partner.primary_color,
      logo_url: partner.logo_url,
      support_email: partner.support_email
    } : void 0
  });
  try {
    await sendEmail({
      to: customer.email,
      subject,
      html
    });
  } catch (e) {
    return { sent: false, reason: "send_failed", error: (e == null ? void 0 : e.message) || String(e) };
  }
  const updated = [...sentArr, { kind, at: (/* @__PURE__ */ new Date()).toISOString() }];
  await supabase.from("customers").update({ mandate_reminders_sent: updated }).eq("id", customer.id);
  return { sent: true };
}

export { sendMandateReminder as s };
//# sourceMappingURL=mandate-reminders.mjs.map
