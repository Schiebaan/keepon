<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'customer' })

const { solarData, partner } = useMockData()
const theme = getModuleTheme('solar')

// Format watts to kW with Dutch decimal separator
const formatWatts = (w: number) => (w / 1000).toFixed(1).replace('.', ',')
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
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl"
          :class="[theme.bg, theme.text]"
        >
          <AppIcon :name="theme.icon" :size="22" />
        </div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Zonnepanelen</h1>
          <span
            class="badge"
            :class="solarData.status === 'online' ? 'badge--green' : 'badge--red'"
          >
            <span
              class="status-dot"
              :class="solarData.status === 'online' ? 'status-dot--active' : 'status-dot--error'"
            />
            {{ solarData.status === 'online' ? 'Online' : solarData.status === 'deels_online' ? 'Deels online' : 'Offline' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Hero metric: current production -->
    <div class="section mb-6">
      <div class="text-center">
        <p class="text-sm font-medium text-gray-500">Huidig vermogen</p>
        <p class="mt-1 text-5xl font-bold text-amber-600">
          {{ formatWatts(solarData.currentProductionW) }} <span class="text-2xl font-semibold text-amber-400">kW</span>
        </p>
        <p class="mt-2 text-sm text-gray-400">
          Piek vandaag: {{ formatWatts(solarData.peakTodayW) }} kW om {{ solarData.peakTodayTime }}
        </p>
      </div>
    </div>

    <!-- Savings grid -->
    <div class="mb-6 grid grid-cols-2 gap-4">
      <!-- Vandaag -->
      <div class="section">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Vandaag</p>
        <p class="mt-1 text-xl font-bold text-gray-900">{{ formatCurrency(solarData.todayEuro) }}</p>
        <p class="mt-0.5 text-sm text-gray-500">{{ solarData.todayKwh.toFixed(1).replace('.', ',') }} kWh</p>
      </div>

      <!-- Deze maand -->
      <div class="section">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Deze maand</p>
        <p class="mt-1 text-xl font-bold text-gray-900">{{ formatCurrency(solarData.monthEuro) }}</p>
        <p class="mt-0.5 text-sm text-gray-500">{{ Math.round(solarData.monthKwh) }} kWh</p>
      </div>

      <!-- Dit jaar -->
      <div class="section">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Dit jaar</p>
        <p class="mt-1 text-xl font-bold text-gray-900">{{ formatCurrency(solarData.yearEuro) }}</p>
        <p class="mt-0.5 text-sm text-gray-500">{{ solarData.yearKwh.toLocaleString('nl-NL') }} kWh</p>
      </div>

      <!-- Eigen verbruik -->
      <div class="section">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Eigen verbruik</p>
        <p class="mt-1 text-xl font-bold text-gray-900">{{ solarData.selfConsumptionPercent }}%</p>
        <div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            class="h-full rounded-full bg-green-500 transition-all"
            :style="{ width: solarData.selfConsumptionPercent + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- Zelfverbruik vs teruglevering -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Verdeling opgewekte energie</h2>
      <div class="flex items-center gap-6">
        <!-- Donut chart via CSS conic-gradient -->
        <div class="relative flex-shrink-0">
          <div
            class="h-28 w-28 rounded-full"
            :style="{
              background: `conic-gradient(#22c55e 0% ${solarData.selfConsumptionPercent}%, #3b82f6 ${solarData.selfConsumptionPercent}% 100%)`,
            }"
          />
          <div class="absolute inset-3 flex items-center justify-center rounded-full bg-white">
            <AppIcon name="solar" :size="20" class="text-amber-500" />
          </div>
        </div>

        <!-- Legend -->
        <div class="space-y-3">
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-green-500" />
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ solarData.selfConsumptionPercent }}% eigen verbruik</p>
              <p class="text-xs text-gray-500">Direct gebruikt in je woning</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="h-3 w-3 rounded-full bg-blue-500" />
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ solarData.feedInPercent }}% teruglevering</p>
              <p class="text-xs text-gray-500">Teruggeleverd aan het net</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Systeeminfo -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Systeeminformatie</h2>
      <div class="space-y-3">
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <span class="text-sm text-gray-500">Aantal panelen</span>
          <span class="text-sm font-semibold text-gray-900">{{ solarData.panelCount }} stuks</span>
        </div>
        <div class="flex items-center justify-between border-b border-gray-100 pb-3">
          <span class="text-sm text-gray-500">Omvormer</span>
          <span class="text-sm font-semibold text-gray-900">{{ solarData.inverterBrand }}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-500">Status omvormer</span>
          <span class="badge badge--green">
            <AppIcon name="check" :size="12" />
            {{ solarData.inverterStatus }}
          </span>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Meldingen</h2>
      <div v-if="solarData.alerts.length === 0" class="flex items-center gap-3 text-green-600">
        <AppIcon name="check-circle" :size="20" />
        <p class="text-sm font-medium">Geen meldingen . alles werkt naar behoren.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(alert, i) in solarData.alerts"
          :key="i"
          class="flex items-start gap-3 rounded-lg p-3"
          :class="{
            'bg-red-50': alert.type === 'error',
            'bg-yellow-50': alert.type === 'warning',
            'bg-blue-50': alert.type === 'info',
          }"
        >
          <AppIcon
            :name="alert.type === 'error' ? 'x-circle' : alert.type === 'warning' ? 'warning' : 'info'"
            :size="18"
            :class="{
              'text-red-600': alert.type === 'error',
              'text-yellow-600': alert.type === 'warning',
              'text-blue-600': alert.type === 'info',
            }"
          />
          <div>
            <p class="text-sm font-medium" :class="{
              'text-red-800': alert.type === 'error',
              'text-yellow-800': alert.type === 'warning',
              'text-blue-800': alert.type === 'info',
            }">
              {{ alert.message }}
            </p>
            <p class="mt-0.5 text-xs text-gray-400">{{ alert.date }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Hulp -->
    <div class="rounded-xl border border-gray-200 bg-white p-5">
      <div class="flex items-start gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <AppIcon name="help-circle" :size="16" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Probleem met je zonnepanelen?</h3>
          <p class="mt-1 text-sm text-gray-500">
            Neem contact op met je installateur of dien een serviceverzoek in.
          </p>
          <div class="mt-3 flex flex-wrap gap-3">
            <NuxtLink
              to="/klant/service"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              <AppIcon name="send" :size="14" />
              Serviceverzoek indienen
            </NuxtLink>
            <span class="text-gray-300">|</span>
            <a
              :href="`tel:${partner.support_phone}`"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <AppIcon name="phone" :size="14" />
              {{ partner.support_phone }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
