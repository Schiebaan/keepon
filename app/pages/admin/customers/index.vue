<script setup lang="ts">
import { formatDate } from '~/utils/formatters'
import type { Customer } from '~~/shared/types/database'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { customers, isLoading: customersLoading, createCustomer, updateCustomer, deleteCustomer } = useCustomers()
const router = useRouter()

const searchQuery = ref('')

function goToCustomer(id: string) {
  router.push(`/admin/customers/${id}`)
}

const filteredCustomers = computed(() => {
  if (!searchQuery.value) return customers.value
  const q = searchQuery.value.toLowerCase()
  return customers.value.filter(
    c => c.full_name?.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.city?.toLowerCase().includes(q)
  )
})

// Onboard modal state
const showOnboardModal = ref(false)
const onboardToast = ref('')

function handleOnboarded(result: any) {
  if (!result?.customer) return
  onboardToast.value = `${result.customer.full_name} is aangemaakt!`
  setTimeout(() => { onboardToast.value = '' }, 3000)
}

// Edit modal state
const editModalOpen = ref(false)
const editingCustomer = ref<Customer | null>(null)
const editForm = ref({ full_name: '', email: '', phone: '', street: '', house_number: '', postal_code: '', city: '' })
const editSaved = ref(false)

function openEdit(customer: Customer) {
  editingCustomer.value = customer
  editForm.value = {
    full_name: customer.full_name || '',
    email: customer.email,
    phone: customer.phone || '',
    street: customer.street || '',
    house_number: customer.house_number || '',
    postal_code: customer.postal_code || '',
    city: customer.city || '',
  }
  editSaved.value = false
  editModalOpen.value = true
}

const editSaving = ref(false)
const editError = ref('')

async function saveEdit() {
  if (!editingCustomer.value) return
  editSaving.value = true
  editError.value = ''
  try {
    await updateCustomer(editingCustomer.value.id, editForm.value)
    editSaved.value = true
    setTimeout(() => {
      editModalOpen.value = false
      editSaved.value = false
    }, 1200)
  } catch (e: any) {
    editError.value = e?.data?.message || e?.message || 'Opslaan mislukt'
  } finally {
    editSaving.value = false
  }
}

// View customer dossier
function viewCustomerDossier(customer: Customer) {
  navigateTo(`/admin/customers/${customer.id}`)
}

