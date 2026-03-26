<script setup lang="ts">
import { formatDate } from '~/utils/formatters'
import type { Partner } from '~~/shared/types/database'

definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const supabase = useSupabaseClient()

const { data: partners } = await useAsyncData('platform-partners', async () => {
  const { data } = await supabase
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false })
  return (data ?? []) as Partner[]
})
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold text-gray-900">Partners</h1>
      <NuxtLink to="/platform/partners/new" class="btn-primary">
        Partner toevoegen
      </NuxtLink>
    </div>

    <div class="card overflow-hidden p-0">
      <table class="w-full">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Naam</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Slug</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
            <th class="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">Aangemaakt</th>
            <th class="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="partner in partners" :key="partner.id" class="hover:bg-gray-50">
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <div
                  class="h-3 w-3 rounded-full"
                  :style="{ backgroundColor: partner.primary_color }"
                />
                <span class="text-sm font-medium text-gray-900">{{ partner.name }}</span>
              </div>
            </td>
            <td class="px-4 py-3 text-sm text-gray-600">{{ partner.slug }}</td>
            <td class="px-4 py-3">
              <span
                class="rounded-full px-2 py-0.5 text-xs font-medium"
                :class="partner.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'"
              >
                {{ partner.is_active ? 'Actief' : 'Inactief' }}
              </span>
            </td>
            <td class="px-4 py-3 text-sm text-gray-400">{{ formatDate(partner.created_at) }}</td>
            <td class="px-4 py-3 text-right">
              <NuxtLink
                :to="`/platform/partners/${partner.id}`"
                class="text-sm text-brand-primary hover:underline"
              >
                Beheren
              </NuxtLink>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
