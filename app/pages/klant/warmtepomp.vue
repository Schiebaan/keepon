<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'customer' })

const { heatPumpData, updateHeatPumpMode, partner } = useMockData()
const theme = getModuleTheme('heat_pump')

// Status display config
const statusConfig = computed(() => {
  const map: Record<string, { icon: string; label: string; colorClass: string; bgClass: string }> = {
    verwarmen: { icon: 'heat-pump', label: 'Verwarmen', colorClass: 'text-rose-600', bgClass: 'bg-rose-50' },
    koelen: { icon: 'droplet', label: 'Koelen', colorClass: 'text-blue-600', bgClass: 'bg-blue-50' },
    warmwater: { icon: 'droplet', label: 'Warmwater', colorClass: 'text-cyan-600', bgClass: 'bg-cyan-50' },
    standby: { icon: 'pause', label: 'Stand-by', colorClass: 'text-gray-500', bgClass: 'bg-gray-50' },
    storing: { icon: 'warning', label: 'Storing', colorClass: 'text-red-600', bgClass: 'bg-red-50' },
  }
  return map[heatPumpData.status] || map.standby
})

// COP rating config
const copConfig = computed(() => {
  const map: Record<string, { label: string; badgeClass: string }> = {
    uitstekend: { label: 'Uitstekend', badgeClass: 'badge--green' },
    goed: { label: 'Goed', badgeClass: 'badge--blue' },
    matig: { label: 'Matig', badgeClass: 'badge--yellow' },
    laag: { label: 'Laag', badgeClass: 'badge--red' },
  }
  return map[heatPumpData.copRating] || map.goed
})

