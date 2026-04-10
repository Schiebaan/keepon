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
  // State is initialized by load-branding.server.ts plugin during SSR
  const partner = useState<Partner>('currentPartner', () => ({ ...EMPTY_PARTNER }))
  const isLoading = ref(false)
  const _fullLoaded = useState('partnerFullLoaded', () => false)

  // Client: if logged in, load full partner data (includes terms, placeholders)
  if (!_fullLoaded.value && typeof window !== 'undefined') {
    _fullLoaded.value = true
    const supabase = useSupabaseClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) return
      $fetch('/api/partners/me', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then((data: any) => {
        if (data?.id) Object.assign(partner.value, data)
      }).catch(() => {})
    })
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
  }
}
