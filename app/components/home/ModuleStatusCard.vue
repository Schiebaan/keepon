<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'
import { formatCurrency } from '~/utils/formatters'

const props = defineProps<{
  moduleType: string
  moduleName: string
  status: string
  price: number
  billingInterval: string
  // Mock monitoring data
  monitoring?: {
    label: string
    value: string
    unit: string
    trend?: 'up' | 'down' | 'stable'
    trendValue?: string
  }[]
}>()

const theme = computed(() => getModuleTheme(props.moduleType))
</script>

<template>
  <div class="section relative overflow-hidden">
    <!-- Accent top border -->
    <div
      class="absolute inset-x-0 top-0 h-1"
      :style="{ backgroundColor: theme.accent }"
    />

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl"
          :class="[theme.bg, theme.text]"
        >
          <AppIcon :name="theme.icon" :size="20" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">{{ moduleName }}</h3>
          <p class="text-xs text-gray-500">
            {{ formatCurrency(price) }} / {{ billingInterval === 'monthly' ? 'maand' : 'jaar' }}
          </p>
        </div>
      </div>
      <span class="badge badge--green">
        <span class="status-dot status-dot--active" />
        Actief
      </span>
    </div>

    <!-- Monitoring data -->
    <div v-if="monitoring?.length" class="mt-4 grid gap-3" :class="monitoring.length > 2 ? 'grid-cols-3' : 'grid-cols-2'">
      <div
        v-for="metric in monitoring"
        :key="metric.label"
        class="rounded-lg bg-gray-50 p-3"
      >
        <p class="text-[11px] font-medium uppercase tracking-wider text-gray-400">{{ metric.label }}</p>
        <div class="mt-1 flex items-baseline gap-1">
          <span class="text-lg font-bold text-gray-900">{{ metric.value }}</span>
          <span class="text-xs text-gray-500">{{ metric.unit }}</span>
        </div>
        <p
          v-if="metric.trendValue"
          class="mt-0.5 text-[11px] font-medium"
          :class="{
            'text-green-600': metric.trend === 'up',
            'text-red-500': metric.trend === 'down',
            'text-gray-400': metric.trend === 'stable',
          }"
        >
          {{ metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→' }}
          {{ metric.trendValue }}
        </p>
      </div>
    </div>
  </div>
</template>
