import type { H3Event } from 'h3'

export async function requireAuth(event: H3Event) {
  // In demo mode, return a mock user
  const config = useRuntimeConfig()
  if (config.public.demoMode) {
    return { id: 'demo-user', email: 'demo@voltvia.nl' }
  }

  // Get access token from Authorization header
  const authHeader = getHeader(event, 'authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw createError({ statusCode: 401, message: 'Niet ingelogd' })
  }

  const accessToken = authHeader.slice(7)
  const supabase = getServiceRoleClient(event)

  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) {
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
    .eq('user_id', user.id)

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
