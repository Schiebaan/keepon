import { d as defineEventHandler, r as readBody, g as getServiceRoleClient, c as createError } from '../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { isDirectDebitEnabled, getMollie, isMollieTestMode } from '../../../../_/mollie.mjs';
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

function isValidIban(iban) {
  const v = iban.replace(/\s+/g, "").toUpperCase();
  return /^NL\d{2}[A-Z]{4}\d{10}$/.test(v) || /^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(v);
}
const mandate_post = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const body = await readBody(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email, mollie_customer_id, mollie_mandate_id").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  const skip = !!(body == null ? void 0 : body.skip);
  const iban = ((body == null ? void 0 : body.iban) || "").toString().replace(/\s+/g, "").toUpperCase();
  const account_holder = ((body == null ? void 0 : body.account_holder) || "").toString().trim();
  if (skip) {
    const now2 = (/* @__PURE__ */ new Date()).toISOString();
    const meta2 = user.user_metadata || {};
    const current2 = meta2.onboarding || {};
    await Promise.all([
      supabase.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...meta2,
          onboarding: { ...current2, step: "done", mandate_at: null, mandate_skipped: true }
        }
      }),
      supabase.from("customers").update({
        onboarding_step: "done",
        mandate_at: null,
        mandate_skipped: true
      }).eq("id", customer.id)
    ]);
    await auditLog(event, "onboarding.mandate_skipped", "customer", customer.id, { at: now2 });
    return { ok: true, mandate_at: null, mandate_skipped: true, next: "klaar" };
  }
  if (!iban || !isValidIban(iban)) {
    throw createError({ statusCode: 400, message: "Vul een geldig IBAN in (bv. NL91ABNA0417164300)" });
  }
  if (!account_holder) {
    throw createError({ statusCode: 400, message: "Vul de naam op het rekeningnummer in" });
  }
  if (!await isDirectDebitEnabled()) {
    console.error("[mandate] SEPA Direct Debit staat uit op het Mollie-profiel \u2014 mandaat geweigerd");
    throw createError({
      statusCode: 503,
      message: "Automatische incasso is op dit moment niet beschikbaar. Je kunt deze stap overslaan en later afronden.",
      data: { code: "DIRECT_DEBIT_DISABLED" }
    });
  }
  const mollie = getMollie();
  let mollieCustomerId = customer.mollie_customer_id || null;
  if (!mollieCustomerId) {
    try {
      const created = await mollie.customers.create({
        name: customer.full_name || account_holder,
        email: customer.email || void 0,
        metadata: { upsol_customer_id: customer.id, upsol_partner_id: customer.partner_id }
      });
      mollieCustomerId = created.id;
    } catch (e) {
      throw createError({ statusCode: 502, message: "Mollie-customer aanmaken mislukt: " + ((e == null ? void 0 : e.message) || "onbekend") });
    }
  }
  let mandate;
  try {
    mandate = await mollie.customerMandates.create({
      customerId: mollieCustomerId,
      method: "directdebit",
      consumerName: account_holder,
      consumerAccount: iban,
      signatureDate: (/* @__PURE__ */ new Date()).toISOString().slice(0, 10)
    });
  } catch (e) {
    throw createError({ statusCode: 502, message: "Mollie-mandaat aanmaken mislukt: " + ((e == null ? void 0 : e.message) || "onbekend") });
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const meta = user.user_metadata || {};
  const current = meta.onboarding || {};
  const mandateActive = (mandate == null ? void 0 : mandate.status) === "valid";
  await Promise.all([
    supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        onboarding: { ...current, step: "done", mandate_at: now, mandate_skipped: false }
      }
    }),
    supabase.from("customers").update({
      mollie_customer_id: mollieCustomerId,
      mollie_mandate_id: mandate.id,
      onboarding_step: "done",
      mandate_at: now,
      mandate_skipped: false
    }).eq("id", customer.id)
  ]);
  await auditLog(event, "onboarding.mandate_created", "customer", customer.id, {
    iban: iban.slice(0, 4) + "****" + iban.slice(-4),
    account_holder,
    mollie_customer_id: mollieCustomerId,
    mollie_mandate_id: mandate.id,
    mandate_status: (mandate == null ? void 0 : mandate.status) || null,
    test_mode: isMollieTestMode(),
    at: now
  });
  return {
    ok: true,
    mandate_at: now,
    mandate_skipped: false,
    mandate_active: mandateActive,
    next: "klaar"
  };
});

export { mandate_post as default };
//# sourceMappingURL=mandate.post.mjs.map