// Mode descriptions
const modeOptions = [
  { key: 'comfort' as const, label: 'Comfort', description: 'Optimaal comfort, 21\u00B0C', icon: 'thermometer' },
  { key: 'eco' as const, label: 'Eco', description: 'Energiezuinig, 19\u00B0C', icon: 'trending-up' },
  { key: 'vakantie' as const, label: 'Vakantie', description: 'Vorstbescherming, 15\u00B0C', icon: 'globe' },
]
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
          <h1 class="text-2xl font-bold text-gray-900">Warmtepomp</h1>
          <span
            class="badge"
            :class="heatPumpData.status === 'storing' ? 'badge--red' : heatPumpData.status === 'standby' ? 'badge--gray' : 'badge--green'"
          >
            <span
              class="status-dot"
              :class="heatPumpData.status === 'storing' ? 'status-dot--error' : heatPumpData.status === 'standby' ? 'status-dot--inactive' : 'status-dot--active'"
            />
            {{ heatPumpData.status === 'storing' ? 'Storing' : heatPumpData.status === 'standby' ? 'Stand-by' : 'Actief' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Hero status -->
    <div class="section mb-6">
      <div class="text-center">
        <div
          class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl"
          :class="statusConfig.bgClass"
        >
          <AppIcon :name="statusConfig.icon" :size="28" :class="statusConfig.colorClass" />
        </div>
        <p class="text-sm font-medium text-gray-500">Huidige activiteit</p>
        <p class="mt-1 text-3xl font-bold" :class="statusConfig.colorClass">
          {{ statusConfig.label }}
        </p>
      </div>
    </div>

    <!-- Temperatuur cards -->
    <div class="mb-6 grid grid-cols-3 gap-4">
      <div class="section text-center">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Ingesteld</p>
        <p class="mt-1 text-3xl font-bold text-gray-900">{{ heatPumpData.setTemperature }}<span class="text-lg text-gray-400">&deg;C</span></p>
      </div>
      <div class="section text-center">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Binnen</p>
        <p class="mt-1 text-3xl font-bold text-gray-900">{{ heatPumpData.actualTemperature.toFixed(1).replace('.', ',') }}<span class="text-lg text-gray-400">&deg;C</span></p>
      </div>
      <div class="section text-center">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Buiten</p>
        <p class="mt-1 text-3xl font-bold text-gray-900">{{ heatPumpData.outsideTemperature }}<span class="text-lg text-gray-400">&deg;C</span></p>
      </div>
    </div>

    <!-- Warmwater card -->
    <div class="section mb-6">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
            <AppIcon name="droplet" :size="20" />
          </div>
          <div>
            <h2 class="text-base font-semibold text-gray-900">Warmwater</h2>
            <p class="text-sm text-gray-500">Boilertemperatuur: {{ heatPumpData.hotWaterTemp }}&deg;C</p>
          </div>
        </div>
        <span
          class="badge"
          :class="heatPumpData.hotWaterStatus === 'gereed' ? 'badge--green' : 'badge--yellow'"
        >
          {{ heatPumpData.hotWaterStatus === 'gereed' ? 'Gereed' : 'Opwarmen...' }}
        </span>
      </div>
    </div>

    <!-- Modus selector -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Modus</h2>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="opt in modeOptions"
          :key="opt.key"
          class="relative rounded-xl border-2 p-4 text-center transition-all"
          :class="heatPumpData.mode === opt.key
            ? 'border-rose-500 bg-rose-50 shadow-sm'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'"
          @click="updateHeatPumpMode(opt.key)"
        >
          <div
            class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg"
            :class="heatPumpData.mode === opt.key ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-500'"
          >
            <AppIcon :name="opt.icon" :size="20" />
          </div>
          <p
            class="text-sm font-semibold"
            :class="heatPumpData.mode === opt.key ? 'text-rose-700' : 'text-gray-900'"
          >
            {{ opt.label }}
          </p>
          <p class="mt-0.5 text-xs text-gray-500">{{ opt.description }}</p>
          <!-- Active indicator -->
          <div
            v-if="heatPumpData.mode === opt.key"
            class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-white"
          >
            <AppIcon name="check" :size="12" />
          </div>
        </button>
      </div>
    </div>

    <!-- Efficientie -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Prestaties</h2>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm text-gray-500">Je warmtepomp werkt</p>
          <div class="mt-1 flex items-center gap-2">
            <span class="badge" :class="copConfig.badgeClass">{{ copConfig.label }}</span>
            <span class="text-sm text-gray-400">COP {{ heatPumpData.copCurrent }}</span>
          </div>
        </div>
        <div class="text-right">
          <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Verbruik vandaag</p>
          <p class="mt-0.5 text-lg font-bold text-gray-900">{{ heatPumpData.consumptionTodayKwh.toFixed(1).replace('.', ',') }} kWh</p>
        </div>
      </div>
      <div class="mt-3 border-t border-gray-100 pt-3">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-500">Verbruik deze maand</span>
          <span class="font-semibold text-gray-900">{{ Math.round(heatPumpData.consumptionMonthKwh) }} kWh</span>
        </div>
      </div>
    </div>

    <!-- Planning -->
    <div v-if="heatPumpData.nextScheduledAction" class="section mb-6">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
          <AppIcon name="calendar" :size="20" />
        </div>
        <div>
          <h2 class="text-base font-semibold text-gray-900">Volgende actie</h2>
          <p class="text-sm text-gray-500">{{ heatPumpData.nextScheduledAction }}</p>
        </div>
      </div>
    </div>

    <!-- Alerts -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Meldingen</h2>
      <div v-if="heatPumpData.alerts.length === 0" class="flex items-center gap-3 text-green-600">
        <AppIcon name="check-circle" :size="20" />
        <p class="text-sm font-medium">Geen meldingen . alles werkt naar behoren.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(alert, i) in heatPumpData.alerts"
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
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
          <AppIcon name="help-circle" :size="16" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Probleem met je warmtepomp?</h3>
          <p class="mt-1 text-sm text-gray-500">
            Neem contact op met je installateur of dien een serviceverzoek in.
          </p>
          <div class="mt-3 flex flex-wrap gap-3">
            <NuxtLink
              to="/klant/service"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700"
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
