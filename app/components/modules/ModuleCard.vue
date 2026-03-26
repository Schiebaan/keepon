<script setup lang="ts">
import type { PartnerModuleConfig, Subscription } from '~~/shared/types/database'
import { formatCurrency } from '~/utils/formatters'

const props = defineProps<{
  moduleConfig: PartnerModuleConfig
  subscription?: Subscription | null
  installationId: string
}>()

const isActive = computed(() => props.subscription?.status === 'active')
const isPending = computed(() => props.subscription?.status === 'pending_payment')
const moduleDef = computed(() => props.moduleConfig.module_definition!)

const iconMap: Record<string, string> = {
  sun: '&#9728;',
  thermometer: '&#127777;',
  zap: '&#9889;',
}
</script>

<template>
  <div class="card">
    <div class="flex items-start justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
          :class="isActive ? 'bg-green-100' : 'bg-gray-100'"
        >
          <span v-html="iconMap[moduleDef.icon || ''] || '&#128268;'" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">{{ moduleDef.name }}</h3>
          <p class="text-sm text-gray-500">{{ moduleDef.description }}</p>
        </div>
      </div>

      <!-- Status badge -->
      <span
        v-if="isActive"
        class="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700"
      >
        Actief
      </span>
      <span
        v-else-if="isPending"
        class="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700"
      >
        In afwachting
      </span>
    </div>

    <div class="mt-4 flex items-center justify-between">
      <div>
        <span class="text-lg font-semibold text-gray-900">
          {{ formatCurrency(moduleConfig.price_monthly) }}
        </span>
        <span class="text-sm text-gray-500"> / maand</span>
      </div>

      <NuxtLink
        v-if="!subscription"
        :to="`/modules/${moduleConfig.id}/activate?installation=${installationId}`"
        class="btn-primary"
      >
        Activeer
      </NuxtLink>

      <NuxtLink
        v-else-if="isActive"
        :to="`/installations/${installationId}`"
        class="btn-secondary"
      >
        Bekijk data
      </NuxtLink>
    </div>
  </div>
</template>
