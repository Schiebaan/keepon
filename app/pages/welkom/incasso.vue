<script setup lang="ts">
definePageMeta({ layout: false, middleware: ['auth'] })

const { state, isLoading, load, submitMandate, formatPrice, targetRouteForStep } = useOnboarding()
const route = useRoute()
const supabase = useSupabaseClient()

// Terugkeer van de bank: ?mandate=pending. Dan eerst controleren hoe het is
// afgelopen, vóór we de klant ergens heen sturen.
const returningFromBank = ref(route.query.mandate === 'pending')
const checkingReturn = ref(false)

onMounted(async () => {
  if (returningFromBank.value) {
    await handleBankReturn()
    return
  }
  const s = await load()
  if (!s) return
  // Customer must have given akkoord before they can land on this incasso page.
  // Once mandate is set OR skipped the page is no longer relevant; the customer
  // has already made their choice and should go to their portal.
  if (!s.accepted_at) {
    navigateTo('/welkom/voorstel')
  } else if (s.mandate_at || s.mandate_skipped) {
    navigateTo('/klant')
  }
})

async function authHeaders() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Niet ingelogd')
  return { Authorization: `Bearer ${session.access_token}` }
}

/**
 * De klant is terug van zijn bank. Mollie's webhook is leidend maar kan een
 * paar seconden later komen, dus vragen we het zelf een paar keer na voordat
 * we concluderen dat het niet gelukt is.
 */
async function handleBankReturn() {
  checkingReturn.value = true
  try {
    for (let poging = 0; poging < 5; poging++) {
      const r = await $fetch<{ status: string; mandate: boolean }>(
        '/api/customer/onboarding/mandate-ideal-status',
        { headers: await authHeaders() },
      )
      if (r.mandate) {
        await load(true)
        return navigateTo('/welkom/klaar')
      }
      // open/pending = bank is nog bezig. Afgebroken of mislukt heeft geen zin
      // om op te wachten.
      if (['failed', 'canceled', 'expired'].includes(r.status)) break
      await new Promise(res => setTimeout(res, 1500))
    }
    submitError.value = 'De machtiging is niet afgerond. Probeer het opnieuw, of vul je IBAN handmatig in.'
  } catch {
    submitError.value = 'We konden de status van je machtiging niet ophalen. Probeer het opnieuw.'
  } finally {
    checkingReturn.value = false
    returningFromBank.value = false
    await load(true)
  }
}

const startingIdeal = ref(false)
const showManual = ref(false)

async function startIdeal() {
  if (startingIdeal.value) return
  startingIdeal.value = true
  submitError.value = ''
  try {
    const r = await $fetch<{ checkout_url: string }>('/api/customer/onboarding/mandate-ideal', {
      method: 'POST',
      headers: await authHeaders(),
    })
    window.location.href = r.checkout_url
  } catch (e: any) {
    submitError.value = e?.data?.message || 'Kon iDEAL niet starten. Vul je IBAN handmatig in.'
    showManual.value = true
    startingIdeal.value = false
  }
}

const partner = computed(() => state.value?.partner)
const totalMonthly = computed(() => state.value?.proposal?.total_monthly_cents || 0)

const iban = ref('')
const accountHolder = ref('')
const submitting = ref(false)
const submitError = ref('')

function formatIban(s: string) {
  return s.replace(/\s+/g, '').toUpperCase().replace(/(.{4})/g, '$1 ').trim()
}

watch(iban, (v) => {
  const formatted = formatIban(v)
  if (formatted !== v) iban.value = formatted
})

// Loose Dutch IBAN check: NL + 2 digits + 4 letters + 10 digits.
// Keep it client-only and lenient; the backend re-validates strictly.
const ibanLooksValid = computed(() => {
  const v = iban.value.replace(/\s+/g, '').toUpperCase()
  return /^NL\d{2}[A-Z]{4}\d{10}$/.test(v)
})

