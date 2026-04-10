<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { partner } = usePartner()
const { customers, isLoading: customersLoading } = useCustomers()
const stats = computed(() => [
  {
    label: 'Klanten',
    value: customers.value.length,
    change: '',
    changePositive: true,
    icon: 'users',
    color: '#1a56db',
  },
  {
    label: 'Actieve modules',
    value: 0,
    change: 'Binnenkort beschikbaar',
    changePositive: true,
    icon: 'puzzle',
    color: '#059669',
  },
  {
    label: 'Maandomzet',
    value: '—',
    change: 'Binnenkort beschikbaar',
    changePositive: true,
    icon: 'euro',
    color: '#7c3aed',
  },
  {
    label: 'Openstaand',
    value: '—',
    change: '',
    changePositive: true,
    icon: 'clock',
    color: '#dc2626',
  },
])

// Recente activiteit — will be populated from audit_log later
const recentActivity: any[] = []

// System alerts — will be populated from real subscription data later
const systemAlerts = computed(() => {
  const alerts: { id: string; customer: string; customerId: string; type: 'error' | 'warning'; module: string; message: string; icon: string }[] = []
  return alerts
})

// Module breakdown — shows available modules (counts come later when subscriptions are in Supabase)
const moduleBreakdown = [
  { name: 'Zonnepanelen', type: 'solar', count: 0, theme: getModuleTheme('solar') },
  { name: 'Warmtepomp', type: 'heat_pump', count: 0, theme: getModuleTheme('heat_pump') },
  { name: 'Laadpaal', type: 'ev_charger', count: 0, theme: getModuleTheme('ev_charger') },
]
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van {{ partner.name }}</p>
    </div>

    <!-- Welcome banner when no customers yet -->
    <div v-if="!customersLoading && customers.length === 0" class="mb-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <AppIcon name="users" :size="28" class="text-gray-400" />
      </div>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Welkom bij {{ partner.name }}!</h2>
      <p class="text-sm text-gray-500 max-w-md mx-auto mb-6">
        Je portaal is klaar. Begin met het toevoegen van je eerste klant, of pas je instellingen aan.
      </p>
      <div class="flex items-center justify-center gap-3">
        <NuxtLink
          to="/admin/customers"
          class="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          :style="{ backgroundColor: partner.primary_color }"
        >
          <AppIcon name="plus" :size="16" />
          Eerste klant toevoegen
        </NuxtLink>
        <NuxtLink
          to="/admin/settings"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <AppIcon name="settings" :size="16" />
          Instellingen
        </NuxtLink>
      </div>
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

    <!-- System Alerts -->
    <div v-if="systemAlerts.length > 0" class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <AppIcon name="warning" :size="18" class="text-red-500" />
        <h2 class="text-base font-semibold text-gray-900">Aandacht vereist</h2>
        <span class="badge badge--red">{{ systemAlerts.length }}</span>
      </div>
      <div class="space-y-2">
        <NuxtLink
          v-for="alert in systemAlerts"
          :key="alert.id"
          :to="`/admin/customers/${alert.customerId}`"
          class="flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-sm"
          :class="alert.type === 'error' ? 'border-red-200 bg-red-50/50' : 'border-amber-200 bg-amber-50/50'"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            :class="alert.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'"
          >
            <AppIcon :name="alert.icon" :size="20" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-gray-900">{{ alert.customer }}</p>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                :class="alert.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ alert.module }}
              </span>
            </div>
            <p class="text-xs text-gray-600 mt-0.5">{{ alert.message }}</p>
          </div>
          <AppIcon name="chevron-right" :size="16" class="text-gray-300 shrink-0" />
        </NuxtLink>
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
          <div v-if="recentActivity.length === 0" class="py-8 text-center">
            <AppIcon name="activity" :size="24" class="mx-auto text-gray-300 mb-2" />
            <p class="text-sm text-gray-400">Activiteit verschijnt hier zodra klanten worden toegevoegd.</p>
          </div>
          <div v-else class="space-y-4">
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

          <!-- Payment link -->
          <div class="mt-5 border-t border-gray-100 pt-4">
            <NuxtLink to="/admin/payments" class="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600">
              <AppIcon name="credit-card" :size="12" />
              Betalingen bekijken
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
