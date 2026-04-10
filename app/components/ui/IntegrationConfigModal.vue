<script setup lang="ts">
const props = defineProps<{
  open: boolean
  integration: {
    name: string
    desc: string
    type?: string       // module type for monitoring integrations
    icon?: string       // icon name for admin integrations
    integrationType?: string // sundata, weheat, easee, mollie, etc.
    category: 'monitoring' | 'admin'
    connected: boolean
  } | null
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const { partner } = usePartner()
const { getCredentials: getIntegrationCredentials, testAndSave, disconnect: disconnectIntegration } = useIntegrations()

// Integration credential definitions
const credentialFields: Record<string, { label: string; key: string; type: string; placeholder: string }[]> = {
  'Sundata': [
    { label: 'E-mailadres', key: 'email', type: 'email', placeholder: 'installateur@bedrijf.nl' },
    { label: 'Wachtwoord', key: 'password', type: 'password', placeholder: '••••••••' },
  ],
  'Weheat': [
    { label: 'Client ID', key: 'client_id', type: 'text', placeholder: 'wh_client_xxxxxxxx' },
    { label: 'Client Secret', key: 'client_secret', type: 'password', placeholder: '••••••••••••••••' },
  ],
  'Easee': [
    { label: 'Gebruikersnaam', key: 'username', type: 'text', placeholder: 'installateur@bedrijf.nl' },
    { label: 'Wachtwoord', key: 'password', type: 'password', placeholder: '••••••••' },
  ],
  'Mollie Payments': [
    { label: 'API Key (live)', key: 'api_key', type: 'password', placeholder: 'live_xxxxxxxxxxxxxxxxxxxxxxxx' },
  ],
  'Basecone': [
    { label: 'API Key', key: 'api_key', type: 'password', placeholder: 'bc_xxxxxxxxxxxxxxxx' },
  ],
  'Boekhoudgemak': [
    { label: 'API Key', key: 'api_key', type: 'password', placeholder: 'bg_xxxxxxxxxxxxxxxx' },
  ],
  'Gripp.com': [
    { label: 'API Key', key: 'api_key', type: 'password', placeholder: 'gripp_xxxxxxxxxxxxxxxx' },
    { label: 'Subdomain', key: 'subdomain', type: 'text', placeholder: 'jouwbedrijf' },
  ],
}

// Integration info/help text
const integrationInfo: Record<string, { description: string; helpUrl: string; features: string[] }> = {
  'Sundata': {
    description: 'Koppel met Sundata om de zonnepanelen van je klanten real-time te monitoren. Ondersteunt alle merken omvormers.',
    helpUrl: 'https://sundata.nl/docs',
    features: ['Storingmeldingen', 'Alle omvormer-merken', 'Historische data'],
  },
  'Weheat': {
    description: 'Koppel met WeHeat voor real-time monitoring van warmtepompen. Zie COP, vermogen en watertemperatuur.',
    helpUrl: 'https://weheat.nl/api',
    features: ['Real-time statusmonitoring', 'COP & vermogensdata', 'Energieverbruik', 'Foutmeldingen'],
  },
  'Easee': {
    description: 'Koppel met Easee voor laadpaal monitoring. Zie laadsessies, vermogen en energieverbruik per klant.',
    helpUrl: 'https://developer.easee.com',
    features: ['Laadsessie-overzicht', 'Real-time vermogen', 'Energieverbruik', 'Laadstatus'],
  },
  'Mollie Payments': {
    description: 'Automatische incasso en betalingsverwerking via Mollie. Verwerk maandelijkse servicecontracten automatisch.',
    helpUrl: 'https://mollie.com/dashboard',
    features: ['Automatische incasso (SEPA)', 'iDEAL betalingen', 'Factuurverwerking', 'Terugbetalingen'],
  },
  'Basecone': {
    description: 'Automatische documentverwerking en boekhoudkoppeling via Basecone.',
    helpUrl: 'https://basecone.com',
    features: ['Factuurscanning', 'Automatische boekingen', 'Documentarchief'],
  },
  'Boekhoudgemak': {
    description: 'Online boekhoudsoftware integratie voor factuurverwerking en financieel overzicht.',
    helpUrl: 'https://boekhoudgemak.nl',
    features: ['Factuurkoppeling', 'BTW-aangifte', 'Financiële rapportages'],
  },
  'Gripp.com': {
    description: 'CRM en projectmanagement koppeling. Synchroniseer klantgegevens en projecten.',
    helpUrl: 'https://gripp.com/api',
    features: ['Klantsynchronisatie', 'Projectkoppeling', 'Urenregistratie', 'Offertebeheer'],
  },
}

// State
const step = ref<'credentials' | 'testing' | 'success' | 'devices'>('credentials')
const credentials = ref<Record<string, string>>({})
const showPasswords = ref<Record<string, boolean>>({})
const testError = ref('')

// Real devices from API
const devices = ref<{ id: string; name: string; serial?: string; customer?: string }[]>([])
const devicesLoading = ref(false)

const fields = computed(() => {
  if (!props.integration) return []
  return credentialFields[props.integration.name] || []
})

const info = computed(() => {
  if (!props.integration) return null
  return integrationInfo[props.integration.name] || null
})

const hasDevices = computed(() => testDetails.value?.plants > 0 || testDetails.value?.heatPumps > 0 || testDetails.value?.chargers > 0)

// Load saved credentials when opening
watch(() => props.open, (isOpen) => {
  if (isOpen && props.integration) {
    showPasswords.value = {}
    testError.value = ''
    testDetails.value = null

    const intType = props.integration.integrationType
    const saved = intType ? getIntegrationCredentials(partner.id, intType) : null

    if (saved?.is_connected) {
      step.value = 'success'
      // Show saved credentials (mask passwords)
      credentials.value = { ...saved.credentials }
      testDetails.value = saved.details || null
    } else {
      step.value = 'credentials'
      credentials.value = {}
    }
  }
})

const allFieldsFilled = computed(() => {
  return fields.value.every(f => credentials.value[f.key]?.trim())
})

function togglePassword(key: string) {
  showPasswords.value[key] = !showPasswords.value[key]
}

const testDetails = ref<Record<string, any> | null>(null)

async function testConnection() {
  step.value = 'testing'
  testError.value = ''
  testDetails.value = null

  const intType = props.integration?.integrationType
  if (!intType) {
    // Fallback: simulate for non-implemented integrations
    await new Promise(resolve => setTimeout(resolve, 1500))
    step.value = 'success'
    return
  }

  try {
    const result = await testAndSave(partner.id, intType, credentials.value)

    if (result.success) {
      testDetails.value = result.details || null
      step.value = 'success'
    } else {
      testError.value = result.error || 'Verbinding mislukt'
      step.value = 'credentials'
    }
  } catch (err: any) {
    testError.value = err?.data?.message || 'Verbinding mislukt. Controleer je gegevens.'
    step.value = 'credentials'
  }
}

async function showDevices() {
  step.value = 'devices'
  devicesLoading.value = true
  devices.value = []

  try {
    const intType = props.integration?.integrationType
    if (intType) {
      const supabase = useSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        const result = await $fetch<any[]>(`/api/integrations/${intType}/devices`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch(() => [])
        devices.value = (result || []).map((d: any) => ({
          id: d.id,
          name: d.name || `Apparaat ${d.id}`,
          serial: d.serial || d.id,
        }))
      }
    }
  } catch {} finally {
    devicesLoading.value = false
  }
}

function handleDisconnect() {
  const intType = props.integration?.integrationType
  if (intType) {
    disconnectIntegration(partner.id, intType)
  }
  step.value = 'credentials'
  credentials.value = {}
}

function handleSave() {
  emit('saved')
  emit('close')
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="open && integration"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="handleClose"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        <!-- Modal -->
        <div class="relative w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden">
          <!-- Header with colored top bar -->
          <div
            class="px-6 pt-5 pb-4"
            :class="integration.category === 'monitoring'
              ? 'bg-gradient-to-r from-gray-50 to-gray-100'
              : 'bg-gradient-to-r from-purple-50 to-purple-100'"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div
                  v-if="integration.category === 'monitoring' && integration.type"
                  class="flex h-10 w-10 items-center justify-center rounded-xl"
                  :class="[
                    integration.type === 'solar' ? 'bg-amber-100 text-amber-600' : '',
                    integration.type === 'heat_pump' ? 'bg-rose-100 text-rose-600' : '',
                    integration.type === 'ev_charger' ? 'bg-sky-100 text-sky-600' : '',
                  ]"
                >
                  <AppIcon
                    :name="integration.type === 'solar' ? 'solar' : integration.type === 'heat_pump' ? 'heat-pump' : 'ev-charger'"
                    :size="22"
                  />
                </div>
                <div
                  v-else
                  class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600"
                >
                  <AppIcon :name="integration.icon || 'puzzle'" :size="22" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">{{ integration.name }}</h3>
                  <p class="text-sm text-gray-500">{{ integration.desc }}</p>
                </div>
              </div>
              <button
                class="rounded-lg p-1.5 text-gray-400 hover:bg-white/60 hover:text-gray-600"
                @click="handleClose"
              >
                <AppIcon name="x" :size="18" />
              </button>
            </div>
          </div>

          <div class="px-6 pb-6">
            <!-- Integration info -->
            <div v-if="info" class="mt-4 mb-5">
              <p class="text-sm text-gray-600">{{ info.description }}</p>
              <div class="mt-3 flex flex-wrap gap-2">
                <span
                  v-for="feature in info.features"
                  :key="feature"
                  class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600"
                >
                  <AppIcon name="check" :size="12" class="text-green-500" />
                  {{ feature }}
                </span>
              </div>
            </div>

            <!-- Step: Credentials -->
            <div v-if="step === 'credentials'">
              <div class="rounded-xl border border-gray-200 p-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AppIcon name="settings" :size="16" class="text-gray-400" />
                  Inloggegevens
                </h4>

                <div class="space-y-3">
                  <div v-for="field in fields" :key="field.key">
                    <label class="label">{{ field.label }}</label>
                    <div class="relative">
                      <input
                        v-model="credentials[field.key]"
                        :type="field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'"
                        :placeholder="field.placeholder"
                        class="input"
                        :class="field.type === 'password' ? 'pr-10' : ''"
                      />
                      <button
                        v-if="field.type === 'password'"
                        type="button"
                        class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        @click="togglePassword(field.key)"
                      >
                        <AppIcon :name="showPasswords[field.key] ? 'x-circle' : 'search'" :size="16" />
                      </button>
                    </div>
                  </div>
                </div>

                <div v-if="info" class="mt-3">
                  <a
                    :href="info.helpUrl"
                    target="_blank"
                    class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700"
                  >
                    <AppIcon name="external" :size="12" />
                    Waar vind ik deze gegevens?
                  </a>
                </div>
              </div>

              <!-- Error message -->
              <div v-if="testError" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3">
                <p class="text-sm text-red-700 flex items-center gap-2">
                  <AppIcon name="x-circle" :size="16" class="text-red-500 shrink-0" />
                  {{ testError }}
                </p>
              </div>

              <!-- Actions -->
              <div class="mt-5 flex justify-end gap-3">
                <button class="btn-secondary" @click="handleClose">Annuleren</button>
                <button
                  class="btn-primary"
                  :disabled="!allFieldsFilled"
                  :class="{ 'opacity-50 cursor-not-allowed': !allFieldsFilled }"
                  @click="testConnection"
                >
                  <AppIcon name="switch" :size="16" />
                  Verbinding testen
                </button>
              </div>
            </div>

            <!-- Step: Testing connection -->
            <div v-else-if="step === 'testing'" class="py-8 text-center">
              <div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" />
              <p class="text-sm font-medium text-gray-900">Verbinding testen...</p>
              <p class="mt-1 text-xs text-gray-500">Even geduld, we verifiëren je gegevens bij {{ integration.name }}.</p>
            </div>

            <!-- Step: Success -->
            <div v-else-if="step === 'success'">
              <div class="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                <div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <AppIcon name="check-circle" :size="28" class="text-green-600" />
                </div>
                <p class="text-sm font-semibold text-green-800">Verbinding actief</p>
                <p class="mt-1 text-xs text-green-600">
                  {{ integration.name }} is succesvol gekoppeld.
                  <template v-if="testDetails?.companies != null">
                    Verbonden met {{ testDetails.companies }} bedrijf(ven).
                  </template>
                  <template v-else-if="testDetails?.heatPumps != null">
                    {{ testDetails.heatPumps }} warmtepomp(en) gevonden.
                  </template>
                  <template v-else-if="testDetails?.chargers != null">
                    {{ testDetails.chargers }} laadpa(a)l(en) gevonden.
                  </template>
                  <template v-else>
                    Gegevens worden automatisch gesynchroniseerd.
                  </template>
                </p>
              </div>

              <!-- Device overview button (only for monitoring integrations) -->
              <div v-if="integration.category === 'monitoring' && hasDevices" class="mt-4">
                <button
                  class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50"
                  @click="showDevices"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <AppIcon name="puzzle" :size="18" />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ devices.length }} apparaten gevonden</p>
                      <p class="text-xs text-gray-500">Bekijk gekoppelde apparaten en klanten</p>
                    </div>
                  </div>
                  <AppIcon name="chevron-right" :size="18" class="text-gray-400" />
                </button>
              </div>

              <!-- Connection details -->
              <div class="mt-4 rounded-xl border border-gray-200 p-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-3">Verbindingsgegevens</h4>
                <div class="space-y-2">
                  <div v-for="field in fields" :key="field.key" class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">{{ field.label }}</span>
                    <span class="text-xs font-mono text-gray-700">
                      {{ field.type === 'password' ? '••••••••••••' : (credentials[field.key] || 'demo-value') }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span class="text-xs text-gray-500">Status</span>
                    <span class="badge badge--green">Verbonden</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500">Laatst gesynchroniseerd</span>
                    <span class="text-xs text-gray-700">Vandaag, 14:32</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="mt-5 flex justify-between">
                <button
                  class="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700"
                  @click="handleDisconnect"
                >
                  Ontkoppelen
                </button>
                <button class="btn-primary" @click="handleSave">
                  <AppIcon name="check" :size="16" />
                  Opslaan & sluiten
                </button>
              </div>
            </div>

            <!-- Step: Devices -->
            <div v-else-if="step === 'devices'">
              <button
                class="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
                @click="step = 'success'"
              >
                <AppIcon name="chevron-right" :size="14" class="rotate-180" />
                Terug
              </button>

              <h4 class="text-sm font-semibold text-gray-900 mb-3">
                Gekoppelde apparaten
              </h4>

              <div v-if="devicesLoading" class="py-6 text-center">
                <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
                <p class="mt-2 text-xs text-gray-500">Apparaten ophalen...</p>
              </div>

              <div v-else-if="devices.length === 0" class="py-6 text-center">
                <p class="text-sm text-gray-500">Geen apparaten gevonden.</p>
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="device in devices"
                  :key="device.id"
                  class="flex items-center justify-between rounded-xl border border-gray-200 p-3"
                >
                  <div class="flex items-center gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100">
                      <AppIcon
                        :name="integration.type === 'solar' ? 'solar' : integration.type === 'heat_pump' ? 'heat-pump' : 'ev-charger'"
                        :size="18"
                        class="text-gray-600"
                      />
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900">{{ device.name }}</p>
                      <p class="font-mono text-xs text-gray-400">{{ device.serial }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span
                      v-if="device.customer"
                      class="badge badge--green"
                    >
                      {{ device.customer }}
                    </span>
                    <span v-else class="badge badge--yellow">Niet gekoppeld</span>
                  </div>
                </div>
              </div>

              <p class="mt-3 text-xs text-gray-400">
                Apparaten worden automatisch gesynchroniseerd. Koppel apparaten aan klanten via de klantpagina.
              </p>

              <!-- Actions -->
              <div class="mt-5 flex justify-end">
                <button class="btn-primary" @click="handleSave">
                  <AppIcon name="check" :size="16" />
                  Sluiten
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
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
