<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const route = useRoute()
const installationId = route.params.id as string

const { getInstallation } = useInstallation()
const { getAvailableModules, getInstallationSubscriptions } = useModules()

const { data: installation } = await useAsyncData(
  `installation-${installationId}`,
  () => getInstallation(installationId)
)

const { data: availableModules } = await useAsyncData(
  `modules-${installationId}`,
  getAvailableModules
)

const { data: subscriptions } = await useAsyncData(
  `subs-${installationId}`,
  () => getInstallationSubscriptions(installationId)
)

function getSubscriptionForModule(moduleConfigId: string) {
  return subscriptions.value?.find(
    s => s.partner_module_config_id === moduleConfigId
  ) ?? null
}
</script>

<template>
  <div>
    <!-- Back link -->
    <NuxtLink to="/installations" class="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
      &larr; Terug naar installaties
    </NuxtLink>

    <div v-if="!installation" class="card text-center py-12">
      <p class="text-gray-500">Installatie niet gevonden.</p>
    </div>

    <template v-else>
      <!-- Installation header -->
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">{{ installation.name }}</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ [installation.address_street, installation.address_house_number].filter(Boolean).join(' ') }},
          {{ [installation.address_postal_code, installation.address_city].filter(Boolean).join(' ') }}
        </p>
      </div>

      <!-- Modules -->
      <div>
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Modules</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ModuleCard
            v-for="moduleConfig in availableModules"
            :key="moduleConfig.id"
            :module-config="moduleConfig"
            :subscription="getSubscriptionForModule(moduleConfig.id)"
            :installation-id="installationId"
          />
        </div>
      </div>
    </template>
  </div>
</template>
