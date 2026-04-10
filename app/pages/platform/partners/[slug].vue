<script setup lang="ts">
import { formatDate } from '~/utils/formatters'

definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const route = useRoute()
const slug = route.params.slug as string

const partner = ref<any>(null)
const isLoading = ref(true)

async function getAuthHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

onMounted(async () => {
  try {
    const headers = await getAuthHeaders()
    partner.value = await $fetch(`/api/platform/partners/${slug}`, { headers })
  } catch {} finally {
    isLoading.value = false
  }
})
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="py-16 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Not found -->
    <div v-else-if="!partner" class="section py-12 text-center">
      <AppIcon name="x-circle" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Partner niet gevonden</h2>
      <NuxtLink to="/platform/partners" class="text-sm text-gray-500 hover:text-gray-700 underline">
        Terug naar partners
      </NuxtLink>
    </div>

    <template v-else>
      <!-- Back link -->
      <NuxtLink to="/platform/partners" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <AppIcon name="chevron-right" :size="14" class="rotate-180" />
        Terug naar partners
      </NuxtLink>

      <!-- Partner header -->
      <div class="section mb-6">
        <div class="flex items-center gap-4">
          <img v-if="partner.logo_url" :src="partner.logo_url" :alt="partner.name" class="h-14 w-14 rounded-2xl object-contain" />
          <div v-else class="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white" :style="{ backgroundColor: partner.primary_color }">
            {{ partner.name?.charAt(0) }}
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">{{ partner.name }}</h1>
              <span class="badge" :class="partner.is_active ? 'badge--green' : 'badge--gray'">
                {{ partner.is_active ? 'Actief' : 'Inactief' }}
              </span>
            </div>
            <p class="text-sm text-gray-500">{{ partner.slug }}.upsol.nl &middot; Sinds {{ formatDate(partner.created_at) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-6 w-6 rounded-full ring-2 ring-white" :style="{ backgroundColor: partner.primary_color }" />
            <a :href="`https://${partner.slug}.upsol.nl/admin`" target="_blank" class="btn-primary inline-flex items-center gap-2">
              <AppIcon name="external" :size="14" />
              Open portaal
            </a>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <span v-if="partner.support_email">{{ partner.support_email }}</span>
          <span v-if="partner.support_phone">{{ partner.support_phone }}</span>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div class="stat-card" :style="{ '--stat-color': '#1a56db' } as any">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500">Klanten</span>
            <AppIcon name="users" :size="18" class="text-gray-400" />
          </div>
          <p class="mt-2 text-2xl font-bold text-gray-900">{{ partner.customer_count }}</p>
        </div>
        <div class="stat-card" :style="{ '--stat-color': '#059669' } as any">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500">Beheerders</span>
            <AppIcon name="shield" :size="18" class="text-gray-400" />
          </div>
          <p class="mt-2 text-2xl font-bold text-gray-900">{{ partner.admin_count }}</p>
        </div>
        <div class="stat-card" :style="{ '--stat-color': '#7c3aed' } as any">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-gray-500">Branding</span>
            <div class="flex gap-1">
              <div class="h-5 w-5 rounded" :style="{ backgroundColor: partner.primary_color }" />
              <div class="h-5 w-5 rounded border border-gray-200" :style="{ backgroundColor: partner.secondary_color }" />
            </div>
          </div>
          <p class="mt-2 text-sm font-medium text-gray-700">{{ partner.primary_color }}</p>
        </div>
      </div>

      <!-- Info -->
      <div class="section">
        <p class="text-xs text-gray-400">
          Logo, kleuren en voorwaarden worden door de partner zelf beheerd via hun instellingen op
          <a :href="`https://${partner.slug}.upsol.nl/admin/settings`" target="_blank" class="text-blue-600 hover:underline">
            {{ partner.slug }}.upsol.nl/admin/settings
          </a>
        </p>
      </div>
    </template>
  </div>
</template>
