import { d as defineEventHandler, h as getRouterParam, g as getServiceRoleClient, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
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

const _slug__get = defineEventHandler(async (event) => {
  await requireRole(event, "platform_admin");
  const slug = getRouterParam(event, "slug");
  const supabase = getServiceRoleClient();
  const { data: partner, error } = await supabase.from("partners").select("*").eq("slug", slug).single();
  if (error || !partner) throw createError({ statusCode: 404, message: "Partner niet gevonden" });
  const { count: customerCount } = await supabase.from("customers").select("id", { count: "exact", head: true }).eq("partner_id", partner.id);
  const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("partner_id", partner.id).eq("role", "partner_admin");
  return {
    ...partner,
    customer_count: customerCount || 0,
    admin_count: (adminRoles == null ? void 0 : adminRoles.length) || 0
  };
});

export { _slug__get as default };
//# sourceMappingURL=_slug_.get.mjs.map
