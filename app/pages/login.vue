<script setup lang="ts">
definePageMeta({ layout: false })

const config = useRuntimeConfig()
const { signInWithMagicLink, user } = useAuth()

// If already logged in, redirect
if (user.value) {
  navigateTo('/')
}

// Try to get partner branding for the login page
const partner = config.public.demoMode
  ? useMockData().partner
  : null

const email = ref('')
const isSending = ref(false)
const isSent = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!email.value) return

  isSending.value = true
  errorMessage.value = ''

  try {
    await signInWithMagicLink(email.value)
    isSent.value = true
  } catch (err: any) {
    errorMessage.value = err.message || 'Er ging iets mis. Probeer het opnieuw.'
  } finally {
    isSending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <div class="w-full max-w-sm">
      <div class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center">
        <!-- Logo & Name -->
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
            K
          </div>
          <h1 class="text-xl font-semibold text-gray-900">
            {{ partner?.name || 'RunON' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Log in op je portaal
          </p>
        </div>

        <!-- Sent confirmation -->
        <div v-if="isSent" class="rounded-xl bg-green-50 p-5 text-left">
          <div class="flex items-center gap-2 mb-2">
            <AppIcon name="check-circle" :size="20" class="text-green-600" />
            <p class="text-sm font-semibold text-green-800">Inloglink verstuurd</p>
          </div>
          <p class="text-sm text-green-700">
            We hebben een link gestuurd naar <strong>{{ email }}</strong>.
            Controleer je inbox en klik op de link om in te loggen.
          </p>
          <button
            class="mt-4 text-sm text-green-700 underline hover:text-green-900"
            @click="isSent = false"
          >
            Ander e-mailadres gebruiken
          </button>
        </div>

        <!-- Login form -->
        <form v-else @submit.prevent="handleLogin">
          <div class="text-left">
            <label for="email" class="block text-xs font-medium text-gray-500 mb-1.5">E-mailadres</label>
            <input
              id="email"
              v-model="email"
              type="email"
              class="input"
              placeholder="je@email.nl"
              required
              autocomplete="email"
            >
          </div>

          <p v-if="errorMessage" class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"
            :disabled="isSending"
          >
            <span v-if="isSending" class="flex items-center justify-center gap-2">
              <svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Versturen...
            </span>
            <span v-else>Inloglink versturen</span>
          </button>

          <p class="mt-4 text-xs text-gray-400">
            Je ontvangt een veilige inloglink per e-mail. Geen wachtwoord nodig.
          </p>
        </form>
      </div>

      <p class="mt-6 text-center text-xs text-gray-400">
        Beveiligd door RunON
      </p>
    </div>
  </div>
</template>
