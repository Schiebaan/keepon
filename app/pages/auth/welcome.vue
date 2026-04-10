<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const { partner } = usePartner()

const newPassword = ref('')
const confirmPassword = ref('')
const isSaving = ref(false)
const isReady = ref(false)
const isDone = ref(false)
const errorMessage = ref('')
const skipPassword = ref(false)

// Process the magic link tokens from the URL hash
onMounted(async () => {
  try {
    const hash = window.location.hash.substring(1)
    if (!hash) {
      errorMessage.value = 'Geen geldige link. Vraag je installateur om een nieuwe uitnodiging.'
      return
    }

    // Parse the hash parameters
    const params = new URLSearchParams(hash)
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (accessToken && refreshToken) {
      // Set the session from the hash tokens
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      if (error) {
        errorMessage.value = 'De link is verlopen. Vraag je installateur om een nieuwe uitnodiging.'
      } else {
        isReady.value = true
        // Clean up the hash from the URL
        window.history.replaceState(null, '', window.location.pathname)
      }
    } else {
      // Maybe the session was already set by the Supabase module
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        isReady.value = true
      } else {
        errorMessage.value = 'De link is verlopen. Vraag je installateur om een nieuwe uitnodiging.'
      }
    }
  } catch {
    errorMessage.value = 'Er ging iets mis. Probeer het opnieuw.'
  }
})

async function handleSetPassword() {
  errorMessage.value = ''

  if (newPassword.value.length < 8) {
    errorMessage.value = 'Wachtwoord moet minimaal 8 tekens zijn.'
    return
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Wachtwoorden komen niet overeen.'
    return
  }

  isSaving.value = true
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword.value })
    if (error) throw error
    isDone.value = true
    setTimeout(() => {
      navigateTo('/auth/callback', { replace: true })
    }, 2000)
  } catch (err: any) {
    errorMessage.value = err.message || 'Opslaan mislukt.'
  } finally {
    isSaving.value = false
  }
}

function handleSkip() {
  navigateTo('/auth/callback', { replace: true })
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <div class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center">
        <!-- Logo -->
        <div class="mb-6">
          <img
            v-if="partner?.logo_url"
            :src="partner.logo_url"
            :alt="partner?.name"
            class="mx-auto mb-3 h-12 w-auto rounded-xl"
          >
          <div
            v-else
            class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white text-xl font-bold"
          >
            {{ partner?.name?.charAt(0) || 'U' }}
          </div>
        </div>

        <!-- Loading -->
        <div v-if="!isReady && !errorMessage" class="py-8">
          <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <p class="mt-3 text-sm text-gray-500">Even geduld...</p>
        </div>

        <!-- Link expired/error -->
        <div v-else-if="errorMessage && !isReady" class="text-left">
          <div class="rounded-xl bg-red-50 p-5">
            <p class="text-sm text-red-700">{{ errorMessage }}</p>
            <NuxtLink to="/login" class="mt-3 inline-block text-sm text-red-700 underline">
              Naar inlogpagina
            </NuxtLink>
          </div>
        </div>

        <!-- Success: password set -->
        <div v-else-if="isDone">
          <div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <AppIcon name="check-circle" :size="28" class="text-green-600" />
          </div>
          <h2 class="text-lg font-semibold text-gray-900">Welkom!</h2>
          <p class="mt-1 text-sm text-gray-500">Je wachtwoord is ingesteld. Je wordt doorgestuurd...</p>
        </div>

        <!-- Set password form -->
        <template v-else-if="isReady">
          <h2 class="text-lg font-semibold text-gray-900 mb-1">Welkom!</h2>
          <p class="text-sm text-gray-500 mb-6">
            Stel een wachtwoord in zodat je voortaan makkelijk kunt inloggen.
          </p>

          <form @submit.prevent="handleSetPassword" class="text-left">
            <div>
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Wachtwoord</label>
              <input
                v-model="newPassword"
                type="password"
                class="input"
                placeholder="Minimaal 8 tekens"
                required
                autocomplete="new-password"
              >
            </div>

            <div class="mt-3">
              <label class="block text-xs font-medium text-gray-500 mb-1.5">Bevestig wachtwoord</label>
              <input
                v-model="confirmPassword"
                type="password"
                class="input"
                placeholder="Herhaal je wachtwoord"
                required
                autocomplete="new-password"
              >
            </div>

            <p v-if="errorMessage" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {{ errorMessage }}
            </p>

            <button
              type="submit"
              class="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
              :disabled="isSaving"
            >
              {{ isSaving ? 'Opslaan...' : 'Wachtwoord instellen' }}
            </button>
          </form>

          <button
            class="mt-3 text-xs text-gray-400 hover:text-gray-600"
            @click="handleSkip"
          >
            Overslaan — ik stel later een wachtwoord in
          </button>
        </template>
      </div>

      <p class="mt-6 text-center text-xs text-gray-400">
        Beveiligd door UPsol
      </p>
    </div>
  </div>
</template>
