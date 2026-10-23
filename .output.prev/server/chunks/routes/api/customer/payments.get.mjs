import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
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

const payments_get = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, mollie_customer_id, mollie_mandate_id, mandate_at, mandate_skipped").eq("auth_user_id", user.id).single();
  if (!customer) return { customer: null, rows: [] };
  const { data: payments } = await supabase.from("payments").select("id, mollie_payment_id, mollie_method, amount_cents, currency, description, status, created_at, paid_at, failed_at, period_start, period_end").eq("customer_id", customer.id).order("created_at", { ascending: false }).limit(200);
  return {
    customer: {
      mandate_active: !!customer.mollie_mandate_id,
      mandate_at: customer.mandate_at,
      mandate_skipped: !!customer.mandate_skipped
    },
    rows: payments || []
  };
});

export { payments_get as default };
//# sourceMappingURL=payments.get.mjs.map
