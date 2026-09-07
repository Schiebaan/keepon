// Customer data composable — loads from Supabase in production
import type { Customer } from '~~/shared/types/database'

interface UseCustomersOptions {
  /**
   * Automatisch de eerste pagina laden zodra auth klaar is.
   *   true  (default) → laadt ongefilterd; voor overzichten die álle klanten willen
   *   false           → laadt niets; de pagina roept zelf refresh(filters) aan
   *   { ...filters }  → laadt meteen mét die filters
   *
   * Pagina's die zelf filteren (klanten = accepted, uitnodigingen = pending)
   * moeten `false` meegeven. Anders vuren er twee requests: eerst ongefilterd,
   * dan gefilterd — dat gaf zichtbare flikkering én een race waarbij het
   * ongefilterde antwoord het gefilterde kon overschrijven.
   */
  autoLoad?: boolean | Record<string, any>
}

export function useCustomers(options: UseCustomersOptions = {}) {
  const config = useRuntimeConfig()

  // Demo mode: use mock data
  if (config.public.demoMode) {
    const mock = useMockData()
    const customers = ref(mock.customers as Customer[])
    return {
      customers,
      total: ref(customers.value.length),
      hasMore: ref(false),
      isLoading: ref(false),
      refresh: async () => {},
      loadMore: async () => {},
      query: async (params: any = {}) => {
        let rows = mock.customers as Customer[]
        if (params.q) {
          const q = String(params.q).toLowerCase()
          rows = rows.filter((c: any) => (c.full_name || '').toLowerCase().includes(q) || (c.email || '').toLowerCase().includes(q))
        }
        return { rows, total: rows.length, limit: 100, offset: 0, has_more: false }
      },
      createCustomer: async (data: any) => mock.onboardCustomer(data),
      updateCustomer: async (id: string, data: Partial<Customer>) => {
        const c = mock.allCustomers.find((x: any) => x.id === id)
        if (c) Object.assign(c, data)
        return c
      },
      deleteCustomer: async (id: string) => {
        const idx = mock.allCustomers.findIndex((x: any) => x.id === id)
        if (idx !== -1) mock.allCustomers.splice(idx, 1)
        const lidx = customers.value.findIndex(c => c.id === id)
        if (lidx !== -1) customers.value.splice(lidx, 1)
      },
    }
  }

  // Production: load from Supabase
  const customers = useState<Customer[]>('adminCustomers', () => [])
  const total = useState<number>('adminCustomersTotal', () => 0)
  const hasMore = useState<boolean>('adminCustomersHasMore', () => false)
  const _loaded = useState('customersLoaded', () => false)
  const isLoading = useState('customersLoading', () => !_loaded.value)
  // Volgnummer voor race-bescherming: elke fetch claimt een nummer, en alleen
  // het antwoord van de hoogste (= meest recente) claim mag de state zetten.
  // Zonder dit kan een traag antwoord van een oudere zoekopdracht een nieuwer
  // resultaat overschrijven.
  const _seq = useState('customersSeq', () => 0)

  interface ListResponse {
    rows: Customer[]
    total: number
    limit: number
    offset: number
    has_more: boolean
  }
  interface QueryParams {
    q?: string
    accepted?: 'true' | 'false' | 'any'
    module?: string
    limit?: number
    offset?: number
  }

  async function getAuthHeaders() {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : {}
  }

  /**
   * Refresh the GLOBAL customers state with optional server-side filters.
   * Replaces the contents (not append). Use loadMore() to append the next page.
   */
  async function refresh(params: QueryParams = {}) {
    const mySeq = ++_seq.value
    isLoading.value = true
    try {
      const headers = await getAuthHeaders()
      const data = await $fetch<ListResponse>('/api/customers', { headers, query: params })
      // Inmiddels een nieuwere fetch gestart? Dan is dit antwoord verouderd.
      if (mySeq !== _seq.value) return
      customers.value = data?.rows || []
      total.value = data?.total || 0
      hasMore.value = !!data?.has_more
    } catch (e) {
      if (mySeq === _seq.value) console.error('Failed to load customers:', e)
    } finally {
      // Alleen de laatste fetch mag de spinner uitzetten, anders knippert 'ie
      // uit terwijl er nog een request loopt.
      if (mySeq === _seq.value) isLoading.value = false
    }
  }

  /**
   * Append the next page to the current list. Caller passes the same filters
   * that were used for the initial load.
   */
  async function loadMore(params: QueryParams = {}) {
    if (!hasMore.value || isLoading.value) return
    isLoading.value = true
    try {
      const headers = await getAuthHeaders()
      const data = await $fetch<ListResponse>('/api/customers', {
        headers,
        query: { ...params, offset: customers.value.length },
      })
      customers.value = customers.value.concat(data?.rows || [])
      total.value = data?.total || total.value
      hasMore.value = !!data?.has_more
    } finally {
      isLoading.value = false
    }
  }

  /**
   * One-shot query that does NOT touch the global state. Useful for filter
   * panes where you don't want to clobber the main list.
   */
  async function query(params: QueryParams = {}): Promise<ListResponse> {
    const headers = await getAuthHeaders()
    return await $fetch<ListResponse>('/api/customers', { headers, query: params })
  }

  // Auto-load: wacht tot auth klaar is en haal dan de eerste pagina op.
  //
  // Pagina's die zelf filteren geven `autoLoad: false` mee en roepen zelf
  // refresh(filters) aan — anders krijg je twee requests over elkaar heen.
  // We routeren via refresh() zodat de race-guard ook hier geldt.
  const autoLoad = options.autoLoad ?? true
  if (autoLoad !== false && !_loaded.value && typeof window !== 'undefined') {
    _loaded.value = true
    isLoading.value = true
    const autoParams: QueryParams = typeof autoLoad === 'object' ? autoLoad : {}
    const supabase = useSupabaseClient()
    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        authSub.unsubscribe()
        refresh(autoParams)
      }
    })
  }

  async function createCustomer(data: {
    email: string
    full_name: string
    phone?: string
    street?: string
    house_number?: string
    postal_code?: string
    city?: string
    modules?: string[]
    // Pricing-flexibility (optioneel; admin kan 't aan/uit zetten)
    billing_interval?: 'monthly' | 'yearly'
    yearly_discount_months?: number
    trial_months?: number
    module_price_overrides?: { module_type: string; price_monthly_cents: number; reason?: string }[]
  }) {
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
    total,
    hasMore,
    isLoading,
    refresh,
    loadMore,
    query,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  }
}
