// Get the currently logged-in customer's data from Supabase
import type { Customer } from '~~/shared/types/database'

export function useCurrentCustomer() {
  const config = useRuntimeConfig()

  if (config.public.demoMode) {
    const { currentCustomer } = useMockData()
    return { customer: ref(currentCustomer) as Ref<Customer>, isLoading: ref(false) }
  }

  const customer = useState<Customer | null>('currentCustomerData', () => null)
  const isLoading = useState('currentCustomerLoading', () => true)
  const _loaded = useState('currentCustomerLoaded', () => false)

  if (!_loaded.value && typeof window !== 'undefined') {
    _loaded.value = true
    const supabase = useSupabaseClient()
    supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Fetch customer record for this auth user
        const svc = useSupabaseClient()
        svc.from('customers').select('*').eq('auth_user_id', session.user.id).single().then(({ data }) => {
          if (data) customer.value = data as Customer
          isLoading.value = false
        }).catch(() => { isLoading.value = false })
      }
    })
  }

  return { customer, isLoading }
}
