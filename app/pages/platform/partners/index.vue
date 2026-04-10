<script setup lang="ts">
import { formatDate } from '~/utils/formatters'

definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const partners = ref<any[]>([])
const isLoading = ref(true)
const search = ref('')

async function getAuthHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function loadPartners() {
  isLoading.value = true
  try {
    const headers = await getAuthHeaders()
    partners.value = await $fetch('/api/platform/partners', { headers })
  } catch {} finally {
    isLoading.value = false
  }
}

const filteredPartners = computed(() => {
  if (!search.value) return partners.value
  const q = search.value.toLowerCase()
  return partners.value.filter((p: any) =>
    p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
  )
})

onMounted(loadPartners)
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Partners</h1>
        <p class="mt-1 text-sm text-gray-500">{{ partners.length }} partners op het platform</p>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input v-model="search" type="text" placeholder="Zoek partner..." class="input pl-10" />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="py-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Partner cards -->
    <div v-else class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="p in filteredPartners"
        :key="p.id"
        :to="`/platform/partners/${p.slug}`"
        class="section group cursor-pointer transition-all hover:shadow-md hover:border-gray-300"
      >
        <div class="flex items-start gap-4">
          <img v-if="p.logo_url" :src="p.logo_url" :alt="p.name" class="h-12 w-12 rounded-xl object-contain" />
          <div v-else class="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white" :style="{ backgroundColor: p.primary_color }">
            {{ p.name?.charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900">{{ p.name }}</h3>
              <span class="badge" :class="p.is_active ? 'badge--green' : 'badge--gray'">
                {{ p.is_active ? 'Actief' : 'Inactief' }}
              </span>
            </div>
            <p class="mt-0.5 text-sm text-gray-500">{{ p.slug }}.upsol.nl</p>
            <p class="mt-0.5 text-xs text-gray-400">Sinds {{ formatDate(p.created_at) }}</p>
          </div>
          <AppIcon name="chevron-right" :size="16" class="mt-1 text-gray-300 transition-colors group-hover:text-gray-500" />
        </div>

        <!-- Branding preview -->
        <div class="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
          <div class="h-4 w-4 rounded" :style="{ backgroundColor: p.primary_color }" />
          <span class="font-mono text-xs text-gray-400">{{ p.primary_color }}</span>
          <span v-if="p.support_email" class="ml-auto text-xs text-gray-400">{{ p.support_email }}</span>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
