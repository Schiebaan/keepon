import { d as defineEventHandler, g as getServiceRoleClient, e as getQuery } from '../../../nitro/nitro.mjs';
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

const users_get = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  if ((role == null ? void 0 : role.role) === "platform_admin") {
    const query = getQuery(event);
    partnerId = query.partner_id || partnerId;
    const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
    if (subdomeinPartner) partnerId = subdomeinPartner;
    if (!partnerId) {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) return [];
  const { data: roles } = await supabase.from("user_roles").select("user_id, role, full_name, created_at").eq("partner_id", partnerId).eq("role", "partner_admin");
  if (!(roles == null ? void 0 : roles.length)) return [];
  const { deriveNameFromEmail } = await import('../../../_/admin-name.mjs');
  const users = [];
  for (const r of roles) {
    const { data: { user: authUser } } = await supabase.auth.admin.getUserById(r.user_id);
    if (authUser) {
      const metaName = ((_b = authUser.user_metadata) == null ? void 0 : _b.full_name) || ((_c = authUser.user_metadata) == null ? void 0 : _c.name) || null;
      users.push({
        id: r.user_id,
        email: authUser.email,
        full_name: r.full_name || metaName || null,
        display_name: r.full_name || metaName || deriveNameFromEmail(authUser.email || ""),
        created_at: r.created_at,
        last_sign_in: authUser.last_sign_in_at
      });
    }
  }
  return users;
});

export { users_get as default };
//# sourceMappingURL=users.get.mjs.map
