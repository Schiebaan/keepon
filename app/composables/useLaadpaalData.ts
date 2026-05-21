export interface LaadpaalData {
  linked: boolean
  charger_id?: string
  online?: boolean
  op_mode?: number | null
  op_mode_label?: string
  op_mode_hint?: string | null
  op_mode_tone?: 'idle' | 'ready' | 'charging' | 'done' | 'error'
  current_session_kwh?: number
  current_power_w?: number
  lifetime_kwh?: number
  voltage?: number
  current_month?: { kwh: number; cost_eur: number }
  monthly_history?: { year: number; month: number; kwh: number; cost_eur: number }[]
  error?: string
}

/**
 * Live Easee data for the current customer's charger. Shared between the
 * /klant home card and /klant/laadpaal deep page so we only hit Easee once
 * per session.
 */
export function useLaadpaalData() {
  const data = useState<LaadpaalData | null>('laadpaalData', () => null)
  const isLoading = useState('laadpaalLoading', () => false)
  const error = useState('laadpaalError', () => '')
  const _loaded = useState('laadpaalLoaded', () => false)

  async function load(force = false): Promise<LaadpaalData | null> {
    if (_loaded.value && !force) return data.value
    if (typeof window === 'undefined') return null
    isLoading.value = true
    error.value = ''
    try {
      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { isLoading.value = false; return null }
      data.value = await $fetch<LaadpaalData>('/api/customer/laadpaal-data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        // user-triggered refresh bypasses the server's 60s cache
        query: force ? { fresh: 1 } : undefined,
      })
      if (data.value?.error) error.value = data.value.error
      _loaded.value = true
    } catch (e: any) {
      error.value = e?.data?.message || e?.message || 'Kon data niet laden'
    } finally {
      isLoading.value = false
    }
    return data.value
  }

  return { data, isLoading, error, load }
}
