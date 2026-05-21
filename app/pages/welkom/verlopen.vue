<script setup lang="ts">
definePageMeta({ layout: false })
const route = useRoute()
const { partner } = usePartner()

const reason = computed(() => (route.query.reason as string) || 'unknown')
const reasonText = computed(() => {
  switch (reason.value) {
    case 'expired':       return 'Deze welkomstlink is verlopen.'
    case 'bad_signature': return 'Deze welkomstlink is ongeldig.'
    case 'malformed':     return 'De link in je e-mail is beschadigd.'
    case 'missing':       return 'We hebben geen e-mailadres voor dit account.'
    case 'generate':      return 'Het lukt nu even niet om je in te loggen.'
    default:              return 'Je welkomstlink werkt niet meer.'
  }
})

const resendEmail = ref('')
const resendState = ref<'idle' | 'sending' | 'sent' | 'error'>('idle')
const resendError = ref('')

async function handleResend() {
  if (!resendEmail.value || resendState.value === 'sending') return
  resendState.value = 'sending'
  resendError.value = ''
  try {
    // Use the partner-branded welkom-resend endpoint so the customer receives the
    // same welcome mail they originally got (30-day token, partner from-name).
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
      <div class="icon-wrap">
        <AppIcon name="clock" :size="32" />
      </div>
      <h1>Link verlopen</h1>
      <p class="subtitle">{{ reasonText }}</p>
      <p class="hint">Geen probleem. Vul je e-mailadres in en we sturen je direct een nieuwe.</p>

      <div v-if="resendState !== 'sent'" class="resend">
        <input
          v-model="resendEmail"
          type="email"
          placeholder="je@email.nl"
          class="input"
          autocomplete="email"
          @keyup.enter="handleResend"
        />
        <button class="btn" :disabled="!resendEmail || resendState === 'sending'" @click="handleResend">
          <span v-if="resendState === 'sending'" class="spinner" />
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
.icon-wrap {
  width: 4rem; height: 4rem; margin: 0 auto 1rem;
  border-radius: 50%; background: #fef3c7; color: #d97706;
  display: flex; align-items: center; justify-content: center;
}
h1 { font-size: 1.375rem; font-weight: 700; color: #111827; margin: 0 0 0.5rem; }
.subtitle { color: #4b5563; font-size: 0.95rem; margin: 0 0 0.5rem; }
.hint { color: #6b7280; font-size: 0.875rem; margin: 0 0 1.5rem; }

.resend { display: flex; flex-direction: column; gap: 0.625rem; text-align: left; }
.input {
  width: 100%; padding: 0.7rem 0.875rem;
  border: 1px solid #d1d5db; border-radius: 0.625rem;
  font-size: 0.95rem;
}
.input:focus { outline: 0; border-color: var(--brand, #2563eb); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand, #2563eb) 15%, transparent); }
.btn {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  padding: 0.75rem 1rem; border: 0; border-radius: 0.625rem;
  background: #111827; color: white; font-weight: 600; font-size: 0.9rem;
  cursor: pointer; transition: background 0.15s, opacity 0.15s;
}
.btn:hover:not(:disabled) { background: #1f2937; }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.spinner { width: 0.875rem; height: 0.875rem; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
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
</style>
