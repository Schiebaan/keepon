<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin' })

const { customers, subscriptions, partner, getActiveModuleCount, getMonthlyRevenue, getPaymentStats, moduleDefinitions } = useMockData()

const paymentStats = getPaymentStats()

const stats = [
  {
    label: 'Klanten',
    value: customers.length,
    change: '+2 deze maand',
    changePositive: true,
    icon: 'users',
    color: '#1a56db',
  },
  {
    label: 'Actieve modules',
    value: getActiveModuleCount(),
    change: '+1 deze week',
    changePositive: true,
    icon: 'puzzle',
    color: '#059669',
  },
  {
    label: 'Maandomzet',
    value: formatCurrency(getMonthlyRevenue()),
    change: '+12% vs vorige maand',
    changePositive: true,
    icon: 'euro',
    color: '#7c3aed',
  },
  {
    label: 'Openstaand',
    value: formatCurrency(paymentStats.pendingAmount + paymentStats.failedAmount),
    change: `${paymentStats.failedCount} mislukt`,
    changePositive: false,
    icon: 'clock',
    color: '#dc2626',
  },
]

// Recente activiteit (mock)
const recentActivity = [
  { id: 1, text: 'Jan de Vries heeft Warmtepomp monitoring geactiveerd', time: '2 uur geleden', type: 'activation', icon: 'check-circle' },
  { id: 2, text: 'Lisa Bakker: betaling ontvangen (€4,99)', time: '5 uur geleden', type: 'payment', icon: 'euro' },
  { id: 3, text: 'Piet Janssen heeft Laadpaal monitoring geactiveerd', time: '1 dag geleden', type: 'activation', icon: 'check-circle' },
  { id: 4, text: 'Tom Smit is toegevoegd als klant', time: '2 dagen geleden', type: 'customer', icon: 'users' },
  { id: 5, text: 'Maria van Dijk: betaling mislukt', time: '3 dagen geleden', type: 'warning', icon: 'warning' },
]

// Module breakdown from real data
const moduleBreakdown = moduleDefinitions.map(md => {
  const count = subscriptions.filter(s => s.partner_module_config?.module_definition?.type === md.type && s.status === 'active').length
  const theme = getModuleTheme(md.type)
  return { name: md.name, type: md.type, count, theme }
})
</script>

<template>
  <div>
    <!-- Page header — no "Welkom terug" -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van {{ partner.name }}</p>
    </div>

    <!-- KPI Stat Cards with accent bars -->
    <div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-card"
        :style="{ '--stat-color': stat.color }"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg"
            :style="{ backgroundColor: stat.color + '10', color: stat.color }"
          >
            <AppIcon :name="stat.icon" :size="18" />
          </div>
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ stat.value }}</p>
        <p
          class="mt-1 text-xs font-medium"
          :class="stat.changePositive ? 'text-green-600' : 'text-red-500'"
        >
          {{ stat.change }}
        </p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Recente activiteit -->
      <div class="lg:col-span-2">
        <div class="section">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">Recente activiteit</h2>
            <NuxtLink to="/admin/customers" class="text-xs font-medium text-gray-400 hover:text-gray-600">
              Alle klanten &rarr;
            </NuxtLink>
          </div>
          <div class="space-y-4">
            <div
              v-for="item in recentActivity"
              :key="item.id"
              class="flex items-start gap-3"
            >
              <div
                class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                :class="{
                  'bg-green-50 text-green-600': item.type === 'activation',
                  'bg-blue-50 text-blue-600': item.type === 'payment',
                  'bg-gray-100 text-gray-500': item.type === 'customer',
                  'bg-red-50 text-red-500': item.type === 'warning',
                }"
              >
                <AppIcon :name="item.icon" :size="15" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-700">{{ item.text }}</p>
                <p class="mt-0.5 text-xs text-gray-400">{{ item.time }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Module verdeling -->
      <div>
        <div class="section">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">Modules</h2>
            <NuxtLink to="/admin/modules" class="text-xs font-medium text-gray-400 hover:text-gray-600">
              Beheren &rarr;
            </NuxtLink>
          </div>
          <div class="space-y-3">
            <div
              v-for="mod in moduleBreakdown"
              :key="mod.type"
              class="flex items-center justify-between rounded-xl p-3"
              :class="mod.theme.bg"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg"
                  :class="[mod.theme.bg, mod.theme.text]"
                >
                  <AppIcon :name="mod.theme.icon" :size="16" />
                </div>
                <span class="text-sm font-medium" :class="mod.theme.text">{{ mod.name }}</span>
              </div>
              <span
                class="badge"
                :class="mod.theme.bg + ' ' + mod.theme.text"
              >
                {{ mod.count }} actief
              </span>
            </div>
          </div>

          <!-- Quick payment stats -->
          <div class="mt-5 border-t border-gray-100 pt-4">
            <div class="flex items-center justify-between">
              <span class="text-xs font-medium text-gray-500">Openstaande betalingen</span>
              <span class="badge" :class="paymentStats.pendingCount > 0 ? 'badge--yellow' : 'badge--green'">
                {{ paymentStats.pendingCount + paymentStats.failedCount }}
              </span>
            </div>
            <NuxtLink to="/admin/payments" class="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600">
              <AppIcon name="credit-card" :size="12" />
              Betalingen bekijken
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
