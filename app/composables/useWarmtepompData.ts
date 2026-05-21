export interface WarmtepompData {
  linked: boolean
  heatpump_id?: string
  serial_number?: string | null
  model?: string | number | null
  part_number?: string | null
  commissioned_at?: string | null

  state?: string
  state_label?: string
  state_hint?: string | null
  state_tone?: 'idle' | 'standby' | 'heating' | 'error'
  online?: boolean
  last_update?: string | null

  rpm?: number | null
  air_in_c?: number | null
  water_out_c?: number | null
  water_return_c?: number | null
  water_house_in_c?: number | null
  room_c?: number | null
  room_target_c?: number | null
  compressor_in_c?: number | null
  compressor_out_c?: number | null
  signal_strength?: number | null

  lifetime_kwh_in?: number
  lifetime_kwh_out?: number
  scop?: number

  days_active?: number | null
  avg_kwh_out_per_day?: number | null
  avg_kwh_in_per_day?: number | null

  week?: { kwh_in: number; kwh_out: number } | null
  month?: { kwh_in: number; kwh_out: number } | null

  savings?: {
    gas_m3_avoided: number
    gas_cost_avoided_eur: number
    electricity_cost_eur: number
    net_savings_eur: number
  }

  breakdown_in?: {
    heating: number
    standby: number
    dhw: number
    defrost: number
    cooling: number
  } | null

  error?: string
}

/**
 * Live Weheat data for the current customer's heat pump. Shared between the
 * /klant home card and /klant/warmtepomp deep page.
 */
export function useWarmtepompData() {
  const data = useState<WarmtepompData | null>('warmtepompData', () => null)
  const isLoading = useState('warmtepompLoading', () => false)
  const error = useState('warmtepompError', () => '')
  const _loaded = useState('warmtepompLoaded', () => false)

  async function load(force = false): Promise<WarmtepompData | null> {
    if (_loaded.value && !force) return data.value
    if (typeof window === 'undefined') return null
    isLoading.value = true
    error.value = ''
    try {
      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) { isLoading.value = false; return null }
      data.value = await $fetch<WarmtepompData>('/api/customer/warmtepomp-data', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        // force=true (user clicked refresh) → bypass server-side 60s cache
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
