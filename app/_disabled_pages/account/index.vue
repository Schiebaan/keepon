<script setup lang="ts">
definePageMeta({ middleware: ['auth'] })

const supabase = useSupabaseClient()
const { user } = useAuth()

const { data: customer } = await useAsyncData('customer', async () => {
  const { data } = await supabase
    .from('customers')
    .select('*')
    .eq('auth_user_id', user.value!.id)
    .single()
  return data
})
</script>

<template>
  <div>
    <h1 class="mb-6 text-2xl font-bold text-gray-900">Mijn account</h1>

    <div class="card max-w-lg">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Gegevens</h2>

      <dl class="space-y-3">
        <div>
          <dt class="text-sm font-medium text-gray-500">E-mail</dt>
          <dd class="text-sm text-gray-900">{{ customer?.email || user?.email }}</dd>
        </div>
        <div v-if="customer?.full_name">
          <dt class="text-sm font-medium text-gray-500">Naam</dt>
          <dd class="text-sm text-gray-900">{{ customer.full_name }}</dd>
        </div>
        <div v-if="customer?.phone">
          <dt class="text-sm font-medium text-gray-500">Telefoon</dt>
          <dd class="text-sm text-gray-900">{{ customer.phone }}</dd>
        </div>
        <div v-if="customer?.street">
          <dt class="text-sm font-medium text-gray-500">Adres</dt>
          <dd class="text-sm text-gray-900">
            {{ customer.street }} {{ customer.house_number }},
            {{ customer.postal_code }} {{ customer.city }}
          </dd>
        </div>
      </dl>

      <div class="mt-6">
        <NuxtLink to="/account/subscriptions" class="btn-secondary">
          Mijn abonnementen bekijken
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
