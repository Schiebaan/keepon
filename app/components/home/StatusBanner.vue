<script setup lang="ts">
import type { MockSystemStatus } from '~/composables/useMockData'

const props = defineProps<{
  status: MockSystemStatus
}>()

const config = computed(() => {
  switch (props.status.overall) {
    case 'ok':
      return {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        subtext: 'text-green-600',
        icon: 'check-circle',
        title: 'Alles werkt goed',
      }
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        subtext: 'text-yellow-600',
        icon: 'warning',
        title: 'Let op: er is aandacht nodig',
      }
    case 'error':
      return {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        subtext: 'text-red-600',
        icon: 'x-circle',
        title: 'Actie vereist',
      }
  }
})

const lastCheckedText = computed(() => {
  const now = new Date()
  const checked = new Date(props.status.lastChecked)
  const diffMs = now.getTime() - checked.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Zojuist gecontroleerd'
  if (diffMin < 60) return `${diffMin} min geleden gecontroleerd`
  const diffHours = Math.floor(diffMin / 60)
  if (diffHours < 24) return `${diffHours} uur geleden gecontroleerd`
  return `${Math.floor(diffHours / 24)} dagen geleden gecontroleerd`
})

const okModules = computed(() =>
  props.status.modules.filter(m => m.status === 'ok').map(m => m.message)
)
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-2xl border p-4"
    :class="[config.bg, config.border]"
  >
    <div class="mt-0.5 shrink-0">
      <AppIcon :name="config.icon" :size="22" :class="config.text" />
    </div>
    <div class="min-w-0 flex-1">
      <p class="text-sm font-semibold" :class="config.text">
        {{ config.title }}
      </p>
      <p class="mt-0.5 text-xs" :class="config.subtext">
        {{ lastCheckedText }}
      </p>
      <div v-if="okModules.length" class="mt-2 flex flex-wrap gap-1.5">
        <span
          v-for="msg in okModules"
          :key="msg"
          class="inline-flex items-center gap-1 rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-medium"
          :class="config.subtext"
        >
          <AppIcon name="check" :size="12" />
          {{ msg }}
        </span>
      </div>
    </div>
  </div>
</template>
