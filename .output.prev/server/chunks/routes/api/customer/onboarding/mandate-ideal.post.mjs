import { d as defineEventHandler, g as getServiceRoleClient, c as createError, b as getRequestHeader } from '../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { getMollie, formatMollieAmount, isMollieTestMode, redactMollieResponse } from '../../../../_/mollie.mjs';
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

const VALIDATION_AMOUNT_CENTS = 1;
const mandateIdeal_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email, mollie_customer_id, mollie_mandate_id").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  if (customer.mollie_mandate_id) {
    throw createError({ statusCode: 409, message: "Er is al een machtiging afgegeven." });
  }
  const mollie = getMollie();
  let mollieCustomerId = customer.mollie_customer_id || null;
  if (!mollieCustomerId) {
    try {
      const created = await mollie.customers.create({
        name: customer.full_name || customer.email || "Klant",
        email: customer.email || void 0,
        metadata: { upsol_customer_id: customer.id, upsol_partner_id: customer.partner_id }
      });
      mollieCustomerId = created.id;
      await supabase.from("customers").update({ mollie_customer_id: mollieCustomerId }).eq("id", customer.id);
    } catch (e) {
      throw createError({ statusCode: 502, message: "Mollie-klant aanmaken mislukt: " + ((e == null ? void 0 : e.message) || "onbekend") });
    }
  }
  const host = getRequestHeader(event, "x-forwarded-host") || getRequestHeader(event, "host");
  const proto = (getRequestHeader(event, "x-forwarded-proto") || "https").toString().split(",")[0].trim();
  if (!host) throw createError({ statusCode: 500, message: "Kan de terugkeer-URL niet bepalen." });
  const baseUrl = `${proto}://${host}`;
  let payment;
  try {
    payment = await mollie.customerPayments.create({
      customerId: mollieCustomerId,
      amount: { currency: "EUR", value: formatMollieAmount(VALIDATION_AMOUNT_CENTS) },
      description: "Machtiging automatische incasso",
      sequenceType: "first",
      method: "ideal",
      redirectUrl: `${baseUrl}/welkom/incasso?mandate=pending`,
      webhookUrl: `${baseUrl}/api/webhooks/mollie`,
      metadata: {
        upsol_customer_id: customer.id,
        upsol_partner_id: customer.partner_id,
        purpose: "mandate_validation"
      }
    });
  } catch (e) {
    console.error("[mandate-ideal] payment create failed:", e == null ? void 0 : e.message);
    throw createError({
      statusCode: 502,
      message: "De iDEAL-machtiging kon niet worden gestart. Probeer het later opnieuw of vul je IBAN handmatig in.",
      data: { code: "IDEAL_UNAVAILABLE", detail: isMollieTestMode() ? e == null ? void 0 : e.message : void 0 }
    });
  }
  await supabase.from("payments").insert({
    partner_id: customer.partner_id,
    customer_id: customer.id,
    mollie_payment_id: payment.id,
    mollie_method: "ideal",
    amount_cents: VALIDATION_AMOUNT_CENTS,
    currency: "EUR",
    description: "Machtiging automatische incasso",
    status: payment.status || "open",
    raw: redactMollieResponse(payment)
  });
  await auditLog(event, "onboarding.mandate_ideal_started", "customer", customer.id, {
    mollie_payment_id: payment.id,
    mollie_customer_id: mollieCustomerId,
    test_mode: isMollieTestMode()
  });
  const checkoutUrl = ((_a = payment.getCheckoutUrl) == null ? void 0 : _a.call(payment)) || ((_c = (_b = payment._links) == null ? void 0 : _b.checkout) == null ? void 0 : _c.href);
  if (!checkoutUrl) {
    throw createError({ statusCode: 502, message: "Mollie gaf geen betaallink terug." });
  }
  return { ok: true, checkout_url: checkoutUrl, payment_id: payment.id };
});

export { mandateIdeal_post as default };
//# sourceMappingURL=mandate-ideal.post.mjs.map
