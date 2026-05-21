// Customer dossier (products & documents) composable — Supabase backed
import type { CustomerProduct, CustomerDocument } from '~~/shared/types/database'

export function useCustomerDossier(customerId: string) {
  const products = useState<CustomerProduct[]>(`dossier-products-${customerId}`, () => [])
  const documents = useState<CustomerDocument[]>(`dossier-documents-${customerId}`, () => [])
  const isLoading = useState(`dossier-loading-${customerId}`, () => true)
  const _loaded = useState(`dossier-loaded-${customerId}`, () => false)

  async function getAuthHeaders() {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  async function loadData() {
    const headers = await getAuthHeaders()
    if (!headers.Authorization) return

    isLoading.value = true
    try {
      const [prods, docs] = await Promise.all([
        $fetch<CustomerProduct[]>(`/api/customers/${customerId}/products`, { headers }).catch(() => [] as CustomerProduct[]),
        $fetch<CustomerDocument[]>(`/api/customers/${customerId}/documents`, { headers }).catch(() => [] as CustomerDocument[]),
      ])
      products.value = prods || []
      documents.value = docs || []
      _loaded.value = true
    } finally {
      isLoading.value = false
    }
  }

  // Load immediately on client-side (not just on auth change)
  if (typeof window !== 'undefined' && !_loaded.value) {
    loadData()
  }

  return {
    products: computed(() => products.value),
    documents: computed(() => documents.value),
    isLoading,

    async refresh() {
      await loadData()
    },

    async addProduct(data: Omit<CustomerProduct, 'id' | 'created_at' | 'updated_at'>) {
      const headers = await getAuthHeaders()
      const product = await $fetch<CustomerProduct>(`/api/customers/${customerId}/products`, {
        method: 'POST',
        headers,
        body: data,
      })
      products.value.push(product)
      return product
    },

    async removeProduct(id: string) {
      const headers = await getAuthHeaders()
      await $fetch(`/api/customers/${customerId}/products/${id}`, {
        method: 'DELETE',
        headers,
      }).catch(() => {})
      const idx = products.value.findIndex(p => p.id === id)
      if (idx !== -1) products.value.splice(idx, 1)
    },

    async addDocument(data: Omit<CustomerDocument, 'id' | 'created_at'>) {
      const headers = await getAuthHeaders()
      const doc = await $fetch<CustomerDocument>(`/api/customers/${customerId}/documents`, {
        method: 'POST',
        headers,
        body: data,
      }).catch(() => {
        return { ...data, id: `doc-${Date.now()}`, created_at: new Date().toISOString() } as CustomerDocument
      })
      documents.value.push(doc)
      return doc
    },

    async removeDocument(id: string) {
      const idx = documents.value.findIndex(d => d.id === id)
      if (idx !== -1) documents.value.splice(idx, 1)
    },
  }
}
