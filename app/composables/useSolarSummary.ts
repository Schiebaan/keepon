/**
 * Load the current customer's Sundata solar summary (plant + yields).
 * Shared state so both /klant and /klant/zonnepanelen show the same data
 * without a second request.
 */
export type ChartPeriod = 'week' | 'month' | 'year' | 'since_start' | 'custom'

export interface SolarSummary {
  connected: boolean
  reason?: string
  product?: { id: string; name: string; brand?: string; model?: string; notes?: string; installation_date?: string }
  plant?: { id: number; name: string; plant_code?: string; monitored_since?: string; address?: { street: string; postal_code: string; city: string } | null } | null
  meter?: { id: number; peak_in_watt?: number; orientation_in_degrees?: number; angle_in_degrees?: number; operational_since?: string } | null
  yield?: {
    today_wh: number
    today_reported: boolean
    has_any_recent_data: boolean
    month_wh: number
    year_wh: number
    month_predicted_wh: number
    history_daily: { date: string; wh: number }[]
  }
  chart?: {
    period: ChartPeriod
    start: string
    end: string
    bucket: 'day' | 'month'
    data: { date: string; wh: number }[]
  }
}

export function useSolarSummary() {
  const summary = useState<SolarSummary | null>('solarSummary', () => null)
  const isLoading = useState<boolean>('solarSummaryLoading', () => false)
  const _loaded = useState<boolean>('solarSummaryLoaded', () => false)
  const currentPeriod = useState<ChartPeriod>('solarSummaryPeriod', () => 'month')

  async function load(opts: { force?: boolean; period?: ChartPeriod; startDate?: string; endDate?: string } = {}) {
    if (typeof window === 'undefined') return
    if (_loaded.value && !opts.force && !opts.period) return
    isLoading.value = true
    try {
      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return
      const params: Record<string, string> = {}
      if (opts.period) {
        params.chart_period = opts.period
        currentPeriod.value = opts.period
      }
      if (opts.startDate) params.start_date = opts.startDate
      if (opts.endDate) params.end_date = opts.endDate
      const qs = Object.keys(params).length ? '?' + new URLSearchParams(params).toString() : ''
      const data = await $fetch<SolarSummary>('/api/customer/solar-summary' + qs, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      summary.value = data
      _loaded.value = true
    } catch {
      summary.value = { connected: false, reason: 'fetch_failed' }
    } finally {
      isLoading.value = false
    }
  }

  return {
    summary,
    isLoading,
    currentPeriod,
    load,
    refresh: () => load({ force: true }),
    setPeriod: (period: ChartPeriod, startDate?: string, endDate?: string) =>
      load({ force: true, period, startDate, endDate }),
  }
}
