<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth', 'customer-onboarding'] })

const { partner } = usePartner()

interface ContractLine {
  module_type: string
  name: string
  price_monthly_cents: number
  is_custom_price: boolean
}
interface MandateInfo {
  state: 'mandate_active' | 'mandate_pending' | 'mandate_skipped' | 'mandate_not_set'
  active: boolean
  mandate_at: string | null
  mandate_skipped: boolean
}
interface TrialInfo {
  months: number
  started_at: string | null
  ends_at: string | null
  active: boolean
}
interface Resp {
  mandate: MandateInfo
  lines: ContractLine[]
  total_monthly_cents: number
  total_yearly_cents: number
  billing_interval: 'monthly' | 'yearly'
  yearly_discount_months: number
  trial: TrialInfo | null
  accepted_at: string | null
}

const loading = ref(true)
const error = ref('')
const data = ref<Resp | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')
    data.value = await $fetch<Resp>('/api/customer/contracts', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Kon contracten niet laden'
  } finally {
    loading.value = false
  }
}
onMounted(load)

function euros(cents: number): string {
  return '€ ' + (cents / 100).toFixed(2).replace('.', ',')
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}

function iconFor(line: ContractLine): string {
  switch (line.module_type) {
    case 'solar_panel': return 'solar'
    case 'heat_pump': return 'heat-pump'
    case 'ev_charger': return 'ev-charger'
    case 'battery': return 'battery'
    default: return 'puzzle'
  }
}

