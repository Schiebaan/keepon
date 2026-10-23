import { d as defineEventHandler, g as getServiceRoleClient, c as createError } from '../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { getMollie, redactMollieResponse } from '../../../../_/mollie.mjs';
import { f as finalizeMandateFromPayment } from '../../../../_/mandate.mjs';
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

const mandateIdealStatus_get = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, mollie_mandate_id, mandate_at").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  if (customer.mollie_mandate_id) {
    return { status: "paid", mandate: true, mandate_at: customer.mandate_at };
  }
  const { data: row } = await supabase.from("payments").select("mollie_payment_id, status").eq("customer_id", customer.id).eq("description", "Machtiging automatische incasso").order("created_at", { ascending: false }).limit(1).maybeSingle();
  if (!row) return { status: "none", mandate: false };
  let payment;
  try {
    payment = await getMollie().payments.get(row.mollie_payment_id);
  } catch (e) {
    console.error("[mandate-ideal-status] fetch failed:", e == null ? void 0 : e.message);
    return { status: row.status || "open", mandate: false };
  }
  await supabase.from("payments").update({
    status: payment.status,
    mollie_mandate_id: payment.mandateId || null,
    paid_at: payment.paidAt || null,
    raw: redactMollieResponse(payment)
  }).eq("mollie_payment_id", payment.id);
  const result = await finalizeMandateFromPayment(supabase, payment);
  if (result.changed) {
    await auditLog(event, "onboarding.mandate_ideal_completed", "customer", customer.id, {
      mollie_payment_id: payment.id,
      mollie_mandate_id: result.mandate_id,
      via: "return"
    });
  }
  return {
    status: payment.status,
    mandate: result.ok,
    mandate_at: result.ok ? (/* @__PURE__ */ new Date()).toISOString() : null
  };
});

export { mandateIdealStatus_get as default };
//# sourceMappingURL=mandate-ideal-status.get.mjs.map
