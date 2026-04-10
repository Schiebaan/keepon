<script setup lang="ts">
import type { SmartMeter } from '~~/shared/types/database'

const { partner } = usePartner()
const { customer } = useCurrentCustomer()
const customerId = computed(() => customer.value?.id || '')
const { meter, linkMeter, unlinkMeter } = useSmartMeter(customerId.value)

const postcode = ref('')
const meterId = ref('')
const isLinking = ref(false)
const showSetup = ref(false)
const errorMessage = ref('')

// Pre-fill from customer data
if (customer.value?.postal_code) {
  postcode.value = customer.value.postal_code
}

async function handleLink() {
  if (!postcode.value || !meterId.value) return
  if (meterId.value.length !== 6 || !/^\d{6}$/.test(meterId.value)) {
    errorMessage.value = 'Vul de laatste 6 cijfers van je meterstand in (alleen cijfers).'
    return
  }

  errorMessage.value = ''
  isLinking.value = true

  linkMeter(customer.value?.partner_id || '', postcode.value, meterId.value)

  // Wait for simulated linking
  await new Promise(resolve => setTimeout(resolve, 2500))
  isLinking.value = false
  showSetup.value = false
}

function handleUnlink() {
  if (confirm('Weet je zeker dat je je slimme meter wilt ontkoppelen?')) {
    unlinkMeter()
  }
}
</script>

<template>
  <div class="rounded-xl border border-gray-100 bg-white p-5">
    <!-- Linked meter -->
    <template v-if="meter && meter.status === 'active'">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <AppIcon name="zap" :size="20" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Slimme meter gekoppeld</p>
            <p class="text-xs text-gray-500">
              Postcode {{ meter.postcode }} · Meter {{ meter.meter_id }}
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="badge badge--green">
            <span class="status-dot status-dot--active" />
            Actief
          </span>
          <button
            class="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Ontkoppelen"
            @click="handleUnlink"
          >
            <AppIcon name="x" :size="16" />
          </button>
        </div>
      </div>
    </template>

    <!-- Pending -->
    <template v-else-if="meter && meter.status === 'pending'">
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600">
          <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-900">Slimme meter wordt gekoppeld...</p>
          <p class="text-xs text-gray-500">Dit kan enkele momenten duren</p>
        </div>
      </div>
    </template>

    <!-- Not linked -->
    <template v-else-if="!showSetup">
      <div class="text-center py-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 mx-auto mb-3">
          <AppIcon name="zap" :size="24" />
        </div>
        <h3 class="text-sm font-semibold text-gray-900 mb-1">Slimme meter koppelen</h3>
        <p class="text-xs text-gray-500 mb-4 max-w-xs mx-auto">
          Koppel je slimme meter voor inzicht in je energieverbruik, teruglevering en gasverbruik.
        </p>
        <button
          class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors"
          :style="{ backgroundColor: partner.primary_color }"
          @click="showSetup = true"
        >
          <AppIcon name="plus" :size="16" />
          Meter koppelen
        </button>
      </div>
    </template>

    <!-- Setup form -->
    <template v-else>
      <h3 class="text-sm font-semibold text-gray-900 mb-1">Slimme meter koppelen</h3>
      <p class="text-xs text-gray-500 mb-4">
        Vul je postcode en de laatste 6 cijfers van je slimme meter in. Deze vind je op de meter zelf of op je energierekening.
      </p>

      <form @submit.prevent="handleLink" class="space-y-3">
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="label">Postcode</label>
            <input
              v-model="postcode"
              type="text"
              class="input"
              placeholder="1234 AB"
              required
              maxlength="7"
            >
          </div>
          <div>
            <label class="label">Laatste 6 cijfers meter</label>
            <input
              v-model="meterId"
              type="text"
              class="input font-mono"
              placeholder="123456"
              required
              maxlength="6"
              pattern="\d{6}"
              inputmode="numeric"
            >
          </div>
        </div>

        <p v-if="errorMessage" class="text-xs text-red-500">{{ errorMessage }}</p>

        <div class="flex items-center gap-2 pt-1">
          <button
            type="submit"
            class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50"
            :style="{ backgroundColor: partner.primary_color }"
            :disabled="isLinking || !postcode || !meterId"
          >
            <svg v-if="isLinking" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <AppIcon v-else name="zap" :size="16" />
            {{ isLinking ? 'Koppelen...' : 'Koppelen via Sundata' }}
          </button>
          <button
            type="button"
            class="rounded-xl px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
            @click="showSetup = false"
          >
            Annuleren
          </button>
        </div>
      </form>

      <div class="mt-4 rounded-lg bg-blue-50 px-3 py-2">
        <p class="text-xs text-blue-700">
          <strong>Tip:</strong> De 6 cijfers vind je op je slimme meter na de schuine streep (/).
          Staat vaak op het display of achter het klepje.
        </p>
      </div>
    </template>
  </div>
</template>
