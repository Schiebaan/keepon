<script setup lang="ts">
definePageMeta({ layout: 'customer' })

const { currentCustomerInstallations, getInstallationSubscriptions } = useMockData()
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Mijn installaties</h1>
      <p class="mt-1 text-sm text-gray-500">
        Bekijk en beheer je installaties en activeer modules.
      </p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="inst in currentCustomerInstallations"
        :key="inst.id"
        :to="`/klant/installaties/${inst.id}`"
        class="card group transition-all hover:shadow-md"
      >
        <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg">
          &#127968;
        </div>
        <h3 class="font-semibold text-gray-900">{{ inst.name }}</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ inst.address_street }} {{ inst.address_house_number }}
        </p>
        <p class="text-sm text-gray-400">
          {{ inst.address_postal_code }} {{ inst.address_city }}
        </p>
        <div class="mt-3 flex items-center justify-between">
          <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            {{ getInstallationSubscriptions(inst.id).length }} actieve modules
          </span>
          <span class="text-sm font-medium text-blue-600 group-hover:text-blue-700">&rarr;</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
