<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth', 'customer-onboarding'] })

const { heatPump, isLoading: productsLoading, load: loadProducts } = useCustomerProducts()
const { data, isLoading: dataLoading, error: dataError, load: loadData } = useWarmtepompData()
const { partner } = usePartner()

onMounted(async () => {
  await loadProducts()
  await loadData()
})
function refresh() { return loadData(true) }

const heatPumpLabel = computed(() => {
  const h = heatPump.value
  if (h?.name) return h.name
  if (h?.brand && h?.model) return `${h.brand} ${h.model}`
  if (h?.brand) return h.brand
  return 'Warmtepomp'
})

function fmtKwh(v?: number | null, digits = 0): string {
  if (v == null) return '—'
  if (v >= 10000) return `${(v / 1000).toFixed(1)} MWh`
  return `${v.toFixed(digits)} kWh`
}
function fmtTemp(v?: number | null): string {
  return v == null ? '—' : `${v.toFixed(1)} °C`
}
function fmtEuro(v?: number | null): string {
  if (v == null) return '€ —'
  return `€ ${Math.round(v).toLocaleString('nl-NL')}`
}
function relativeTime(iso?: string | null): string {
  if (!iso) return ''
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return 'zojuist'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} min geleden`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} u geleden`
  return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
function fmtDaysActive(d?: number | null): string {
  if (!d) return ''
  if (d < 60) return `${d} dagen`
  if (d < 730) return `${Math.round(d / 30.4)} maanden`
  return `${(d / 365).toFixed(1)} jaar`
}

const toneColors: Record<string, { dot: string; text: string; bg: string }> = {
  idle:    { dot: 'bg-gray-400',  text: 'text-gray-700',  bg: 'bg-gray-100' },
  standby: { dot: 'bg-blue-400',  text: 'text-blue-700',  bg: 'bg-blue-50' },
  heating: { dot: 'bg-rose-500',  text: 'text-rose-700',  bg: 'bg-rose-50' },
  error:   { dot: 'bg-red-500',   text: 'text-red-700',   bg: 'bg-red-50' },
}
function toneStyle(tone?: string) { return toneColors[tone || 'idle'] }
</script>

