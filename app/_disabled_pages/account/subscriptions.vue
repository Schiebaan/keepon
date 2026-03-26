<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/formatters'

definePageMeta({ middleware: ['auth'] })

const { getAllSubscriptions } = useModules()
const { data: subscriptions } = await useAsyncData('my-subscriptions', getAllSubscriptions)

const statusLabels: Record<string, { text: string; class: string }> = {
  active: { text: 'Actief', class: 'bg-green-100 text-green-700' },
  pending_payment: { text: 'In afwachting', class: 'bg-yellow-100 text-yellow-700' },
  paused: { text: 'Gepauzeerd', class: 'bg-gray-100 text-gray-700' },
  cancelled: { text: 'Opgezegd', class: 'bg-red-100 text-red-700' },
  expired: { text: 'Verlopen', class: 'bg-gray-100 text-gray-500' },
}
</script>

<template>
  <div>
    <NuxtLink to="/account" class="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
      &larr; Terug naar account
    </NuxtLink>

    <h1 class="mb-6 text-2xl font-bold text-gray-900">Mijn abonnementen</h1>

    <div v-if="!subscriptions?.length" class="card text-center py-12">
      <p class="text-gray-500">Je hebt nog geen actieve abonnementen.</p>
      <NuxtLink to="/installations" class="btn-primary mt-4 inline-block">
        Modules activeren
      </NuxtLink>
    </div>

    <div v-else class="space-y-4">
      <div
        v-for="sub in subscriptions"
        :key="sub.id"
        class="card"
      >
        <div class="flex items-start justify-between">
          <div>
            <h3 class="font-semibold text-gray-900">
              {{ sub.partner_module_config?.module_definition?.name || 'Module' }}
            </h3>
            <p class="mt-1 text-sm text-gray-500">
              {{ formatCurrency(sub.price_cents) }} /
              {{ sub.billing_interval === 'monthly' ? 'maand' : 'jaar' }}
            </p>
          </div>
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-medium"
            :class="statusLabels[sub.status]?.class"
          >
            {{ statusLabels[sub.status]?.text }}
          </span>
        </div>

        <div v-if="sub.activated_at" class="mt-2 text-xs text-gray-400">
          Actief sinds {{ formatDate(sub.activated_at) }}
        </div>
      </div>
    </div>
  </div>
</template>
