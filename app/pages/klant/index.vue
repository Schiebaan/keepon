<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'
import { getModuleBenefits } from '~/utils/module-benefits'

definePageMeta({ layout: 'customer' })

const {
  currentCustomer,
  systemStatus,
  energyFlow,
  solarData,
  heatPumpData,
  evChargerData,
  subscriptions,
  partner,
  getActiveModuleTypes,
  notifications,
  partnerModuleConfigs,
} = useMockData()

// Welcome banner for newly added modules
const welcomeBanner = computed(() => {
  const unread = notifications.filter(
    n => n.customer_id === currentCustomer.id && !n.is_read && n.subject?.includes('toegevoegd')
  )
  return unread.length > 0 ? unread[0] : null
})

function dismissBanner() {
  if (welcomeBanner.value) {
    welcomeBanner.value.is_read = true
  }
}

// Time-based greeting
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Goedemorgen'
  if (hour < 18) return 'Goedemiddag'
  return 'Goedenavond'
})

const firstName = computed(() => currentCustomer.full_name?.split(' ')[0] || 'daar')

// Active subscriptions for cust-1
const activeSubscriptions = computed(() =>
  subscriptions.filter(s => s.customer_id === currentCustomer.id && s.status === 'active')
)

// Active module types from subscriptions
const activeModuleTypes = computed(() => getActiveModuleTypes())

// Module summary card data — only for modules the customer has
const moduleSummaryCards = computed(() => {
  const cards: { moduleType: string; label: string; status: 'ok' | 'warning' | 'error'; metric: string; metricLabel: string; to: string }[] = []

  if (activeModuleTypes.value.includes('solar')) {
    const statusEntry = systemStatus.modules.find(m => m.type === 'solar')
    cards.push({
      moduleType: 'solar',
      label: 'Zonnepanelen',
      status: (statusEntry?.status ?? 'ok') as 'ok' | 'warning' | 'error',
      metric: `${(solarData.currentProductionW / 1000).toFixed(1).replace('.', ',')} kW`,
      metricLabel: 'Huidige productie',
      to: '/klant/zonnepanelen',
    })
  }

  if (activeModuleTypes.value.includes('heat_pump')) {
    const statusEntry = systemStatus.modules.find(m => m.type === 'heat_pump')
    cards.push({
      moduleType: 'heat_pump',
      label: 'Warmtepomp',
      status: (statusEntry?.status ?? 'ok') as 'ok' | 'warning' | 'error',
      metric: `${heatPumpData.actualTemperature.toFixed(1).replace('.', ',')}°C`,
      metricLabel: 'Binnentemperatuur',
      to: '/klant/warmtepomp',
    })
  }

  if (activeModuleTypes.value.includes('ev_charger')) {
    const statusEntry = systemStatus.modules.find(m => m.type === 'ev_charger')
    const evMetric = evChargerData.status === 'laden'
      ? `${(evChargerData.currentPowerW / 1000).toFixed(1).replace('.', ',')} kW`
      : evChargerData.status === 'gepland'
        ? 'Gepland'
        : 'Stand-by'
    cards.push({
      moduleType: 'ev_charger',
      label: 'Laadpaal',
      status: (statusEntry?.status ?? 'ok') as 'ok' | 'warning' | 'error',
      metric: evMetric,
      metricLabel: 'Laadstatus',
      to: '/klant/laadpaal',
    })
  }

  return cards
})

