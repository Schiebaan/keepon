<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import type { MockEnergyFlow } from '~/composables/useMockData'

const props = defineProps<{
  energyFlow: MockEnergyFlow
}>()

function formatWatts(w: number): string {
  return (Math.abs(w) / 1000).toFixed(1).replace('.', ',')
}

const isExporting = computed(() => props.energyFlow.gridImportW < 0)

const gridLabel = computed(() =>
  isExporting.value ? 'Teruglevering' : 'Van het net'
)
</script>

<template>
  <div class="section">
    <!-- Savings hero -->
    <div class="mb-6 flex items-center gap-6">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Besparing vandaag</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ formatCurrency(energyFlow.savingsToday) }}</p>
      </div>
      <div class="h-8 w-px bg-gray-200" />
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Deze maand</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ formatCurrency(energyFlow.savingsMonth) }}</p>
      </div>
      <div class="h-8 w-px bg-gray-200" />
      <div class="hidden sm:block">
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Dit jaar</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ formatCurrency(energyFlow.savingsYear) }}</p>
      </div>
    </div>

    <!-- Energy flow pillars -->
    <div class="relative flex items-center justify-between rounded-xl bg-gray-50 px-4 py-6 sm:px-8">
      <!-- Solar pillar -->
      <div class="flex flex-col items-center gap-2">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
          <AppIcon name="solar" :size="28" />
        </div>
        <p class="text-lg font-bold text-gray-900">{{ formatWatts(energyFlow.solarProductionW) }} kW</p>
        <p class="text-xs font-medium text-amber-600">Zonnepanelen</p>
      </div>

      <!-- Flow line: solar -> house -->
      <div class="flow-line flow-line--solar" />

      <!-- House pillar -->
      <div class="flex flex-col items-center gap-2">
        <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-200 text-gray-600">
          <AppIcon name="home" :size="28" />
        </div>
        <p class="text-lg font-bold text-gray-900">{{ formatWatts(energyFlow.houseConsumptionW) }} kW</p>
        <p class="text-xs font-medium text-gray-500">Verbruik</p>
      </div>

      <!-- Flow line: house -> grid -->
      <div class="flow-line" :class="isExporting ? 'flow-line--export' : 'flow-line--import'" />

      <!-- Grid pillar -->
      <div class="flex flex-col items-center gap-2">
        <div
          class="flex h-14 w-14 items-center justify-center rounded-2xl"
          :class="isExporting ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
        >
          <AppIcon name="zap" :size="28" />
        </div>
        <p
          class="text-lg font-bold"
          :class="isExporting ? 'text-green-700' : 'text-red-600'"
        >
          {{ formatWatts(energyFlow.gridImportW) }} kW
        </p>
        <p
          class="text-xs font-medium"
          :class="isExporting ? 'text-green-600' : 'text-red-500'"
        >
          {{ gridLabel }}
        </p>
      </div>
    </div>

    <!-- Self-consumption bar -->
    <div class="mt-5">
      <div class="mb-1.5 flex items-center justify-between">
        <p class="text-xs font-medium text-gray-500">Eigen verbruik</p>
        <p class="text-sm font-bold text-gray-900">{{ energyFlow.selfConsumptionPercent }}%</p>
      </div>
      <div class="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          class="h-full rounded-full bg-gradient-to-r from-amber-400 to-green-500 transition-all duration-700"
          :style="{ width: `${energyFlow.selfConsumptionPercent}%` }"
        />
      </div>
      <div class="mt-1 flex justify-between text-[11px] text-gray-400">
        <span>{{ energyFlow.selfConsumptionPercent }}% eigen verbruik</span>
        <span>{{ energyFlow.feedInPercent }}% teruglevering</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Animated flow dots between pillars */
.flow-line {
  position: relative;
  flex: 1;
  height: 2px;
  margin: 0 8px;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent 4px,
    #d1d5db 4px,
    #d1d5db 8px
  );
  align-self: center;
  margin-top: -24px;
}

.flow-line::after {
  content: '';
  position: absolute;
  top: 50%;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transform: translateY(-50%);
  animation: flow-dot 2s ease-in-out infinite;
}

.flow-line--solar::after {
  background-color: #f59e0b;
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
}

.flow-line--export::after {
  background-color: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}

.flow-line--import::after {
  background-color: #ef4444;
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
}

@keyframes flow-dot {
  0% {
    left: 0;
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    left: calc(100% - 8px);
    opacity: 0;
  }
}
</style>
