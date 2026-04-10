<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const route = useRoute()
const customerId = route.params.id as string

const { partner } = usePartner()
const { customers, updateCustomer, isLoading: customersLoading } = useCustomers()

const customer = computed(() => customers.value.find((c: any) => c.id === customerId))

const activeTab = ref<'producten' | 'documenten' | 'notities'>('producten')

// --- Customer edit ---
const isEditingCustomer = ref(false)
const customerSaving = ref(false)
const customerForm = ref({ full_name: '', phone: '', street: '', house_number: '', postal_code: '', city: '' })

function startEditCustomer() {
  if (!customer.value) return
  customerForm.value = {
    full_name: customer.value.full_name || '',
    phone: customer.value.phone || '',
    street: customer.value.street || '',
    house_number: customer.value.house_number || '',
    postal_code: customer.value.postal_code || '',
    city: customer.value.city || '',
  }
  isEditingCustomer.value = true
}

async function saveCustomer() {
  customerSaving.value = true
  try {
    await updateCustomer(customerId, customerForm.value)
    isEditingCustomer.value = false
  } catch {} finally {
    customerSaving.value = false
  }
}

// --- Sundata wizard ---
const showSundataWizard = ref(false)
const sundataProductData = ref<{ capacityWp?: string; orientation?: string; tilt?: string }>({})

function openSundataWizard() {
  // Try to extract Wp/orientation/tilt from the most recent solar product's notes
  const { products } = useCustomerDossier(customerId)
  const solarProduct = products.value.findLast?.((p: any) => p.category === 'solar_panel') || products.value.filter((p: any) => p.category === 'solar_panel').pop()
  if (solarProduct?.notes) {
    sundataProductData.value = {
      capacityWp: solarProduct.notes.match(/(\d+)\s*Wp/)?.[1] || '',
      orientation: solarProduct.notes.match(/oriëntatie:\s*(\S+)/i)?.[1] || '',
      tilt: solarProduct.notes.match(/helling:\s*(\d+)/i)?.[1] || '',
    }
  }
  showSundataWizard.value = true
}

function handleSundataCompleted(result: { deviceId: string; plantName: string }) {
  console.log('Sundata linked:', result)
}

