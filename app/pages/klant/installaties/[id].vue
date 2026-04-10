<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })
</script>

<template>
  <div>
    <NuxtLink to="/klant/installaties" class="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700">
      <AppIcon name="chevron-right" :size="14" class="rotate-180" />
      Terug
    </NuxtLink>
    <div class="section py-12 text-center">
      <p class="text-sm text-gray-500">Installatie niet gevonden.</p>
    </div>
  </div>
</template>
