// Customer dossier (products & documents) composable — Supabase backed
import type { CustomerProduct, CustomerDocument } from '~~/shared/types/database'

export function useCustomerDossier(customerId: string) {
  const products = useState<CustomerProduct[]>(`dossier-products-${customerId}`, () => [])
  const documents = useState<CustomerDocument[]>(`dossier-documents-${customerId}`, () => [])
  const isLoading = ref(true)
  const _loaded = useState(`dossier-loaded-${customerId}`, () => false)

  async function getAuthHeaders() {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  // Load from Supabase
  if (!_loaded.value && typeof window !== 'undefined') {
    _loaded.value = true
    const supabase = useSupabaseClient()
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.access_token) {
        const h = { Authorization: `Bearer ${session.access_token}` }
        Promise.all([
          $fetch<CustomerProduct[]>(`/api/customers/${customerId}/products`, { headers: h }).catch(() => []),
          $fetch<CustomerDocument[]>(`/api/customers/${customerId}/documents`, { headers: h }).catch(() => []),
        ]).then(([prods, docs]) => {
          products.value = prods || []
          documents.value = docs || []
          isLoading.value = false
        })
      }
    })
  }

  return {
    products: computed(() => products.value),
    documents: computed(() => documents.value),
    isLoading,

    async addProduct(data: Omit<CustomerProduct, 'id' | 'created_at' | 'updated_at'>) {
      const headers = await getAuthHeaders()
      const product = await $fetch<CustomerProduct>(`/api/customers/${customerId}/products`, {
        method: 'POST',
        headers,
        body: { ...data, partner_id: data.partner_id },
      })
      products.value.push(product)
      return product
    },

    async removeProduct(id: string) {
      const headers = await getAuthHeaders()
      await $fetch(`/api/customers/${customerId}/products/${id}`, {
        method: 'DELETE',
        headers,
      }).catch(() => {
        // If no delete endpoint yet, just remove locally
      })
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
        // Fallback: store locally if API fails
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
