import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
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

const pricing_get = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
    partnerId = fp == null ? void 0 : fp.id;
  }
  if (!partnerId) return [];
  const { data } = await supabase.from("partner_module_configs").select("id, is_enabled, price_monthly, price_yearly, min_contract_months, module_definition:module_definitions(type, name)").eq("partner_id", partnerId);
  return data || [];
});

export { pricing_get as default };
//# sourceMappingURL=pricing.get.mjs.map
