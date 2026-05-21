<script setup lang="ts">
definePageMeta({ layout: false })

const config = useRuntimeConfig()
const { resolveRole } = useAuth()
const { partner } = usePartner()

const isSubdomain = typeof window !== 'undefined'
  && config.public.baseDomain
  && window.location.hostname !== config.public.baseDomain
  && window.location.hostname !== `www.${config.public.baseDomain}`
  && window.location.hostname.endsWith(config.public.baseDomain as string)

const status = ref<'loading' | 'error' | 'expired'>('loading')
const errorMessage = ref('')
// Customers see "Voorstel wordt geladen..." (no scary "logging you in" wording).
// Other roles see the neutral default.
const loadingText = ref('Voorstel wordt geladen...')

const resendEmail = ref('')
const resendState = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const resendError = ref('')

function parseHashParams(): URLSearchParams {
  if (typeof window === 'undefined') return new URLSearchParams()
  return new URLSearchParams(window.location.hash.slice(1))
}

onMounted(async () => {
  // 1) Check whether Supabase came back with an error in the hash
  const hash = parseHashParams()
  const errorCode = hash.get('error_code') || hash.get('error')
  const errorDesc = hash.get('error_description')

  if (errorCode) {
    if (errorCode === 'otp_expired' || errorCode === 'access_denied') {
      status.value = 'expired'
      errorMessage.value = 'De inloglink is verlopen of al gebruikt.'
    } else {
      status.value = 'error'
      errorMessage.value = errorDesc?.replace(/\+/g, ' ') || 'Er ging iets mis met inloggen.'
    }
    // Clean URL so the user can refresh without re-running the same hash
    history.replaceState(null, '', window.location.pathname)
    return
  }

  // 2) Happy path — consume the access_token from the hash and route directly.
  //    We DON'T go through `resolveRole()` here because that helper checks
  //    `useSupabaseUser().value` which doesn't update synchronously after
  //    setSession() — Vue's Ref lags behind the auth-state-change listener,
  //    causing a race where role comes back null in fresh incognito sessions.
  //    Instead we do the auth verification with the token we already have.
  const access_token = hash.get('access_token')
  const refresh_token = hash.get('refresh_token')

  let token = access_token || ''
  if (access_token && refresh_token) {
    try {
      const supabase = useSupabaseClient()
      await supabase.auth.setSession({ access_token, refresh_token })
      const { data: { session } } = await supabase.auth.getSession()
      token = session?.access_token || access_token
    } catch {
      // Fall through with the raw access_token — /api/auth/role can still verify it
    }
    history.replaceState(null, '', window.location.pathname)
  }

  try {
    let role: string | null = null
    let userMeta: any = null

    if (!token) {
      // No magic-link hash. Maybe the user is already authenticated via cookie
      // (Supabase module restored the session on page load). Pull the current
      // access_token directly from the client — bypass the useSupabaseUser ref
      // which can be null right after hydration.
      try {
        const supabase = useSupabaseClient()
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.access_token) token = session.access_token
      } catch {}
    }

    if (token) {
      // Direct call: bypass resolveRole's user-Ref check
      const data: any = await $fetch('/api/auth/role', {
        headers: { Authorization: `Bearer ${token}` },
      })
      role = data?.role || null

      // Also fetch the user once for onboarding-state routing
      try {
        const supabase = useSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser(token)
        userMeta = user?.user_metadata
      } catch {}
    } else {
      // No hash and no cookie session → user genuinely isn't logged in.
      // Send them to /login instead of showing a scary error.
      navigateTo('/login', { replace: true })
      return
    }

    switch (role) {
      case 'platform_admin':
        loadingText.value = 'Even geduld...'
        navigateTo(isSubdomain ? '/admin' : '/platform')
        break
      case 'partner_admin':
        loadingText.value = 'Even geduld...'
        navigateTo('/admin')
        break
      case 'customer': {
        const onb = userMeta?.onboarding
        // Customer with akkoord (accepted_at set) belongs in the portal. The
        // mandate is optional and is solved separately from there.
        // Only customers who haven't accepted yet are routed to the proposal.
        if (!onb?.accepted_at && (onb?.step === 'hero' || onb?.step === 'voorstel')) {
          navigateTo('/welkom/voorstel')
          return
        }
        navigateTo('/klant')
        break
      }
      default:
        // Unknown role: this can happen if the user record exists in Supabase
        // Auth but has no user_roles entry yet, or if the call to /api/auth/role
        // came back without one of the expected role values. Send the user to
        // /login rather than showing a scary error.
        navigateTo('/login', { replace: true })
        break
    }
  } catch (e: any) {
    status.value = 'error'
    errorMessage.value = e?.message || 'Er ging iets mis met inloggen.'
  }
})

async function handleResend() {
  if (!resendEmail.value || resendState.value === 'sending') return
  resendState.value = 'sending'
  resendError.value = ''
  try {
    // Use the partner-branded welkom-resend endpoint (30-day token + partner from-name)
    // so the customer receives the same mail style as their original welcome.
    await $fetch('/api/welkom/resend', {
      method: 'POST',
      body: { email: resendEmail.value },
    })
    resendState.value = 'sent'
  } catch (e: any) {
    resendState.value = 'error'
    resendError.value = e?.data?.message || 'Verzenden mislukt. Probeer het nogmaals.'
  }
}
</script>