// Smart energy tips based on customer data
const energyTips = computed(() => {
  const tips: { icon: string; iconBg: string; iconColor: string; title: string; description: string; cta?: string; to?: string }[] = []

  // Tip based on self-consumption
  if (activeModuleTypes.value.includes('solar') && energyFlow.selfConsumptionPercent < 75) {
    tips.push({
      icon: 'solar',
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-600',
      title: 'Verhoog je eigen verbruik',
      description: `Je verbruikt ${energyFlow.selfConsumptionPercent}% van je zonne-energie zelf. Zet de wasmachine en vaatwasser overdag aan om meer te besparen.`,
    })
  } else if (activeModuleTypes.value.includes('solar')) {
    tips.push({
      icon: 'trending-up',
      iconBg: 'bg-green-50',
      iconColor: 'text-green-600',
      title: 'Goed bezig!',
      description: `Je verbruikt ${energyFlow.selfConsumptionPercent}% van je zonne-energie zelf. Dat is bovengemiddeld! Zo haal je het maximale uit je panelen.`,
    })
  }

  // Tip based on heat pump efficiency
  if (activeModuleTypes.value.includes('heat_pump')) {
    if (heatPumpData.copCurrent >= 4) {
      tips.push({
        icon: 'heat-pump',
        iconBg: 'bg-rose-50',
        iconColor: 'text-rose-600',
        title: 'Je warmtepomp presteert uitstekend',
        description: `Met een COP van ${heatPumpData.copCurrent.toFixed(1)} levert je warmtepomp ${heatPumpData.copCurrent.toFixed(1)}x zoveel warmte als de stroom die het kost. Top!`,
      })
    } else {
      tips.push({
        icon: 'heat-pump',
        iconBg: 'bg-rose-50',
        iconColor: 'text-rose-600',
        title: 'Warmtepomp kan efficiënter',
        description: 'Probeer de temperatuur 1°C lager in te stellen. Dat bespaart tot 5% energie zonder comfortverlies.',
      })
    }
  }

  // Tip: suggest missing modules
  if (!activeModuleTypes.value.includes('ev_charger') && activeModuleTypes.value.includes('solar')) {
    tips.push({
      icon: 'ev-charger',
      iconBg: 'bg-sky-50',
      iconColor: 'text-sky-600',
      title: 'Slim laden met zonne-energie?',
      description: 'Met een laadpaal en slim laden gebruik je je eigen zonne-energie om je auto op te laden. Dat kan tot €50 per maand besparen.',
      cta: 'Meer informatie',
      to: '/klant/abonnementen',
    })
  }

  if (!activeModuleTypes.value.includes('heat_pump') && activeModuleTypes.value.includes('solar')) {
    tips.push({
      icon: 'heat-pump',
      iconBg: 'bg-rose-50',
      iconColor: 'text-rose-600',
      title: 'Van het gas af?',
      description: 'Met een warmtepomp verwarm je je huis elektrisch. In combinatie met je zonnepanelen extra efficiënt.',
      cta: 'Bekijk opties',
      to: '/klant/abonnementen',
    })
  }

  // General savings tip
  tips.push({
    icon: 'zap',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    title: `Je bespaart al €${(energyFlow.savingsYear / 100).toFixed(0)} dit jaar`,
    description: 'Dat is vergelijkbaar met een maand boodschappen. Wist je dat je nog meer kunt besparen door grote apparaten overdag te gebruiken?',
  })

  return tips.slice(0, 3) // Max 3 tips
})

// Upsell: modules the customer does NOT have yet
const upsellModules = computed(() => {
  const activeTypes = activeModuleTypes.value
  return partnerModuleConfigs.filter(c => {
    const type = c.module_definition?.type
    return type && !activeTypes.includes(type) && c.is_enabled
  })
})

// Upsell flow state
const showAddFlow = ref(false)
const upsellModule = ref<string | null>(null)

