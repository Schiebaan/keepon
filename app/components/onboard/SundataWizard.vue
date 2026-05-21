<script setup lang="ts">
/**
 * Sundata Onboarding Wizard
 *
 * Standalone module for connecting a customer's solar installation to Sundata.
 * Steps:
 * 1. Select inverter brand (driver)
 * 2. Enter driver-specific credentials
 * 3. Create plant + meter in Sundata
 * 4. Verify connection
 *
 * Designed to be reusable across projects.
 */

const props = defineProps<{
  modelValue: boolean
  customerId: string
  customerName: string
  productData?: { capacityWp?: string; orientation?: string; tilt?: string }
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'completed': [result: { deviceId: string; plantName: string }]
}>()

const { partner } = usePartner()

// Wizard state
const step = ref<'brand' | 'credentials' | 'creating' | 'verifying' | 'done' | 'error'>('brand')
const errorMessage = ref('')

// Step 1: Brand/driver selection
const drivers = ref<any[]>([])
const driversLoading = ref(true)
const selectedDriver = ref<any>(null)
const searchBrand = ref('')

// Step 2: Credentials + plant details
const plantName = ref('')
const capacityWp = ref('')
const orientation = ref('')
const tilt = ref('')
const driverCredentials = ref<Record<string, string>>({})

const orientationOptions = [
  { value: 'north', label: 'Noord' },
  { value: 'north-east', label: 'Noordoost' },
  { value: 'east', label: 'Oost' },
  { value: 'south-east', label: 'Zuidoost' },
  { value: 'south', label: 'Zuid' },
  { value: 'south-west', label: 'Zuidwest' },
  { value: 'west', label: 'West' },
  { value: 'north-west', label: 'Noordwest' },
]

// Step 3-4: Result
const createResult = ref<any>(null)
const verifyResult = ref<any>(null)

// Track plant_id across retries so we don't duplicate the plant when meter creation fails
const existingPlantId = ref<number | null>(null)
const existingCompanyId = ref<number | null>(null)

// Prevent double-submit of the Koppelen button (avoids accidental duplicate meter calls)
const isSubmitting = ref(false)

const filteredDrivers = computed(() => {
  if (!searchBrand.value) return drivers.value
  const q = searchBrand.value.toLowerCase()
  return drivers.value.filter((d: any) => d.name.toLowerCase().includes(q))
})

async function getAuthHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

// Load drivers on open
watch(() => props.modelValue, async (open) => {
  if (!open) return
  reset()
  driversLoading.value = true
  try {
    const headers = await getAuthHeaders()
    drivers.value = await $fetch('/api/sundata/drivers', { headers })
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Kan merken niet ophalen. Is Sundata gekoppeld?'
    step.value = 'error'
  } finally {
    driversLoading.value = false
  }
})

function reset() {
  step.value = 'brand'
  errorMessage.value = ''
  selectedDriver.value = null
  searchBrand.value = ''
  plantName.value = props.customerName || ''
  // Pre-fill installation details from the product record if available;
  // otherwise the user fills them in directly in the wizard.
  capacityWp.value = props.productData?.capacityWp || ''
  orientation.value = props.productData?.orientation || ''
  tilt.value = props.productData?.tilt || ''
  driverCredentials.value = {}
  createResult.value = null
  verifyResult.value = null
  existingPlantId.value = null
  existingCompanyId.value = null
}

function selectDriver(driver: any) {
  selectedDriver.value = driver
  driverCredentials.value = {}
  // Fields can be strings (old format) OR objects {name, label} (new format)
  ;(driver.fields || []).forEach((f: any) => {
    const fieldName = typeof f === 'string' ? f : f.name
    driverCredentials.value[fieldName] = ''
  })
  step.value = 'credentials'
}

function goBack() {
  if (step.value === 'credentials') step.value = 'brand'
}

