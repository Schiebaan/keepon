import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { r as resolvePartnerId } from '../../../_/partner-scope.mjs';
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

const pricing_put = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  const body = await readBody(event);
  const { id, price_monthly, price_yearly, is_enabled, min_contract_months } = body;
  if (!id) throw createError({ statusCode: 400, message: "id is required" });
  const updates = {};
  if (price_monthly !== void 0) updates.price_monthly = price_monthly;
  if (price_yearly !== void 0) updates.price_yearly = price_yearly;
  if (is_enabled !== void 0) updates.is_enabled = is_enabled;
  if (min_contract_months !== void 0) updates.min_contract_months = min_contract_months;
  const { data, error } = await supabase.from("partner_module_configs").update(updates).eq("id", id).eq("partner_id", partnerId).select().single();
  if (error || !data) throw createError({ statusCode: 404, message: "Module niet gevonden" });
  return data;
});

export { pricing_put as default };
//# sourceMappingURL=pricing.put.mjs.map