<template>
  <div class="page" :style="partner?.primary_color ? `--brand: ${partner.primary_color};` : ''">
    <div class="card">
      <!-- Loading -->
      <template v-if="status === 'loading'">
        <div class="spinner" />
        <p class="loading-text">{{ loadingText }}</p>
      </template>

      <!-- Expired link -->
      <template v-else-if="status === 'expired'">
        <div class="icon-wrap icon-amber">
          <AppIcon name="clock" :size="32" />
        </div>
        <h1>Link verlopen</h1>
        <p class="subtitle">{{ errorMessage }}</p>
        <p class="hint">Geen probleem. Vul je e-mailadres in en we sturen je direct een nieuwe.</p>

        <div v-if="resendState !== 'sent'" class="resend-form">
          <input
            v-model="resendEmail"
            type="email"
            placeholder="je@email.nl"
            class="input"
            autocomplete="email"
            @keyup.enter="handleResend"
          />
          <button class="btn-primary" :disabled="!resendEmail || resendState === 'sending'" @click="handleResend">
            <span v-if="resendState === 'sending'" class="btn-spinner" />
            <AppIcon v-else name="send" :size="14" />
            {{ resendState === 'sending' ? 'Versturen...' : 'Stuur nieuwe link' }}
          </button>
          <p v-if="resendError" class="error">{{ resendError }}</p>
        </div>

        <div v-else class="success">
          <AppIcon name="check-circle" :size="20" />
          <div>
            <p><strong>Verstuurd!</strong></p>
            <p class="success-text">Open je inbox van <strong>{{ resendEmail }}</strong> en klik op de nieuwe knop.</p>
          </div>
        </div>
      </template>

      <!-- Generic error -->
      <template v-else>
        <div class="icon-wrap icon-red">
          <AppIcon name="alert-circle" :size="32" />
        </div>
        <h1>Inloggen niet gelukt</h1>
        <p class="subtitle">{{ errorMessage }}</p>

        <div v-if="resendState !== 'sent'" class="resend-form">
          <input
            v-model="resendEmail"
            type="email"
            placeholder="je@email.nl"
            class="input"
            autocomplete="email"
            @keyup.enter="handleResend"
          />
          <button class="btn-primary" :disabled="!resendEmail || resendState === 'sending'" @click="handleResend">
            <span v-if="resendState === 'sending'" class="btn-spinner" />
            <AppIcon v-else name="send" :size="14" />
            {{ resendState === 'sending' ? 'Versturen...' : 'Stuur nieuwe link' }}
          </button>
          <p v-if="resendError" class="error">{{ resendError }}</p>
        </div>

        <div v-else class="success">
          <AppIcon name="check-circle" :size="20" />
          <div>
            <p><strong>Verstuurd!</strong></p>
            <p class="success-text">Open je inbox van <strong>{{ resendEmail }}</strong>.</p>
          </div>
        </div>

        <NuxtLink to="/login" class="link-secondary">Of: log in met je wachtwoord</NuxtLink>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: linear-gradient(160deg, color-mix(in srgb, var(--brand, #111) 8%, white) 0%, #f9fafb 70%);
}
.card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 1.25rem;
  padding: 2.5rem 2rem;
  box-shadow: 0 4px 12px -2px rgba(0,0,0,0.06);
  text-align: center;
}

.spinner {
  width: 2rem; height: 2rem; margin: 0 auto;
  border: 2px solid #e5e7eb;
  border-top-color: var(--brand, #111);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.loading-text { margin-top: 1rem; color: #6b7280; font-size: 0.875rem; }

.icon-wrap {
  width: 4rem; height: 4rem; margin: 0 auto 1rem;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.icon-amber { background: #fef3c7; color: #d97706; }
.icon-red { background: #fee2e2; color: #dc2626; }

h1 { font-size: 1.375rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem; }
.subtitle { color: #4b5563; font-size: 0.95rem; margin: 0 0 0.5rem; }
.hint { color: #6b7280; font-size: 0.875rem; margin: 0 0 1.5rem; }

.resend-form { display: flex; flex-direction: column; gap: 0.625rem; text-align: left; }
.input {
  width: 100%; padding: 0.7rem 0.875rem;
  border: 1px solid #d1d5db; border-radius: 0.625rem;
  font-size: 0.95rem;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.input:focus { outline: 0; border-color: var(--brand, #2563eb); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand, #2563eb) 15%, transparent); }

.btn-primary {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.75rem 1rem; border: 0; border-radius: 0.625rem;
  background: #111827; color: white; font-weight: 600; font-size: 0.9rem;
  cursor: pointer; transition: background 0.15s, opacity 0.15s;
}
.btn-primary:hover:not(:disabled) { background: #1f2937; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-spinner { width: 0.875rem; height: 0.875rem; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }

.error { color: #b91c1c; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.8125rem; margin: 0; }

.success {
  display: flex; gap: 0.625rem; align-items: start; text-align: left;
  padding: 0.875rem 1rem;
  background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 0.625rem;
  color: #065f46;
}
.success svg { flex-shrink: 0; margin-top: 0.125rem; color: #059669; }
.success p { margin: 0; font-size: 0.8125rem; }
.success-text { color: #047857; margin-top: 0.125rem !important; }

.link-secondary { display: inline-block; margin-top: 1.25rem; font-size: 0.8125rem; color: #6b7280; text-decoration: none; }
.link-secondary:hover { color: #1f2937; text-decoration: underline; }

@keyframes spin { to { transform: rotate(360deg); } }
</style>
