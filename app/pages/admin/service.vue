<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Service</h1>
      <p class="mt-1 text-sm text-gray-500">Serviceverzoeken en AI-klantenservice gesprekken.</p>
    </div>

    <div class="section py-16 text-center">
      <AppIcon name="message" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen serviceverzoeken</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Zodra klanten via het portaal hulp aanvragen, verschijnen de gesprekken hier.
      </p>
    </div>
  </div>
</template>
