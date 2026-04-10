<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Facturen</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van je facturen en betalingen.</p>
    </div>
    <div class="section py-12 text-center">
      <AppIcon name="credit-card" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen facturen</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Zodra er betalingen worden verwerkt, verschijnen je facturen hier.
      </p>
    </div>
  </div>
</template>