const intervalLabel = computed(() => {
  if (!data.value) return ''
  if (data.value.billing_interval === 'yearly') {
    const m = data.value.yearly_discount_months
    return m > 0
      ? `Per jaar (${m === 1 ? '1 maand' : `${m} maanden`} korting)`
      : 'Per jaar'
  }
  return 'Per maand'
})
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Contracten</h1>
      <p class="mt-1 text-sm text-gray-500">Je servicecontract met {{ partner.name }} en de status van je automatische incasso.</p>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center">
      <div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card border-red-200 bg-red-50 text-sm text-red-800" role="alert">
      {{ error }}
    </div>

    <template v-else-if="data">
      <!-- Trial banner — komt boven alles als de klant nog gratis zit -->
      <div
        v-if="data.trial?.active"
        class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5"
      >
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
            <AppIcon name="check-circle" :size="20" />
          </div>
          <div>
            <p class="text-base font-semibold text-emerald-900">
              Je zit in een gratis proefperiode<template v-if="data.trial.months"> van {{ data.trial.months }} {{ data.trial.months === 1 ? 'maand' : 'maanden' }}</template>
            </p>
            <p class="mt-0.5 text-sm text-emerald-800/80">
              Eerste afschrijving op <strong>{{ fmtDate(data.trial.ends_at) }}</strong>. Tot dan
              betaal je niets.
            </p>
          </div>
        </div>
      </div>

      <!-- Mandate banner -->
      <div
        v-if="data.mandate"
        class="mb-6 rounded-2xl border p-5"
        :class="{
          'border-green-200 bg-green-50/60': data.mandate.state === 'mandate_active',
          'border-amber-200 bg-amber-50/60': data.mandate.state === 'mandate_pending',
          'border-rose-200 bg-rose-50/60': data.mandate.state === 'mandate_not_set' || data.mandate.state === 'mandate_skipped',
        }"
      >
        <div class="flex items-start gap-3">
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            :class="{
              'bg-green-100 text-green-700': data.mandate.state === 'mandate_active',
              'bg-amber-100 text-amber-700': data.mandate.state === 'mandate_pending',
              'bg-rose-100 text-rose-700': data.mandate.state === 'mandate_not_set' || data.mandate.state === 'mandate_skipped',
            }"
          >
            <AppIcon
              :name="data.mandate.state === 'mandate_active' ? 'check-circle' : (data.mandate.state === 'mandate_pending' ? 'clock' : 'warning')"
              :size="20"
            />
          </div>
          <div class="min-w-0 flex-1">
            <template v-if="data.mandate.state === 'mandate_active'">
              <p class="text-base font-semibold text-green-900">Automatische incasso is actief</p>
              <p class="mt-0.5 text-sm text-green-800/80">
                Je {{ data.billing_interval === 'yearly' ? 'jaarbedrag' : 'maandbedrag' }} wordt automatisch geïncasseerd. Bekijk losse afschrijvingen op je
                <NuxtLink to="/klant/facturen" class="underline hover:text-green-900">facturen-pagina</NuxtLink>.
              </p>
            </template>
            <template v-else-if="data.mandate.state === 'mandate_pending'">
              <p class="text-base font-semibold text-amber-900">Mandaat wordt bevestigd</p>
              <p class="mt-0.5 text-sm text-amber-800/80">
                Je IBAN is ingediend op {{ fmtDate(data.mandate.mandate_at) }}. We wachten op bevestiging van je bank
                — meestal binnen een paar minuten.
              </p>
            </template>
            <template v-else-if="data.mandate.state === 'mandate_skipped'">
              <p class="text-base font-semibold text-rose-900">Incasso staat nog niet aan</p>
              <p class="mt-0.5 mb-3 text-sm text-rose-800/80">
                Je hebt eerder gekozen om dit later te regelen. Stel je IBAN in zodat je
                {{ partner.name }}-servicekosten automatisch worden afgeschreven.
              </p>
              <NuxtLink
                to="/welkom/incasso"
                class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                <AppIcon name="credit-card" :size="14" />
                Incasso instellen
              </NuxtLink>
            </template>
            <template v-else>
              <!-- mandate_not_set -->
              <p class="text-base font-semibold text-rose-900">Incasso nog instellen</p>
              <p class="mt-0.5 mb-3 text-sm text-rose-800/80">
                Je hebt akkoord gegeven op {{ data.accepted_at ? `het servicecontract op ${fmtDate(data.accepted_at)}` : 'het servicecontract' }},
                maar je IBAN is nog niet ingesteld. Doe dit nu zodat {{ partner.name }} de maandkosten automatisch kan afschrijven.
              </p>
              <NuxtLink
                to="/welkom/incasso"
                class="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                <AppIcon name="credit-card" :size="14" />
                Incasso instellen
              </NuxtLink>
            </template>
          </div>
        </div>
      </div>

      <!-- Contractlines -->
      <section v-if="data.lines.length" class="mb-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">
            Je contract
            <span class="ml-1 text-gray-400 font-normal">({{ data.lines.length }} {{ data.lines.length === 1 ? 'module' : 'modules' }})</span>
          </h2>
          <span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
            <AppIcon name="clock" :size="11" />
            {{ intervalLabel }}
          </span>
        </div>

        <div class="rounded-2xl border border-gray-100 bg-white overflow-hidden">
          <div
            v-for="(line, i) in data.lines"
            :key="line.module_type"
            class="flex items-center gap-3 px-5 py-4"
            :class="i > 0 ? 'border-t border-gray-100' : ''"
          >
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">
              <AppIcon :name="iconFor(line)" :size="18" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-900">{{ line.name }}</p>
                <span v-if="line.is_custom_price" class="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                  Persoonlijk tarief
                </span>
              </div>
              <p class="text-xs text-gray-500">Servicecontract via {{ partner.name }}</p>
            </div>
            <p class="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">
              {{ euros(line.price_monthly_cents) }}<span class="text-xs font-normal text-gray-400">/mnd</span>
            </p>
          </div>

          <div class="bg-gray-50 px-5 py-3 text-sm">
            <template v-if="data.billing_interval === 'yearly'">
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">Totaal per jaar</span>
                <span class="text-base font-bold text-gray-900 tabular-nums">{{ euros(data.total_yearly_cents) }}</span>
              </div>
              <p v-if="data.yearly_discount_months > 0" class="mt-1 text-[11px] text-gray-500">
                Bespaart je {{ data.yearly_discount_months === 1 ? '1 maand' : `${data.yearly_discount_months} maanden` }} t.o.v. maandelijks betalen.
              </p>
            </template>
            <template v-else>
              <div class="flex items-center justify-between">
                <span class="font-medium text-gray-700">Totaal per maand</span>
                <span class="text-base font-bold text-gray-900 tabular-nums">{{ euros(data.total_monthly_cents) }}</span>
              </div>
            </template>
          </div>
        </div>
      </section>

      <!-- No accepted modules at all -->
      <div v-else class="section py-12 text-center">
        <AppIcon name="puzzle" :size="40" class="mx-auto text-gray-300 mb-4" />
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen contractregels</h2>
        <p class="text-sm text-gray-500 max-w-sm mx-auto">
          Zodra je akkoord geeft op een service van {{ partner.name }}, verschijnen je contractregels hier.
        </p>
      </div>

      <!-- Quick links -->
      <div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <NuxtLink
          to="/klant/facturen"
          class="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <AppIcon name="file-text" :size="18" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900">Facturen bekijken</p>
            <p class="text-xs text-gray-500">Alle afschrijvingen en de status per maand.</p>
          </div>
          <AppIcon name="chevron-right" :size="14" class="text-gray-300" />
        </NuxtLink>
        <NuxtLink
          to="/klant/service"
          class="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <AppIcon name="tool" :size="18" />
          </div>
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900">Service of vraag</p>
            <p class="text-xs text-gray-500">Direct contact met {{ partner.name }}.</p>
          </div>
          <AppIcon name="chevron-right" :size="14" class="text-gray-300" />
        </NuxtLink>
      </div>
    </template>
  </div>
</template>
