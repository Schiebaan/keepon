<script setup lang="ts">
const { partner } = usePartner()
</script>

<template>
  <footer class="border-t border-gray-200 bg-white py-6">
    <div class="mx-auto max-w-7xl px-4 sm:px-6">
      <div class="flex flex-col items-center justify-between gap-2 sm:flex-row">
        <p class="text-sm text-gray-400">
          {{ partner.name }} · Powered by UPsol
        </p>
        <div class="flex gap-4 text-sm text-gray-400">
          <NuxtLink :to="'/voorwaarden/' + (partner.slug || 'volt4u')" class="hover:text-gray-600">Voorwaarden</NuxtLink>
          <span>{{ partner.support_email }}</span>
        </div>
      </div>
    </div>
  </footer>
</template>
