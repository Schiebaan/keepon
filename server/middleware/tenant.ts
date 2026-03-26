import type { TenantBranding } from '~~/shared/types/tenant'

const tenantCache = new Map<string, { data: TenantBranding; expires: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Skip tenant resolution in demo mode
  if (config.public.demoMode) {
    return
  }

  const host = getHeader(event, 'host') || ''
  const baseDomain = config.public.baseDomain

  // Skip for API health checks etc.
  const path = getRequestURL(event).pathname
  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt')) return

  // Check cache first
  const cached = tenantCache.get(host)
  if (cached && cached.expires > Date.now()) {
    event.context.tenant = cached.data
    return
  }

  let tenantSlug: string | null = null

  // Extract subdomain from host
  if (baseDomain && host.endsWith(baseDomain)) {
    const sub = host.replace(`.${baseDomain}`, '').split('.')[0]
    if (sub && sub !== 'www') {
      tenantSlug = sub
    }
  }

  // For local development: use query param or header as fallback
  if (!tenantSlug && process.dev) {
    tenantSlug = getQuery(event).tenant as string || getHeader(event, 'x-tenant') || null
  }

  const supabase = getServiceRoleClient(event)

  let tenant: TenantBranding | null = null

  // Try subdomain slug lookup
  if (tenantSlug) {
    const { data } = await supabase
      .from('partners')
      .select('id, name, slug, logo_url, primary_color, secondary_color, terms_url, support_email')
      .eq('slug', tenantSlug)
      .eq('is_active', true)
      .single()

    if (data) tenant = data as TenantBranding
  }

  // Try custom domain lookup
  if (!tenant) {
    const { data } = await supabase
      .from('partners')
      .select('id, name, slug, logo_url, primary_color, secondary_color, terms_url, support_email')
      .eq('custom_domain', host)
      .eq('is_active', true)
      .single()

    if (data) tenant = data as TenantBranding
  }

  if (tenant) {
    tenantCache.set(host, { data: tenant, expires: Date.now() + CACHE_TTL })
    event.context.tenant = tenant
  }
})
