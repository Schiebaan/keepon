<script setup lang="ts">
import type { PartnerModuleConfig, Subscription } from '~~/shared/types/database'

const props = defineProps<{
  moduleConfig: PartnerModuleConfig
  installationId: string
  existingSubscription?: Subscription | null
}>()

const supabase = useSupabaseClient()

// If returning from Mollie, start at linking step
const route = useRoute()
const initialStep = route.query.step === 'linking' ? 4 : 1

const currentStep = ref(initialStep)
const billingInterval = ref<'monthly' | 'yearly'>('monthly')
const subscription = ref<Subscription | null>(props.existingSubscription || null)

// If we have a subscription_id in the URL (returning from Mollie), load it
if (route.query.subscription_id && !subscription.value) {
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', route.query.subscription_id as string)
    .single()
  if (data) subscription.value = data as Subscription
}

async function createSubscription() {
  const price = billingInterval.value === 'monthly'
    ? props.moduleConfig.price_monthly
    : props.moduleConfig.price_yearly

  const { data, error } = await supabase
    .from('subscriptions')
    .insert({
      customer_id: (await supabase.from('customers').select('id').single()).data?.id,
      installation_id: props.installationId,
      partner_module_config_id: props.moduleConfig.id,
      billing_interval: billingInterval.value,
      price_cents: price,
      terms_accepted_at: new Date().toISOString(),
      terms_version: '1.0',
    })
    .select()
    .single()

  if (error) throw error
  subscription.value = data as Subscription
}

async function handlePaymentStep() {
  if (!subscription.value) {
    await createSubscription()
  }
  currentStep.value = 3
}

function handleLinked() {
  currentStep.value = 5
}

const steps = [
  { number: 1, label: 'Voorwaarden' },
  { number: 2, label: 'Betaalperiode' },
  { number: 3, label: 'Betaling' },
  { number: 4, label: 'Koppeling' },
]
</script>

<template>
  <div class="mx-auto max-w-lg">
    <!-- Step indicator -->
    <div class="mb-8 flex items-center justify-between">
      <div
        v-for="step in steps"
        :key="step.number"
        class="flex items-center"
      >
        <div
          class="flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium"
          :class="
            currentStep >= step.number
              ? 'bg-brand-primary text-white'
              : 'bg-gray-200 text-gray-500'
          "
        >
          {{ currentStep > step.number ? '&#10003;' : step.number }}
        </div>
        <span class="ml-2 hidden text-sm text-gray-600 sm:inline">{{ step.label }}</span>
        <div
          v-if="step.number < steps.length"
          class="mx-2 h-px w-8 sm:w-12"
          :class="currentStep > step.number ? 'bg-brand-primary' : 'bg-gray-200'"
        />
      </div>
    </div>

    <!-- Steps -->
    <div class="card">
      <StepTerms
        v-if="currentStep === 1"
        :module-config="moduleConfig"
        @accepted="currentStep = 2"
      />

      <StepPaymentChoice
        v-if="currentStep === 2"
        :module-config="moduleConfig"
        v-model:interval="billingInterval"
        @continue="handlePaymentStep"
      />

      <StepPayment
        v-if="currentStep === 3 && subscription"
        :subscription="subscription"
        @redirect="() => {}"
      />

      <StepDeviceLinking
        v-if="currentStep === 4 && subscription"
        :subscription="subscription"
        @linked="handleLinked"
      />

      <!-- Complete -->
      <div v-if="currentStep === 5" class="text-center">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          &#10003;
        </div>
        <h2 class="mt-4 text-lg font-semibold text-gray-900">Module geactiveerd!</h2>
        <p class="mt-1 text-sm text-gray-500">
          {{ moduleConfig.module_definition?.name }} is nu actief.
          Je kunt de monitoring data bekijken op je dashboard.
        </p>
        <NuxtLink
          :to="`/installations/${installationId}`"
          class="btn-primary mt-6 inline-block"
        >
          Ga naar mijn installatie
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
