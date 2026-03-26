<script setup lang="ts">
definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const supabase = useSupabaseClient()

const { data: stats } = await useAsyncData('platform-stats', async () => {
  const [partners, customers, subscriptions] = await Promise.all([
    supabase.from('partners').select('id', { count: 'exact', head: true }),
    supabase.from('customers').select('id', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  return {
    partnerCount: partners.count || 0,
    customerCount: customers.count || 0,
    activeSubscriptions: subscriptions.count || 0,
  }
})
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold text-gray-900">Platform Overzicht</h1>

    <div class="grid gap-4 sm:grid-cols-3">
      <div class="card">
        <p class="text-sm font-medium text-gray-500">Partners</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900">{{ stats?.partnerCount ?? 0 }}</p>
      </div>
      <div class="card">
        <p class="text-sm font-medium text-gray-500">Klanten (totaal)</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900">{{ stats?.customerCount ?? 0 }}</p>
      </div>
      <div class="card">
        <p class="text-sm font-medium text-gray-500">Actieve modules</p>
        <p class="mt-1 text-2xl font-semibold text-gray-900">{{ stats?.activeSubscriptions ?? 0 }}</p>
      </div>
    </div>
  </div>
</template>
