import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { c as computeCustomerCharge } from '../../../_/pricing.mjs';
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

const contracts_get = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, mollie_customer_id, mollie_mandate_id, mandate_at, mandate_skipped").eq("auth_user_id", user.id).single();
  if (!customer) {
    return {
      mandate: { state: "mandate_not_set", mandate_at: null, mandate_skipped: false, active: false },
      lines: [],
      total_monthly_cents: 0,
      total_yearly_cents: 0,
      billing_interval: "monthly",
      yearly_discount_months: 0,
      trial: null,
      accepted_at: null
    };
  }
  const compute = await computeCustomerCharge(supabase, customer.id);
  const { data: acceptedRow } = await supabase.from("customers").select("accepted_at").eq("id", customer.id).single();
  let state;
  if (customer.mollie_mandate_id) state = "mandate_active";
  else if (customer.mandate_at) state = "mandate_pending";
  else if (customer.mandate_skipped) state = "mandate_skipped";
  else state = "mandate_not_set";
  const lines = compute.lines.map((l) => ({
    module_type: l.module_type,
    name: l.name,
    price_monthly_cents: l.price_monthly_cents,
    is_custom_price: l.default_price_monthly_cents !== null
  }));
  return {
    mandate: {
      state,
      active: state === "mandate_active",
      mandate_at: customer.mandate_at,
      mandate_skipped: !!customer.mandate_skipped
    },
    lines,
    total_monthly_cents: compute.monthly_total_cents,
    total_yearly_cents: compute.yearly_total_cents,
    billing_interval: compute.billing_interval,
    yearly_discount_months: compute.yearly_discount_months,
    trial: compute.trial,
    accepted_at: (acceptedRow == null ? void 0 : acceptedRow.accepted_at) || null
  };
});

export { contracts_get as default };
//# sourceMappingURL=contracts.get.mjs.map
