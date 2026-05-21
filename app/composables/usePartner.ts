// Partner data composable — loads from Supabase in production
import type { Partner } from '~~/shared/types/database'

const EMPTY_PARTNER: Partner = {
  id: '', name: '', slug: '', custom_domain: null, logo_url: null,
  primary_color: '#1a56db', secondary_color: '#f3f4f6',
  terms_url: null, terms_content: '', terms_placeholders: {},
  support_email: null, support_phone: null, is_active: true,
  created_at: '', updated_at: '',
}

export function usePartner() {
  const config = useRuntimeConfig()

  // Demo mode: use mock data
  if (config.public.demoMode) {
    const { partner } = useMockData()
    return {
      partner: ref(partner) as Ref<Partner>,
      isLoading: ref(false),
      save: async () => {},
    }
  }

  // Production mode
  // State is initialized by load-branding.server.ts plugin during SSR — this IS the authoritative
  // value. We deliberately do NOT auto-refetch here because the refetch caused a brief flash of the
  // wrong partner (e.g. "Demo Installateur") if the API fell back to a different partner for any
  // reason. Pages that need the extra fields (terms_content, terms_placeholders) should call
  // loadFullPartner() explicitly.
  const partner = useState<Partner>('currentPartner', () => ({ ...EMPTY_PARTNER }))
  const isLoading = ref(false)
  const _fullLoaded = useState('partnerFullLoaded', () => false)

  async function loadFullPartner() {
    if (_fullLoaded.value || typeof window === 'undefined') return
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    try {
      const data: any = await $fetch('/api/partners/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      // Only merge if the API agrees with SSR — prevents cross-partner contamination if the
      // endpoint accidentally falls back to a different partner.
      if (data?.id && (!partner.value.id || data.id === partner.value.id)) {
        // Careful merge: keep any client-side defaults that the settings page has populated
        // on top of (like module_terms), but trust DB values when present.
        const currentPh = partner.value.terms_placeholders || {}
        const apiPh = data.terms_placeholders || {}
        const mergedPlaceholders = {
          ...currentPh,
          ...apiPh,
          module_terms: {
            ...(currentPh as any).module_terms,
            ...(apiPh as any).module_terms,
          },
        }
        Object.assign(partner.value, data)
        partner.value.terms_placeholders = mergedPlaceholders as any
        _fullLoaded.value = true
      }
    } catch {}
  }

  // Save partner to Supabase
  async function save() {
    isLoading.value = true
    try {
      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const result = await $fetch('/api/partners/me', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          name: partner.value.name,
          slug: partner.value.slug,
          logo_url: partner.value.logo_url,
          primary_color: partner.value.primary_color,
          secondary_color: partner.value.secondary_color,
          support_email: partner.value.support_email,
          support_phone: partner.value.support_phone,
          terms_url: partner.value.terms_url,
          terms_content: partner.value.terms_content,
          terms_placeholders: partner.value.terms_placeholders,
        },
      })
      if (result) Object.assign(partner.value, result)
    } finally {
      isLoading.value = false
    }
  }

  return {
    partner: partner as Ref<Partner>,
    isLoading,
    save,
    loadFullPartner,
  }
}