async function handleSubmit(skip = false) {
  if (submitting.value) return
  submitting.value = true
  submitError.value = ''
  try {
    await submitMandate(skip ? { skip: true } : { iban: iban.value, account_holder: accountHolder.value })
    navigateTo('/welkom/klaar')
  } catch (e: any) {
    submitError.value = e?.data?.message || 'Versturen mislukt. Probeer het nogmaals.'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="page" :style="partner?.primary_color ? `--brand: ${partner.primary_color};` : ''">
    <div class="container">
      <header class="header">
        <NuxtLink to="/welkom/voorstel" class="back-link">
          <AppIcon name="chevron-right" :size="14" class="rotate-180" />
          Terug
        </NuxtLink>
        <div class="brand">
          <img v-if="partner?.logo_url" :src="partner.logo_url" alt="" aria-hidden="true" class="logo" />
          <span class="brand-name">{{ partner?.name }}</span>
        </div>
        <span class="step-marker" aria-label="Optionele stap">Incasso</span>
      </header>

      <!-- Terug van de bank: we vragen Mollie na of de machtiging rond is. -->
      <div v-if="checkingReturn" class="text-center py-16">
        <div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
        <p class="mt-4 text-sm font-medium text-gray-900">Je machtiging wordt bevestigd</p>
        <p class="mt-1 text-sm text-gray-500">Even geduld, dit duurt een paar seconden.</p>
      </div>

      <div v-else-if="isLoading && !state" class="text-center py-16">
        <div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
      </div>

      <template v-else>
        <div class="title-block">
          <p class="eyebrow">Bijna klaar</p>
          <h1 class="title">Automatische incasso</h1>
          <p class="subtitle">
            Eén afschrijving per maand, geen omkijken naar. Veilig geregeld via Mollie en
            volgens SEPA. Je kunt elke incasso binnen 8 weken kosteloos terugdraaien.
          </p>
        </div>

        <div class="card">
          <div class="amount-row">
            <div>
              <p class="amount-label">Maandelijks bedrag</p>
              <p class="amount">€{{ formatPrice(totalMonthly) }}</p>
              <p class="amount-note">Eerste afschrijving volgende maand</p>
            </div>
            <div class="badge">
              <AppIcon name="shield" :size="14" />
              SEPA via Mollie
            </div>
          </div>

          <p v-if="submitError" class="error" role="alert" aria-live="assertive">{{ submitError }}</p>

          <!-- Standaardroute: iDEAL. De klant bevestigt bij zijn eigen bank,
               waardoor het rekeningnummer geverifieerd is in plaats van
               ingetypt. -->
          <template v-if="!showManual">
            <button type="button" class="btn-primary" :disabled="startingIdeal" @click="startIdeal">
              <span v-if="startingIdeal" class="spinner" />
              <AppIcon v-else name="shield" :size="16" />
              {{ startingIdeal ? 'Je gaat naar je bank...' : 'Machtigen via iDEAL' }}
            </button>

            <ul class="ideal-steps">
              <li>Je kiest je eigen bank en logt in zoals je gewend bent.</li>
              <li>We schrijven <strong>€0,01</strong> af om je rekening te bevestigen.</li>
              <li>Daarna loopt de maandelijkse incasso vanzelf.</li>
            </ul>

            <button type="button" class="btn-link" @click="showManual = true">
              Liever je IBAN zelf invullen?
            </button>
            <button type="button" class="btn-secondary" @click="handleSubmit(true)" :disabled="submitting">
              Nu nog niet, doe ik later
            </button>
          </template>

          <!-- Terugvaloptie: handmatig IBAN. Voor zakelijke rekeningen zonder
               iDEAL, of als iDEAL onverhoopt niet beschikbaar is. -->
          <form v-else class="form" @submit.prevent="handleSubmit(false)">
            <div class="field">
              <label>IBAN</label>
              <input v-model="iban" type="text" placeholder="NL91 ABNA 0417 1643 00" maxlength="34" autocomplete="off" />
              <p class="field-hint">Het rekeningnummer waarvan we mogen incasseren</p>
            </div>
            <div class="field">
              <label>Naam op rekening</label>
              <input v-model="accountHolder" type="text" placeholder="J. de Vries" autocomplete="name" />
            </div>

            <p class="manual-note">
              <AppIcon name="warning" :size="14" />
              Controleer het nummer goed — we kunnen het hier niet bij je bank verifiëren.
            </p>

            <button type="submit" class="btn-primary" :disabled="submitting || !ibanLooksValid || !accountHolder">
              <span v-if="submitting" class="spinner" />
              <AppIcon v-else name="check" :size="16" />
              {{ submitting ? 'Bezig...' : 'Mandaat verlenen' }}
            </button>

            <button type="button" class="btn-link" @click="showManual = false">
              Toch via iDEAL, dat is veiliger
            </button>
            <button type="button" class="btn-secondary" @click="handleSubmit(true)" :disabled="submitting">
              Nu nog niet, doe ik later
            </button>
          </form>
        </div>

        <div class="reassurance">
          <div class="reassurance-item">
            <AppIcon name="shield" :size="16" />
            <div>
              <p class="reassurance-title">Veilig</p>
              <p class="reassurance-text">Je gegevens gaan rechtstreeks naar Mollie, een Nederlandse betaalverwerker.</p>
            </div>
          </div>
          <div class="reassurance-item">
            <AppIcon name="zap" :size="16" />
            <div>
              <p class="reassurance-title">Geen verrassingen</p>
              <p class="reassurance-text">Bij elke incasso krijg je een mail. Niet eens? Tot 8 weken terugdraaien.</p>
            </div>
          </div>
        </div>

        <p class="explainer">
          Het mandaat geef je af aan <strong>UPsol B.V.</strong> namens je servicecontract met {{ partner?.name }}.
        </p>
      </template>
    </div>
  </div>
</template>

<style scoped>
.page { min-height: 100vh; background: #f9fafb; padding: 1.5rem 1rem 4rem; }
.container { max-width: 560px; margin: 0 auto; }
.header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
.back-link { display: inline-flex; align-items: center; gap: 0.25rem; font-size: 0.875rem; color: #6b7280; text-decoration: none; }
.back-link:hover { color: #1f2937; }
.brand { display: flex; align-items: center; gap: 0.5rem; }
.logo { height: 3rem; max-width: 12rem; object-fit: contain; }
.brand-name { font-weight: 600; font-size: 0.875rem; color: #1f2937; }
.step-marker { font-size: 0.75rem; color: #9ca3af; font-variant-numeric: tabular-nums; }

.title-block { text-align: center; margin-bottom: 2rem; }
.eyebrow { color: var(--brand, #111); font-weight: 600; font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 0.5rem; }
.title { font-size: 1.875rem; font-weight: 700; color: #111827; margin: 0 0 0.75rem; line-height: 1.2; }
.subtitle { font-size: 0.95rem; color: #6b7280; max-width: 480px; margin: 0 auto; line-height: 1.5; }

.card { background: white; border: 1px solid #e5e7eb; border-radius: 1rem; padding: 1.5rem; margin-bottom: 1.5rem; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.amount-row { display: flex; align-items: start; justify-content: space-between; margin-bottom: 1.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid #f3f4f6; }
.amount-label { font-size: 0.75rem; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 0.25rem; }
.amount { font-size: 2rem; font-weight: 700; color: #111827; margin: 0; line-height: 1; }
.amount-note { font-size: 0.75rem; color: #6b7280; margin: 0.375rem 0 0; }
.badge { display: inline-flex; align-items: center; gap: 0.375rem; background: #ecfdf5; color: #047857; padding: 0.375rem 0.625rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }

.form { display: flex; flex-direction: column; gap: 0.75rem; }
.field label { display: block; font-size: 0.8125rem; font-weight: 500; color: #374151; margin-bottom: 0.375rem; }
.field input { width: 100%; padding: 0.625rem 0.75rem; border: 1px solid #e5e7eb; border-radius: 0.5rem; font-size: 0.95rem; font-family: ui-monospace, monospace; transition: border-color 0.15s, box-shadow 0.15s; }
.field input:focus { outline: 0; border-color: var(--brand, #2563eb); box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand, #2563eb) 15%, transparent); }
.field-hint { font-size: 0.75rem; color: #9ca3af; margin: 0.375rem 0 0; }

.error { color: #b91c1c; background: #fef2f2; padding: 0.5rem 0.75rem; border-radius: 0.5rem; font-size: 0.875rem; }

.btn-primary {
  display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  width: 100%; padding: 0.875rem 1.25rem; border: 0; border-radius: 0.75rem;
  background: #111827; color: white; font-weight: 600; font-size: 0.95rem;
  cursor: pointer; transition: background 0.15s, opacity 0.15s; margin-top: 0.5rem;
}
.btn-primary:hover:not(:disabled) { background: #1f2937; }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-secondary {
  display: block; width: 100%; padding: 0.625rem; margin-top: 0.25rem;
  background: transparent; border: 0; color: #6b7280; font-size: 0.875rem; cursor: pointer;
}
.btn-secondary:hover:not(:disabled) { color: #1f2937; }
.btn-secondary:disabled { opacity: 0.4; cursor: not-allowed; }
.btn-link {
  display: block; width: 100%; padding: 0.5rem; margin-top: 0.75rem;
  background: transparent; border: 0; color: var(--brand, #2563eb);
  font-size: 0.875rem; font-weight: 500; cursor: pointer; text-decoration: underline;
  text-underline-offset: 2px;
}
.btn-link:hover { opacity: 0.75; }

.ideal-steps { list-style: none; padding: 0; margin: 1.25rem 0 0; display: flex; flex-direction: column; gap: 0.5rem; counter-reset: stap; }
.ideal-steps li { position: relative; padding-left: 1.75rem; font-size: 0.8125rem; color: #6b7280; line-height: 1.45; counter-increment: stap; }
.ideal-steps li::before {
  content: counter(stap); position: absolute; left: 0; top: 0.0625rem;
  width: 1.125rem; height: 1.125rem; border-radius: 9999px;
  background: #f3f4f6; color: #6b7280; font-size: 0.6875rem; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
}
.ideal-steps strong { color: #374151; font-weight: 600; }

.manual-note { display: flex; align-items: flex-start; gap: 0.5rem; font-size: 0.75rem; color: #92400e; background: #fffbeb; border-radius: 0.5rem; padding: 0.5rem 0.625rem; margin: 0; line-height: 1.4; }
.manual-note svg { flex-shrink: 0; margin-top: 0.0625rem; }

.spinner { width: 1rem; height: 1rem; border: 2px solid currentColor; border-right-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.reassurance { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1.5rem; }
.reassurance-item { display: flex; gap: 0.625rem; padding: 0.875rem; background: white; border: 1px solid #f3f4f6; border-radius: 0.75rem; }
.reassurance-item svg { flex-shrink: 0; color: var(--brand, #2563eb); margin-top: 0.125rem; }
.reassurance-title { font-size: 0.8125rem; font-weight: 600; color: #111827; margin: 0; }
.reassurance-text { font-size: 0.75rem; color: #6b7280; margin: 0.125rem 0 0; line-height: 1.4; }

.explainer { font-size: 0.75rem; color: #9ca3af; text-align: center; }
.explainer strong { color: #6b7280; font-weight: 600; }

@media (max-width: 540px) {
  .reassurance { grid-template-columns: 1fr; }
}
</style>
