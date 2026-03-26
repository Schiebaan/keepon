<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const moduleConfigId = route.params.id as string
const installationId = route.query.installation as string
const subscriptionId = route.query.subscription_id as string | undefined

const supabase = useSupabaseClient()

// Load the module config
const { data: moduleConfig } = await useAsyncData(
  `module-config-${moduleConfigId}`,
  async () => {
    const { data } = await supabase
      .from('partner_module_configs')
      .select('*, module_definition:module_definitions(*)')
      .eq('id', moduleConfigId)
      .single()
    return data
  }
)

// Load existing subscription if returning from Mollie
const { data: existingSubscription } = await useAsyncData(
  `subscription-${subscriptionId}`,
  async () => {
    if (!subscriptionId) return null
    const { data } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single()
    return data
  }
)
</script>

<template>
  <div>
    <NuxtLink
      :to="`/installations/${installationId}`"
      class="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
    >
      &larr; Terug naar installatie
    </NuxtLink>

    <div v-if="!moduleConfig" class="card text-center py-12">
      <p class="text-gray-500">Module niet gevonden.</p>
    </div>

    <OnboardingWizard
      v-else
      :module-config="moduleConfig"
      :installation-id="installationId"
      :existing-subscription="existingSubscription"
    />
  </div>
</template>
