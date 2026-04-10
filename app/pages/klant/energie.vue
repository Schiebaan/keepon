<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })

const { partner } = usePartner()
const { customer } = useCurrentCustomer()
const customerId = computed(() => customer.value?.id || '')
const { meter, getReadings } = useSmartMeter(customerId.value)

const readings = computed(() => meter.value ? getReadings(meter.value.id) : [])

// Period selection
const period = ref<'dag' | 'week' | 'maand'>('week')

// Filter readings by period
const filteredReadings = computed(() => {
  const now = new Date()
  let since: Date
  if (period.value === 'dag') {
    since = new Date(now); since.setHours(0, 0, 0, 0)
  } else if (period.value === 'week') {
    since = new Date(now); since.setDate(since.getDate() - 7)
  } else {
    since = new Date(now); since.setMonth(since.getMonth() - 1)
  }
  return readings.value.filter(r => new Date(r.timestamp) >= since)
})

// Aggregated stats
const stats = computed(() => {
  const data = filteredReadings.value
  if (!data.length) return { consumption: 0, production: 0, net: 0, gas: 0, selfConsumption: 0 }

  const consumption = data.reduce((sum, r) => sum + r.consumption_wh, 0)
  const production = data.reduce((sum, r) => sum + r.production_wh, 0)
  const gas = data.reduce((sum, r) => sum + (r.gas_m3 || 0), 0)
  const net = consumption - production
  const selfConsumption = production > 0 ? Math.min(100, Math.round((Math.min(consumption, production) / production) * 100)) : 0

  return {
    consumption: Math.round(consumption / 1000) / 1, // kWh
    production: Math.round(production / 1000) / 1,
    net: Math.round(net / 1000) / 1,
    gas: Math.round(gas * 10) / 10,
    selfConsumption,
  }
})

// Daily aggregation for bar chart
const dailyData = computed(() => {
  const days = new Map<string, { consumption: number; production: number; gas: number }>()

  for (const r of filteredReadings.value) {
    const day = r.timestamp.slice(0, 10) // YYYY-MM-DD
    const existing = days.get(day) || { consumption: 0, production: 0, gas: 0 }
    existing.consumption += r.consumption_wh / 1000
    existing.production += r.production_wh / 1000
    existing.gas += r.gas_m3 || 0
    days.set(day, existing)
  }

  return Array.from(days.entries()).map(([date, data]) => ({
    date,
    label: new Date(date).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' }),
    consumption: Math.round(data.consumption * 10) / 10,
    production: Math.round(data.production * 10) / 10,
    gas: Math.round(data.gas * 10) / 10,
  }))
})

// Max values for bar scaling
const maxKwh = computed(() => {
  let max = 1
  for (const d of dailyData.value) {
    max = Math.max(max, d.consumption, d.production)
  }
  return max
})

