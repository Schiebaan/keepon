<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const { getInstallations } = useInstallation()
const { data: installations } = await useAsyncData('installations', getInstallations)
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Mijn installaties</h1>
      <p class="mt-1 text-sm text-gray-500">
        Bekijk en beheer je installaties en modules.
      </p>
    </div>

    <div v-if="!installations?.length" class="card text-center py-12">
      <p class="text-gray-500">Nog geen installaties gevonden.</p>
      <p class="mt-1 text-sm text-gray-400">
        Neem contact op met je installateur.
      </p>
    </div>

    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <NuxtLink
        v-for="installation in installations"
        :key="installation.id"
        :to="`/installations/${installation.id}`"
        class="card transition-shadow hover:shadow-md"
      >
        <h3 class="font-semibold text-gray-900">{{ installation.name }}</h3>
        <p class="mt-1 text-sm text-gray-500">
          {{ [installation.address_street, installation.address_house_number].filter(Boolean).join(' ') }}
        </p>
        <p class="text-sm text-gray-400">
          {{ [installation.address_postal_code, installation.address_city].filter(Boolean).join(' ') }}
        </p>
        <div class="mt-3 flex items-center text-sm text-brand-primary">
          Bekijk details &rarr;
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
