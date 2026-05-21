export interface CustomerProductSummary {
  id: string
  category: string
  name: string | null
  brand: string | null
  model: string | null
  notes: string | null
  installation_date: string | null
  linked: boolean
  integration: 'sundata' | 'easee' | 'weheat' | null
  external_id: string | null
}

/**
 * Fetch the logged-in customer's products + linkage status. Cached per Nuxt
 * instance via useState so multiple pages on the customer side share one fetch.
 */
export function useCustomerProducts() {
  const products = useState<CustomerProductSummary[]>('customerProducts', () => [])
  const isLoading = useState('customerProductsLoading', () => true)
  const _loaded = useState('customerProductsLoaded', () => false)

  async function load(force = false) {
    if (_loaded.value && !force) return products.value
    if (typeof window === 'undefined') return products.value
    isLoading.value = true
    try {
      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { isLoading.value = false; return products.value }
      const data = await $fetch<CustomerProductSummary[]>('/api/customer/products', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      products.value = data || []
      _loaded.value = true
    } catch {
      products.value = []
    } finally {
      isLoading.value = false
    }
    return products.value
  }

  // Helpers for common lookups
  const evCharger = computed(() => products.value.find(p => p.category === 'ev_charger'))
  const heatPump = computed(() => products.value.find(p => p.category === 'heat_pump'))
  const solar = computed(() => products.value.find(p => p.category === 'solar_panel'))
  const battery = computed(() => products.value.find(p => p.category === 'battery'))

  return { products, isLoading, load, evCharger, heatPump, solar, battery }
}