// Delete customer
async function handleDelete(customer: Customer) {
  if (!confirm(`Weet je zeker dat je ${customer.full_name || customer.email} wilt verwijderen? Dit kan niet ongedaan worden.`)) return
  try {
    await deleteCustomer(customer.id)
    onboardToast.value = `${customer.full_name || customer.email} is verwijderd`
    setTimeout(() => { onboardToast.value = '' }, 3000)
  } catch (e: any) {
    onboardToast.value = `Fout: ${e?.data?.message || 'Verwijderen mislukt'}`
    setTimeout(() => { onboardToast.value = '' }, 5000)
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Klanten</h1>
        <p class="mt-1 text-sm text-gray-500">{{ customersLoading ? '' : customers.length + ' klanten totaal' }}</p>
      </div>
      <button class="btn-primary" @click="showOnboardModal = true">
        <AppIcon name="plus" :size="16" />
        Klant toevoegen
      </button>
    </div>

    <!-- Search -->
    <div class="mb-4 relative max-w-sm">
      <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        v-model="searchQuery"
        type="search"
        class="input pl-9"
        placeholder="Zoek op naam, e-mail of plaats..."
      />
    </div>

    <!-- Table (client-only to prevent hydration mismatch with async data) -->
    <ClientOnly>
    <div class="section overflow-hidden p-0">
      <div class="-mx-0 overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Naam</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Contact</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Adres</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Modules</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Aangemeld</th>
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400">Acties</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="group transition-colors hover:bg-gray-50/50 cursor-pointer"
              @click="goToCustomer(customer.id)"
            >
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                    :style="{ backgroundColor: `hsl(${(customer.full_name?.charCodeAt(0) || 65) * 5}, 50%, 55%)` }"
                  >
                    {{ customer.full_name?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {{ customer.full_name || '-' }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-3.5">
                <p class="text-sm text-gray-700">{{ customer.email }}</p>
                <p class="text-xs text-gray-400">{{ customer.phone || '-' }}</p>
              </td>
              <td class="px-6 py-3.5">
                <p class="text-sm text-gray-700">{{ customer.street }} {{ customer.house_number }}</p>
                <p class="text-xs text-gray-400">{{ customer.postal_code }} {{ customer.city }}</p>
              </td>
              <td class="px-6 py-3.5">
                <span class="text-xs text-gray-400">—</span>
              </td>
              <td class="px-6 py-3.5 text-sm text-gray-400">
                {{ formatDate(customer.created_at) }}
              </td>
              <td class="px-6 py-3.5">
                <div class="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    @click.stop="openEdit(customer)"
                  >
                    <AppIcon name="settings" :size="14" />
                    Bewerken
                  </button>
                  <button
                    class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:bg-red-50 hover:text-red-600"
                    @click.stop="handleDelete(customer)"
                  >
                    <AppIcon name="trash" :size="14" />
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="customersLoading">
              <td colspan="6" class="px-6 py-8 text-center">
                <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
              </td>
            </tr>
            <tr v-else-if="!filteredCustomers.length">
              <td colspan="6" class="px-6 py-8 text-center text-sm text-gray-400">
                {{ searchQuery ? 'Geen klanten gevonden.' : 'Nog geen klanten. Klik op "Klant toevoegen" om te beginnen.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    </ClientOnly>

    <!-- Onboard Modal -->
    <OnboardModal v-model="showOnboardModal" @onboarded="handleOnboarded" />

    <!-- Toast notification -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="onboardToast"
          class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          <AppIcon name="check-circle" :size="16" class="text-green-400" />
          {{ onboardToast }}
        </div>
      </Transition>
    </Teleport>

    <!-- Edit Customer Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="editModalOpen && editingCustomer"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="editModalOpen = false"
        >
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <!-- Header -->
            <div class="border-b border-gray-100 px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                    :style="{ backgroundColor: `hsl(${(editingCustomer.full_name?.charCodeAt(0) || 65) * 5}, 50%, 55%)` }"
                  >
                    {{ editingCustomer.full_name?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Klant bewerken</h3>
                    <p class="text-sm text-gray-500">{{ editingCustomer.full_name }}</p>
                  </div>
                </div>
                <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" @click="editModalOpen = false">
                  <AppIcon name="x" :size="18" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <div class="px-6 py-5 space-y-4">
              <!-- Success message -->
              <div v-if="editSaved" class="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                <p class="text-sm font-medium text-green-700">
                  <AppIcon name="check-circle" :size="16" class="inline -mt-0.5" />
                  Klantgegevens opgeslagen
                </p>
              </div>

              <template v-if="!editSaved">
                <!-- Name + Email -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Naam</label>
                    <input v-model="editForm.full_name" type="text" class="input" />
                  </div>
                  <div>
                    <label class="label">E-mailadres</label>
                    <input v-model="editForm.email" type="email" class="input" />
                  </div>
                </div>

                <!-- Phone -->
                <div>
                  <label class="label">Telefoonnummer</label>
                  <input v-model="editForm.phone" type="tel" class="input" />
                </div>

                <!-- Address -->
                <div>
                  <label class="label text-gray-400 text-xs uppercase tracking-wider">Adres</label>
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
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Postcode</label>
                    <input v-model="editForm.postal_code" type="text" class="input" />
                  </div>
                  <div>
                    <label class="label">Plaats</label>
                    <input v-model="editForm.city" type="text" class="input" />
                  </div>
                </div>

                <!-- Dossier link -->
                <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <NuxtLink
                    :to="`/admin/customers/${editingCustomer.id}`"
                    class="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                    @click="editModalOpen = false"
                  >
                    <AppIcon name="folder" :size="12" />
                    Bekijk klantdossier voor modules en documenten
                  </NuxtLink>
                </div>
              </template>
            </div>

            <!-- Actions -->
            <div v-if="!editSaved" class="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <button
                class="flex items-center gap-1.5 text-sm font-medium hover:text-blue-700"
                :style="{ color: 'var(--brand-primary)' }"
                @click="editModalOpen = false; viewCustomerDossier(editingCustomer!)"
              >
                <AppIcon name="external" :size="14" />
                Bekijk klantportaal
              </button>
              <div class="flex gap-3">
                <button class="btn-secondary" @click="editModalOpen = false">Annuleren</button>
                <button class="btn-primary" @click="saveEdit">
                  <AppIcon name="check" :size="16" />
                  Opslaan
                </button>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
