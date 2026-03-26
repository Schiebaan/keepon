import type { H3Event } from 'h3'

export async function requireAuth(event: H3Event) {
  // In demo mode, return a mock user
  const config = useRuntimeConfig()
  if (config.public.demoMode) {
    return { id: 'demo-user', email: 'demo@voltvia.nl' }
  }

  // Production: use Supabase server auth
  // Dynamic import to avoid build warnings when module is disabled
  const supabaseModulePath = '#supabase/server'
  const mod = await import(/* @vite-ignore */ supabaseModulePath).catch(() => null)
  if (!mod) {
    throw createError({ statusCode: 500, message: 'Supabase module niet geladen' })
  }
  const user = await mod.serverSupabaseUser(event)
  if (!user) {
    throw createError({ statusCode: 401, message: 'Niet ingelogd' })
  }
  return user
}

export async function requireRole(event: H3Event, requiredRole: 'partner_admin' | 'platform_admin') {
  const user = await requireAuth(event)
  const config = useRuntimeConfig()

  // In demo mode, always allow
  if (config.public.demoMode) {
    return { user, role: requiredRole }
  }

  const tenant = event.context.tenant
  const supabase = getServiceRoleClient(event)

  const query = supabase
    .from('user_roles')
    .select('role')
    .eq('auth_user_id', user.id)

  if (requiredRole === 'platform_admin') {
    query.eq('role', 'platform_admin')
  } else if (tenant) {
    query.or(`partner_id.eq.${tenant.id},role.eq.platform_admin`)
  }

  const { data } = await query.limit(1).single()

  if (!data) {
    throw createError({ statusCode: 403, message: 'Geen toegang' })
  }

  return { user, role: data.role }
}
