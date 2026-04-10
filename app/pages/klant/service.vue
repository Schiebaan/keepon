<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })
const { partner } = usePartner()
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Service</h1>
      <p class="mt-1 text-sm text-gray-500">Hulp nodig? Neem contact op.</p>
    </div>

    <div class="section">
      <h3 class="text-base font-semibold text-gray-900 mb-4">Contact met {{ partner.name }}</h3>
      <div class="space-y-3">
        <a
          v-if="partner.support_email"
          :href="'mailto:' + partner.support_email"
          class="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <AppIcon name="mail" :size="20" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">E-mail</p>
            <p class="text-sm text-gray-500">{{ partner.support_email }}</p>
          </div>
        </a>
        <a
          v-if="partner.support_phone"
          :href="'tel:' + partner.support_phone"
          class="flex items-center gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
        >
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
            <AppIcon name="phone" :size="20" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Telefoon</p>
            <p class="text-sm text-gray-500">{{ partner.support_phone }}</p>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>
