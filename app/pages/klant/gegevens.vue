<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })

const { partner } = usePartner()
const { customer, isLoading } = useCurrentCustomer()
const supabase = useSupabaseClient()

const isEditing = ref(false)
const isSaving = ref(false)
const showSuccess = ref(false)
const editForm = ref({ full_name: '', phone: '', street: '', house_number: '', postal_code: '', city: '' })

function startEdit() {
  if (!customer.value) return
  editForm.value = {
    full_name: customer.value.full_name || '',
    phone: customer.value.phone || '',
    street: customer.value.street || '',
    house_number: customer.value.house_number || '',
    postal_code: customer.value.postal_code || '',
    city: customer.value.city || '',
  }
  isEditing.value = true
}

async function saveEdit() {
  if (!customer.value) return
  isSaving.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return

    const updated = await $fetch(`/api/customers/${customer.value.id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: editForm.value,
    })
    Object.assign(customer.value, updated)
    isEditing.value = false
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 3000)
  } catch {} finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Mijn gegevens</h1>
      <p class="mt-1 text-sm text-gray-500">Bekijk en wijzig je persoonlijke gegevens.</p>
    </div>

    <div v-if="isLoading" class="section py-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <div v-else-if="customer" class="section">
      <!-- View mode -->
      <template v-if="!isEditing">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">Persoonlijke gegevens</h2>
          <button class="btn-secondary text-sm" @click="startEdit">
            <AppIcon name="settings" :size="14" />
            Bewerken
          </button>
        </div>

        <p v-if="showSuccess" class="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">Gegevens opgeslagen!</p>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p class="text-xs text-gray-400">Naam</p>
            <p class="text-sm font-medium text-gray-900">{{ customer.full_name || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400">E-mail</p>
            <p class="text-sm font-medium text-gray-900">{{ customer.email }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400">Telefoon</p>
            <p class="text-sm font-medium text-gray-900">{{ customer.phone || '—' }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400">Adres</p>
            <p class="text-sm font-medium text-gray-900">
              <template v-if="customer.street">{{ customer.street }} {{ customer.house_number }}, {{ customer.postal_code }} {{ customer.city }}</template>
              <template v-else>—</template>
            </p>
          </div>
        </div>
      </template>

      <!-- Edit mode -->
      <template v-else>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-base font-semibold text-gray-900">Gegevens bewerken</h2>
          <div class="flex gap-2">
            <button class="btn-primary text-sm" :disabled="isSaving" @click="saveEdit">
              {{ isSaving ? 'Opslaan...' : 'Opslaan' }}
            </button>
            <button class="btn-secondary text-sm" @click="isEditing = false">Annuleren</button>
          </div>
        </div>

        <div class="space-y-3">
          <div>
            <label class="label">Naam</label>
            <input v-model="editForm.full_name" type="text" class="input" />
          </div>
          <div>
            <label class="label">Telefoon</label>
            <input v-model="editForm.phone" type="tel" class="input" />
          </div>
          <div class="grid grid-cols-3 gap-3">
            <div class="col-span-2">
              <label class="label">Straat</label>
              <input v-model="editForm.street" type="text" class="input" />
            </div>
            <div>
              <label class="label">Huisnummer</label>
              <input v-model="editForm.house_number" type="text" class="input" />
            </div>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="label">Postcode</label>
              <input v-model="editForm.postal_code" type="text" class="input" />
            </div>
            <div>
              <label class="label">Woonplaats</label>
              <input v-model="editForm.city" type="text" class="input" />
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
