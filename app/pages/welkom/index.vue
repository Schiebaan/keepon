<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['auth'] })

const { state, load } = useOnboarding()

onMounted(async () => {
  // Defensive: if Supabase ever drops a magic-link hash on us, consume it and clean the URL
  if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
    try {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const access_token = params.get('access_token')
      const refresh_token = params.get('refresh_token')
      if (access_token && refresh_token) {
        const supabase = useSupabaseClient()
        await supabase.auth.setSession({ access_token, refresh_token })
      }
    } catch { /* ignore */ }
    history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  // Customers never see this page on the happy path (callback routes them
  // straight to /welkom/voorstel). This handler is purely a defensive
  // fallback for stale links or refreshes that land on the bare /welkom URL.
  const s = await load()
  if (!s) {
    // Not logged in or no customer record — auth middleware will redirect.
    return
  }

  // Honor acceptance status as the source of truth. Step alone could drift.
  if (s.mandate_at || s.mandate_skipped) {
    navigateTo('/klant')
  } else if (s.accepted_at) {
    navigateTo('/klant')
  } else {
    navigateTo('/welkom/voorstel')
  }
})
</script>

<template>
  <div class="loading-page">
    <div class="spinner" />
  </div>
</template>

<style scoped>
.loading-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}
.spinner {
  width: 2rem; height: 2rem;
  border: 2px solid #e2e8f0;
  border-top-color: #64748b;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
