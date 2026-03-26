<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

const props = defineProps<{
  open: boolean
  installationId: string
  existingModuleTypes: string[] // types already subscribed to
}>()

const emit = defineEmits<{
  close: []
  added: [configId: string]
}>()

const { partnerModuleConfigs } = useMockData()

// Only show modules not yet subscribed to
const availableModules = computed(() =>
  partnerModuleConfigs.filter(c => {
    const type = c.module_definition?.type
    return type && !props.existingModuleTypes.includes(type) && c.is_enabled
  })
)

const selectedConfig = ref<string | null>(null)

function handleAdd() {
  if (selectedConfig.value) {
    emit('added', selectedConfig.value)
    selectedConfig.value = null
  }
}

function handleClose() {
  selectedConfig.value = null
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        <!-- Modal -->
        <div class="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">Module toevoegen</h3>
            <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" @click="handleClose">
              <AppIcon name="x" :size="18" />
            </button>
          </div>

          <p class="mt-2 text-sm text-gray-500">
            Kies een module om toe te voegen aan je installatie.
          </p>

          <!-- Available modules -->
          <div v-if="availableModules.length" class="mt-5 space-y-3">
            <label
              v-for="config in availableModules"
              :key="config.id"
              class="flex cursor-pointer items-center gap-4 rounded-xl border-2 p-4 transition-all"
              :class="selectedConfig === config.id
                ? 'border-blue-500 bg-blue-50/50'
                : 'border-gray-200 hover:border-gray-300'"
            >
              <input
                v-model="selectedConfig"
                type="radio"
                :value="config.id"
                class="sr-only"
              />
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl"
                :class="[getModuleTheme(config.module_definition?.type || 'solar').bg, getModuleTheme(config.module_definition?.type || 'solar').text]"
              >
                <AppIcon :name="getModuleTheme(config.module_definition?.type || 'solar').icon" :size="22" />
              </div>
              <div class="flex-1">
                <p class="text-sm font-semibold text-gray-900">{{ config.module_definition?.name }}</p>
                <p class="text-xs text-gray-500">{{ config.module_definition?.description }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-bold text-gray-900">{{ formatCurrency(config.price_monthly) }}</p>
                <p class="text-[11px] text-gray-400">per maand</p>
              </div>
            </label>
          </div>

          <!-- No modules available -->
          <div v-else class="mt-5 rounded-xl bg-gray-50 p-6 text-center">
            <AppIcon name="check-circle" :size="32" class="mx-auto text-green-500" />
            <p class="mt-2 text-sm font-medium text-gray-700">Je hebt alle beschikbare modules!</p>
            <p class="mt-1 text-xs text-gray-500">Er zijn geen extra modules beschikbaar om toe te voegen.</p>
          </div>

          <!-- Actions -->
          <div class="mt-6 flex justify-end gap-3">
            <button class="btn-secondary" @click="handleClose">
              Annuleren
            </button>
            <button
              class="btn-primary"
              :disabled="!selectedConfig"
              :class="{ 'opacity-50 cursor-not-allowed': !selectedConfig }"
              @click="handleAdd"
            >
              <AppIcon name="plus" :size="16" />
              Toevoegen
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