function formatKwh(v: number) {
  return v.toFixed(1).replace('.', ',')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6">
      <NuxtLink
        to="/klant"
        class="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
      >
        <AppIcon name="chevron-right" :size="14" class="rotate-180" />
        Terug naar overzicht
      </NuxtLink>
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <AppIcon name="zap" :size="22" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Energie-inzichten</h1>
        </div>
        <div class="flex gap-2">
          <a
            href="/api/reports/energy?period=month"
            target="_blank"
            class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <AppIcon name="download" :size="14" />
            Maandrapport
          </a>
          <a
            href="/api/reports/energy?period=year"
            target="_blank"
            class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <AppIcon name="download" :size="14" />
            Jaaroverzicht
          </a>
        </div>
      </div>
    </div>

    <!-- Smart Meter Setup -->
    <div class="mb-6">
      <SmartMeterSetup />
    </div>

    <!-- No data state -->
    <div v-if="!meter || meter.status !== 'active'" class="card py-12 text-center">
      <AppIcon name="activity" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen energiedata</h2>
      <p class="text-sm text-gray-500">Koppel je slimme meter hierboven om je verbruik te bekijken.</p>
    </div>

    <!-- Energy insights -->
    <template v-else>
      <!-- Period selector -->
      <div class="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6">
        <button
          v-for="p in (['dag', 'week', 'maand'] as const)"
          :key="p"
          class="flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors capitalize"
          :class="period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="period = p"
        >
          {{ p === 'dag' ? 'Vandaag' : p === 'week' ? 'Week' : 'Maand' }}
        </button>
      </div>

      <!-- Stats cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="card !p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Verbruik</p>
          <p class="text-xl font-bold text-gray-900">{{ formatKwh(stats.consumption) }}</p>
          <p class="text-xs text-gray-400">kWh</p>
        </div>
        <div class="card !p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Opwek</p>
          <p class="text-xl font-bold text-amber-600">{{ formatKwh(stats.production) }}</p>
          <p class="text-xs text-gray-400">kWh</p>
        </div>
        <div class="card !p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">
            {{ stats.net > 0 ? 'Netto afname' : 'Netto levering' }}
          </p>
          <p class="text-xl font-bold" :class="stats.net > 0 ? 'text-red-500' : 'text-green-600'">
            {{ formatKwh(Math.abs(stats.net)) }}
          </p>
          <p class="text-xs text-gray-400">kWh</p>
        </div>
        <div class="card !p-4 text-center">
          <p class="text-xs text-gray-500 mb-1">Gas</p>
          <p class="text-xl font-bold text-blue-600">{{ stats.gas.toFixed(1).replace('.', ',') }}</p>
          <p class="text-xs text-gray-400">m&sup3;</p>
        </div>
      </div>

      <!-- Self-consumption indicator -->
      <div v-if="stats.production > 0" class="card !p-4 mb-6">
        <div class="flex items-center justify-between mb-2">
          <p class="text-sm font-medium text-gray-900">Eigen verbruik</p>
          <p class="text-sm font-bold" :style="{ color: partner.primary_color }">{{ stats.selfConsumption }}%</p>
        </div>
        <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-500"
            :style="{ width: stats.selfConsumption + '%', backgroundColor: partner.primary_color }"
          />
        </div>
        <p class="text-xs text-gray-400 mt-1.5">
          Van de {{ formatKwh(stats.production) }} kWh opgewekte energie gebruik je {{ stats.selfConsumption }}% zelf
        </p>
      </div>

      <!-- Daily bar chart -->
      <div class="card">
        <h3 class="text-sm font-semibold text-gray-900 mb-4">
          {{ period === 'dag' ? 'Per uur' : 'Per dag' }}
        </h3>

        <div v-if="dailyData.length === 0" class="py-8 text-center text-sm text-gray-400">
          Geen data beschikbaar
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="day in dailyData"
            :key="day.date"
            class="flex items-center gap-3"
          >
            <span class="w-16 shrink-0 text-xs text-gray-500 text-right">{{ day.label }}</span>
            <div class="flex-1 space-y-1">
              <!-- Consumption bar -->
              <div class="flex items-center gap-2">
                <div class="h-3 rounded-full bg-gray-200 transition-all duration-300" :style="{ width: (day.consumption / maxKwh * 100) + '%', minWidth: '4px' }" />
                <span class="text-[11px] text-gray-500 shrink-0">{{ formatKwh(day.consumption) }}</span>
              </div>
              <!-- Production bar -->
              <div class="flex items-center gap-2">
                <div class="h-3 rounded-full bg-amber-400 transition-all duration-300" :style="{ width: (day.production / maxKwh * 100) + '%', minWidth: '4px' }" />
                <span class="text-[11px] text-amber-600 shrink-0">{{ formatKwh(day.production) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div class="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <div class="h-2.5 w-2.5 rounded-full bg-gray-200" />
            <span class="text-xs text-gray-500">Verbruik (kWh)</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="h-2.5 w-2.5 rounded-full bg-amber-400" />
            <span class="text-xs text-gray-500">Opwek (kWh)</span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
