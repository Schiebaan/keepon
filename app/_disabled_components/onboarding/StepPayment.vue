<script setup lang="ts">
import type { Subscription } from '~~/shared/types/database'
import { formatCurrency } from '~/utils/formatters'

const props = defineProps<{
  subscription: Subscription
}>()

const emit = defineEmits<{
  redirect: [url: string]
}>()

const isProcessing = ref(false)
const errorMessage = ref('')

const priceLabel = computed(() => {
  const price = formatCurrency(props.subscription.price_cents)
  const period = props.subscription.billing_interval === 'monthly' ? 'maand' : 'jaar'
  return `${price} / ${period}`
})

async function startPayment() {
  isProcessing.value = true
  errorMessage.value = ''

  try {
    const { checkoutUrl } = await $fetch('/api/payments/create-first', {
      method: 'POST',
      body: {
        subscription_id: props.subscription.id,
        return_url: `${window.location.origin}/modules/${props.subscription.partner_module_config_id}/activate?step=linking&subscription_id=${props.subscription.id}`,
      },
    })

    if (checkoutUrl) {
      emit('redirect', checkoutUrl)
      window.location.href = checkoutUrl
    }
  } catch (err: any) {
    errorMessage.value = err.data?.message || 'Betaling starten mislukt. Probeer het opnieuw.'
  } finally {
    isProcessing.value = false
  }
}
</script>

<template>
  <div>
    <h2 class="text-lg font-semibold text-gray-900">Betaling</h2>
    <p class="mt-1 text-sm text-gray-500">
      Rond je betaling af om de module te activeren.
    </p>

    <div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-600">Bedrag</span>
        <span class="font-semibold text-gray-900">{{ priceLabel }}</span>
      </div>
      <p class="mt-2 text-xs text-gray-500">
        Je wordt doorgestuurd naar een veilige betaalomgeving (iDEAL, creditcard).
        Na betaling wordt je module direct geactiveerd.
      </p>
    </div>

    <p v-if="errorMessage" class="mt-3 text-sm text-red-600">
      {{ errorMessage }}
    </p>

    <button
      class="btn-primary mt-6 w-full"
      :disabled="isProcessing"
      @click="startPayment"
    >
      {{ isProcessing ? 'Even geduld...' : 'Betaal nu' }}
    </button>
  </div>
</template>
