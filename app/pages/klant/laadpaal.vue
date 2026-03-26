<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'customer' })

const { evChargerData, toggleEvCharging, partner } = useMockData()
const theme = getModuleTheme('ev_charger')

// Format watts to kW with Dutch decimal separator
const formatWatts = (w: number) => (w / 1000).toFixed(1).replace('.', ',')

// Format duration from minutes to "Xu XXmin"
const formatDuration = (min: number) => {
  const h = Math.floor(min / 60)
  const m = min % 60
  return h > 0 ? `${h}u ${m}min` : `${m}min`
}

// Charge mode label map
const chargeModeLabels: Record<string, string> = {
  direct: 'Direct',
  gepland: 'Gepland',
  slim: 'Slim',
}

// Active charge mode (local ref synced to mock data)
const selectedMode = ref(evChargerData.chargeMode)
watch(selectedMode, (val) => {
  evChargerData.chargeMode = val
})

// Mode options
const modeOptions = [
  { key: 'direct' as const, label: 'Direct', description: 'Laad direct op vol vermogen', icon: 'zap' },
  { key: 'gepland' as const, label: 'Gepland', description: 'Laad op een ingesteld tijdstip', icon: 'calendar' },
  { key: 'slim' as const, label: 'Slim (op zon)', description: 'Laad zoveel mogelijk op zonne-energie', icon: 'solar' },
]

// Status display config
const statusConfig = computed(() => {
  const map: Record<string, { icon: string; label: string; sublabel: string; colorClass: string; bgClass: string }> = {
    laden: {
      icon: 'zap',
      label: 'Laden...',
      sublabel: `${formatWatts(evChargerData.currentPowerW)} kW${evChargerData.estimatedCompletion ? ` \u2014 Klaar rond ${evChargerData.estimatedCompletion}` : ''}`,
      colorClass: 'text-sky-600',
      bgClass: 'bg-sky-50',
    },
    standby: {
      icon: 'ev-charger',
      label: 'Stand-by',
      sublabel: 'Klaar om te laden',
      colorClass: 'text-gray-500',
      bgClass: 'bg-gray-50',
    },
    gepland: {
      icon: 'calendar',
      label: 'Gepland',
      sublabel: 'Volgende laadsessie gepland',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
    },
    storing: {
      icon: 'warning',
      label: 'Storing',
      sublabel: 'Er is een probleem met de laadpaal',
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50',
    },
  }
  return map[evChargerData.status] || map.standby
})

// Recent sessions (last 5)
const recentSessions = computed(() => evChargerData.sessions.slice(0, 5))

