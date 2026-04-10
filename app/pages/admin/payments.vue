<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Betalingen</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van alle betalingen en openstaande bedragen.</p>
    </div>

    <!-- Empty state -->
    <div class="section py-16 text-center">
      <AppIcon name="credit-card" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen betalingen</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Zodra klanten een servicecontract afsluiten en betalingen verwerkt worden via Mollie, verschijnen ze hier.
      </p>
    </div>
  </div>
</template>
