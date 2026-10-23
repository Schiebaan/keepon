import { g as useState, f as useSupabaseClient } from './server.mjs';

function useIntegrations() {
  const connected = useState("integrationConnected", () => ({}));
  const _loaded = useState("integrationConnectedLoaded", () => false);
  async function getAuthHeaders() {
    const supabase = useSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return (session == null ? void 0 : session.access_token) ? { Authorization: `Bearer ${session.access_token}` } : {};
  }
  async function loadStatus() {
    return;
  }
  return {
    // Signature keeps the partnerId parameter for backwards compatibility, but we ignore it.
    isConnected: (_partnerId, type) => !!connected.value[type],
    setConnected(_partnerId, type, value) {
      connected.value[type] = value;
    },
    getCredentials: (_partnerId, _type) => null,
    loadStatus,
    isLoaded: _loaded,
    async testAndSave(_partnerId, type, credentials) {
      const headers = await getAuthHeaders();
      const result = await $fetch("/api/integrations/test-credentials", {
        method: "POST",
        headers,
        body: { type, credentials }
      });
      if (result.success) {
        await $fetch("/api/integrations/credentials", {
          method: "POST",
          headers,
          body: { type, credentials }
        });
        connected.value[type] = true;
      }
      return result;
    },
    async disconnect(_partnerId, type) {
      const headers = await getAuthHeaders();
      await $fetch("/api/integrations/credentials", {
        method: "DELETE",
        headers,
        body: { type }
      }).catch(() => {
      });
      connected.value[type] = false;
    }
  };
}

export { useIntegrations as u };
//# sourceMappingURL=useIntegrations-BEERw8am.mjs.map
