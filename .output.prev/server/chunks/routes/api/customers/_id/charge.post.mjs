import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient, r as readBody, b as getRequestHeader } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { getMollie, formatMollieAmount, redactMollieResponse } from '../../../../_/mollie.mjs';
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
import '@mollie/api-client';

const charge_post = defineEventHandler(async (event) => {
  var _a;
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
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email, mollie_customer_id, mollie_mandate_id").eq("id", customerId).eq("partner_id", partnerId).single();
  if (!customer) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  if (!customer.mollie_customer_id) {
    throw createError({ statusCode: 400, message: "Deze klant heeft nog geen incasso ingesteld." });
  }
  const overrideAmount = Number(body == null ? void 0 : body.amount_cents) || 0;
  const overrideDescription = ((body == null ? void 0 : body.description) || "").toString().trim() || "";
  const compute = await computeCustomerCharge(supabase, customer.id);
  if (!overrideAmount) {
    if (compute.skip_reason === "no_modules") {
      throw createError({ statusCode: 400, message: "Klant heeft geen geaccepteerde modules \u2014 kies een bedrag of accepteer eerst modules." });
    }
    if (compute.skip_reason === "no_price") {
      throw createError({ statusCode: 400, message: "Geen prijs gevonden voor de modules van deze klant." });
    }
    if (compute.skip_reason === "trial") {
      const endsAt = ((_a = compute.trial) == null ? void 0 : _a.ends_at) ? new Date(compute.trial.ends_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }) : "einde proefperiode";
      throw createError({
        statusCode: 400,
        message: `Klant zit nog in z'n proefperiode tot ${endsAt}. Wil je t\xF3ch incasseren? Geef dan amount_cents mee.`
      });
    }
  }
  const amountCents = overrideAmount || compute.amount_cents;
  if (!amountCents) {
    throw createError({ statusCode: 400, message: "Geen bedrag om te incasseren." });
  }
  const description = overrideDescription || compute.description;
  const periodStart = (body == null ? void 0 : body.period_start) || compute.period_start;
  const periodEnd = (body == null ? void 0 : body.period_end) || compute.period_end;
  const host = getRequestHeader(event, "host") || "";
  const proto = (getRequestHeader(event, "x-forwarded-proto") || "https").toString().split(",")[0].trim();
  const webhookUrl = host ? `${proto}://${host}/api/webhooks/mollie` : void 0;
  const mollie = getMollie();
  let payment;
  try {
    payment = await mollie.customerPayments.create({
      customerId: customer.mollie_customer_id,
      amount: { currency: "EUR", value: formatMollieAmount(amountCents) },
      description,
      sequenceType: "recurring",
      webhookUrl,
      metadata: {
        upsol_customer_id: customer.id,
        upsol_partner_id: customer.partner_id,
        period_start: periodStart,
        period_end: periodEnd,
        billing_interval: compute.billing_interval
      }
    });
  } catch (e) {
    throw createError({ statusCode: 502, message: "Mollie-incasso aanmaken mislukt: " + ((e == null ? void 0 : e.message) || "onbekend") });
  }
  const { data: row } = await supabase.from("payments").insert({
    partner_id: partnerId,
    customer_id: customer.id,
    mollie_payment_id: payment.id,
    mollie_mandate_id: customer.mollie_mandate_id,
    mollie_method: "directdebit",
    amount_cents: amountCents,
    currency: "EUR",
    description,
    status: payment.status || "open",
    period_start: periodStart,
    period_end: periodEnd,
    raw: redactMollieResponse(payment)
  }).select("id, mollie_payment_id, amount_cents, status, period_start, period_end").single();
  await auditLog(event, "payment.created", "payment", (row == null ? void 0 : row.id) || null, {
    customer_id: customer.id,
    amount_cents: amountCents,
    mollie_payment_id: payment.id,
    period_start: periodStart,
    period_end: periodEnd,
    billing_interval: compute.billing_interval,
    via: overrideAmount ? "manual_override" : "computed"
  });
  return { ok: true, payment: row, billing_interval: compute.billing_interval };
});

export { charge_post as default };
//# sourceMappingURL=charge.post.mjs.map
