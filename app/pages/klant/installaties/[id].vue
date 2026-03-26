<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'

definePageMeta({ layout: 'customer' })

const route = useRoute()
const installationId = route.params.id as string

const { currentCustomerInstallations, getInstallationSubscriptions, partnerModuleConfigs } = useMockData()

const installation = currentCustomerInstallations.find(i => i.id === installationId)
const activeSubscriptions = getInstallationSubscriptions(installationId)

// Determine which modules are available but not yet activated
const activatedConfigIds = new Set(activeSubscriptions.map(s => s.partner_module_config_id))
const availableModules = partnerModuleConfigs.filter(pmc => !activatedConfigIds.has(pmc.id))

// Mock monitoring data
const solarData = {
  todayYield: 12.4,
  monthYield: 342,
  yearYield: 4120,
  currentPower: 2.1,
}

const heatPumpData = {
  status: 'Verwarmen',
  waterTemp: 48,
  cop: 4.2,
  outputPower: 3.5,
}
</script>

<template>
  <div>
    <NuxtLink to="/klant/installaties" class="mb-4 inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
      &larr; Terug naar installaties
    </NuxtLink>

    <div v-if="!installation" class="card py-12 text-center">
      <p class="text-gray-500">Installatie niet gevonden.</p>
    </div>

    <template v-else>
      <div class="mb-8">
        <h1 class="text-2xl font-bold text-gray-900">{{ installation.name }}</h1>
        <p class="mt-1 text-sm text-gray-500">
          {{ installation.address_street }} {{ installation.address_house_number }},
          {{ installation.address_postal_code }} {{ installation.address_city }}
        </p>
      </div>

      <!-- Actieve modules met data -->
      <div class="mb-8">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Actieve modules</h2>

        <div class="grid gap-4 lg:grid-cols-2">
          <!-- Solar widget -->
          <div
            v-for="sub in activeSubscriptions"
            :key="sub.id"
            class="card"
          >
            <!-- Solar -->
            <template v-if="sub.partner_module_config?.module_definition?.type === 'solar'">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100 text-lg">&#9728;</span>
                  <h3 class="font-semibold text-gray-900">Zonnepanelen</h3>
                </div>
                <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Actief</span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-lg bg-yellow-50 p-3">
                  <p class="text-xs text-yellow-600">Huidig vermogen</p>
                  <p class="text-xl font-bold text-yellow-700">{{ solarData.currentPower }} kW</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">Vandaag</p>
                  <p class="text-xl font-bold text-gray-900">{{ solarData.todayYield }} kWh</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">Deze maand</p>
                  <p class="text-xl font-bold text-gray-900">{{ solarData.monthYield }} kWh</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">Dit jaar</p>
                  <p class="text-xl font-bold text-gray-900">{{ solarData.yearYield }} kWh</p>
                </div>
              </div>
            </template>

            <!-- Heat Pump -->
            <template v-else-if="sub.partner_module_config?.module_definition?.type === 'heat_pump'">
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-lg">&#127777;</span>
                  <h3 class="font-semibold text-gray-900">Warmtepomp</h3>
                </div>
                <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Actief</span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-lg bg-red-50 p-3">
                  <p class="text-xs text-red-600">Status</p>
                  <p class="text-lg font-bold text-red-700">{{ heatPumpData.status }}</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">Watertemperatuur</p>
                  <p class="text-xl font-bold text-gray-900">{{ heatPumpData.waterTemp }}&#176;C</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">COP</p>
                  <p class="text-xl font-bold text-gray-900">{{ heatPumpData.cop }}</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">Vermogen</p>
                  <p class="text-xl font-bold text-gray-900">{{ heatPumpData.outputPower }} kW</p>
                </div>
              </div>
            </template>

            <!-- EV Charger -->
            <template v-else>
              <div class="mb-4 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-lg">&#9889;</span>
                  <h3 class="font-semibold text-gray-900">Laadpaal</h3>
                </div>
                <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Actief</span>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="rounded-lg bg-blue-50 p-3">
                  <p class="text-xs text-blue-600">Status</p>
                  <p class="text-lg font-bold text-blue-700">Stand-by</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">Laatste sessie</p>
                  <p class="text-xl font-bold text-gray-900">18.3 kWh</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">Deze maand</p>
                  <p class="text-xl font-bold text-gray-900">142 kWh</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-3">
                  <p class="text-xs text-gray-500">Sessies</p>
                  <p class="text-xl font-bold text-gray-900">12</p>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- Beschikbare modules (niet geactiveerd) -->
      <div v-if="availableModules.length">
        <h2 class="mb-4 text-lg font-semibold text-gray-900">Beschikbare modules</h2>
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="pmc in availableModules"
            :key="pmc.id"
            class="card border-dashed"
          >
            <div class="mb-3 flex items-center gap-2">
              <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-lg">
                <span v-if="pmc.module_definition?.type === 'solar'">&#9728;</span>
                <span v-else-if="pmc.module_definition?.type === 'heat_pump'">&#127777;</span>
                <span v-else>&#9889;</span>
              </span>
              <h3 class="font-medium text-gray-900">{{ pmc.module_definition?.name }}</h3>
            </div>
            <p class="mb-3 text-sm text-gray-500">{{ pmc.module_definition?.description }}</p>
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-900">
                {{ formatCurrency(pmc.price_monthly) }}/mnd
              </span>
              <button class="btn-primary text-sm">Activeer</button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
