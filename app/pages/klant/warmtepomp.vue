<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })
</script>

<template>
  <div>
    <NuxtLink to="/klant" class="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
      <AppIcon name="chevron-right" :size="14" class="rotate-180" />
      Terug naar overzicht
    </NuxtLink>
    <div class="flex items-center gap-3 mb-6">
      <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
        <AppIcon name="heat-pump" :size="22" />
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Warmtepomp</h1>
    </div>
    <div class="section py-12 text-center">
      <AppIcon name="heat-pump" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog niet gekoppeld</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Je installateur koppelt je warmtepomp aan het monitoringplatform. Zodra dit klaar is, zie je hier je verbruik en status.
      </p>
    </div>
  </div>
</template>
