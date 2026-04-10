// Customer data composable — loads from Supabase in production
import type { Customer } from '~~/shared/types/database'

export function useCustomers() {
  const config = useRuntimeConfig()

  // Demo mode: use mock data
  if (config.public.demoMode) {
    const mock = useMockData()
    const customers = ref(mock.customers as Customer[])
    return {
      customers,
      isLoading: ref(false),
      refresh: async () => {},
      createCustomer: async (data: any) => mock.onboardCustomer(data),
      updateCustomer: async (id: string, data: Partial<Customer>) => {
        const c = mock.allCustomers.find((x: any) => x.id === id)
        if (c) Object.assign(c, data)
        return c
      },
    }
  }

  // Production: load from Supabase
  const customers = useState<Customer[]>('adminCustomers', () => [])
  const _loaded = useState('customersLoaded', () => false)
  const isLoading = useState('customersLoading', () => !_loaded.value)

  async function getAuthHeaders() {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}
  }

  async function refresh() {
    isLoading.value = true
    try {
      const headers = await getAuthHeaders()
      const data = await $fetch<Customer[]>('/api/customers', { headers })
      customers.value = data || []
    } catch (e) {
      console.error('Failed to load customers:', e)
    } finally {
      isLoading.value = false
    }
  }

  // Auto-load: wait for auth to be ready, then fetch immediately
  if (!_loaded.value && typeof window !== 'undefined') {
    _loaded.value = true
    isLoading.value = true
    // Use onAuthStateChange to trigger load as soon as session is available
    const supabase = useSupabaseClient()
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        $fetch<Customer[]>('/api/customers', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).then(data => {
          customers.value = data || []
        }).catch(() => {}).finally(() => {
          isLoading.value = false
        })
        authSub.unsubscribe()
      }
    })
  }

  async function createCustomer(data: { email: string; full_name: string; phone?: string; street?: string; house_number?: string; postal_code?: string; city?: string; modules?: string[] }) {
    const headers = await getAuthHeaders()
    const customer = await $fetch<Customer>('/api/customers', {
      method: 'POST',
      headers,
      body: data,
    })
    customers.value.unshift(customer)
    return customer
  }

  async function updateCustomer(id: string, data: Partial<Customer>) {
    const headers = await getAuthHeaders()
    const updated = await $fetch<Customer>(`/api/customers/${id}`, {
      method: 'PUT',
      headers,
      body: data,
    })
    const idx = customers.value.findIndex(c => c.id === id)
    if (idx !== -1) customers.value[idx] = updated
    return updated
  }

  async function deleteCustomer(id: string) {
    const headers = await getAuthHeaders()
    await $fetch(`/api/customers/${id}`, { method: 'DELETE', headers })
    const idx = customers.value.findIndex(c => c.id === id)
    if (idx !== -1) customers.value.splice(idx, 1)
  }

  return {
    customers,
    isLoading,
    refresh,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  }
}
