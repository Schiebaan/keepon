/**
 * Customer onboarding state — shared across the four /welkom screens.
 * The state lives on the auth user metadata (server-side authoritative)
 * and is loaded via /api/customer/onboarding.
 */
export type OnboardingStep = 'hero' | 'voorstel' | 'incasso' | 'done'

export interface OnboardingProduct {
  id: string
  category: string
  module: 'solar' | 'heat_pump' | 'ev_charger' | 'battery'
  brand?: string | null
  model?: string | null
  notes?: string | null
  price?: { monthly_cents: number; yearly_cents: number; min_months: number; enabled: boolean } | null
}

export interface OnboardingState {
  step: OnboardingStep
  accepted_at: string | null
  accepted_modules: string[] | null
  mandate_at: string | null
  mandate_skipped: boolean
  customer: {
    full_name: string; first_name: string; email: string
    address_short?: string | null
    street?: string | null; house_number?: string | null; postal_code?: string | null; city?: string | null
  }
  partner: { name: string; slug: string; logo_url: string | null; primary_color: string; secondary_color: string; support_email: string | null; support_phone: string | null; terms_url: string | null } | null
  proposal: {
    modules: OnboardingProduct[]
    total_monthly_cents: number
    total_yearly_cents: number
    billing_interval: 'monthly' | 'yearly'
    yearly_discount_months: number
    trial_months: number
  }
}

export function useOnboarding() {
  const state = useState<OnboardingState | null>('onboardingState', () => null)
  const isLoading = useState('onboardingLoading', () => false)

  async function authHeaders() {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  async function load(force = false): Promise<OnboardingState | null> {
    if (state.value && !force) return state.value
    if (typeof window === 'undefined') return null
    isLoading.value = true
    try {
      const headers = await authHeaders()
      if (!headers.Authorization) return null
      state.value = await $fetch<OnboardingState>('/api/customer/onboarding', { headers })
      return state.value
    } catch {
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function setStep(step: OnboardingStep) {
    const headers = await authHeaders()
    await $fetch('/api/customer/onboarding/step', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: { step },
    })
    if (state.value) state.value.step = step
  }

  /**
   * After an onboarding-state write, the server has updated the auth user's
   * `user_metadata` but the client's `useSupabaseUser()` ref still holds the
   * stale copy. The customer-onboarding middleware reads from that ref, so
   * without a refresh it would block the customer from /klant after akkoord
   * (it sees no `accepted_at` and bounces them back to /welkom/voorstel).
   *
   * We trigger a session refresh so the JWT + user_metadata get re-fetched
   * and the middleware has fresh data for the next navigation.
   */
  async function refreshSupabaseSession() {
    try {
      const supabase = useSupabaseClient()
      await supabase.auth.refreshSession()
    } catch {
      // Non-fatal; worst case is one extra middleware redirect cycle.
    }
  }

  async function acceptProposal(acceptedModules?: string[], billingInterval?: 'monthly' | 'yearly') {
    const headers = await authHeaders()
    const res: any = await $fetch('/api/customer/onboarding/accept', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: {
        accepted_modules: acceptedModules || [],
        billing_interval: billingInterval || 'monthly',
      },
    })
    if (state.value) {
      state.value.step = 'incasso'
      state.value.accepted_at = res.accepted_at
      state.value.accepted_modules = res.accepted_modules
      if (state.value.proposal && res.billing_interval) {
        state.value.proposal.billing_interval = res.billing_interval
      }
    }
    await refreshSupabaseSession()
    return res
  }

  async function submitMandate(payload: { iban?: string; account_holder?: string; skip?: boolean }) {
    const headers = await authHeaders()
    const res: any = await $fetch('/api/customer/onboarding/mandate', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: payload,
    })
    if (state.value) {
      state.value.step = 'done'
      state.value.mandate_at = res.mandate_at
      state.value.mandate_skipped = res.mandate_skipped
    }
    await refreshSupabaseSession()
    return res
  }

  /** Where should the customer be right now based on their saved progress? */
  function targetRouteForStep(step: OnboardingStep): string {
    switch (step) {
      case 'hero':       return '/welkom'
      case 'voorstel':   return '/welkom/voorstel'
      case 'incasso':    return '/welkom/incasso'
      case 'done':       return '/welkom/klaar'
      default:           return '/welkom'
    }
  }

  function formatPrice(cents: number): string {
    if (!cents) return '0,00'
    const euros = cents / 100
    return euros.toFixed(2).replace('.', ',')
  }

  return {
    state,
    isLoading,
    load,
    setStep,
    acceptProposal,
    submitMandate,
    targetRouteForStep,
    formatPrice,
  }
}
