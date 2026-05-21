<script setup lang="ts">
import type { ChartPeriod } from '~/composables/useSolarSummary'
definePageMeta({ layout: 'customer', middleware: ['auth', 'customer-onboarding'] })

const { partner } = usePartner()
const { summary: solar, isLoading, currentPeriod, load: loadSolar, setPeriod } = useSolarSummary()

onMounted(() => { loadSolar() })

const ORIENTATION_LABEL: Record<number, string> = {
  0: 'Noord', 45: 'Noordoost', 90: 'Oost', 135: 'Zuidoost',
  180: 'Zuid', 225: 'Zuidwest', 270: 'West', 315: 'Noordwest',
}

function formatKwh(wh?: number, decimals = 1) {
  const v = (wh || 0) / 1000
  if (v >= 1000) return `${(v / 1000).toFixed(decimals)} MWh`
  return `${v.toFixed(decimals)} kWh`
}

function formatDate(s?: string) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
}

// --- Today's yield: friendly text when data hasn't arrived yet ---
/**
 * Sundata-backed inverters often only report a daily total once in the evening/night.
 * During the day the value can legitimately be 0. Distinguish:
 *   - Today's row exists AND > 0 → show actual value
 *   - Today's row exists but = 0 → "Wordt vandaag nog bijgewerkt" (inverter didn't report yet)
 *   - No row for today AND we DO have data elsewhere this month → same friendly msg
 *   - No row and zero data whole month → "Data komt binnenkort"
 */
const todayDisplay = computed(() => {
  const y = solar.value?.yield
  if (!y) return { text: '—', isPending: false }
  if (y.today_wh && y.today_wh > 0) {
    return { text: formatKwh(y.today_wh), isPending: false }
  }
  // Zero for today
  if (y.has_any_recent_data) {
    return { text: 'Komt vanavond binnen', isPending: true }
  }
  return { text: 'Nog geen data', isPending: true }
})

// --- Chart data ---
const chartMax = computed(() => {
  const vals = (solar.value?.chart?.data || []).map(d => d.wh || 0)
  return Math.max(1, ...vals)
})

const chartData = computed(() => solar.value?.chart?.data || [])

function chartLabel(date: string, bucket: 'day' | 'month') {
  const d = new Date(date)
  if (bucket === 'month') {
    return d.toLocaleDateString('nl-NL', { month: 'short' })
  }
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function bucketTooltip(date: string, wh: number, bucket: 'day' | 'month') {
  const d = new Date(date)
  const label = bucket === 'month'
    ? d.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
    : d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })
  return `${label}: ${formatKwh(wh)}`
}

// --- Period selector ---
interface PeriodOption { key: ChartPeriod; label: string }
const periodOptions: PeriodOption[] = [
  { key: 'week',         label: 'Week' },
  { key: 'month',        label: 'Maand' },
  { key: 'year',         label: 'Jaar' },
  { key: 'since_start',  label: 'Sinds start' },
  { key: 'custom',       label: 'Aangepast' },
]

const showCustomRange = ref(false)
const customStart = ref('')
const customEnd = ref('')

function formatISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function pickPeriod(p: ChartPeriod) {
  if (p === 'custom') {
    // Initialize default custom range if not set
    if (!customStart.value || !customEnd.value) {
      const end = new Date()
      const start = new Date(end)
      start.setDate(start.getDate() - 29)
      customStart.value = formatISO(start)
      customEnd.value = formatISO(end)
    }
    showCustomRange.value = true
    setPeriod('custom', customStart.value, customEnd.value)
  } else {
    showCustomRange.value = false
    setPeriod(p)
  }
}

function applyCustom() {
  if (!customStart.value || !customEnd.value) return
  setPeriod('custom', customStart.value, customEnd.value)
}

const periodTotalWh = computed(() => {
  const data = solar.value?.chart?.data || []
  return data.reduce((s, d) => s + (d.wh || 0), 0)
})

const periodAverageWh = computed(() => {
  const data = solar.value?.chart?.data || []
  if (!data.length) return 0
  const nonzero = data.filter(d => (d.wh || 0) > 0)
  if (!nonzero.length) return 0
  return Math.round(periodTotalWh.value / nonzero.length)
})

