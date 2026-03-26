<script setup lang="ts">
import type { PartnerModuleConfig } from '~~/shared/types/database'

const props = defineProps<{
  moduleConfig: PartnerModuleConfig
}>()

const emit = defineEmits<{
  accepted: []
}>()

const tenant = useTenant()
const termsAccepted = ref(false)

const termsText = computed(() =>
  props.moduleConfig.custom_terms || `Door deze module te activeren ga je akkoord met de algemene voorwaarden van ${tenant.value?.name || 'de aanbieder'}.`
)
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold text-gray-900">Voorwaarden</h2>
    <p class="mt-1 text-sm text-gray-500">
      Lees en accepteer de voorwaarden voor {{ moduleConfig.module_definition?.name }}.
    </p>

    <div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <p class="text-sm text-gray-700">{{ termsText }}</p>
      <a
        v-if="tenant?.terms_url"
        :href="tenant.terms_url"
        target="_blank"
        class="mt-2 inline-block text-sm text-brand-primary underline"
      >
        Volledige voorwaarden bekijken
      </a>
    </div>

    <label class="mt-4 flex items-start gap-3">
      <input
        v-model="termsAccepted"
        type="checkbox"
        class="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary"
      >
      <span class="text-sm text-gray-700">
        Ik ga akkoord met de voorwaarden
      </span>
    </label>

    <button
      class="btn-primary mt-6 w-full"
      :disabled="!termsAccepted"
      @click="emit('accepted')"
    >
      Volgende
    </button>
  </div>
</template>