async function createPlant() {
  if (isSubmitting.value) return // hard guard against double-submit
  errorMessage.value = ''

  if (!plantName.value.trim()) {
    errorMessage.value = 'Vul een naam voor de installatie in.'
    return
  }

  // Validate all credential fields are filled
  const fields = selectedDriver.value?.fields || []
  const missing = fields.filter((f: any) => {
    const name = typeof f === 'string' ? f : f.name
    return !driverCredentials.value[name]?.trim()
  })
  if (missing.length > 0) {
    errorMessage.value = `Vul ${missing.length === 1 ? 'het ontbrekende veld' : 'alle velden'} bij ${selectedDriver.value?.name} in.`
    return
  }

  // Installation details: take from local fields (which are pre-filled from the
  // product record if available, else the user entered them in the wizard).
  if (!capacityWp.value || !orientation.value || !tilt.value) {
    errorMessage.value = 'Vul vermogen, oriëntatie en helling in — Sundata heeft deze nodig om de koppeling te maken.'
    return
  }

  isSubmitting.value = true
  step.value = 'creating'
  errorMessage.value = ''

  try {
    const headers = await getAuthHeaders()

    // Step 1: Create plant (or reuse existing by name) — idempotent
    let plantId = existingPlantId.value
    let companyId = existingCompanyId.value
    if (!plantId) {
      const plantResult: any = await $fetch('/api/sundata/create-plant', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: {
          customer_id: props.customerId,
          plant_name: plantName.value,
        },
      })
      plantId = plantResult.plant_id
      companyId = plantResult.company_id
      existingPlantId.value = plantId
      existingCompanyId.value = companyId
    }

    // Step 2: Create meter on that plant
    const meterResult: any = await $fetch('/api/sundata/create-meter', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: {
        customer_id: props.customerId,
        plant_id: plantId,
        driver_id: selectedDriver.value.driver_name || selectedDriver.value.id,
        composition_alias: selectedDriver.value.composition_alias || selectedDriver.value.id,
        driver_credentials: driverCredentials.value,
        capacity_kwp: capacityWp.value ? parseFloat(capacityWp.value) / 1000 : undefined,
        orientation: orientation.value || undefined,
        tilt: tilt.value ? parseFloat(tilt.value) : undefined,
      },
    })

    createResult.value = meterResult

    if (meterResult.success) {
      step.value = 'verifying'
      await new Promise(r => setTimeout(r, 2000))
      try {
        const verify = await $fetch('/api/sundata/verify-plant', {
          headers,
          params: { device_id: meterResult.device_id },
        })
        verifyResult.value = verify
      } catch {}
      step.value = 'done'
    } else {
      // Meter failed but plant exists — keep plant_id so retry reuses it
      errorMessage.value = meterResult.error || 'Meter koppelen mislukt'
      step.value = 'error'
    }
  } catch (e: any) {
    errorMessage.value = e?.data?.message || 'Er ging iets mis. Probeer het opnieuw.'
    step.value = 'error'
  } finally {
    isSubmitting.value = false
  }
}

// Retry from the error panel: keeps plant_id, re-submits credentials
function retryMeter() {
  step.value = 'credentials'
  errorMessage.value = ''
  isSubmitting.value = false
}

function handleDone() {
  if (createResult.value?.device_id) {
    emit('completed', {
      deviceId: createResult.value.device_id,
      plantName: plantName.value,
    })
  }
  emit('update:modelValue', false)
}

function close() {
  emit('update:modelValue', false)
}

