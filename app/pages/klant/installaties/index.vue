<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Installaties</h1>
    </div>
    <div class="section py-12 text-center">
      <AppIcon name="home" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen installaties</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Zodra je installateur je systeem heeft gekoppeld, verschijnen je installaties hier.
      </p>
    </div>
  </div>
</template>