// --- Notes ---
const NOTES_KEY = 'upsol-customer-notes'
function loadNotes(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) || '{}') } catch { return {} }
}
function saveNotes(notes: Record<string, string>) {
  if (typeof window !== 'undefined') localStorage.setItem(NOTES_KEY, JSON.stringify(notes))
}
const allNotes = ref(loadNotes())
const customerNotes = computed({
  get: () => allNotes.value[customerId] || '',
  set: (val: string) => { allNotes.value[customerId] = val; saveNotes(allNotes.value) },
})
const notesSaved = ref(false)
function handleSaveNotes() {
  saveNotes(allNotes.value)
  notesSaved.value = true
  setTimeout(() => { notesSaved.value = false }, 2000)
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="customersLoading" class="py-16 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Not found -->
    <div v-else-if="!customer" class="section">
      <div class="card py-12 text-center">
        <AppIcon name="x-circle" :size="40" class="mx-auto text-gray-300 mb-4" />
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Klant niet gevonden</h2>
        <NuxtLink to="/admin/customers" class="text-sm text-gray-500 hover:text-gray-700 underline">
          Terug naar klantenoverzicht
        </NuxtLink>
      </div>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="section">
        <div class="mb-4">
          <NuxtLink to="/admin/customers" class="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
            <AppIcon name="chevron-right" :size="14" class="rotate-180" />
            Klanten
          </NuxtLink>
        </div>

        <div class="card">
          <!-- View mode -->
          <template v-if="!isEditingCustomer">
            <div class="flex items-start gap-5">
              <div
                class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white"
                :style="{ backgroundColor: partner.primary_color }"
              >
                {{ customer.full_name?.charAt(0) || '?' }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-3">
                  <h1 class="text-xl font-bold text-gray-900">{{ customer.full_name }}</h1>
                  <button class="text-xs text-gray-400 hover:text-gray-600" @click="startEditCustomer">
                    <AppIcon name="settings" :size="14" />
                  </button>
                </div>
                <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
                  <span class="flex items-center gap-1.5">
                    <AppIcon name="mail" :size="14" />
                    {{ customer.email }}
                  </span>
                  <span v-if="customer.phone" class="flex items-center gap-1.5">
                    <AppIcon name="phone" :size="14" />
                    {{ customer.phone }}
                  </span>
                  <span v-if="customer.street" class="flex items-center gap-1.5">
                    <AppIcon name="map-pin" :size="14" />
                    {{ customer.street }} {{ customer.house_number }}, {{ customer.postal_code }} {{ customer.city }}
                  </span>
                </div>
              </div>
            </div>
          </template>

          <!-- Edit mode -->
          <template v-else>
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-semibold text-gray-900">Klantgegevens bewerken</h2>
              <div class="flex gap-2">
                <button class="btn-primary text-sm" :disabled="customerSaving" @click="saveCustomer">
                  {{ customerSaving ? 'Opslaan...' : 'Opslaan' }}
                </button>
                <button class="btn-secondary text-sm" @click="isEditingCustomer = false">Annuleren</button>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="label">Naam</label>
                <input v-model="customerForm.full_name" type="text" class="input" />
              </div>
              <div>
                <label class="label">Telefoon</label>
                <input v-model="customerForm.phone" type="tel" class="input" />
              </div>
              <div>
                <label class="label">Straat + huisnummer</label>
                <div class="flex gap-2">
                  <input v-model="customerForm.street" type="text" class="input flex-1" placeholder="Straat" />
                  <input v-model="customerForm.house_number" type="text" class="input w-20" placeholder="Nr." />
                </div>
              </div>
              <div>
                <label class="label">Postcode + woonplaats</label>
                <div class="flex gap-2">
                  <input v-model="customerForm.postal_code" type="text" class="input w-28" placeholder="1234 AB" />
                  <input v-model="customerForm.city" type="text" class="input flex-1" placeholder="Woonplaats" />
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Tabs -->
      <div class="section">
        <div class="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6">
          <button
            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'producten' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'producten'"
          >
            <AppIcon name="package" :size="16" />
            Producten
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'documenten' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'documenten'"
          >
            <AppIcon name="folder" :size="16" />
            Documenten
          </button>
          <button
            class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
            :class="activeTab === 'notities' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="activeTab = 'notities'"
          >
            <AppIcon name="file-text" :size="16" />
            Notities
          </button>
        </div>

        <div class="card">
          <ProductList
            v-if="activeTab === 'producten'"
            :customer-id="customerId"
            :partner-id="customer.partner_id"
            :customer-name="customer.full_name || customer.email"
            @open-connector="openSundataWizard"
          />
          <DocumentList
            v-if="activeTab === 'documenten'"
            :customer-id="customerId"
            :partner-id="customer.partner_id"
          />
          <div v-if="activeTab === 'notities'">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-sm font-semibold text-gray-900">Interne notities</h3>
              <div class="flex items-center gap-2">
                <span v-if="notesSaved" class="text-xs text-green-600 font-medium">Opgeslagen!</span>
                <button
                  class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
                  @click="handleSaveNotes"
                >
                  <AppIcon name="check" :size="14" />
                  Opslaan
                </button>
              </div>
            </div>
            <textarea
              v-model="customerNotes"
              class="input font-mono text-sm"
              rows="10"
              placeholder="Interne notities over deze klant... (alleen zichtbaar voor installateurs)"
            />
            <p class="mt-2 text-xs text-gray-400">Deze notities zijn alleen zichtbaar voor jou en je team, niet voor de klant.</p>
          </div>
        </div>
      </div>

      <!-- Sundata Wizard -->
      <SundataWizard
        v-model="showSundataWizard"
        :customer-id="customerId"
        :customer-name="customer.full_name || customer.email"
        :product-data="sundataProductData"
        @completed="handleSundataCompleted"
      />
    </template>
  </div>
</template>