// Format session date
const formatSessionDate = (dateStr: string) => {
  const d = new Date(dateStr)
  return d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
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
      <div class="flex items-center gap-3">
        <div
          class="flex h-11 w-11 items-center justify-center rounded-xl"
          :class="[theme.bg, theme.text]"
        >
          <AppIcon :name="theme.icon" :size="22" />
        </div>
        <div class="flex items-center gap-3">
          <h1 class="text-2xl font-bold text-gray-900">Laadpaal</h1>
          <span
            class="badge"
            :class="evChargerData.status === 'storing' ? 'badge--red' : evChargerData.status === 'laden' ? 'badge--green' : 'badge--gray'"
          >
            <span
              class="status-dot"
              :class="evChargerData.status === 'storing' ? 'status-dot--error' : evChargerData.status === 'laden' ? 'status-dot--active' : 'status-dot--inactive'"
            />
            {{ evChargerData.status === 'laden' ? 'Laden' : evChargerData.status === 'storing' ? 'Storing' : evChargerData.status === 'gepland' ? 'Gepland' : 'Stand-by' }}
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
          <AppIcon
            :name="statusConfig.icon"
            :size="28"
            :class="[statusConfig.colorClass, evChargerData.status === 'laden' ? 'animate-pulse' : '']"
          />
        </div>
        <p class="text-3xl font-bold" :class="statusConfig.colorClass">
          {{ statusConfig.label }}
        </p>
        <p class="mt-1 text-sm text-gray-500">{{ statusConfig.sublabel }}</p>
      </div>

      <!-- Start/Stop button -->
      <div class="mt-5 text-center">
        <button
          v-if="evChargerData.status === 'standby'"
          class="inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-green-700 hover:shadow-lg"
          @click="toggleEvCharging()"
        >
          <AppIcon name="zap" :size="20" />
          Start laden
        </button>
        <button
          v-else-if="evChargerData.status === 'laden'"
          class="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3 text-base font-semibold text-white shadow-md transition-all hover:bg-red-700 hover:shadow-lg"
          @click="toggleEvCharging()"
        >
          <AppIcon name="pause" :size="20" />
          Stop laden
        </button>
      </div>
    </div>

    <!-- Vandaag + Deze maand -->
    <div class="mb-6 grid grid-cols-2 gap-4">
      <div class="section">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Vandaag</p>
        <p class="mt-1 text-xl font-bold text-gray-900">{{ evChargerData.chargedTodayKwh.toFixed(1).replace('.', ',') }} kWh</p>
        <p class="mt-0.5 text-sm text-gray-500">{{ formatCurrency(evChargerData.chargedTodayEuro) }}</p>
        <div v-if="evChargerData.batteryPercent !== null" class="mt-3 border-t border-gray-100 pt-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-500">Batterij</span>
            <span class="font-semibold text-gray-900">{{ evChargerData.batteryPercent }}%</span>
          </div>
          <div class="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              class="h-full rounded-full transition-all"
              :class="evChargerData.batteryPercent > 60 ? 'bg-green-500' : evChargerData.batteryPercent > 20 ? 'bg-yellow-500' : 'bg-red-500'"
              :style="{ width: evChargerData.batteryPercent + '%' }"
            />
          </div>
        </div>
      </div>

      <div class="section">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Deze maand</p>
        <p class="mt-1 text-xl font-bold text-gray-900">{{ evChargerData.chargedMonthKwh.toFixed(0) }} kWh</p>
        <p class="mt-0.5 text-sm text-gray-500">{{ formatCurrency(evChargerData.chargedMonthEuro) }}</p>
      </div>
    </div>

    <!-- Laadmodus selector -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Laadmodus</h2>
      <div class="grid grid-cols-3 gap-3">
        <button
          v-for="opt in modeOptions"
          :key="opt.key"
          class="relative rounded-xl border-2 p-4 text-center transition-all"
          :class="selectedMode === opt.key
            ? 'border-sky-500 bg-sky-50 shadow-sm'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'"
          @click="selectedMode = opt.key"
        >
          <div
            class="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg"
            :class="selectedMode === opt.key ? 'bg-sky-100 text-sky-600' : 'bg-gray-100 text-gray-500'"
          >
            <AppIcon :name="opt.icon" :size="20" />
          </div>
          <p
            class="text-sm font-semibold"
            :class="selectedMode === opt.key ? 'text-sky-700' : 'text-gray-900'"
          >
            {{ opt.label }}
          </p>
          <p class="mt-0.5 text-xs text-gray-500">{{ opt.description }}</p>
          <!-- Active indicator -->
          <div
            v-if="selectedMode === opt.key"
            class="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white"
          >
            <AppIcon name="check" :size="12" />
          </div>
        </button>
      </div>
    </div>

    <!-- Recente laadsessies -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Recente laadsessies</h2>
      <div v-if="recentSessions.length === 0" class="text-center py-4">
        <p class="text-sm text-gray-500">Nog geen laadsessies.</p>
      </div>
      <div v-else class="overflow-x-auto -mx-6">
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-6 pb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Datum</th>
              <th class="px-6 pb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Duur</th>
              <th class="px-6 pb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Energie</th>
              <th class="px-6 pb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Kosten</th>
              <th class="px-6 pb-3 text-xs font-medium uppercase tracking-wider text-gray-400">Modus</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="session in recentSessions"
              :key="session.id"
              class="border-b border-gray-50 last:border-0"
            >
              <td class="px-6 py-3 text-gray-900">{{ formatSessionDate(session.date) }}</td>
              <td class="px-6 py-3 text-gray-600">{{ formatDuration(session.durationMin) }}</td>
              <td class="px-6 py-3 font-medium text-gray-900">{{ session.kwh.toFixed(1).replace('.', ',') }} kWh</td>
              <td class="px-6 py-3 text-gray-900">{{ formatCurrency(session.costCents) }}</td>
              <td class="px-6 py-3">
                <span
                  class="badge"
                  :class="{
                    'badge--green': session.mode === 'slim',
                    'badge--blue': session.mode === 'gepland',
                    'badge--gray': session.mode === 'direct',
                  }"
                >
                  {{ chargeModeLabels[session.mode] || session.mode }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Alerts -->
    <div class="section mb-6">
      <h2 class="mb-4 text-base font-semibold text-gray-900">Meldingen</h2>
      <div v-if="evChargerData.alerts.length === 0" class="flex items-center gap-3 text-green-600">
        <AppIcon name="check-circle" :size="20" />
        <p class="text-sm font-medium">Geen meldingen . alles werkt naar behoren.</p>
      </div>
      <div v-else class="space-y-3">
        <div
          v-for="(alert, i) in evChargerData.alerts"
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
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <AppIcon name="help-circle" :size="16" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Probleem met je laadpaal?</h3>
          <p class="mt-1 text-sm text-gray-500">
            Neem contact op met je installateur of dien een serviceverzoek in.
          </p>
          <div class="mt-3 flex flex-wrap gap-3">
            <NuxtLink
              to="/klant/service"
              class="inline-flex items-center gap-1.5 text-sm font-medium text-sky-600 hover:text-sky-700"
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
