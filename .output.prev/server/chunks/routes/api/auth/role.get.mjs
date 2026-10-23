import { d as defineEventHandler, a as getHeader, p as parseCookies, g as getServiceRoleClient, u as useRuntimeConfig } from '../../../nitro/nitro.mjs';
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

const role_get = defineEventHandler(async (event) => {
  var _a, _b;
  const config = useRuntimeConfig();
  if (config.public.demoMode) {
    return { role: "platform_admin" };
  }
  let accessToken = null;
  const authHeader = getHeader(event, "authorization");
  if (authHeader == null ? void 0 : authHeader.startsWith("Bearer ")) {
    accessToken = authHeader.slice(7);
  }
  if (!accessToken) {
    const supabaseUrl = ((_a = config.supabase) == null ? void 0 : _a.url) || config.public.supabaseUrl || process.env.SUPABASE_URL || "";
    const refMatch = supabaseUrl.match(/\/\/([^.]+)\.supabase/);
    const ref = refMatch == null ? void 0 : refMatch[1];
    if (ref) {
      const cookies = parseCookies(event);
      let cookieStr = "";
      for (let i = 0; ; i++) {
        const chunk = cookies[`sb-${ref}-auth-token.${i}`];
        if (!chunk) break;
        cookieStr += chunk;
      }
      if (!cookieStr) {
        cookieStr = cookies[`sb-${ref}-auth-token`] || "";
      }
      if (cookieStr) {
        try {
          const decoded = Buffer.from(cookieStr, "base64url").toString();
          const parsed = JSON.parse(decoded);
          accessToken = parsed.access_token || null;
        } catch {
          try {
            const parsed = JSON.parse(decodeURIComponent(cookieStr));
            accessToken = Array.isArray(parsed) ? parsed[0] : parsed.access_token || null;
          } catch {
            if (cookieStr.startsWith("ey")) accessToken = cookieStr;
          }
        }
      }
    }
  }
  if (!accessToken) {
    return { role: null };
  }
  const supabase = getServiceRoleClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    return { role: null };
  }
  const tenant = event.context.tenant;
  const query = supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (tenant) {
    query.or(`partner_id.eq.${tenant.id},role.eq.platform_admin`);
  }
  const { data } = await query.limit(1).single();
  return { role: (_b = data == null ? void 0 : data.role) != null ? _b : null };
});

export { role_get as default };
//# sourceMappingURL=role.get.mjs.map