const { onMouseDown: onBackdropDown, onClick: onBackdropClick } = useBackdropClose(close)
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @mousedown="onBackdropDown"
        @click="onBackdropClick"
      >
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
          <!-- Header -->
          <div class="px-6 pt-5 pb-4 bg-gradient-to-r from-amber-50 to-orange-50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                  <AppIcon name="solar" :size="22" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Zonnepanelen koppelen</h3>
                  <p class="text-sm text-gray-500">{{ customerName }} · via Sundata</p>
                </div>
              </div>
              <button class="rounded-lg p-1.5 text-gray-400 hover:bg-white/60 hover:text-gray-600" @click="close">
                <AppIcon name="x" :size="18" />
              </button>
            </div>

            <!-- Step indicator -->
            <div class="mt-4 flex gap-1">
              <div v-for="s in ['brand', 'credentials', 'creating', 'done']" :key="s"
                class="h-1 flex-1 rounded-full transition-colors"
                :class="['brand','credentials','creating','verifying','done'].indexOf(step) >= ['brand','credentials','creating','done'].indexOf(s) ? 'bg-amber-500' : 'bg-amber-200'"
              />
            </div>
          </div>

          <div class="px-6 py-5 max-h-[60vh] overflow-y-auto">

            <!-- Step 1: Select brand -->
            <template v-if="step === 'brand'">
              <p class="text-sm text-gray-600 mb-4">Selecteer het merk van de omvormer of het monitoringplatform.</p>

              <div class="mb-3">
                <input
                  v-model="searchBrand"
                  type="text"
                  class="input"
                  placeholder="Zoek merk..."
                  autofocus
                />
              </div>

              <div v-if="driversLoading" class="py-8 text-center">
                <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" />
              </div>

              <div v-else class="grid grid-cols-2 gap-2">
                <button
                  v-for="driver in filteredDrivers"
                  :key="driver.id"
                  class="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-3 text-left transition-all hover:border-amber-300 hover:bg-amber-50"
                  @click="selectDriver(driver)"
                >
                  <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 text-xs font-bold">
                    {{ driver.name?.substring(0, 2).toUpperCase() }}
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ driver.name }}</span>
                </button>
              </div>

              <p v-if="!driversLoading && drivers.length === 0" class="rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700">
                Er zijn nog geen merken actief in jullie Sundata account. Neem contact op met Sundata om merken te activeren.
              </p>
              <p v-else-if="!driversLoading && filteredDrivers.length === 0" class="py-4 text-center text-sm text-gray-400">
                Geen merken gevonden voor "{{ searchBrand }}"
              </p>
            </template>

            <!-- Step 2: Credentials -->
            <template v-if="step === 'credentials'">
              <button class="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" @click="goBack">
                <AppIcon name="chevron-right" :size="14" class="rotate-180" />
                Ander merk kiezen
              </button>

              <div class="flex items-center gap-3 mb-4 rounded-xl bg-amber-50 p-3">
                <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-xs font-bold">
                  {{ selectedDriver.name?.substring(0, 2).toUpperCase() }}
                </div>
                <div>
                  <p class="text-sm font-semibold text-gray-900">{{ selectedDriver.name }}</p>
                  <p class="text-xs text-gray-500">{{ (selectedDriver.fields || []).length }} gegevens nodig</p>
                </div>
              </div>

              <form @submit.prevent="createPlant" class="space-y-3">
                <div>
                  <label class="label">Naam installatie <span class="text-red-400">*</span></label>
                  <input v-model="plantName" type="text" class="input" placeholder="Bijv. Zonnepanelen Fam. Jansen" required />
                </div>

                <!-- Installation details — required by Sundata.
                     Pre-filled from the product record when available, else
                     the installer fills them right here. -->
                <div class="border-t border-gray-100 pt-3">
                  <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Installatie details</p>
                  <div class="grid grid-cols-3 gap-3">
                    <div>
                      <label class="label">Vermogen (Wp) <span class="text-red-400">*</span></label>
                      <input v-model="capacityWp" type="number" step="1" min="0" class="input" placeholder="8400" required />
                    </div>
                    <div>
                      <label class="label">Oriëntatie <span class="text-red-400">*</span></label>
                      <select v-model="orientation" class="input" required>
                        <option value="">Kies...</option>
                        <option v-for="o in orientationOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
                      </select>
                    </div>
                    <div>
                      <label class="label">Helling (°) <span class="text-red-400">*</span></label>
                      <input v-model="tilt" type="number" step="1" min="0" max="90" class="input" placeholder="35" required />
                    </div>
                  </div>
                </div>

                <div v-if="selectedDriver.fields?.length" class="border-t border-gray-100 pt-3">
                  <div class="flex items-center justify-between mb-2">
                    <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">{{ selectedDriver.name }} gegevens</p>
                    <a
                      v-if="selectedDriver.helpUrl"
                      :href="selectedDriver.helpUrl"
                      target="_blank"
                      class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                    >
                      <AppIcon name="external" :size="11" />
                      Hulp bij instellen
                    </a>
                  </div>
                  <div class="space-y-3">
                    <div v-for="field in selectedDriver.fields" :key="typeof field === 'string' ? field : field.name">
                      <label class="label">{{ typeof field === 'string' ? field : field.label }}</label>
                      <input
                        v-model="driverCredentials[typeof field === 'string' ? field : field.name]"
                        :type="(typeof field === 'string' ? field : field.name).toLowerCase().includes('password') ? 'password' : 'text'"
                        class="input"
                        :placeholder="typeof field === 'string' ? field : field.label"
                        required
                      />
                    </div>
                  </div>
                </div>

                <p
                  v-if="errorMessage"
                  class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                  role="alert"
                >
                  {{ errorMessage }}
                </p>

                <button
                  type="submit"
                  :disabled="isSubmitting"
                  class="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg v-if="isSubmitting" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <AppIcon v-else name="zap" :size="16" />
                  {{ isSubmitting ? 'Koppelen...' : 'Koppelen met Sundata' }}
                </button>
              </form>
            </template>

            <!-- Step 3: Creating -->
            <template v-if="step === 'creating'">
              <div class="py-8 text-center">
                <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" />
                <p class="text-sm font-medium text-gray-900">Plant aanmaken in Sundata...</p>
                <p class="mt-1 text-xs text-gray-500">Even geduld, we koppelen {{ selectedDriver?.name }}</p>
              </div>
            </template>

            <!-- Step 3b: Verifying -->
            <template v-if="step === 'verifying'">
              <div class="py-8 text-center">
                <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-500" />
                <p class="text-sm font-medium text-gray-900">Verbinding verifiëren...</p>
                <p class="mt-1 text-xs text-gray-500">We controleren of de data binnenkomt</p>
              </div>
            </template>

            <!-- Step 4: Done -->
            <template v-if="step === 'done'">
              <div class="py-4 text-center">
                <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                  <AppIcon name="check-circle" :size="28" class="text-green-500" />
                </div>
                <p class="text-lg font-semibold text-gray-900">Gekoppeld!</p>
                <p class="mt-1 text-sm text-gray-500">{{ plantName }} is aangemeld bij Sundata.</p>

                <div v-if="verifyResult" class="mt-4 rounded-xl bg-gray-50 p-4 text-left">
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p class="text-xs text-gray-400">Status</p>
                      <p class="font-medium" :class="verifyResult.connected ? 'text-green-600' : 'text-amber-600'">
                        {{ verifyResult.connected ? 'Verbonden' : 'In afwachting van data' }}
                      </p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-400">Meters</p>
                      <p class="font-medium text-gray-900">{{ verifyResult.meters }}</p>
                    </div>
                    <div v-if="verifyResult.capacity_kwp">
                      <p class="text-xs text-gray-400">Capaciteit</p>
                      <p class="font-medium text-gray-900">{{ verifyResult.capacity_kwp }} kWp</p>
                    </div>
                  </div>
                </div>

                <button
                  class="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
                  @click="handleDone"
                >
                  Sluiten
                </button>
              </div>
            </template>

            <!-- Error -->
            <template v-if="step === 'error'">
              <div class="py-4 text-center">
                <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                  <AppIcon name="x-circle" :size="28" class="text-red-500" />
                </div>
                <p class="text-lg font-semibold text-gray-900">
                  {{ existingPlantId ? 'Meter koppelen mislukt' : 'Koppeling mislukt' }}
                </p>
                <p class="mt-2 text-sm text-red-600">{{ errorMessage }}</p>

                <p v-if="existingPlantId" class="mt-3 text-xs text-gray-500">
                  De plant is aangemaakt in Sundata (#{{ existingPlantId }}). Bij opnieuw proberen hergebruiken we deze — er worden geen dubbele plants aangemaakt.
                </p>

                <div class="mt-6 flex justify-center gap-3">
                  <button class="btn-secondary" @click="close">Sluiten</button>
                  <button
                    class="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
                    @click="existingPlantId ? retryMeter() : reset()"
                  >
                    {{ existingPlantId ? 'Meter opnieuw koppelen' : 'Opnieuw proberen' }}
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
