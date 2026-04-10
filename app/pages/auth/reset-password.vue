<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()

const newPassword = ref('')
const confirmPassword = ref('')
const isSaving = ref(false)
const isDone = ref(false)
const isLoading = ref(true)
const sessionReady = ref(false)
const errorMessage = ref('')

// On mount: Supabase sends the user here with tokens in the URL hash
// We need to let Supabase client process the hash to establish a session
onMounted(async () => {
  try {
    // Supabase JS client auto-detects the hash tokens and establishes a session
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      errorMessage.value = 'Ongeldige of verlopen resetlink. Vraag een nieuwe aan.'
    } else if (data.session) {
      sessionReady.value = true
    } else {
      // Sometimes the hash needs a moment to be processed
      await new Promise(resolve => setTimeout(resolve, 1000))
      const { data: retry } = await supabase.auth.getSession()
      if (retry.session) {
        sessionReady.value = true
      } else {
        errorMessage.value = 'Sessie kon niet worden hersteld. Vraag een nieuwe resetlink aan.'
      }
    }
  } catch {
    errorMessage.value = 'Er ging iets mis. Probeer het opnieuw.'
  } finally {
    isLoading.value = false
  }
})

async function handleReset() {
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
  } catch (err: any) {
    errorMessage.value = err.message || 'Er ging iets mis. Probeer het opnieuw.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <div class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center">
        <div class="mb-6">
          <div
            class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white text-xl font-bold"
          >
            U
          </div>
          <h1 class="text-xl font-semibold text-gray-900">UPsol</h1>
          <p class="mt-1 text-sm text-gray-500">Nieuw wachtwoord instellen</p>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="py-8">
          <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          <p class="mt-3 text-sm text-gray-500">Resetlink verifiëren...</p>
        </div>

        <!-- Session error -->
        <div v-else-if="!sessionReady && !isDone" class="rounded-xl bg-red-50 p-5 text-left">
          <p class="text-sm text-red-700">{{ errorMessage || 'De resetlink is ongeldig of verlopen.' }}</p>
          <NuxtLink
            to="/login"
            class="mt-4 inline-block text-sm text-red-700 underline hover:text-red-900"
          >
            Terug naar inloggen
          </NuxtLink>
        </div>

        <!-- Success -->
        <div v-else-if="isDone" class="rounded-xl bg-green-50 p-5 text-left">
          <div class="flex items-center gap-2 mb-2">
            <AppIcon name="check-circle" :size="20" class="text-green-600" />
            <p class="text-sm font-semibold text-green-800">Wachtwoord gewijzigd</p>
          </div>
          <p class="text-sm text-green-700">
            Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen.
          </p>
          <NuxtLink
            to="/login"
            class="mt-4 inline-block text-sm text-green-700 underline hover:text-green-900"
          >
            Naar inloggen
          </NuxtLink>
        </div>

        <!-- Reset form -->
        <form v-else @submit.prevent="handleReset">
          <div class="text-left">
            <label for="new-password" class="block text-xs font-medium text-gray-500 mb-1.5">Nieuw wachtwoord</label>
            <input
              id="new-password"
              v-model="newPassword"
              type="password"
              class="input"
              placeholder="Minimaal 8 tekens"
              required
              autocomplete="new-password"
            >
          </div>

          <div class="mt-3 text-left">
            <label for="confirm-password" class="block text-xs font-medium text-gray-500 mb-1.5">Bevestig wachtwoord</label>
            <input
              id="confirm-password"
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
            <span v-if="isSaving" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Opslaan...
            </span>
            <span v-else>Wachtwoord opslaan</span>
          </button>
        </form>
      </div>

      <p class="mt-6 text-center text-xs text-gray-400">
        Beveiligd door UPsol
      </p>
    </div>
  </div>
</template>
