<script setup lang="ts">
import type { Customer } from '~~/shared/types/database'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const route = useRoute()
const customerId = route.params.id as string

const { partner } = usePartner()
const { customers, updateCustomer } = useCustomers()

// Detail page fetches the single customer directly — much faster than
// waiting for the full /api/customers list to load. If the row happens to
// also be in the global list (because we got here from /admin/customers),
// we use it as an instant first render while the dedicated fetch runs.
const customer = ref<Customer | undefined>(customers.value.find(c => c.id === customerId) as Customer | undefined)
const customersLoading = ref(!customer.value)

async function fetchCustomer() {
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    const fresh = await $fetch<Customer>(`/api/customers/${customerId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (fresh) customer.value = fresh
  } catch (e) {
    console.error('Klant ophalen mislukt:', e)
  } finally {
    customersLoading.value = false
  }
}
onMounted(fetchCustomer)

const activeTab = ref<'producten' | 'documenten' | 'mails' | 'notities'>('producten')

// --- Mail-log ---
interface MailEvent {
  id: string
  at: string
  action: string
  label: string
  to: string | null
  success: boolean
  subject: string | null
}
const mailEvents = ref<MailEvent[]>([])
const mailLoading = ref(false)
async function loadMailLog() {
  mailLoading.value = true
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    const res = await $fetch<{ events: MailEvent[] }>(`/api/customers/${customerId}/mail-log`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    mailEvents.value = res.events
  } catch { mailEvents.value = [] }
  finally { mailLoading.value = false }
}
watch(activeTab, (t) => { if (t === 'mails' && !mailEvents.value.length) loadMailLog() })

function fmtMailDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

// --- Onboarding-status derivation (shown in the dossier header) ---
type OnboardingState = NonNullable<Customer['onboarding']>
const onboarding = computed<OnboardingState | null>(() => customer.value?.onboarding || null)
const onboardingTimeline = computed(() => {
  const o = onboarding.value
  const created = customer.value?.created_at
  return [
    {
      key: 'invite',
      label: 'Welkomstmail verstuurd',
      done: !!created,
      at: created || null,
    },
    {
      key: 'akkoord',
      label: 'Akkoord gegeven',
      done: !!o?.accepted_at,
      at: o?.accepted_at || null,
      pending: !o?.accepted_at,
    },
    {
      key: 'incasso',
      // Drie staten: skipped → "Incasso later regelen" · done → "Incasso geregeld"
      // · anders (geen mandate_at én niet expliciet geskipt) → "Incasso instellen"
      // — voorheen stond hier "Incasso geregeld" + "Wacht op klant" wat lezers
      // verwart omdat het tegelijk wel en niet geregeld lijkt.
      label: o?.mandate_skipped
        ? 'Incasso later regelen'
        : (o?.mandate_at ? 'Incasso geregeld' : 'Incasso instellen'),
      done: !!o?.mandate_at,
      pending: !o?.mandate_at && !o?.mandate_skipped,
      skipped: !!o?.mandate_skipped,
      at: o?.mandate_at || null,
    },
  ]
})
function formatStatusDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('nl-NL', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  } catch { return '' }
}

// --- Customer edit ---
const isEditingCustomer = ref(false)
const customerSaving = ref(false)
const customerForm = ref({ full_name: '', phone: '', street: '', house_number: '', postal_code: '', city: '' })

function startEditCustomer() {
  if (!customer.value) return
  customerForm.value = {
    full_name: customer.value.full_name || '',
    phone: customer.value.phone || '',
    street: customer.value.street || '',
    house_number: customer.value.house_number || '',
    postal_code: customer.value.postal_code || '',
    city: customer.value.city || '',
  }
  isEditingCustomer.value = true
}

const customerSaveError = ref('')

async function saveCustomer() {
  customerSaving.value = true
  customerSaveError.value = ''
  try {
    await updateCustomer(customerId, customerForm.value)
    isEditingCustomer.value = false
  } catch (e: any) {
    customerSaveError.value = e?.data?.message || e?.message || 'Opslaan mislukt'
  } finally {
    customerSaving.value = false
  }
}

// --- Module-koppel wizards (Sundata + Weheat) ---
// Each connector type opens its own wizard. The ProductList component emits
// `open-connector` with the integration key ('solar' | 'weheat' | 'easee').
const showSundataWizard = ref(false)
const showWeheatWizard = ref(false)
const sundataProductData = ref<{ capacityWp?: string; orientation?: string; tilt?: string }>({})

function openSundataWizard() {
  // Try to extract Wp/orientation/tilt from the most recent solar product's
  // notes. Wrapped in try/catch so a missing field never blocks the wizard
  // from actually opening — the wizard itself surfaces "missing details"
  // errors with a clear message.
  try {
    const { products } = useCustomerDossier(customerId)
    const list = Array.isArray(products.value) ? products.value : []
    const solars = list.filter((p: any) => p?.category === 'solar_panel')
    const solarProduct = solars[solars.length - 1]
    if (solarProduct?.notes) {
      sundataProductData.value = {
        capacityWp: solarProduct.notes.match(/(\d+)\s*Wp/)?.[1] || '',
        orientation: solarProduct.notes.match(/oriëntatie:\s*(\S+)/i)?.[1] || '',
        tilt: solarProduct.notes.match(/helling:\s*(\d+)/i)?.[1] || '',
      }
    } else {
      sundataProductData.value = {}
    }
  } catch (e) {
    console.error('[sundata-open] pre-fill faalde:', e)
    sundataProductData.value = {}
  }
  showSundataWizard.value = true
}

function openConnector(type: string) {
  if (type === 'solar') openSundataWizard()
  else if (type === 'weheat') showWeheatWizard.value = true
  else if (type === 'easee') {
    // No Easee wizard yet — manual DB linkage for now.
    // (Could add an EaseeWizard following the WeheatWizard pattern later.)
  }
}

async function handleWeheatCompleted(_r: { heatpumpId: string; serial: string }) {
  await productListRef.value?.refresh?.()
}

const productListRef = ref<any>(null)

async function handleSundataCompleted(_result: { deviceId: string; plantName: string }) {
  // Reload products so the "Gekoppeld met Sundata" badge appears immediately
  await productListRef.value?.refresh?.()
}

const confirm = useConfirm()
const { deleteCustomer } = useCustomers()
const router = useRouter()

// --- Pricing-kaart -------------------------------------------------------
interface PricingLine {
  module_type: string
  name: string
  price_monthly_cents: number
  default_price_monthly_cents: number | null
  override_reason: string | null
}
interface PricingInfo {
  billing_interval: 'monthly' | 'yearly'
  yearly_discount_months: number
  trial_months: number
  mandate_at: string | null
  trial: { months: number; started_at: string | null; ends_at: string | null; active: boolean } | null
  lines: PricingLine[]
  monthly_total_cents: number
  yearly_total_cents: number
  accepted_modules: string[]
  partner_defaults: { module_type: string; name: string; price_monthly_cents: number }[]
}
const pricing = ref<PricingInfo | null>(null)
const pricingLoading = ref(false)
const isEditingPricing = ref(false)
const pricingSaving = ref(false)
const pricingError = ref('')

// Edit-state mirrors PricingInfo maar met user-input strings voor de
// prijs-inputs (zodat we niet de hele tijd cents↔euro hoeven om te zetten
// tijdens typen).
const pricingForm = ref({
  billing_interval: 'monthly' as 'monthly' | 'yearly',
  yearly_discount_months: 0 as number,
  trial_months: 0 as number,
  // module_type → { price (euro-string) | null, reason }
  overrides: {} as Record<string, { price_eur: string; reason: string }>,
})

async function loadPricing() {
  pricingLoading.value = true
  pricingError.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    pricing.value = await $fetch<PricingInfo>(`/api/customers/${customerId}/pricing`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch (e: any) {
    pricingError.value = e?.data?.message || e?.message || 'Tarief ophalen mislukt'
  } finally {
    pricingLoading.value = false
  }
}
onMounted(loadPricing)

function euros(cents: number | null | undefined): string {
  if (!cents) return '€ 0,00'
  return '€ ' + (cents / 100).toFixed(2).replace('.', ',')
}
function parseEur(v: string): number | null {
  if (!v || !v.trim()) return null
  const cleaned = v.replace(/€/g, '').replace(/\s+/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

function startEditPricing() {
  if (!pricing.value) return
  pricingForm.value = {
    billing_interval: pricing.value.billing_interval,
    yearly_discount_months: pricing.value.yearly_discount_months,
    trial_months: pricing.value.trial_months,
    overrides: {},
  }
  // Pre-fill bestaande overrides
  for (const line of pricing.value.lines) {
    if (line.default_price_monthly_cents !== null) {
      // Er ís een override actief (helper zet default_price ≠ null in dat geval)
      pricingForm.value.overrides[line.module_type] = {
        price_eur: (line.price_monthly_cents / 100).toFixed(2).replace('.', ','),
        reason: line.override_reason || '',
      }
    }
  }
  isEditingPricing.value = true
  pricingError.value = ''
}
function cancelEditPricing() {
  isEditingPricing.value = false
  pricingError.value = ''
}

async function savePricing() {
  pricingSaving.value = true
  pricingError.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    // Bouw override-array uit het formulier
    const overrides = Object.entries(pricingForm.value.overrides)
      .map(([module_type, val]) => {
        const cents = parseEur(val.price_eur)
        if (!cents) return null
        return { module_type, price_monthly_cents: cents, reason: val.reason || undefined }
      })
      .filter(Boolean) as { module_type: string; price_monthly_cents: number; reason?: string }[]

    await $fetch(`/api/customers/${customerId}/pricing`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: {
        billing_interval: pricingForm.value.billing_interval,
        yearly_discount_months: pricingForm.value.yearly_discount_months,
        trial_months: pricingForm.value.trial_months,
        module_price_overrides: overrides,
      },
    })

    isEditingPricing.value = false
    await loadPricing()
  } catch (e: any) {
    pricingError.value = e?.data?.message || e?.message || 'Opslaan mislukt'
  } finally {
    pricingSaving.value = false
  }
}

// Helper: alle modules waar de klant een override op kan zetten (= modules
// waar de partner überhaupt een prijs voor heeft + accepted_modules van klant).
const overrideCandidates = computed(() => {
  if (!pricing.value) return [] as { module_type: string; name: string; default_cents: number }[]
  const accepted = new Set(pricing.value.accepted_modules)
  return pricing.value.partner_defaults
    .filter(d => accepted.has(d.module_type))
    .map(d => ({ module_type: d.module_type, name: d.name, default_cents: d.price_monthly_cents }))
})

function ensureOverrideSlot(t: string) {
  if (!pricingForm.value.overrides[t]) {
    pricingForm.value.overrides[t] = { price_eur: '', reason: '' }
  }
}
function clearOverride(t: string) {
  delete pricingForm.value.overrides[t]
}
function fmtDateNl(iso: string | null | undefined) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}

// --- Open customer portal in a new tab (preview as customer) ---
const openingPortal = ref(false)
const portalError = ref('')
async function openCustomerPortal() {
  if (openingPortal.value) return
  const ok = await confirm({
    title: 'Klantportaal openen?',
    message:
      'Er wordt een nieuw tabblad geopend met een inloglink van deze klant. ' +
      'Open dit in een incognito-venster zodat je niet uitgelogd raakt uit het admin.',
    confirmLabel: 'Open in nieuw tabblad',
  })
  if (!ok) return

  openingPortal.value = true
  portalError.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    const res = await $fetch<{ url: string }>(
      `/api/customers/${customerId}/portal-link`,
      { headers: { Authorization: `Bearer ${session.access_token}` } },
    )
    window.open(res.url, '_blank', 'noopener,noreferrer')
  } catch (e: any) {
    portalError.value = e?.data?.message || e?.message || 'Kon portaal-link niet ophalen'
  } finally {
    openingPortal.value = false
  }
}

// --- Delete customer ---
const deletingCustomer = ref(false)
async function handleDeleteCustomer() {
  if (!customer.value || deletingCustomer.value) return
  const ok = await confirm({
    title: 'Klant verwijderen?',
    message:
      `${customer.value.full_name || customer.value.email}\n\n` +
      'Dit verwijdert ook alle producten, documenten en tickets. Deze actie kan niet ongedaan worden gemaakt.',
    confirmLabel: 'Verwijderen',
    dangerous: true,
  })
  if (!ok) return

  deletingCustomer.value = true
  actionError.value = ''
  try {
    await deleteCustomer(customerId)
    router.push('/admin/customers')
  } catch (e: any) {
    actionError.value = e?.data?.message || e?.message || 'Verwijderen mislukt'
    deletingCustomer.value = false
  }
}

// Generic action-level error (delete, portal) shown above the action bar
const actionError = ref('')

// --- Charge customer (recurring Mollie debit) ---
const charging = ref(false)
const chargeResult = ref<{ type: 'success' | 'error'; text: string } | null>(null)

function dismissChargeResult() { chargeResult.value = null }

async function chargeCustomer() {
  if (charging.value) return
  if (!customer.value?.mollie_customer_id) {
    chargeResult.value = { type: 'error', text: 'Klant heeft nog geen incasso geregeld.' }
    return
  }
  const ok = await confirm({
    title: 'Servicekosten incasseren?',
    message:
      `${customer.value?.full_name || customer.value?.email}\n\n` +
      'We boeken het maandbedrag af via de SEPA-machtiging. ' +
      'Het exacte bedrag wordt automatisch berekend op basis van de modules van deze klant.',
    confirmLabel: 'Incasseren',
  })
  if (!ok) return

  charging.value = true
  chargeResult.value = null
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    const res = await $fetch<{ ok: boolean; payment: { amount_cents: number; status: string; mollie_payment_id: string } }>(
      `/api/customers/${customerId}/charge`,
      { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } },
    )
    chargeResult.value = {
      type: 'success',
      text: `Incasso aangemaakt — ${euros(res.payment.amount_cents)} (${res.payment.status})`,
    }
  } catch (e: any) {
    chargeResult.value = { type: 'error', text: e?.data?.message || e?.message || 'Incasso aanmaken mislukt' }
  } finally {
    charging.value = false
  }
}

// --- Notes ---
const NOTES_KEY = 'upsol-customer-notes'
function loadNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}') } catch { return {} }
}
function saveNotes(notes: Record<string, string>) {
  if (typeof window !== 'undefined') localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}
const allNotes = ref(loadNotes())
const customerNotes = computed({
  get: () => allNotes.value[customerId] || '',
  set: (val: string) => { allNotes.value[customerId] = val; saveNotes(allNotes.value) },
})
const notesSaved = ref(false)
function handleSaveNotes() {
  saveNotes(allNotes.value)
  notesSaved.value = true
  setTimeout(() => { notesSaved.value = false }, 2000)
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="customersLoading" class="py-16 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Not found -->
    <div v-else-if="!customer" class="section">
      <div class="card py-12 text-center">
        <AppIcon name="x-circle" :size="40" class="mx-auto text-gray-300 mb-4" />
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Klant niet gevonden</h2>
        <NuxtLink to="/admin/customers" class="text-sm text-gray-500 hover:text-gray-700 underline">
          Terug naar klantenoverzicht
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="section">
        <div class="mb-4">
          <NuxtLink to="/admin/customers" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <AppIcon name="chevron-right" :size="14" class="rotate-180" />
            Klanten
          </NuxtLink>
        </div>

        <div class="card">
          <!-- View mode -->
          <template v-if="!isEditingCustomer">
            <div class="flex items-start gap-5">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                :style="{ backgroundColor: partner.primary_color }"
              >
                {{ customer.full_name?.charAt(0) || '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <h1 class="text-xl font-bold text-gray-900">{{ customer.full_name || customer.email }}</h1>

                <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
                  <span class="flex items-center gap-1.5">
                    <AppIcon name="mail" :size="14" />
                    {{ customer.email }}
                  </span>
                  <span v-if="customer.phone" class="flex items-center gap-1.5">
                    <AppIcon name="phone" :size="14" />
                    {{ customer.phone }}
                  </span>
                  <span v-if="customer.street" class="flex items-center gap-1.5">
                    <AppIcon name="map-pin" :size="14" />
                    {{ customer.street }} {{ customer.house_number }}, {{ customer.postal_code }} {{ customer.city }}
                  </span>
                </div>

                <!-- Action bar -->
                <div class="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    @click="startEditCustomer"
                  >
                    <AppIcon name="settings" :size="14" />
                    Bewerken
                  </button>
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                    :disabled="openingPortal"
                    title="Bekijk wat de klant ziet (opent in nieuw tabblad)"
                    @click="openCustomerPortal"
                  >
                    <AppIcon name="external" :size="14" />
                    {{ openingPortal ? 'Openen...' : 'Klantportaal openen' }}
                  </button>
                  <NuxtLink
                    :to="`/admin/service?customer=${customerId}`"
                    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <AppIcon name="tool" :size="14" />
                    Ticket
                  </NuxtLink>
                  <button
                    class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="charging || !customer.mollie_customer_id"
                    :title="!customer.mollie_customer_id ? 'Klant heeft nog geen incasso ingesteld' : 'Stuur servicekosten naar deze klant'"
                    @click="chargeCustomer"
                  >
                    <svg v-if="charging" class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <AppIcon v-else name="credit-card" :size="14" />
                    {{ charging ? 'Incasseren...' : 'Stuur factuur' }}
                  </button>
                  <div class="ml-auto">
                    <button
                      class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                      :disabled="deletingCustomer"
                      @click="handleDeleteCustomer"
                    >
                      <AppIcon name="trash" :size="14" />
                      {{ deletingCustomer ? 'Verwijderen...' : 'Verwijderen' }}
                    </button>
                  </div>
                </div>

                <!-- Action feedback panels -->
                <Transition name="fade">
                  <div
                    v-if="chargeResult"
                    class="mt-3 rounded-xl border px-3 py-2.5 text-xs"
                    :class="chargeResult.type === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-800'"
                  >
                    <div class="flex items-start gap-2">
                      <AppIcon :name="chargeResult.type === 'success' ? 'check-circle' : 'alert-circle'" :size="14" class="mt-0.5 shrink-0" />
                      <div class="flex-1 min-w-0">
                        <p class="font-medium">{{ chargeResult.text }}</p>
                        <p v-if="chargeResult.type === 'success'" class="mt-1 text-green-700/90">
                          De SEPA-incasso loopt nu via Mollie — definitieve status verschijnt zodra de bank reageert.
                        </p>
                      </div>
                      <button
                        class="shrink-0 text-gray-400 hover:text-gray-600"
                        title="Sluiten"
                        @click="dismissChargeResult"
                      >
                        <AppIcon name="x" :size="14" />
                      </button>
                    </div>
                  </div>
                </Transition>
                <div v-if="portalError" class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800" role="alert">
                  {{ portalError }}
                </div>
                <div v-if="actionError" class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800" role="alert">
                  {{ actionError }}
                </div>

                <!-- Onboarding status timeline -->
                <div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    v-for="step in onboardingTimeline"
                    :key="step.key"
                    class="flex items-start gap-2 rounded-lg border px-3 py-2"
                    :class="{
                      'border-green-200 bg-green-50': step.done,
                      'border-amber-200 bg-amber-50': step.pending && !step.done,
                      'border-gray-200 bg-gray-50': step.skipped && !step.done,
                    }"
                  >
                    <AppIcon
                      :name="step.done ? 'check-circle' : (step.skipped ? 'clock' : 'circle')"
                      :size="14"
                      class="mt-0.5 shrink-0"
                      :class="{
                        'text-green-600': step.done,
                        'text-amber-600': step.pending && !step.done,
                        'text-gray-400': step.skipped && !step.done,
                      }"
                    />
                    <div class="min-w-0">
                      <p class="text-xs font-medium" :class="{
                        'text-green-900': step.done,
                        'text-amber-900': step.pending && !step.done,
                        'text-gray-600': step.skipped && !step.done,
                      }">{{ step.label }}</p>
                      <p v-if="step.at" class="text-[11px] text-gray-500 mt-0.5">{{ formatStatusDate(step.at) }}</p>
                      <p v-else-if="step.pending && !step.done" class="text-[11px] text-amber-700 mt-0.5">Wacht op klant</p>
                      <p v-else-if="step.skipped && !step.done" class="text-[11px] text-gray-500 mt-0.5">Reminder volgt</p>
                      <p
                        v-if="step.key === 'incasso' && step.done && customer.mollie_mandate_id"
                        class="text-[11px] text-green-700/90 mt-0.5 truncate"
                        :title="customer.mollie_mandate_id"
                      >
                        Mandaat actief
                      </p>
                      <p
                        v-else-if="step.key === 'incasso' && step.done && customer.mollie_customer_id && !customer.mollie_mandate_id"
                        class="text-[11px] text-amber-700 mt-0.5"
                      >
                        Mandaat in afwachting
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-gray-900">Klantgegevens bewerken</h2>
              <div class="flex gap-2">
                <button class="btn-primary text-sm" :disabled="customerSaving" @click="saveCustomer">
                  {{ customerSaving ? 'Opslaan...' : 'Opslaan' }}
                </button>
                <button class="btn-secondary text-sm" @click="isEditingCustomer = false">Annuleren</button>
              </div>
            </div>
            <div v-if="customerSaveError" class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {{ customerSaveError }}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Naam</label>
                <input v-model="customerForm.full_name" type="text" class="input" />
              </div>
              <div>
                <label class="label">Telefoon</label>
                <input v-model="customerForm.phone" type="tel" class="input" />
              </div>
              <div>
                <label class="label">Straat + huisnummer</label>
                <div class="flex gap-2">
                  <input v-model="customerForm.street" type="text" class="input flex-1" placeholder="Straat" />
                  <input v-model="customerForm.house_number" type="text" class="input w-20" placeholder="Nr." />
                </div>
              </div>
              <div>
                <label class="label">Postcode + woonplaats</label>
                <div class="flex gap-2">
                  <input v-model="customerForm.postal_code" type="text" class="input w-28" placeholder="1234 AB" />
                  <input v-model="customerForm.city" type="text" class="input flex-1" placeholder="Woonplaats" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Tarief -->
      <div class="section">
        <div class="card">
          <!-- View mode -->
          <template v-if="!isEditingPricing">
            <div class="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 class="text-base font-semibold text-gray-900">Tarief</h2>
                <p class="text-xs text-gray-500 mt-0.5">Termijn, kortingen en eventuele afwijkende modulen-prijzen.</p>
              </div>
              <button
                v-if="pricing"
                class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                @click="startEditPricing"
              >
                <AppIcon name="settings" :size="14" />
                Aanpassen
              </button>
            </div>

            <div v-if="pricingLoading" class="py-6 text-center">
              <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
            <div v-else-if="!pricing" class="text-sm text-gray-400">Geen tariefinformatie beschikbaar.</div>

            <template v-else>
              <!-- Top-summary -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                <div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p class="text-[11px] text-gray-500 uppercase tracking-wider">Termijn</p>
                  <p class="text-sm font-semibold text-gray-900 mt-0.5">
                    {{ pricing.billing_interval === 'yearly' ? 'Per jaar' : 'Per maand' }}
                  </p>
                  <p v-if="pricing.billing_interval === 'yearly' && pricing.yearly_discount_months > 0" class="text-[11px] text-gray-500 mt-0.5">
                    {{ pricing.yearly_discount_months === 1 ? '1 maand' : `${pricing.yearly_discount_months} maanden` }} korting
                  </p>
                </div>
                <div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
                  <p class="text-[11px] text-gray-500 uppercase tracking-wider">
                    {{ pricing.billing_interval === 'yearly' ? 'Jaarbedrag' : 'Maandbedrag' }}
                  </p>
                  <p class="text-sm font-semibold text-gray-900 mt-0.5 tabular-nums">
                    {{ euros(pricing.billing_interval === 'yearly' ? pricing.yearly_total_cents : pricing.monthly_total_cents) }}
                  </p>
                  <p v-if="pricing.billing_interval === 'yearly'" class="text-[11px] text-gray-500 mt-0.5 tabular-nums">
                    {{ euros(pricing.monthly_total_cents) }} per maand
                  </p>
                </div>
                <div
                  class="rounded-xl border px-4 py-3"
                  :class="pricing.trial?.active ? 'border-emerald-200 bg-emerald-50/70' : 'border-gray-100 bg-gray-50'"
                >
                  <p class="text-[11px] uppercase tracking-wider" :class="pricing.trial?.active ? 'text-emerald-700' : 'text-gray-500'">
                    Proefperiode
                  </p>
                  <template v-if="pricing.trial?.active">
                    <p class="text-sm font-semibold text-emerald-900 mt-0.5">Loopt tot {{ fmtDateNl(pricing.trial.ends_at) }}</p>
                    <p class="text-[11px] text-emerald-800/80 mt-0.5">{{ pricing.trial_months }} maanden gratis</p>
                  </template>
                  <template v-else-if="pricing.trial_months > 0 && !pricing.trial?.started_at">
                    <p class="text-sm font-semibold text-gray-700 mt-0.5">{{ pricing.trial_months }} maanden ingesteld</p>
                    <p class="text-[11px] text-gray-500 mt-0.5">Start zodra incasso actief is.</p>
                  </template>
                  <template v-else-if="pricing.trial_months > 0">
                    <p class="text-sm font-semibold text-gray-700 mt-0.5">Voorbij</p>
                    <p class="text-[11px] text-gray-500 mt-0.5">Klant betaalt nu het volle bedrag.</p>
                  </template>
                  <template v-else>
                    <p class="text-sm text-gray-500 mt-0.5">Geen</p>
                  </template>
                </div>
              </div>

              <!-- Module-prijzen -->
              <div v-if="pricing.lines.length" class="rounded-xl border border-gray-100 overflow-hidden">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50">
                    <tr class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                      <th class="px-4 py-2">Module</th>
                      <th class="px-4 py-2 text-right">Tarief / mnd</th>
                      <th class="px-4 py-2">Standaardprijs</th>
                      <th class="px-4 py-2">Reden override</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-for="line in pricing.lines" :key="line.module_type">
                      <td class="px-4 py-2.5 text-gray-900">{{ line.name }}</td>
                      <td class="px-4 py-2.5 text-right font-semibold text-gray-900 tabular-nums">{{ euros(line.price_monthly_cents) }}</td>
                      <td class="px-4 py-2.5 text-gray-500 tabular-nums">
                        <template v-if="line.default_price_monthly_cents !== null">
                          {{ euros(line.default_price_monthly_cents) }}
                          <span class="text-[10px] text-blue-700 ml-1">override</span>
                        </template>
                        <template v-else>standaard</template>
                      </td>
                      <td class="px-4 py-2.5 text-xs text-gray-500">{{ line.override_reason || '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-else class="text-sm text-gray-500">Klant heeft nog geen modules geaccepteerd.</div>
            </template>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-gray-900">Tarief aanpassen</h2>
              <div class="flex gap-2">
                <button class="btn-primary text-sm" :disabled="pricingSaving" @click="savePricing">
                  {{ pricingSaving ? 'Opslaan...' : 'Opslaan' }}
                </button>
                <button class="btn-secondary text-sm" :disabled="pricingSaving" @click="cancelEditPricing">Annuleren</button>
              </div>
            </div>
            <div v-if="pricingError" class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {{ pricingError }}
            </div>

            <div class="space-y-5">
              <!-- Termijn -->
              <div>
                <label class="label">Termijn</label>
                <div class="mt-1 grid grid-cols-2 gap-2 max-w-md">
                  <button
                    type="button"
                    class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors"
                    :class="pricingForm.billing_interval === 'monthly' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                    @click="pricingForm.billing_interval = 'monthly'"
                  >Per maand</button>
                  <button
                    type="button"
                    class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors"
                    :class="pricingForm.billing_interval === 'yearly' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                    @click="pricingForm.billing_interval = 'yearly'"
                  >Per jaar</button>
                </div>
              </div>

              <!-- Jaarkorting -->
              <div>
                <label class="label">Korting bij jaarbetaling (maanden gratis)</label>
                <input
                  v-model.number="pricingForm.yearly_discount_months"
                  type="number"
                  min="0"
                  max="12"
                  step="0.5"
                  class="input max-w-[8rem]"
                />
                <p class="mt-1 text-[11px] text-gray-500">Bv. 1 = bij jaarbetaling betaalt klant 11 maanden i.p.v. 12.</p>
              </div>

              <!-- Proefperiode -->
              <div>
                <label class="label">Proefperiode (maanden gratis na incasso-activatie)</label>
                <input
                  v-model.number="pricingForm.trial_months"
                  type="number"
                  min="0"
                  max="60"
                  step="1"
                  class="input max-w-[8rem]"
                />
                <p class="mt-1 text-[11px] text-gray-500">Telt vanaf het moment dat de klant z'n IBAN heeft afgegeven.</p>
              </div>

              <!-- Per-module overrides -->
              <div>
                <label class="label">Afwijkend tarief per module</label>
                <p class="mt-1 mb-2 text-[11px] text-gray-500">Laat het veld leeg om de standaardprijs aan te houden.</p>
                <div v-if="overrideCandidates.length === 0" class="text-xs text-gray-400">
                  Klant heeft nog geen modules geaccepteerd, of er staan geen partner-tarieven.
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="cand in overrideCandidates"
                    :key="cand.module_type"
                    class="grid grid-cols-[1fr_auto_2fr_auto] gap-2 items-center"
                  >
                    <div>
                      <p class="text-sm text-gray-900">{{ cand.name }}</p>
                      <p class="text-[11px] text-gray-400">Standaard {{ euros(cand.default_cents) }}/mnd</p>
                    </div>
                    <div class="relative">
                      <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                      <input
                        :value="pricingForm.overrides[cand.module_type]?.price_eur || ''"
                        type="text"
                        class="input pl-6 w-24 text-sm tabular-nums"
                        placeholder="—"
                        @input="(e) => { ensureOverrideSlot(cand.module_type); pricingForm.overrides[cand.module_type].price_eur = (e.target as HTMLInputElement).value }"
                      />
                    </div>
                    <input
                      :value="pricingForm.overrides[cand.module_type]?.reason || ''"
                      type="text"
                      class="input text-sm"
                      placeholder="Reden (intern, optioneel)"
                      maxlength="200"
                      @input="(e) => { ensureOverrideSlot(cand.module_type); pricingForm.overrides[cand.module_type].reason = (e.target as HTMLInputElement).value }"
                    />
                    <button
                      v-if="pricingForm.overrides[cand.module_type]"
                      type="button"
                      class="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                      title="Override verwijderen"
                      @click="clearOverride(cand.module_type)"
                    >
                      <AppIcon name="x" :size="14" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Tabs -->
      <div class="section">
        <div class="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6">
          <button
            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'producten' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'producten'"
          >
            <AppIcon name="package" :size="16" />
            Producten
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'documenten' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'documenten'"
          >
            <AppIcon name="folder" :size="16" />
            Documenten
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'mails' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'mails'"
          >
            <AppIcon name="mail" :size="16" />
            E-mails
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'notities' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'notities'"
          >
            <AppIcon name="file-text" :size="16" />
            Notities
          </button>
        </div>

        <div class="card">
          <ProductList
            v-if="activeTab === 'producten'"
            ref="productListRef"
            :customer-id="customerId"
            :partner-id="customer.partner_id"
            :customer-name="customer.full_name || customer.email"
            @open-connector="openConnector"
          />
          <DocumentList
            v-if="activeTab === 'documenten'"
            :customer-id="customerId"
            :partner-id="customer.partner_id"
          />
          <div v-if="activeTab === 'mails'">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900">
                E-mailhistorie
                <span v-if="mailEvents.length" class="ml-1 text-gray-400 font-normal">({{ mailEvents.length }})</span>
              </h3>
              <button
                class="text-xs text-gray-500 hover:text-gray-800"
                @click="loadMailLog"
                :disabled="mailLoading"
              >
                <AppIcon name="refresh" :size="12" class="inline-block mr-1" />
                {{ mailLoading ? 'Laden...' : 'Verversen' }}
              </button>
            </div>

            <div v-if="mailLoading && !mailEvents.length" class="py-8 text-center">
              <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
            </div>
            <div v-else-if="!mailEvents.length" class="rounded-xl border border-gray-100 bg-gray-50 py-8 text-center">
              <AppIcon name="mail" :size="24" class="mx-auto text-gray-300 mb-2" />
              <p class="text-sm text-gray-500">Er zijn nog geen e-mails naar deze klant verstuurd.</p>
            </div>
            <div v-else class="divide-y divide-gray-100 rounded-xl border border-gray-100">
              <div v-for="ev in mailEvents" :key="ev.id" class="flex items-start gap-3 px-4 py-3">
                <div
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  :class="ev.success ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'"
                >
                  <AppIcon :name="ev.success ? 'check' : 'x'" :size="14" />
                </div>
                <div class="min-w-0 flex-1">
                  <div class="flex items-baseline justify-between gap-2">
                    <p class="text-sm font-medium text-gray-900">{{ ev.label }}</p>
                    <span class="shrink-0 text-[11px] text-gray-400 whitespace-nowrap">{{ fmtMailDate(ev.at) }}</span>
                  </div>
                  <p v-if="ev.subject" class="mt-0.5 text-xs text-gray-500 truncate">"{{ ev.subject }}"</p>
                  <p class="mt-0.5 text-[11px] text-gray-400">
                    <span v-if="ev.to">Naar {{ ev.to }}</span>
                    <span v-if="!ev.success" class="ml-1 text-red-600 font-medium">· mislukt</span>
                  </p>
                </div>
              </div>
            </div>
            <p class="mt-3 text-[11px] text-gray-400">
              Toont wat wíj hebben verstuurd. Voor aflevering, opening en bounces is een Resend-webhook nodig (op de roadmap).
            </p>
          </div>
          <div v-if="activeTab === 'notities'">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900">Interne notities</h3>
              <div class="flex items-center gap-2">
                <span v-if="notesSaved" class="text-xs text-green-600 font-medium">Opgeslagen!</span>
                <button
                  class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                  @click="handleSaveNotes"
                >
                  <AppIcon name="check" :size="14" />
                  Opslaan
                </button>
              </div>
            </div>
            <textarea
              v-model="customerNotes"
              class="input font-mono text-sm"
              rows="10"
              placeholder="Persoonlijke aantekeningen, zichtbaar in deze browser."
            />
            <p class="mt-2 text-xs text-gray-400">
              Tijdelijke aantekening, alleen opgeslagen op dit apparaat. Synchronisatie met je team volgt later.
            </p>
          </div>
        </div>
      </div>

      <!-- Sundata Wizard -->
      <SundataWizard
        v-model="showSundataWizard"
        :customer-id="customerId"
        :customer-name="customer.full_name || customer.email"
        :product-data="sundataProductData"
        @completed="handleSundataCompleted"
      />

      <!-- Weheat Wizard -->
      <WeheatWizard
        v-model="showWeheatWizard"
        :customer-id="customerId"
        :customer-name="customer.full_name || customer.email"
        @completed="handleWeheatCompleted"
      />
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.25s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
