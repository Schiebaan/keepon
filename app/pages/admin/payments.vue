<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { payments, getPaymentStats, getRecentPayments } = useMockData()

const stats = getPaymentStats()
const allPayments = getRecentPayments(50)

// Filter state
const statusFilter = ref<string>('all')

const filteredPayments = computed(() => {
  if (statusFilter.value === 'all') return allPayments
  return allPayments.filter(p => p.status === statusFilter.value)
})

const statusBadge = (status: string) => {
  switch (status) {
    case 'paid': return { class: 'badge--green', label: 'Betaald' }
    case 'pending': return { class: 'badge--yellow', label: 'Openstaand' }
    case 'failed': return { class: 'badge--red', label: 'Mislukt' }
    case 'refunded': return { class: 'badge--gray', label: 'Terugbetaald' }
    default: return { class: 'badge--gray', label: status }
  }
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

const kpiCards = [
  {
    label: 'Omzet deze maand',
    value: formatCurrency(stats.totalThisMonth),
    icon: 'euro',
    color: '#059669',
  },
  {
    label: 'Openstaand',
    value: formatCurrency(stats.pendingAmount),
    count: stats.pendingCount,
    icon: 'clock',
    color: '#d97706',
  },
  {
    label: 'Mislukt',
    value: formatCurrency(stats.failedAmount),
    count: stats.failedCount,
    icon: 'warning',
    color: '#dc2626',
  },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Betalingen</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van alle betalingen en openstaande bedragen.</p>
    </div>

    <!-- KPI Cards -->
    <div class="mb-8 grid gap-4 sm:grid-cols-3">
      <div
        v-for="kpi in kpiCards"
        :key="kpi.label"
        class="stat-card"
        :style="{ '--stat-color': kpi.color }"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-500">{{ kpi.label }}</p>
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg"
            :style="{ backgroundColor: kpi.color + '10', color: kpi.color }"
          >
            <AppIcon :name="kpi.icon" :size="18" />
          </div>
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ kpi.value }}</p>
        <p v-if="kpi.count !== undefined" class="mt-1 text-xs text-gray-400">
          {{ kpi.count }} betaling{{ kpi.count !== 1 ? 'en' : '' }}
        </p>
      </div>
    </div>

    <!-- Payments table -->
    <div class="section">
      <div class="mb-5 flex items-center justify-between">
        <h2 class="text-base font-semibold text-gray-900">Betalingsoverzicht</h2>

        <!-- Status filter -->
        <div class="flex gap-1">
          <button
            v-for="filter in [
              { value: 'all', label: 'Alles' },
              { value: 'paid', label: 'Betaald' },
              { value: 'pending', label: 'Openstaand' },
              { value: 'failed', label: 'Mislukt' },
            ]"
            :key="filter.value"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            :class="statusFilter === filter.value
              ? 'bg-gray-900 text-white'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'"
            @click="statusFilter = filter.value"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Table -->
      <div class="-mx-6 overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Datum</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Klant</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Module</th>
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Bedrag</th>
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="payment in filteredPayments"
              :key="payment.id"
              class="transition-colors hover:bg-gray-50/50"
            >
              <td class="whitespace-nowrap px-6 py-3.5 text-sm text-gray-500">
                {{ formatDate(payment.created_at) }}
              </td>
              <td class="px-6 py-3.5">
                <p class="text-sm font-medium text-gray-900">{{ payment.customer_name }}</p>
              </td>
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-2">
                  <div
                    class="flex h-6 w-6 items-center justify-center rounded"
                    :class="[getModuleTheme(payment.module_type).bg, getModuleTheme(payment.module_type).text]"
                  >
                    <AppIcon :name="getModuleTheme(payment.module_type).icon" :size="12" />
                  </div>
                  <span class="text-sm text-gray-700">{{ payment.module_name }}</span>
                </div>
              </td>
              <td class="whitespace-nowrap px-6 py-3.5 text-right text-sm font-medium text-gray-900">
                {{ formatCurrency(payment.amount_cents) }}
              </td>
              <td class="whitespace-nowrap px-6 py-3.5 text-right">
                <span class="badge" :class="statusBadge(payment.status).class">
                  {{ statusBadge(payment.status).label }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="filteredPayments.length === 0" class="py-8 text-center text-sm text-gray-400">
        Geen betalingen gevonden voor dit filter.
      </div>
    </div>
  </div>
</template>
