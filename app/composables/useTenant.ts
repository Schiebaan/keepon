import type { TenantBranding } from '~~/shared/types/tenant'

export function useTenant() {
  const config = useRuntimeConfig()

  // In demo mode, return mock partner data as tenant
  if (config.public.demoMode) {
    const { partner } = useMockData()
    return ref<TenantBranding>({
      id: partner.id,
      name: partner.name,
      slug: partner.slug,
      logo_url: partner.logo_url,
      primary_color: partner.primary_color,
      secondary_color: partner.secondary_color,
      terms_url: partner.terms_url,
      support_email: partner.support_email,
    })
  }

  // In production: read from SSR event context (set by server middleware)
  const tenant = useState<TenantBranding | null>('tenant', () => null)

  if (import.meta.server) {
    const event = useRequestEvent()
    if (event?.context?.tenant) {
      tenant.value = event.context.tenant as TenantBranding
    }
  }

  return tenant
}
