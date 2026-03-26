<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth'] })

const { currentCustomer, currentCustomerInstallations, partner, updateCurrentCustomer } = useMockData()
const installation = currentCustomerInstallations[0]

// --- Address edit ---
const isEditingAddress = ref(false)
const isSaving = ref(false)
const showSuccess = ref(false)
const addressForm = ref({
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
})

function startEditAddress() {
  addressForm.value = {
    street: currentCustomer.street || '',
    house_number: currentCustomer.house_number || '',
    postal_code: currentCustomer.postal_code || '',
    city: currentCustomer.city || '',
  }
  isEditingAddress.value = true
  showSuccess.value = false
}

function cancelEditAddress() {
  isEditingAddress.value = false
}

function saveAddress() {
  isSaving.value = true
  setTimeout(() => {
    updateCurrentCustomer({
      street: addressForm.value.street,
      house_number: addressForm.value.house_number,
      postal_code: addressForm.value.postal_code,
      city: addressForm.value.city,
    })
    isEditingAddress.value = false
    isSaving.value = false
    showSuccess.value = true
    setTimeout(() => { showSuccess.value = false }, 4000)
  }, 500)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Mijn gegevens</h1>
      <p class="mt-1 text-sm text-gray-500">Beheer je contactgegevens en adres.</p>
    </div>

    <!-- Success message -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="showSuccess" class="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
        <AppIcon name="check-circle" :size="18" class="text-green-600" />
        <p class="text-sm font-medium text-green-800">Adreswijziging succesvol doorgegeven. Je installateur is op de hoogte gebracht.</p>
      </div>
    </Transition>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Personal information -->
      <div class="section">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <AppIcon name="users" :size="20" />
          </div>
          <h2 class="text-base font-semibold text-gray-900">Contactgegevens</h2>
        </div>

        <div class="space-y-4">
          <div>
            <label class="label">Naam</label>
            <input type="text" :value="currentCustomer.full_name" class="input" readonly />
          </div>
          <div>
            <label class="label">E-mailadres</label>
            <input type="email" :value="currentCustomer.email" class="input" readonly />
          </div>
          <div>
            <label class="label">Telefoonnummer</label>
            <input type="tel" :value="currentCustomer.phone" class="input" readonly />
          </div>
        </div>

        <p class="mt-4 text-xs text-gray-400">
          Neem contact op met je installateur om contactgegevens te wijzigen.
        </p>
      </div>

      <!-- Address -->
      <div class="section">
        <div class="mb-5 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <AppIcon name="map-pin" :size="20" />
            </div>
            <h2 class="text-base font-semibold text-gray-900">Adres</h2>
          </div>
          <button
            v-if="!isEditingAddress"
            class="btn-secondary text-sm inline-flex items-center gap-1.5"
            @click="startEditAddress"
          >
            <AppIcon name="settings" :size="14" />
            Verhuizing doorgeven
          </button>
          <div v-else class="flex gap-2">
            <button class="btn-primary text-sm inline-flex items-center gap-1.5" :disabled="isSaving" @click="saveAddress">
              <AppIcon name="check" :size="14" />
              {{ isSaving ? 'Opslaan...' : 'Opslaan' }}
            </button>
            <button class="btn-secondary text-sm" @click="cancelEditAddress">Annuleren</button>
          </div>
        </div>

        <!-- Display mode -->
        <template v-if="!isEditingAddress">
          <div class="space-y-4">
            <div>
              <label class="label">Straat en huisnummer</label>
              <input
                type="text"
                :value="`${currentCustomer.street} ${currentCustomer.house_number}`"
                class="input"
                readonly
              />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Postcode</label>
                <input type="text" :value="currentCustomer.postal_code" class="input" readonly />
              </div>
              <div>
                <label class="label">Plaats</label>
                <input type="text" :value="currentCustomer.city" class="input" readonly />
              </div>
            </div>
          </div>

          <a
            :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentCustomer.street + ' ' + currentCustomer.house_number + ', ' + currentCustomer.postal_code + ' ' + currentCustomer.city)}`"
            target="_blank"
            rel="noopener"
            class="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
          >
            <AppIcon name="external" :size="14" />
            Bekijk op Google Maps
          </a>
        </template>

        <!-- Edit mode -->
        <template v-else>
          <div class="space-y-4">
            <div class="grid grid-cols-3 gap-3">
              <div class="col-span-2">
                <label class="label">Straat</label>
                <input v-model="addressForm.street" type="text" class="input" />
              </div>
              <div>
                <label class="label">Huisnummer</label>
                <input v-model="addressForm.house_number" type="text" class="input" />
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Postcode</label>
                <input v-model="addressForm.postal_code" type="text" class="input" />
              </div>
              <div>
                <label class="label">Plaats</label>
                <input v-model="addressForm.city" type="text" class="input" />
              </div>
            </div>
          </div>
          <p class="mt-3 text-xs text-gray-400">
            Na het opslaan wordt je installateur automatisch op de hoogte gebracht van je verhuizing.
          </p>
        </template>
      </div>
    </div>

    <!-- Support contact -->
    <div class="mt-6 rounded-xl border border-gray-200 bg-white p-5">
      <div class="flex items-start gap-3">
        <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
          <AppIcon name="external" :size="16" />
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-900">Hulp nodig?</h3>
          <p class="mt-1 text-sm text-gray-500">
            Neem contact op met je installateur voor vragen of wijzigingen.
          </p>
          <div class="mt-2 flex flex-wrap gap-3 text-sm">
            <a :href="`mailto:${partner.support_email}`" class="font-medium text-blue-600 hover:text-blue-700">
              {{ partner.support_email }}
            </a>
            <span class="text-gray-300">|</span>
            <a :href="`tel:${partner.support_phone}`" class="font-medium text-blue-600 hover:text-blue-700">
              {{ partner.support_phone }}
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
