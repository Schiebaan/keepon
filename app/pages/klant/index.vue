<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })

const { partner } = usePartner()
const { customer, isLoading } = useCurrentCustomer()

// Time-based greeting
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Goedemorgen'
  if (hour < 18) return 'Goedemiddag'
  return 'Goedenavond'
})

const firstName = computed(() => customer.value?.full_name?.split(' ')[0] || 'daar')
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="py-16 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <template v-else>
      <!-- Greeting -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ greeting }}, {{ firstName }}</h1>
        <p class="mt-1 text-sm text-gray-500">Welkom bij je persoonlijke portaal.</p>
      </div>

      <!-- Customer info card -->
      <div class="section mb-6">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
            :style="{ backgroundColor: partner.primary_color }"
          >
            {{ customer?.full_name?.charAt(0) || '?' }}
          </div>
          <div>
            <p class="font-medium text-gray-900">{{ customer?.full_name }}</p>
            <p class="text-sm text-gray-500">{{ customer?.email }}</p>
          </div>
        </div>
      </div>

      <!-- Status: no modules yet -->
      <div class="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center mb-6">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <AppIcon name="home" :size="28" class="text-gray-400" />
        </div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Je portaal wordt ingericht</h2>
        <p class="text-sm text-gray-500 max-w-md mx-auto">
          Je installateur is bezig met het koppelen van je systeem. Zodra dit klaar is, zie je hier je energiegegevens, monitoring en meer.
        </p>
      </div>

      <!-- Contact -->
      <div class="section">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Contact met {{ partner.name }}</h3>
        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
          <span v-if="partner.support_email" class="flex items-center gap-1.5">
            <AppIcon name="mail" :size="14" class="text-gray-400" />
            <a :href="'mailto:' + partner.support_email" class="hover:underline">{{ partner.support_email }}</a>
          </span>
          <span v-if="partner.support_phone" class="flex items-center gap-1.5">
            <AppIcon name="phone" :size="14" class="text-gray-400" />
            {{ partner.support_phone }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
