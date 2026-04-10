// Server-side plugin: loads partner branding before any page renders
// This ensures SSR output already contains the correct name, logo, and colors
export default defineNuxtPlugin(async (nuxtApp) => {
  const config = useRuntimeConfig()
  if (config.public.demoMode) return

  const event = useRequestEvent()
  const tenant = event?.context?.tenant

  if (tenant) {
    // Tenant resolved from subdomain by middleware — use directly
    useState('currentPartner', () => tenant)
    useState('partnerBrandingLoaded', () => true)
  } else {
    // No subdomain — fetch default partner
    try {
      const data = await $fetch('/api/tenant/branding')
      if (data) {
        useState('currentPartner', () => data)
        useState('partnerBrandingLoaded', () => true)
      }
    } catch {}
  }
})
