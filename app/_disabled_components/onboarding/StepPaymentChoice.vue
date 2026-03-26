<script setup lang="ts">
import type { PartnerModuleConfig } from '~~/shared/types/database'
import { formatCurrency } from '~/utils/formatters'

const props = defineProps<{
  moduleConfig: PartnerModuleConfig
}>()

const interval = defineModel<'monthly' | 'yearly'>('interval', { default: 'monthly' })

const emit = defineEmits<{
  continue: []
}>()

const monthlyPrice = computed(() => formatCurrency(props.moduleConfig.price_monthly))
const yearlyPrice = computed(() => formatCurrency(props.moduleConfig.price_yearly))
const yearlyMonthly = computed(() => formatCurrency(Math.round(props.moduleConfig.price_yearly / 12)))
const yearlySaving = computed(() => {
  const diff = (props.moduleConfig.price_monthly * 12) - props.moduleConfig.price_yearly
  return diff > 0 ? formatCurrency(diff) : null
})
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold text-gray-900">Kies je betaalperiode</h2>
    <p class="mt-1 text-sm text-gray-500">
      {{ moduleConfig.module_definition?.name }}
    </p>

    <div class="mt-4 space-y-3">
      <!-- Monthly -->
      <label
        class="flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-colors"
        :class="interval === 'monthly' ? 'border-brand-primary bg-blue-50' : 'border-gray-200'"
      >
        <div class="flex items-center gap-3">
          <input
            v-model="interval"
            type="radio"
            value="monthly"
            class="h-4 w-4 text-brand-primary focus:ring-brand-primary"
          >
          <div>
            <p class="font-medium text-gray-900">Maandelijks</p>
            <p class="text-sm text-gray-500">Maandelijks opzegbaar</p>
          </div>
        </div>
        <span class="text-lg font-semibold text-gray-900">{{ monthlyPrice }}/mnd</span>
      </label>

      <!-- Yearly -->
      <label
        class="flex cursor-pointer items-center justify-between rounded-lg border-2 p-4 transition-colors"
        :class="interval === 'yearly' ? 'border-brand-primary bg-blue-50' : 'border-gray-200'"
      >
        <div class="flex items-center gap-3">
          <input
            v-model="interval"
            type="radio"
            value="yearly"
            class="h-4 w-4 text-brand-primary focus:ring-brand-primary"
          >
          <div>
            <p class="font-medium text-gray-900">
              Jaarlijks
              <span v-if="yearlySaving" class="ml-1 rounded bg-green-100 px-1.5 py-0.5 text-xs font-medium text-green-700">
                Bespaar {{ yearlySaving }}
              </span>
            </p>
            <p class="text-sm text-gray-500">{{ yearlyMonthly }}/mnd, jaarlijks gefactureerd</p>
          </div>
        </div>
        <span class="text-lg font-semibold text-gray-900">{{ yearlyPrice }}/jaar</span>
      </label>
    </div>

    <button
      class="btn-primary mt-6 w-full"
      @click="emit('continue')"
    >
      Ga naar betaling
    </button>
  </div>
</template>
