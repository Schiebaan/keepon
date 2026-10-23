import { u as useRuntimeConfig, g as getServiceRoleClient, c as createError, a as getHeader } from '../nitro/nitro.mjs';

async function requireAuth(event) {
  const config = useRuntimeConfig();
  if (config.public.demoMode) {
    return { id: "demo-user", email: "demo@voltvia.nl" };
  }
  const authHeader = getHeader(event, "authorization");
  if (!(authHeader == null ? void 0 : authHeader.startsWith("Bearer "))) {
    throw createError({ statusCode: 401, message: "Niet ingelogd" });
  }
  const accessToken = authHeader.slice(7);
  const supabase = getServiceRoleClient();
  const { data: { user }, error } = await supabase.auth.getUser(accessToken);
  if (error || !user) {
    throw createError({ statusCode: 401, message: "Niet ingelogd" });
  }
  return user;
}
async function requireRole(event, requiredRole) {
  const user = await requireAuth(event);
  const config = useRuntimeConfig();
  if (config.public.demoMode) {
    return { user, role: requiredRole };
  }
  const tenant = event.context.tenant;
  const supabase = getServiceRoleClient();
  const query = supabase.from("user_roles").select("role").eq("user_id", user.id);
  if (requiredRole === "platform_admin") {
    query.eq("role", "platform_admin");
  } else if (tenant) {
    query.or(`partner_id.eq.${tenant.id},role.eq.platform_admin`);
  }
  const { data } = await query.limit(1).single();
  if (!data) {
    throw createError({ statusCode: 403, message: "Geen toegang" });
  }
  return { user, role: data.role };
}

export { requireAuth as a, requireRole as r };
//# sourceMappingURL=auth-guard.mjs.map
