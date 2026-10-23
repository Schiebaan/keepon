async function finalizeMandateFromPayment(supabase, payment) {
  var _a, _b;
  const customerId = (_a = payment == null ? void 0 : payment.metadata) == null ? void 0 : _a.upsol_customer_id;
  const mandateId = payment == null ? void 0 : payment.mandateId;
  if (!customerId || !mandateId) return { ok: false, changed: false, mandate_id: null };
  if ((payment == null ? void 0 : payment.status) !== "paid") return { ok: false, changed: false, mandate_id: null };
  if ((payment == null ? void 0 : payment.sequenceType) !== "first") return { ok: false, changed: false, mandate_id: null };
  const { data: customer } = await supabase.from("customers").select("id, auth_user_id, mollie_mandate_id").eq("id", customerId).single();
  if (!customer) return { ok: false, changed: false, mandate_id: null };
  if (customer.mollie_mandate_id === mandateId) {
    return { ok: true, changed: false, mandate_id: mandateId };
  }
  const now = (/* @__PURE__ */ new Date()).toISOString();
  await supabase.from("customers").update({
    mollie_mandate_id: mandateId,
    onboarding_step: "done",
    mandate_at: now,
    mandate_skipped: false
  }).eq("id", customer.id);
  if (customer.auth_user_id) {
    try {
      const { data: u } = await supabase.auth.admin.getUserById(customer.auth_user_id);
      const meta = ((_b = u == null ? void 0 : u.user) == null ? void 0 : _b.user_metadata) || {};
      await supabase.auth.admin.updateUserById(customer.auth_user_id, {
        user_metadata: {
          ...meta,
          onboarding: { ...meta.onboarding || {}, step: "done", mandate_at: now, mandate_skipped: false }
        }
      });
    } catch (e) {
      console.error("[mandate] user_metadata bijwerken mislukt:", e == null ? void 0 : e.message);
    }
  }
  return { ok: true, changed: true, mandate_id: mandateId };
}

export { finalizeMandateFromPayment as f };
//# sourceMappingURL=mandate.mjs.map
