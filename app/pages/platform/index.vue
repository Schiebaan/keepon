<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'

definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const { partners, getPlatformStats, getPartnerCustomers, getPartnerActiveModuleCount, getPartnerMonthlyRevenue } = useMockData()

const platform = getPlatformStats()

const stats = [
  {
    label: 'Partners',
    value: platform.activePartners,
    change: '+1 deze maand',
    changePositive: true,
    icon: 'building',
    color: '#1a56db',
  },
  {
    label: 'Klanten',
    value: platform.totalCustomers,
    change: '+3 deze maand',
    changePositive: true,
    icon: 'users',
    color: '#059669',
  },
  {
    label: 'Actieve modules',
    value: platform.totalActiveSubscriptions,
    change: '+4 deze week',
    changePositive: true,
    icon: 'puzzle',
    color: '#7c3aed',
  },
  {
    label: 'Platform MRR',
    value: formatCurrency(platform.totalMRR),
    change: '+18% vs vorige maand',
    changePositive: true,
    icon: 'euro',
    color: '#f59e0b',
  },
]

const recentActivity = [
  { id: 1, text: 'SolarWise: nieuwe klant Sophie Mulder aangemeld', time: '2 uur geleden', icon: 'users' },
  { id: 2, text: 'GreenCharge: 2 nieuwe laadpaal abonnementen', time: '5 uur geleden', icon: 'ev-charger' },
  { id: 3, text: 'Volt4U: betaling mislukt voor Maria van Dijk', time: '1 dag geleden', icon: 'warning' },
  { id: 4, text: 'SolarWise: warmtepomp monitoring geactiveerd', time: '1 dag geleden', icon: 'check-circle' },
  { id: 5, text: 'GreenCharge: partner onboarding voltooid', time: '3 dagen geleden', icon: 'check-circle' },
]
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van alle partners en activiteit</p>
    </div>

    <!-- KPI Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="stat-card" :style="{ '--stat-color': stat.color } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">{{ stat.label }}</span>
          <AppIcon :name="stat.icon" :size="20" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ stat.value }}</p>
        <p class="mt-1 text-xs" :class="stat.changePositive ? 'text-green-600' : 'text-red-600'">
          {{ stat.change }}
        </p>
      </div>
    </div>

    <!-- Two column layout -->
    <div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
      <!-- Partner breakdown -->
      <div class="section lg:col-span-2">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Partners</h2>
          <NuxtLink to="/platform/partners" class="text-sm font-medium text-blue-600 hover:text-blue-700">
            Alle partners &rarr;
          </NuxtLink>
        </div>

        <div class="divide-y divide-gray-100">
          <NuxtLink
            v-for="p in partners"
            :key="p.id"
            :to="`/platform/partners/${p.slug}`"
            class="flex items-center gap-4 py-4 transition-colors hover:bg-gray-50 -mx-4 px-4 rounded-lg"
          >
            <img :src="p.logo_url!" :alt="p.name" class="h-10 w-10 rounded-xl" />
            <div class="min-w-0 flex-1">
              <p class="font-medium text-gray-900">{{ p.name }}</p>
              <p class="text-xs text-gray-500">{{ p.slug }}.runon.nl</p>
            </div>
            <div class="hidden gap-6 text-right sm:flex">
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ getPartnerCustomers(p.id).length }}</p>
                <p class="text-xs text-gray-500">klanten</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ getPartnerActiveModuleCount(p.id) }}</p>
                <p class="text-xs text-gray-500">modules</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ formatCurrency(getPartnerMonthlyRevenue(p.id)) }}</p>
                <p class="text-xs text-gray-500">MRR</p>
              </div>
            </div>
            <AppIcon name="chevron-right" :size="16" class="text-gray-300" />
          </NuxtLink>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="section">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Recente activiteit</h2>
        <div class="space-y-4">
          <div v-for="item in recentActivity" :key="item.id" class="flex gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
              <AppIcon :name="item.icon" :size="14" class="text-gray-500" />
            </div>
            <div>
              <p class="text-sm text-gray-700">{{ item.text }}</p>
              <p class="text-xs text-gray-400">{{ item.time }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