const chartRangeLabel = computed(() => {
  const c = solar.value?.chart
  if (!c) return ''
  const s = new Date(c.start), e = new Date(c.end)
  const sameYear = s.getFullYear() === e.getFullYear()
  const sFmt = sameYear
    ? s.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
    : s.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  const eFmt = e.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  return `${sFmt} – ${eFmt}`
})

const bucketLabel = computed(() => solar.value?.chart?.bucket === 'month' ? 'per maand' : 'per dag')
</script>

<template>
  <div>
    <NuxtLink to="/klant" class="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
      <AppIcon name="chevron-right" :size="14" class="rotate-180" />
      Terug naar overzicht
    </NuxtLink>

    <div class="flex items-center gap-3 mb-6">
      <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
        <AppIcon name="solar" :size="22" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Zonnepanelen</h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading && !solar" class="py-16 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Not connected yet -->
    <div v-else-if="!solar?.connected" class="section py-12 text-center">
      <AppIcon name="solar" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog niet gekoppeld</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        {{ partner.name }} koppelt je zonnepanelen aan het monitoringplatform. Zodra dit klaar is, zie je hier je opbrengst en statistieken.
      </p>
    </div>

    <!-- Connected: show plant + yield -->
    <template v-else>
      <!-- Fixed totals: Today / This month / This year -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div class="rounded-2xl bg-white border border-gray-100 p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Vandaag</p>
          <p
            class="mt-2 text-2xl font-semibold"
            :class="todayDisplay.isPending ? 'text-gray-400' : 'text-gray-900'"
          >
            {{ todayDisplay.text }}
          </p>
          <p class="mt-1 text-xs text-gray-400">
            <template v-if="todayDisplay.isPending">
              Je omvormer rapporteert meestal 's avonds.
            </template>
            <template v-else>
              Opbrengst op {{ new Date().toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) }}
            </template>
          </p>
        </div>
        <div class="rounded-2xl bg-white border border-gray-100 p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Deze maand</p>
          <p class="mt-2 text-2xl font-semibold text-gray-900">{{ formatKwh(solar.yield?.month_wh) }}</p>
          <p v-if="solar.yield?.month_predicted_wh" class="mt-1 text-xs text-gray-400">
            Verwacht: {{ formatKwh(solar.yield.month_predicted_wh, 0) }}
          </p>
        </div>
        <div class="rounded-2xl bg-white border border-gray-100 p-5">
          <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Dit jaar</p>
          <p class="mt-2 text-2xl font-semibold text-gray-900">{{ formatKwh(solar.yield?.year_wh, 0) }}</p>
        </div>
      </div>

      <!-- Waiting for first data -->
      <div
        v-if="solar.yield && !solar.yield.has_any_recent_data"
        class="mb-6 rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800"
      >
        <div class="flex items-start gap-2">
          <AppIcon name="info" :size="18" class="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p class="font-medium">Wachten op eerste meetgegevens</p>
            <p class="mt-0.5 text-xs text-amber-700">
              Je installatie is succesvol gekoppeld aan Sundata. Zodra je omvormer data deelt, zie je hier de opbrengst. Dit kan tot 24 uur duren.
            </p>
          </div>
        </div>
      </div>

      <!-- Chart with period selector -->
      <div class="rounded-2xl bg-white border border-gray-100 p-5 mb-6">
        <div class="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 class="text-sm font-semibold text-gray-900">Opbrengstgrafiek</h2>
            <p class="text-xs text-gray-400 mt-0.5">
              {{ chartRangeLabel }} · {{ bucketLabel }}
              <span v-if="periodTotalWh > 0" class="ml-1">
                · totaal <strong class="text-gray-700">{{ formatKwh(periodTotalWh, 0) }}</strong>
                <span v-if="periodAverageWh > 0" class="text-gray-400">
                  · gem. {{ formatKwh(periodAverageWh) }} {{ bucketLabel }}
                </span>
              </span>
            </p>
          </div>
        </div>

        <!-- Period tabs -->
        <div class="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 overflow-x-auto">
          <button
            v-for="opt in periodOptions"
            :key="opt.key"
            class="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            :class="currentPeriod === opt.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="pickPeriod(opt.key)"
          >
            {{ opt.label }}
          </button>
        </div>

        <!-- Custom range inputs -->
        <div v-if="showCustomRange" class="mb-4 flex flex-wrap items-center gap-2">
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500">Van</label>
            <input v-model="customStart" type="date" class="input !py-1 text-sm" />
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-500">Tot</label>
            <input v-model="customEnd" type="date" class="input !py-1 text-sm" />
          </div>
          <button
            class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40"
            :disabled="!customStart || !customEnd"
            @click="applyCustom"
          >
            Toepassen
          </button>
        </div>

        <!-- Chart bars -->
        <div class="flex items-end gap-0.5 h-32 relative" :class="{ 'opacity-40': isLoading }">
          <template v-if="chartData.length">
            <div
              v-for="d in chartData"
              :key="d.date"
              class="flex-1 rounded-sm bg-amber-200/60 hover:bg-amber-400 transition-colors relative group"
              :style="{ height: `${Math.max(2, (d.wh / chartMax) * 100)}%` }"
              :title="bucketTooltip(d.date, d.wh, solar.chart?.bucket || 'day')"
            />
          </template>
          <div v-else-if="!isLoading" class="flex-1 text-center text-xs text-gray-400 self-center">
            Nog geen data in deze periode
          </div>
        </div>

        <!-- X-axis labels (start + end) -->
        <div v-if="chartData.length" class="mt-2 flex justify-between text-[10px] text-gray-400">
          <span>{{ chartLabel(chartData[0].date, solar.chart?.bucket || 'day') }}</span>
          <span>{{ chartLabel(chartData[chartData.length - 1].date, solar.chart?.bucket || 'day') }}</span>
        </div>
      </div>

      <!-- Installation details -->
      <div class="rounded-2xl bg-white border border-gray-100 p-5">
        <h2 class="text-sm font-semibold text-gray-900 mb-4">Installatie</h2>
        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <dt class="text-xs text-gray-400 uppercase tracking-wider">Vermogen</dt>
            <dd class="mt-0.5 text-gray-900">
              {{ solar.meter?.peak_in_watt ? (solar.meter.peak_in_watt / 1000).toFixed(2) + ' kWp' : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-400 uppercase tracking-wider">Oriëntatie</dt>
            <dd class="mt-0.5 text-gray-900">
              {{ solar.meter?.orientation_in_degrees !== null && solar.meter?.orientation_in_degrees !== undefined
                ? (ORIENTATION_LABEL[solar.meter.orientation_in_degrees] || `${solar.meter.orientation_in_degrees}°`)
                : '—' }}
            </dd>
          </div>
          <div>
            <dt class="text-xs text-gray-400 uppercase tracking-wider">Helling</dt>
            <dd class="mt-0.5 text-gray-900">{{ solar.meter?.angle_in_degrees ?? '—' }}°</dd>
          </div>
          <div v-if="solar.product?.brand || solar.product?.model">
            <dt class="text-xs text-gray-400 uppercase tracking-wider">Panelen</dt>
            <dd class="mt-0.5 text-gray-900">{{ [solar.product.brand, solar.product.model].filter(Boolean).join(' ') }}</dd>
          </div>
          <div v-if="solar.product?.installation_date">
            <dt class="text-xs text-gray-400 uppercase tracking-wider">Installatiedatum</dt>
            <dd class="mt-0.5 text-gray-900">{{ formatDate(solar.product.installation_date) }}</dd>
          </div>
          <div v-if="solar.plant?.monitored_since">
            <dt class="text-xs text-gray-400 uppercase tracking-wider">Gemonitord sinds</dt>
            <dd class="mt-0.5 text-gray-900">{{ formatDate(solar.plant.monitored_since) }}</dd>
          </div>
          <div v-if="solar.plant?.address" class="sm:col-span-2">
            <dt class="text-xs text-gray-400 uppercase tracking-wider">Adres</dt>
            <dd class="mt-0.5 text-gray-900">
              {{ solar.plant.address.street }}, {{ solar.plant.address.postal_code }} {{ solar.plant.address.city }}
            </dd>
          </div>
        </dl>
      </div>
    </template>
  </div>
</template>
