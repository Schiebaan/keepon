import { d as defineEventHandler, g as getServiceRoleClient, c as createError } from '../../../nitro/nitro.mjs';
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

const me_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const tenant = event.context.tenant;
  let partnerId = tenant == null ? void 0 : tenant.id;
  if (!partnerId) {
    const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
    partnerId = role == null ? void 0 : role.partner_id;
    if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
      const { data: firstPartner } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = firstPartner == null ? void 0 : firstPartner.id;
    }
  }
  if (!partnerId) throw createError({ statusCode: 404, message: "Geen partner gevonden" });
  const { data, error } = await supabase.from("partners").select("*").eq("id", partnerId).single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  return data;
});

export { me_get as default };
//# sourceMappingURL=me.get.mjs.map