function handleModuleAdded() {
  upsellModule.value = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- 0. Welcome Banner (new module added) -->
    <Transition name="slide">
      <div
        v-if="welcomeBanner"
        class="flex items-center gap-3 rounded-2xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 px-5 py-4"
      >
        <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-600">
          <AppIcon name="check-circle" :size="22" />
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-green-900">{{ welcomeBanner.subject }}</p>
          <p class="mt-0.5 text-sm text-green-700">{{ welcomeBanner.message }}</p>
        </div>
        <button
          class="shrink-0 rounded-lg p-1.5 text-green-400 transition-colors hover:bg-green-100 hover:text-green-600"
          @click="dismissBanner"
        >
          <AppIcon name="x" :size="16" />
        </button>
      </div>
    </Transition>

    <!-- 1. Greeting + StatusBanner -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">
        {{ greeting }}, {{ firstName }}
      </h1>
      <p v-if="activeModuleTypes.length > 0" class="mt-1 mb-4 text-sm text-gray-500">
        Hier zie je in een oogopslag hoe jouw systemen presteren.
      </p>
      <p v-else class="mt-1 mb-4 text-sm text-gray-500">
        Welkom bij je persoonlijke energieportaal. Sluit een module aan om te starten.
      </p>
      <StatusBanner v-if="activeModuleTypes.length > 0" :status="systemStatus" />
    </div>

    <!-- 2. Energy Flow Card (only when modules are active) -->
    <EnergyFlowCard v-if="activeModuleTypes.length > 0" :energy-flow="energyFlow" />

    <!-- 3. Module Summary Cards (only when modules are active) -->
    <div v-if="moduleSummaryCards.length > 0">
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Mijn systemen</h2>
        <NuxtLink
          to="/klant/abonnementen"
          class="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <AppIcon name="settings" :size="14" />
          Beheren
        </NuxtLink>
      </div>
      <div class="grid gap-3 sm:grid-cols-1 lg:grid-cols-3">
        <ModuleSummaryCard
          v-for="card in moduleSummaryCards"
          :key="card.moduleType"
          :module-type="card.moduleType"
          :label="card.label"
          :status="card.status"
          :metric="card.metric"
          :metric-label="card.metricLabel"
          :to="card.to"
        />
      </div>
    </div>

    <!-- 4. Upsell: Modules afsluiten / Breid je systeem uit -->
    <div v-if="upsellModules.length">
      <h2 v-if="activeModuleTypes.length === 0" class="mb-2 text-lg font-semibold text-gray-900">Start met je eerste module</h2>
      <p v-if="activeModuleTypes.length === 0" class="mb-4 text-sm text-gray-500">
        Kies een module om je installatie te koppelen. Je krijgt direct inzicht in je systeem.
      </p>
      <h2 v-else class="mb-3 text-lg font-semibold text-gray-900">Breid je systeem uit</h2>
      <div :class="activeModuleTypes.length === 0 ? 'space-y-3' : 'grid gap-3 sm:grid-cols-1 lg:grid-cols-2'">
        <div
          v-for="config in upsellModules"
          :key="config.id"
          class="flex items-center gap-4 rounded-2xl border p-5"
          :class="[
            getModuleTheme(config.module_definition?.type || 'solar').border,
            getModuleTheme(config.module_definition?.type || 'solar').bg,
          ]"
        >
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/70"
            :class="getModuleTheme(config.module_definition?.type || 'solar').text"
          >
            <AppIcon :name="getModuleTheme(config.module_definition?.type || 'solar').icon" :size="24" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900">{{ config.module_definition?.name }}</p>
            <p class="mt-0.5 text-xs text-gray-600 leading-relaxed">
              {{ getModuleBenefits(config.module_definition?.type || '').pitch }}
            </p>
            <p class="mt-1 text-xs font-medium text-gray-500">
              Vanaf {{ formatCurrency(config.price_monthly) }}/maand
            </p>
          </div>
          <button
            class="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            @click="upsellModule = config.module_definition?.type || null; showAddFlow = true"
          >
            Bekijk voordelen
          </button>
        </div>
      </div>
    </div>

    <!-- 5. Hulp nodig? -->
    <div class="section bg-gradient-to-br from-gray-50 to-white">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Hulp nodig?</h2>
          <p class="mt-1 text-sm text-gray-500">
            Neem contact op met ons serviceteam. We helpen je graag.
          </p>
          <div class="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
            <a
              v-if="partner.support_phone"
              :href="`tel:${partner.support_phone}`"
              class="flex items-center gap-1.5 hover:text-gray-900"
            >
              <AppIcon name="phone" :size="14" />
              {{ partner.support_phone }}
            </a>
            <a
              v-if="partner.support_email"
              :href="`mailto:${partner.support_email}`"
              class="flex items-center gap-1.5 hover:text-gray-900"
            >
              <AppIcon name="mail" :size="14" />
              {{ partner.support_email }}
            </a>
          </div>
        </div>
        <NuxtLink to="/klant/service" class="btn-primary shrink-0">
          <AppIcon name="help-circle" :size="16" />
          Hulp aanvragen
        </NuxtLink>
      </div>
    </div>

    <!-- Add Module Flow modal -->
    <AddModuleFlow
      v-model="showAddFlow"
      :pre-selected-module="upsellModule"
      @added="handleModuleAdded"
    />
  </div>
</template>
