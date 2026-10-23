import { d as defineEventHandler, r as readBody, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { getMollie, redactMollieResponse } from '../../../_/mollie.mjs';
import { f as finalizeMandateFromPayment } from '../../../_/mandate.mjs';
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

const mollie_post = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const body = await readBody(event).catch(() => ({}));
  const paymentId = ((body == null ? void 0 : body.id) || "").toString();
  if (!paymentId) {
    throw createError({ statusCode: 400, message: "Payment ID ontbreekt" });
  }
  const supabase = getServiceRoleClient();
  const mollie = getMollie();
  let payment;
  try {
    payment = await mollie.payments.get(paymentId);
  } catch (e) {
    console.error("[webhooks/mollie] payment fetch failed:", e == null ? void 0 : e.message);
    return { received: true, status: "fetch_failed" };
  }
  const updates = {
    status: payment.status,
    mollie_method: payment.method || null,
    raw: redactMollieResponse(payment)
  };
  if (payment.status === "paid" && payment.paidAt) updates.paid_at = payment.paidAt;
  if (payment.status === "failed" && payment.failedAt) updates.failed_at = payment.failedAt;
  if ((payment.status === "expired" || payment.status === "canceled") && payment.expiredAt) updates.failed_at = payment.expiredAt;
  if (((_a = payment.amountRefunded) == null ? void 0 : _a.value) && parseFloat(payment.amountRefunded.value) > 0) updates.refunded_at = (/* @__PURE__ */ new Date()).toISOString();
  if (((_b = payment.amountChargedBack) == null ? void 0 : _b.value) && parseFloat(payment.amountChargedBack.value) > 0) updates.charged_back_at = (/* @__PURE__ */ new Date()).toISOString();
  if (payment.mandateId) updates.mollie_mandate_id = payment.mandateId;
  await supabase.from("payments").update(updates).eq("mollie_payment_id", payment.id);
  const finalized = await finalizeMandateFromPayment(supabase, payment);
  if (finalized.changed) {
    await auditLog(event, "onboarding.mandate_ideal_completed", "customer", payment.metadata.upsol_customer_id, {
      mollie_payment_id: payment.id,
      mollie_mandate_id: finalized.mandate_id,
      via: "webhook"
    });
  }
  await auditLog(event, `payment.${payment.status}`, "payment", null, {
    mollie_payment_id: payment.id,
    sequence_type: payment.sequenceType,
    amount: payment.amount,
    customer_id: (_c = payment.metadata) == null ? void 0 : _c.upsol_customer_id
  });
  return { received: true };
});

export { mollie_post as default };
//# sourceMappingURL=mollie.post.mjs.map