<template>
  <div>
    <NuxtLink to="/klant" class="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
      <AppIcon name="chevron-right" :size="14" class="rotate-180" />
      Terug naar overzicht
    </NuxtLink>
    <div class="flex items-center justify-between gap-3 mb-6">
      <div class="flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
          <AppIcon name="heat-pump" :size="22" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Warmtepomp</h1>
      </div>
      <button
        v-if="heatPump?.linked"
        class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        :disabled="dataLoading"
        title="Vernieuwen"
        @click="refresh"
      >
        <AppIcon name="refresh" :size="14" :class="dataLoading ? 'animate-spin' : ''" />
      </button>
    </div>

    <!-- Loading -->
    <div v-if="productsLoading || (dataLoading && !data)" class="section py-12 text-center">
      <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
    </div>

    <!-- Connected with live data -->
    <template v-else-if="heatPump?.linked && data?.linked && !dataError">
      <!-- 1. Status hero (compact, friendly) -->
      <div class="rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-orange-50 p-5 mb-5">
        <div class="flex items-start justify-between gap-3">
          <div>
            <p class="text-lg font-semibold text-gray-900">{{ heatPumpLabel }}</p>
            <p class="text-xs text-gray-500 mt-0.5">
              <span v-if="data.last_update">bijgewerkt {{ relativeTime(data.last_update) }}</span>
            </p>
          </div>
          <span
            class="shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
            :class="[toneStyle(data.state_tone).bg, toneStyle(data.state_tone).text]"
          >
            <span class="h-2 w-2 rounded-full" :class="[toneStyle(data.state_tone).dot, data.state_tone === 'heating' ? 'animate-pulse' : '']" />
            {{ data.state_label }}
          </span>
        </div>
      </div>

      <!-- 2. The headline visual: stroom → warmte met SCOP -->
      <div class="rounded-2xl border border-gray-100 bg-white p-6 mb-5">
        <p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Hoe efficiënt is je warmtepomp?</p>

        <!-- Energy-flow diagram -->
        <div class="flex items-center justify-between gap-4 mb-4">
          <!-- Electricity in -->
          <div class="flex-1 text-center">
            <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">
              <AppIcon name="zap" :size="22" />
            </div>
            <p class="text-xs text-gray-500">Stroom</p>
            <p class="text-base font-semibold text-gray-900 tabular-nums">{{ fmtKwh(data.lifetime_kwh_in) }}</p>
          </div>

          <!-- Multiplier arrow -->
          <div class="flex-1 max-w-[200px]">
            <div class="relative">
              <div class="h-1.5 rounded-full bg-gradient-to-r from-yellow-300 via-orange-300 to-rose-400" />
              <div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span class="rounded-full bg-white border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 shadow-sm tabular-nums">
                  × {{ data.scop ? data.scop.toFixed(1) : '—' }}
                </span>
              </div>
            </div>
            <p class="mt-3 text-[11px] text-center text-gray-400">SCOP</p>
          </div>

          <!-- Heat out -->
          <div class="flex-1 text-center">
            <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
              <AppIcon name="heat-pump" :size="22" />
            </div>
            <p class="text-xs text-gray-500">Warmte</p>
            <p class="text-base font-semibold text-gray-900 tabular-nums">{{ fmtKwh(data.lifetime_kwh_out) }}</p>
          </div>
        </div>

        <p class="text-sm text-gray-600 text-center">
          Voor elke <strong>1 kWh stroom</strong> die je warmtepomp gebruikt, haalt hij
          <strong class="text-rose-700 tabular-nums">{{ data.scop ? data.scop.toFixed(1) : '—' }} kWh warmte</strong>
          uit de buitenlucht.
        </p>
      </div>

      <!-- 3. Wat heb je daarmee bespaard? -->
      <div v-if="data.savings && data.savings.net_savings_eur > 0" class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 p-6 mb-5">
        <p class="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-3">Wat heb je bespaard?</p>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p class="text-3xl font-bold text-emerald-900 tabular-nums">{{ fmtEuro(data.savings.net_savings_eur) }}</p>
            <p class="mt-0.5 text-xs text-emerald-700">minder uitgegeven dan met een gasketel</p>
          </div>
          <div>
            <p class="text-3xl font-bold text-emerald-900 tabular-nums">{{ data.savings.gas_m3_avoided.toLocaleString('nl-NL') }} m³</p>
            <p class="mt-0.5 text-xs text-emerald-700">aardgas niet verstookt</p>
          </div>
          <div v-if="data.days_active">
            <p class="text-3xl font-bold text-emerald-900 tabular-nums">{{ fmtDaysActive(data.days_active) }}</p>
            <p class="mt-0.5 text-xs text-emerald-700">je warmtepomp doet z'n werk</p>
          </div>
        </div>
        <p class="mt-3 text-[11px] text-emerald-700/70">
          Vergeleken met een moderne cv-ketel (rendement 95%), bij € 1,45/m³ gas en € 0,30/kWh stroom.
        </p>
      </div>

      <!-- 4. Verbruik over tijd -->
      <div class="rounded-2xl border border-gray-100 bg-white p-5 mb-5">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Verbruik over tijd</h2>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Deze week (uit snapshots) -->
          <div class="rounded-xl border border-gray-100 p-4">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Deze week</p>
            <template v-if="data.week">
              <p class="mt-1 text-xl font-semibold text-gray-900 tabular-nums">{{ fmtKwh(data.week.kwh_out, 0) }}</p>
              <p class="text-[11px] text-gray-500">warmte geleverd</p>
            </template>
            <template v-else>
              <p class="mt-1 text-xl font-semibold text-gray-300 tabular-nums">—</p>
              <p class="text-[11px] text-gray-400">data komt vanaf volgende week</p>
            </template>
          </div>

          <!-- Deze maand (uit snapshots) -->
          <div class="rounded-xl border border-gray-100 p-4">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Laatste 30 dagen</p>
            <template v-if="data.month">
              <p class="mt-1 text-xl font-semibold text-gray-900 tabular-nums">{{ fmtKwh(data.month.kwh_out, 0) }}</p>
              <p class="text-[11px] text-gray-500">warmte geleverd</p>
            </template>
            <template v-else>
              <p class="mt-1 text-xl font-semibold text-gray-300 tabular-nums">—</p>
              <p class="text-[11px] text-gray-400">data wordt opgebouwd</p>
            </template>
          </div>

          <!-- Gemiddeld per dag -->
          <div class="rounded-xl border border-rose-100 bg-rose-50 p-4">
            <p class="text-[11px] font-medium text-rose-700 uppercase tracking-wider">Gemiddeld per dag</p>
            <p class="mt-1 text-xl font-semibold text-rose-900 tabular-nums">{{ fmtKwh(data.avg_kwh_out_per_day, 0) }}</p>
            <p class="text-[11px] text-rose-700">sinds installatie</p>
          </div>
        </div>

        <p class="mt-3 text-[11px] text-gray-400 italic">
          We slaan dagelijks een meting op om je verbruik per week en maand te tonen. De eerste week ben je nog data aan het verzamelen.
        </p>
      </div>

      <!-- 5. Op dit moment in huis -->
      <div class="rounded-2xl border border-gray-100 bg-white p-5 mb-5">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Op dit moment in huis</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div class="rounded-xl bg-gray-50 p-3 text-center">
            <div class="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">
              <AppIcon name="cloud" :size="14" />
            </div>
            <p class="text-[10px] text-gray-500 uppercase tracking-wider">Buiten</p>
            <p class="text-base font-semibold text-gray-900 tabular-nums">{{ fmtTemp(data.air_in_c) }}</p>
          </div>
          <div class="rounded-xl bg-gray-50 p-3 text-center">
            <div class="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <AppIcon name="home" :size="14" />
            </div>
            <p class="text-[10px] text-gray-500 uppercase tracking-wider">Binnen</p>
            <p class="text-base font-semibold text-gray-900 tabular-nums">{{ fmtTemp(data.room_c) }}</p>
            <p v-if="data.room_target_c != null" class="text-[10px] text-gray-400">doel {{ data.room_target_c.toFixed(0) }} °C</p>
          </div>
          <div class="rounded-xl bg-gray-50 p-3 text-center">
            <div class="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-rose-600">
              <AppIcon name="zap" :size="14" />
            </div>
            <p class="text-[10px] text-gray-500 uppercase tracking-wider">Aanvoer</p>
            <p class="text-base font-semibold text-gray-900 tabular-nums">{{ fmtTemp(data.water_out_c) }}</p>
            <p class="text-[10px] text-gray-400">naar verwarming</p>
          </div>
          <div class="rounded-xl bg-gray-50 p-3 text-center">
            <div class="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
              <AppIcon name="chevron-right" :size="14" class="rotate-180" />
            </div>
            <p class="text-[10px] text-gray-500 uppercase tracking-wider">Retour</p>
            <p class="text-base font-semibold text-gray-900 tabular-nums">{{ fmtTemp(data.water_return_c) }}</p>
            <p class="text-[10px] text-gray-400">terug uit huis</p>
          </div>
        </div>
      </div>
    </template>

    <!-- Error -->
    <div v-else-if="heatPump?.linked && (dataError || data?.error)" class="section py-12 text-center">
      <AppIcon name="alert-circle" :size="40" class="mx-auto text-amber-400 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Live data niet beschikbaar</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">{{ dataError || data?.error }}</p>
      <button class="mt-4 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800" @click="refresh">
        Probeer opnieuw
      </button>
    </div>

    <!-- Not linked -->
    <div v-else class="section py-12 text-center">
      <AppIcon name="heat-pump" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog niet gekoppeld</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Je installateur koppelt je warmtepomp aan het monitoringplatform. Zodra dit klaar is, zie je hier je verbruik en status.
      </p>
    </div>
  </div>
</template>
