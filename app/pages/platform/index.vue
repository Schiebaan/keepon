<script setup lang="ts">
definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const partners = ref<any[]>([])
const isLoading = ref(true)

async function getAuthHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

onMounted(async () => {
  try {
    const headers = await getAuthHeaders()
    partners.value = await $fetch('/api/platform/partners', { headers })
  } catch {} finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-2xl font-bold text-gray-900">Platform Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van alle partners</p>
    </div>

    <!-- KPI Stats -->
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div class="stat-card" :style="{ '--stat-color': '#1a56db' } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Partners</span>
          <AppIcon name="building" :size="20" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ partners.length }}</p>
      </div>
      <div class="stat-card" :style="{ '--stat-color': '#059669' } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Actieve partners</span>
          <AppIcon name="check-circle" :size="20" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ partners.filter(p => p.is_active).length }}</p>
      </div>
    </div>

    <!-- Partners list -->
    <div class="mt-8 section">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Partners</h2>
        <NuxtLink to="/platform/partners" class="text-sm font-medium text-blue-600 hover:text-blue-700">
          Beheren &rarr;
        </NuxtLink>
      </div>

      <div v-if="isLoading" class="py-8 text-center">
        <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
      </div>

      <div v-else-if="partners.length === 0" class="py-8 text-center text-sm text-gray-400">
        Geen partners gevonden.
      </div>

      <div v-else class="divide-y divide-gray-100">
        <NuxtLink
          v-for="p in partners"
          :key="p.id"
          :to="`/platform/partners/${p.slug}`"
          class="flex items-center gap-4 py-4 transition-colors hover:bg-gray-50 -mx-4 px-4 rounded-lg"
        >
          <img v-if="p.logo_url" :src="p.logo_url" :alt="p.name" class="h-10 w-10 rounded-xl object-contain" />
          <div v-else class="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" :style="{ backgroundColor: p.primary_color }">
            {{ p.name?.charAt(0) }}
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-900">{{ p.name }}</p>
            <p class="text-xs text-gray-500">{{ p.slug }}.upsol.nl</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-3 w-3 rounded-full" :style="{ backgroundColor: p.primary_color }" />
            <span class="badge" :class="p.is_active ? 'badge--green' : 'badge--gray'">
              {{ p.is_active ? 'Actief' : 'Inactief' }}
            </span>
          </div>
          <AppIcon name="chevron-right" :size="16" class="text-gray-300" />
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
