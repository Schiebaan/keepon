<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })
const { partner } = usePartner()
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Abonnementen</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van je actieve diensten.</p>
    </div>
    <div class="section py-12 text-center">
      <AppIcon name="puzzle" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen actieve abonnementen</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Zodra je installateur modules heeft gekoppeld, verschijnen je abonnementen hier.
      </p>
    </div>
  </div>
</template>
