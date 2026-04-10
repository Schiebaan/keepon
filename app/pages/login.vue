<script setup lang="ts">
definePageMeta({ layout: false })

const config = useRuntimeConfig()
const { signInWithMagicLink, signInWithPassword, resetPassword, user } = useAuth()

// Get partner branding (works on subdomains without auth)
const { partner } = usePartner()

// If already logged in, redirect
if (user.value) {
  navigateTo('/auth/callback', { replace: true })
}

const loginMode = ref<'password' | 'magic'>('password')
const email = ref('')
const password = ref('')
const isSending = ref(false)
const isSent = ref(false)
const isResetSent = ref(false)
const showResetForm = ref(false)
const errorMessage = ref('')

async function handleReset() {
  if (!email.value) return

  isSending.value = true
  errorMessage.value = ''

  try {
    await resetPassword(email.value)
    isResetSent.value = true
  } catch (err: any) {
    errorMessage.value = err.message || 'Er ging iets mis. Probeer het opnieuw.'
  } finally {
    isSending.value = false
  }
}

async function handleLogin() {
  if (!email.value) return

  isSending.value = true
  errorMessage.value = ''

  try {
    if (loginMode.value === 'magic') {
      await signInWithMagicLink(email.value)
      isSent.value = true
    } else {
      if (!password.value) {
        isSending.value = false
        return
      }
      await signInWithPassword(email.value, password.value)
      // Force hard navigation — prevents Vue re-render from swallowing the redirect
      window.location.href = '/auth/callback'
      return
    }
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
            {{ partner?.name || 'UPsol' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Log in op je portaal
          </p>
        </div>

        <!-- Password reset sent confirmation -->
        <div v-if="isResetSent" class="rounded-xl bg-blue-50 p-5 text-left">
          <div class="flex items-center gap-2 mb-2">
            <AppIcon name="check-circle" :size="20" class="text-blue-600" />
            <p class="text-sm font-semibold text-blue-800">Herstelmail verstuurd</p>
          </div>
          <p class="text-sm text-blue-700">
            We hebben een link gestuurd naar <strong>{{ email }}</strong> om je wachtwoord te herstellen.
            Controleer je inbox (en spam).
          </p>
          <button
            class="mt-4 text-sm text-blue-700 underline hover:text-blue-900"
            @click="isResetSent = false; showResetForm = false"
          >
            Terug naar inloggen
          </button>
        </div>

        <!-- Magic link sent confirmation -->
        <div v-else-if="isSent" class="rounded-xl bg-green-50 p-5 text-left">
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

        <!-- Password reset form -->
        <div v-else-if="showResetForm">
          <form @submit.prevent="handleReset">
            <p class="mb-4 text-sm text-gray-600">
              Vul je e-mailadres in. We sturen je een link om je wachtwoord te herstellen.
            </p>
            <div class="text-left">
              <label for="reset-email" class="block text-xs font-medium text-gray-500 mb-1.5">E-mailadres</label>
              <input
                id="reset-email"
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
              <span v-else>Herstelmail versturen</span>
            </button>

            <button
              type="button"
              class="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
              @click="showResetForm = false; errorMessage = ''"
            >
              Terug naar inloggen
            </button>
          </form>
        </div>

        <!-- Login form -->
        <div v-else>
          <!-- Login mode tabs -->
          <div class="mb-5 flex rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              class="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              :class="loginMode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              @click="loginMode = 'password'; errorMessage = ''"
            >
              Wachtwoord
            </button>
            <button
              type="button"
              class="flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              :class="loginMode === 'magic' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              @click="loginMode = 'magic'; errorMessage = ''"
            >
              Magic link
            </button>
          </div>

          <form @submit.prevent="handleLogin">
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

            <div v-if="loginMode === 'password'" class="mt-3 text-left">
              <label for="password" class="block text-xs font-medium text-gray-500 mb-1.5">Wachtwoord</label>
              <input
                id="password"
                v-model="password"
                type="password"
                class="input"
                placeholder="Je wachtwoord"
                required
                autocomplete="current-password"
              >
              <button
                type="button"
                class="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                @click="showResetForm = true; errorMessage = ''"
              >
                Wachtwoord vergeten?
              </button>
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
                {{ loginMode === 'magic' ? 'Versturen...' : 'Inloggen...' }}
              </span>
              <span v-else>{{ loginMode === 'magic' ? 'Inloglink versturen' : 'Inloggen' }}</span>
            </button>

            <p v-if="loginMode === 'magic'" class="mt-4 text-xs text-gray-400">
              Je ontvangt een veilige inloglink per e-mail. Geen wachtwoord nodig.
            </p>
          </form>
        </div>
      </div>

      <p class="mt-6 text-center text-xs text-gray-400">
        Beveiligd door UPsol
      </p>
    </div>
  </div>
</template>
