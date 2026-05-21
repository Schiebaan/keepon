<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth', 'customer-onboarding'] })

const { evCharger, isLoading: productsLoading, load: loadProducts } = useCustomerProducts()
const { data, isLoading: dataLoading, error: dataError, load: loadData } = useLaadpaalData()
const { partner } = usePartner()

onMounted(async () => {
  await loadProducts()
  await loadData()
})

function refresh() {
  return loadData(true)
}

const chargerLabel = computed(() => {
  const e = evCharger.value
  if (!e) return 'Laadpaal'
  if (e.name) return e.name
  if (e.brand && e.model) return `${e.brand} ${e.model}`
  return 'Laadpaal'
})

const monthLabels = ['', 'jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
function monthLabel(year: number, month: number): string {
  const now = new Date()
  if (year === now.getFullYear()) return monthLabels[month] || String(month)
  return `${monthLabels[month] || month} '${String(year).slice(-2)}`
}

// Chart bars: scale to max value in history
const recentMonths = computed(() => {
  if (!data.value?.monthly_history) return []
  return data.value.monthly_history.slice(-12)
})
const maxMonthKwh = computed(() => {
  return Math.max(1, ...recentMonths.value.map(m => m.kwh))
})

function fmtEuro(v: number): string {
  return v.toFixed(2).replace('.', ',')
}
function fmtKwh(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)} MWh`
  return `${v.toFixed(1)} kWh`
}

const toneColors: Record<string, { dot: string; text: string; bg: string }> = {
  idle:     { dot: 'bg-gray-400',  text: 'text-gray-700',   bg: 'bg-gray-100' },
  ready:    { dot: 'bg-blue-500',  text: 'text-blue-700',   bg: 'bg-blue-50' },
  charging: { dot: 'bg-green-500', text: 'text-green-700',  bg: 'bg-green-50' },
  done:     { dot: 'bg-green-500', text: 'text-green-700',  bg: 'bg-green-50' },
  error:    { dot: 'bg-red-500',   text: 'text-red-700',    bg: 'bg-red-50' },
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
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
          <AppIcon name="ev-charger" :size="22" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">Laadpaal</h1>
      </div>
      <button
        class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        :disabled="dataLoading"
        title="Vernieuwen"
        @click="refresh"
      >
        <AppIcon name="refresh" :size="14" :class="dataLoading ? 'animate-spin' : ''" />
      </button>
    </div>

    <!-- Loading (initial) -->
    <div v-if="productsLoading || (dataLoading && !data)" class="section py-12 text-center">
      <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
    </div>

    <!-- Connected state with live data -->
    <template v-else-if="evCharger?.linked && data?.linked && !dataError">
      <!-- Hero card with status -->
      <div class="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 mb-6">
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3 flex-1 min-w-0">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600">
              <AppIcon name="ev-charger" :size="22" />
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-sky-700 uppercase tracking-wider">Jouw laadpaal</p>
              <p class="text-lg font-semibold text-gray-900">{{ chargerLabel }}</p>
              <p class="text-xs text-gray-500 mt-0.5">
                <span class="font-mono text-gray-400">{{ data.charger_id }}</span>
                <span class="mx-1">·</span>
                <span :class="data.online ? 'text-green-600' : 'text-red-600'">
                  <span class="inline-block h-1.5 w-1.5 rounded-full" :class="data.online ? 'bg-green-500' : 'bg-red-500'" />
                  {{ data.online ? 'Online' : 'Offline' }}
                </span>
              </p>
            </div>
          </div>
          <div class="shrink-0 text-right">
            <span
              class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
              :class="[toneStyle(data.op_mode_tone).bg, toneStyle(data.op_mode_tone).text]"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="toneStyle(data.op_mode_tone).dot" />
              {{ data.op_mode_label }}
            </span>
            <p v-if="data.op_mode_hint" class="mt-1 text-[11px] text-gray-500 max-w-[180px]">{{ data.op_mode_hint }}</p>
          </div>
        </div>

        <!-- Charging-now bar (only when actively charging) -->
        <div v-if="data.op_mode_tone === 'charging' && data.current_power_w" class="mt-4 rounded-xl bg-white/70 px-4 py-3">
          <div class="flex items-baseline justify-between">
            <span class="text-xs text-gray-500">Nu aan het laden</span>
            <span class="text-lg font-semibold text-green-700 tabular-nums">{{ (data.current_power_w / 1000).toFixed(1) }} kW</span>
          </div>
          <p v-if="data.current_session_kwh" class="mt-0.5 text-xs text-gray-500">
            Deze sessie: {{ data.current_session_kwh }} kWh
          </p>
        </div>
      </div>

      <!-- Stat tiles -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div class="rounded-xl border border-gray-100 bg-white p-4">
          <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Geladen deze maand</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">
            {{ fmtKwh(data.current_month?.kwh || 0) }}
          </p>
          <p class="mt-0.5 text-xs text-gray-500 tabular-nums">€ {{ fmtEuro(data.current_month?.cost_eur || 0) }} geschatte kosten</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4">
          <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Totaal sinds installatie</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">
            {{ fmtKwh(data.lifetime_kwh || 0) }}
          </p>
          <p class="mt-0.5 text-xs text-gray-500">Lifetime energieverbruik</p>
        </div>
        <div class="rounded-xl border border-gray-100 bg-white p-4">
          <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Netspanning</p>
          <p class="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">
            {{ data.voltage ? data.voltage.toFixed(0) : '—' }}<span class="text-base font-normal text-gray-500"> V</span>
          </p>
          <p class="mt-0.5 text-xs text-gray-500">Live gemeten</p>
        </div>
      </div>

      <!-- Monthly history bars -->
      <div v-if="recentMonths.length" class="rounded-2xl border border-gray-100 bg-white p-5 mb-6">
        <div class="mb-3 flex items-baseline justify-between">
          <h2 class="text-sm font-semibold text-gray-900">Verbruik per maand</h2>
          <p class="text-[11px] text-gray-400">Laatste {{ recentMonths.length }} maanden</p>
        </div>
        <!-- Bar row: fixed height + each column h-full so percentage bar heights
             are taken against 128px instead of content-sized columns. -->
        <div class="flex items-end gap-1.5 h-32">
          <div
            v-for="m in recentMonths"
            :key="`bar-${m.year}-${m.month}`"
            class="flex-1 h-full relative flex items-end group"
            :title="`${monthLabel(m.year, m.month)}: ${m.kwh} kWh · € ${fmtEuro(m.cost_eur)}`"
          >
            <!-- Bar -->
            <div
              class="w-full rounded-t-md bg-sky-200 group-hover:bg-sky-400 transition-colors"
              :style="{ height: `${Math.max(3, (m.kwh / maxMonthKwh) * 100)}%` }"
            />
            <!-- Hover label, absolutely positioned above the bar -->
            <div
              class="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 whitespace-nowrap rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity tabular-nums shadow"
            >
              {{ m.kwh }} kWh
            </div>
          </div>
        </div>
        <!-- Label row: same flex-1 widths so labels line up under their bars -->
        <div class="mt-1.5 flex gap-1.5">
          <p
            v-for="m in recentMonths"
            :key="`lbl-${m.year}-${m.month}`"
            class="flex-1 text-center text-[10px] text-gray-500 tabular-nums"
          >
            {{ monthLabel(m.year, m.month) }}
          </p>
        </div>
      </div>
    </template>

    <!-- Error state (linked but couldn't fetch live) -->
    <div v-else-if="evCharger?.linked && (dataError || data?.error)" class="section py-12 text-center">
      <AppIcon name="alert-circle" :size="40" class="mx-auto text-amber-400 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Live data niet beschikbaar</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">{{ dataError || data?.error }}</p>
      <button class="mt-4 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800" @click="refresh">
        Probeer opnieuw
      </button>
    </div>

    <!-- Not yet linked -->
    <div v-else class="section py-12 text-center">
      <AppIcon name="ev-charger" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog niet gekoppeld</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Je installateur koppelt je laadpaal aan het monitoringplatform. Zodra dit klaar is, zie je hier je laadsessies en verbruik.
      </p>
    </div>
  </div>
</template>
