import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  if (config.public.demoMode) {
    return { role: 'platform_admin' }
  }

  // Try multiple ways to get the user's access token
  let accessToken: string | null = null

  // 1. Authorization header
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    accessToken = authHeader.slice(7)
  }

  // 2. Supabase cookie — derive project ref from SUPABASE_URL
  if (!accessToken) {
    const supabaseUrl = (config as any).supabase?.url || config.public.supabaseUrl || process.env.SUPABASE_URL || ''
    const refMatch = supabaseUrl.match(/\/\/([^.]+)\.supabase/)
    const ref = refMatch?.[1]

    if (ref) {
      const cookies = parseCookies(event)

      // @nuxtjs/supabase v2 chunked cookie format
      let cookieStr = ''
      for (let i = 0; ; i++) {
        const chunk = cookies[`sb-${ref}-auth-token.${i}`]
        if (!chunk) break
        cookieStr += chunk
      }

      // Also try non-chunked format
      if (!cookieStr) {
        cookieStr = cookies[`sb-${ref}-auth-token`] || ''
      }

      if (cookieStr) {
        try {
          const decoded = Buffer.from(cookieStr, 'base64url').toString()
          const parsed = JSON.parse(decoded)
          accessToken = parsed.access_token || null
        } catch {
          try {
            const parsed = JSON.parse(decodeURIComponent(cookieStr))
            accessToken = Array.isArray(parsed) ? parsed[0] : (parsed.access_token || null)
          } catch {
            if (cookieStr.startsWith('ey')) accessToken = cookieStr
          }
        }
      }
    }
  }

  if (!accessToken) {
    return { role: null }
  }

  const supabase = getServiceRoleClient(event)

  // Verify token and get user
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) {
    return { role: null }
  }

  // Get role
  const tenant = event.context.tenant
  const query = supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)

  if (tenant) {
    query.or(`partner_id.eq.${tenant.id},role.eq.platform_admin`)
  }

  const { data } = await query.limit(1).single()
  return { role: data?.role ?? null }
})
