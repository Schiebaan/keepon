<script setup lang="ts">
definePageMeta({ layout: false })

const tenant = useTenant()
useBranding()

const { signInWithMagicLink } = useAuth()

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
  <div class="flex min-h-screen items-center justify-center bg-brand-secondary px-4">
    <div class="w-full max-w-sm">
      <div class="card text-center">
        <!-- Logo & Name -->
        <div class="mb-6">
          <img
            v-if="tenant?.logo_url"
            :src="tenant.logo_url"
            :alt="tenant?.name"
            class="mx-auto mb-3 h-12 w-auto"
          >
          <h1 class="text-xl font-semibold text-gray-900">
            {{ tenant?.name || 'RunON' }}
          </h1>
          <p class="mt-1 text-sm text-gray-500">
            Log in op je portaal
          </p>
        </div>

        <!-- Sent confirmation -->
        <div v-if="isSent" class="rounded-lg bg-green-50 p-4">
          <p class="text-sm font-medium text-green-800">
            We hebben een inloglink gestuurd naar
          </p>
          <p class="mt-1 text-sm font-semibold text-green-900">
            {{ email }}
          </p>
          <p class="mt-2 text-xs text-green-700">
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
            <label for="email" class="label">E-mailadres</label>
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

          <p v-if="errorMessage" class="mt-2 text-sm text-red-600">
            {{ errorMessage }}
          </p>

          <button
            type="submit"
            class="btn-primary mt-4 w-full"
            :disabled="isSending"
          >
            {{ isSending ? 'Versturen...' : 'Inloglink versturen' }}
          </button>

          <p class="mt-4 text-xs text-gray-400">
            Je ontvangt een veilige inloglink per e-mail. Geen wachtwoord nodig.
          </p>
        </form>
      </div>
    </div>
  </div>
</template>
