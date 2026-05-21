// Integration credentials composable — Supabase backed.
// Tracks connection status by integration type. The logged-in user is always bound
// to one partner (session-scoped), so no need to scope by partner id in the key.
export function useIntegrations() {
  const connected = useState<Record<string, boolean>>('integrationConnected', () => ({}))
  const _loaded = useState<boolean>('integrationConnectedLoaded', () => false)

  async function getAuthHeaders() {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  /** Fetch current integration status from the server into shared state. */
  async function loadStatus() {
    if (typeof window === 'undefined') return
    const headers = await getAuthHeaders()
    if (!headers.Authorization) return
    try {
      const status = await $fetch<Record<string, boolean>>('/api/integrations/status', { headers })
      connected.value = status || {}
      _loaded.value = true
    } catch {
      connected.value = {}
    }
  }

  return {
    // Signature keeps the partnerId parameter for backwards compatibility, but we ignore it.
    isConnected: (_partnerId: string | null | undefined, type: string) => !!connected.value[type],
    setConnected(_partnerId: string | null | undefined, type: string, value: boolean) {
      connected.value[type] = value
    },
    getCredentials: (_partnerId: string, _type: string) => null,
    loadStatus,
    isLoaded: _loaded,

    async testAndSave(_partnerId: string, type: string, credentials: Record<string, string>) {
      const headers = await getAuthHeaders()
      const result = await $fetch('/api/integrations/test-credentials', {
        method: 'POST',
        headers,
        body: { type, credentials },
      })
      if (result.success) {
        await $fetch('/api/integrations/credentials', {
          method: 'POST',
          headers,
          body: { type, credentials },
        })
        connected.value[type] = true
      }
      return result
    },

    async disconnect(_partnerId: string, type: string) {
      const headers = await getAuthHeaders()
      await $fetch('/api/integrations/credentials', {
        method: 'DELETE',
        headers,
        body: { type },
      }).catch(() => {})
      connected.value[type] = false
    },
  }
}
