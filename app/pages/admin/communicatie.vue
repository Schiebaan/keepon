<script setup lang="ts">
import { formatDate } from '~/utils/formatters'
import type { MockNotification } from '~/composables/useMockData'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { getNotifications } = useMockData()

const notifications = getNotifications()

const totalSent = computed(() => notifications.filter(n => n.status === 'verzonden').length)
const totalFailed = computed(() => notifications.filter(n => n.status === 'mislukt').length)
const thisMonth = computed(() => notifications.filter(n => n.created_at >= '2025-04-01').length)

function typeLabel(type: MockNotification['type']) {
  const labels: Record<string, string> = {
    factuur_verzonden: 'Factuur',
    contract_bevestiging: 'Contract',
    opzegging_bevestiging: 'Opzegging',
    verhuizing_melding: 'Verhuizing',
    incasso_alert: 'Incasso alert',
    welkomstmail: 'Welkom',
  }
  return labels[type] || type
}

function typeClass(type: MockNotification['type']) {
  const classes: Record<string, string> = {
    factuur_verzonden: 'bg-blue-50 text-blue-700',
    contract_bevestiging: 'bg-green-50 text-green-700',
    opzegging_bevestiging: 'bg-gray-100 text-gray-700',
    verhuizing_melding: 'bg-amber-50 text-amber-700',
    incasso_alert: 'bg-red-50 text-red-700',
    welkomstmail: 'bg-purple-50 text-purple-700',
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

function statusClass(status: string) {
  switch (status) {
    case 'verzonden': return 'badge--green'
    case 'gepland': return 'badge--yellow'
    case 'mislukt': return 'badge--red'
    default: return 'badge--gray'
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Communicatie</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van alle geautomatiseerde berichten naar klanten en servicedesk.</p>
    </div>

    <!-- KPI Stats -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="stat-card" :style="{ '--stat-color': '#1a56db' } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Verzonden</span>
          <AppIcon name="mail" :size="18" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ totalSent }}</p>
        <p class="mt-1 text-xs text-green-600">Alle kanalen</p>
      </div>
      <div class="stat-card" :style="{ '--stat-color': '#059669' } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Deze maand</span>
          <AppIcon name="clock" :size="18" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ thisMonth }}</p>
        <p class="mt-1 text-xs text-green-600">+3 vs vorige maand</p>
      </div>
      <div class="stat-card" :style="{ '--stat-color': '#dc2626' } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Mislukt</span>
          <AppIcon name="warning" :size="18" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ totalFailed }}</p>
        <p class="mt-1 text-xs text-red-600">Opnieuw verzenden</p>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Notification log -->
      <div class="section lg:col-span-2">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Berichtenlog</h2>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th class="pb-3 pr-3">Datum</th>
                <th class="pb-3 pr-3">Type</th>
                <th class="pb-3 pr-3">Ontvanger</th>
                <th class="pb-3 pr-3">Onderwerp</th>
                <th class="pb-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="n in notifications" :key="n.id" class="hover:bg-gray-50">
                <td class="py-3 pr-3 text-xs text-gray-500 whitespace-nowrap">{{ formatDate(n.created_at) }}</td>
                <td class="py-3 pr-3">
                  <span class="inline-flex rounded-md px-2 py-0.5 text-xs font-medium" :class="typeClass(n.type)">
                    {{ typeLabel(n.type) }}
                  </span>
                </td>
                <td class="py-3 pr-3">
                  <p class="text-sm text-gray-900">{{ n.recipient_name }}</p>
                  <p class="text-xs text-gray-400">{{ n.recipient_email }}</p>
                </td>
                <td class="py-3 pr-3 text-sm text-gray-700 max-w-xs truncate">{{ n.subject }}</td>
                <td class="py-3">
                  <span class="badge" :class="statusClass(n.status)">{{ n.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Email settings sidebar -->
      <div class="space-y-6">
        <div class="section">
          <h2 class="mb-4 text-base font-semibold text-gray-900">E-mail instellingen</h2>

          <div class="space-y-3">
            <div class="flex items-center justify-between rounded-xl border border-gray-200 p-3">
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <AppIcon name="mail" :size="16" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Resend</p>
                  <p class="text-xs text-gray-500">Transactionele e-mail</p>
                </div>
              </div>
              <span class="badge badge--green">Verbonden</span>
            </div>

            <div class="flex items-center justify-between rounded-xl border border-gray-200 p-3">
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <AppIcon name="bell" :size="16" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">Servicedesk alerts</p>
                  <p class="text-xs text-gray-500">Incasso & verhuizing meldingen</p>
                </div>
              </div>
              <span class="badge badge--green">Actief</span>
            </div>
          </div>
        </div>

        <div class="section">
          <h2 class="mb-3 text-base font-semibold text-gray-900">Automatische berichten</h2>
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Welkomstmail</span>
              <span class="text-green-600 font-medium">Aan</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Factuur per e-mail</span>
              <span class="text-green-600 font-medium">Aan</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Contractbevestiging</span>
              <span class="text-green-600 font-medium">Aan</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Opzeggingsbevestiging</span>
              <span class="text-green-600 font-medium">Aan</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Incasso alert (servicedesk)</span>
              <span class="text-green-600 font-medium">Aan</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-600">Verhuizing melding</span>
              <span class="text-green-600 font-medium">Aan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
