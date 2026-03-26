<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

const props = defineProps<{
  moduleType: string
  label: string
  status: 'ok' | 'warning' | 'error'
  metric: string
  metricLabel: string
  to: string
}>()

const theme = computed(() => getModuleTheme(props.moduleType))

const statusDotClass = computed(() => {
  switch (props.status) {
    case 'ok': return 'status-dot--active'
    case 'warning': return 'status-dot--warning'
    case 'error': return 'status-dot--error'
    default: return 'status-dot--active'
  }
})
</script>

<template>
  <NuxtLink
    :to="to"
    class="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-md hover:scale-[1.01]"
  >
    <!-- Module icon in themed circle -->
    <div
      class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      :class="[theme.bg, theme.text]"
    >
      <AppIcon :name="theme.icon" :size="22" />
    </div>

    <!-- Label + metric label -->
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold text-gray-900">{{ label }}</p>
      <p class="mt-0.5 text-xs text-gray-500">{{ metricLabel }}</p>
    </div>

    <!-- Metric value + status + chevron -->
    <div class="flex items-center gap-3 shrink-0">
      <div class="text-right">
        <p class="text-sm font-bold text-gray-900">{{ metric }}</p>
        <span class="status-dot" :class="statusDotClass" />
      </div>
      <AppIcon
        name="chevron-right"
        :size="16"
        class="text-gray-300 transition-colors group-hover:text-gray-500"
      />
    </div>
  </NuxtLink>
</template>
