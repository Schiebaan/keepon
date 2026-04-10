// Integration credentials composable — Supabase backed
export function useIntegrations() {
  // Track connected integrations in state
  const connected = useState<Record<string, boolean>>('integrationConnected', () => ({}))

  async function getAuthHeaders() {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
  }

  return {
    isConnected: (partnerId: string, type: string) => connected.value[`${partnerId}:${type}`] || false,

    setConnected(partnerId: string, type: string, value: boolean) {
      connected.value[`${partnerId}:${type}`] = value
    },

    getCredentials: (partnerId: string, type: string) => null, // credentials are server-side only

    async testAndSave(partnerId: string, type: string, credentials: Record<string, string>) {
      const headers = await getAuthHeaders()

      // Test credentials
      const result = await $fetch('/api/integrations/test-credentials', {
        method: 'POST',
        headers,
        body: { type, credentials },
      })

      if (result.success) {
        // Save to Supabase
        await $fetch('/api/integrations/credentials', {
          method: 'POST',
          headers,
          body: { type, credentials },
        })
        connected.value[`${partnerId}:${type}`] = true
      }

      return result
    },

    async disconnect(partnerId: string, type: string) {
      const headers = await getAuthHeaders()
      await $fetch('/api/integrations/credentials', {
        method: 'DELETE',
        headers,
        body: { type },
      }).catch(() => {})
      connected.value[`${partnerId}:${type}`] = false
    },
  }
}
