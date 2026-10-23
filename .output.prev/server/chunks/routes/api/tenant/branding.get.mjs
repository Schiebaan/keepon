import { d as defineEventHandler, g as getServiceRoleClient, a as getHeader } from '../../../nitro/nitro.mjs';
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

const branding_get = defineEventHandler(async (event) => {
  const tenant = event.context.tenant;
  if (tenant) return tenant;
  const supabase = getServiceRoleClient();
  const authHeader = getHeader(event, "authorization");
  if (authHeader == null ? void 0 : authHeader.startsWith("Bearer ")) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
    if (user) {
      const { data: role } = await supabase.from("user_roles").select("partner_id").eq("user_id", user.id).not("partner_id", "is", null).limit(1).single();
      if (role == null ? void 0 : role.partner_id) {
        const { data: partner } = await supabase.from("partners").select("id, name, slug, logo_url, primary_color, secondary_color, terms_url, support_email").eq("id", role.partner_id).single();
        if (partner) return partner;
      }
    }
  }
  return {
    id: null,
    name: "UPsol",
    slug: null,
    logo_url: null,
    primary_color: "#1a56db",
    secondary_color: "#f3f4f6",
    terms_url: null,
    support_email: null
  };
});

export { branding_get as default };
//# sourceMappingURL=branding.get.mjs.map
