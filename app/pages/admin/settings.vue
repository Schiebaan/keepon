<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { partner, save: savePartner, isLoading: isSavingPartner } = usePartner()
const { isConnected: isIntegrationConnected, setConnected } = useIntegrations()

// Load integration status from Supabase on mount
if (typeof window !== 'undefined') {
  const supabase = useSupabaseClient()
  supabase.auth.onAuthStateChange((event, session) => {
    if (session?.access_token) {
      $fetch<Record<string, boolean>>('/api/integrations/status', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).then(status => {
        for (const [type, active] of Object.entries(status)) {
          setConnected(partner.value.id, type, active)
        }
      }).catch(() => {})
    }
  })
}

// --- Module pricing ---
const moduleConfigs = ref<any[]>([])
const pricingLoaded = ref(false)
const pricingSaving = ref<string | null>(null)

async function loadPricing() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return
  const data = await $fetch<any[]>('/api/partners/pricing', {
    headers: { Authorization: `Bearer ${session.access_token}` },
  }).catch(() => [])
  moduleConfigs.value = data
  pricingLoaded.value = true
}

async function savePricing(config: any) {
  pricingSaving.value = config.id
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return
  await $fetch('/api/partners/pricing', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: { id: config.id, price_monthly: config.price_monthly, price_yearly: config.price_yearly, is_enabled: config.is_enabled, min_contract_months: config.min_contract_months },
  }).catch(() => {})
  pricingSaving.value = null
}

if (typeof window !== 'undefined') loadPricing()

const moduleIcons: Record<string, string> = { solar: 'solar', heat_pump: 'heat-pump', ev_charger: 'ev-charger' }
const moduleColors: Record<string, string> = { solar: 'bg-amber-50 text-amber-600', heat_pump: 'bg-rose-50 text-rose-600', ev_charger: 'bg-sky-50 text-sky-600' }

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2).replace('.', ',')
}

// --- Password change ---
const currentPassword = ref('')
const newPw = ref('')
const confirmPw = ref('')
const pwSaving = ref(false)
const pwSuccess = ref(false)
const pwError = ref('')

async function handleChangePassword() {
  pwError.value = ''
  if (newPw.value.length < 8) { pwError.value = 'Minimaal 8 tekens.'; return }
  if (newPw.value !== confirmPw.value) { pwError.value = 'Wachtwoorden komen niet overeen.'; return }

  pwSaving.value = true
  try {
    const supabase = useSupabaseClient()
    const { error } = await supabase.auth.updateUser({ password: newPw.value })
    if (error) throw error
    pwSuccess.value = true
    currentPassword.value = ''
    newPw.value = ''
    confirmPw.value = ''
    setTimeout(() => { pwSuccess.value = false }, 3000)
  } catch (e: any) {
    pwError.value = e?.message || 'Wijzigen mislukt'
  } finally {
    pwSaving.value = false
  }
}

const saveSuccess = ref(false)
const saveError = ref('')
async function handleSavePartner() {
  saveError.value = ''
  try {
    await savePartner()
    saveSuccess.value = true
    setTimeout(() => { saveSuccess.value = false }, 3000)
  } catch (e: any) {
    saveError.value = e?.data?.message || e?.message || 'Opslaan mislukt'
  }
}

// Ensure terms_placeholders is initialized with defaults
if (!partner.value.terms_placeholders) {
  partner.value.terms_placeholders = {
    bedrijfsnaam: partner.value.name || '',
    kvk: '',
    adres: '',
    email: partner.value.support_email || '',
    telefoon: partner.value.support_phone || '',
  }
}

const placeholderFields = [
  { key: 'bedrijfsnaam', label: 'Bedrijfsnaam', tag: '\u007B\u007Bbedrijfsnaam\u007D\u007D' },
  { key: 'kvk', label: 'KvK-nummer', tag: '\u007B\u007Bkvk\u007D\u007D' },
  { key: 'adres', label: 'Adres', tag: '\u007B\u007Badres\u007D\u007D' },
  { key: 'email', label: 'E-mail', tag: '\u007B\u007Bemail\u007D\u007D' },
  { key: 'telefoon', label: 'Telefoon', tag: '\u007B\u007Btelefoon\u007D\u007D' },
]

const monitoringIntegrations = computed(() => [
  { name: 'Sundata', desc: 'Zonnepaneel monitoring (alle merken)', type: 'solar', integrationType: 'sundata', category: 'monitoring' as const, connected: isIntegrationConnected(partner.id, 'sundata') },
  { name: 'Weheat', desc: 'Warmtepomp monitoring', type: 'heat_pump', integrationType: 'weheat', category: 'monitoring' as const, connected: isIntegrationConnected(partner.id, 'weheat') },
  { name: 'Easee', desc: 'Laadpaal monitoring', type: 'ev_charger', integrationType: 'easee', category: 'monitoring' as const, connected: isIntegrationConnected(partner.id, 'easee') },
])

const adminIntegrations = computed(() => [
  { name: 'Gripp.com', desc: 'CRM & projectmanagement', icon: 'users', integrationType: 'gripp', category: 'admin' as const, connected: isIntegrationConnected(partner.id, 'gripp') },
])

// Modal state
const configModalOpen = ref(false)
const selectedIntegration = ref<typeof monitoringIntegrations[0] | typeof adminIntegrations[0] | null>(null)

function openConfig(integration: typeof monitoringIntegrations[0] | typeof adminIntegrations[0]) {
  selectedIntegration.value = integration
  configModalOpen.value = true
}

function handleSaved() {
  if (selectedIntegration.value) {
    selectedIntegration.value.connected = true
  }
  configModalOpen.value = false
}

// Logo upload
const fileInput = ref<HTMLInputElement | null>(null)
const logoUploading = ref(false)
const logoSuccess = ref(false)

function triggerLogoUpload() {
  fileInput.value?.click()
}

async function handleLogoChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  // Validate file type
  if (!file.type.startsWith('image/')) return

  logoUploading.value = true
  logoSuccess.value = false

  // Convert to base64 data URL
  const reader = new FileReader()
  reader.onload = async (e) => {
    const dataUrl = e.target?.result as string
    if (dataUrl) {
      partner.value.logo_url = dataUrl
      logoUploading.value = false
      logoSuccess.value = true
      // Auto-save after logo upload
      await savePartner()
      setTimeout(() => { logoSuccess.value = false }, 3000)
    }
  }
  reader.onerror = () => {
    logoUploading.value = false
  }
  reader.readAsDataURL(file)

  // Reset input so same file can be selected again
  input.value = ''
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Instellingen</h1>
      <p class="mt-1 text-sm text-gray-500">Beheer je partneromgeving, branding en koppelingen.</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Left column -->
      <div class="space-y-6">
        <!-- Logo upload -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="home" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Logo</h2>
          </div>

          <div class="flex items-center gap-5">
            <button
              class="group relative flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:bg-gray-100"
              @click="triggerLogoUpload"
            >
              <img
                v-if="partner.logo_url"
                :src="partner.logo_url"
                :alt="partner.name"
                class="h-12 w-12 rounded-lg object-contain"
              />
              <AppIcon v-else name="plus" :size="20" class="text-gray-300" />
              <!-- Hover overlay -->
              <div class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <AppIcon name="plus" :size="18" class="text-white" />
              </div>
              <!-- Loading spinner -->
              <div v-if="logoUploading" class="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80">
                <div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
              </div>
            </button>
            <div>
              <p class="text-sm font-medium text-gray-700">{{ partner.name }}</p>
              <p class="text-xs text-gray-400">Wordt getoond in het klantportaal en e-mails.</p>
              <button class="btn-ghost mt-1 text-xs" @click="triggerLogoUpload">
                <AppIcon name="plus" :size="12" />
                Logo wijzigen
              </button>
              <p v-if="logoSuccess" class="mt-1 text-xs font-medium text-green-600">
                Logo succesvol bijgewerkt!
              </p>
            </div>
            <!-- Hidden file input -->
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="handleLogoChange"
            />
          </div>
        </div>

        <!-- Partner info -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="settings" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Partnerinformatie</h2>
          </div>

          <div class="space-y-3">
            <div>
              <label class="label">Bedrijfsnaam</label>
              <input type="text" v-model="partner.name" class="input" />
            </div>
            <div>
              <label class="label">Portaal URL</label>
              <div class="flex items-center gap-2">
                <input type="text" v-model="partner.slug" class="input flex-1" />
                <span class="text-sm text-gray-400 whitespace-nowrap">.upsol.nl</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Support e-mail</label>
                <input type="email" v-model="partner.support_email" class="input" />
              </div>
              <div>
                <label class="label">Telefoon</label>
                <input type="tel" v-model="partner.support_phone" class="input" />
              </div>
            </div>
          </div>
        </div>

        <!-- Servicevoorwaarden -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="check-circle" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Servicevoorwaarden</h2>
          </div>

          <!-- Placeholders -->
          <div class="mb-5">
            <h3 class="text-sm font-semibold text-gray-800 mb-1">Placeholders</h3>
            <p class="text-xs text-gray-500 mb-3">Deze waarden worden automatisch ingevuld in je voorwaarden.</p>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="field in placeholderFields" :key="field.key">
                <label class="label">{{ field.label }}</label>
                <input
                  type="text"
                  v-model="partner.terms_placeholders[field.key]"
                  class="input"
                />
              </div>
            </div>
          </div>

          <!-- Terms text editor -->
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-800 mb-1">Voorwaardentekst</h3>
            <p class="text-xs text-gray-500 mb-2">Gebruik de volgende placeholders in je tekst:</p>
            <div class="mb-3 flex flex-wrap gap-1.5">
              <span
                v-for="field in placeholderFields"
                :key="field.key"
                class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600"
              >
                {{ field.tag }}
              </span>
            </div>
            <textarea
              v-model="partner.terms_content"
              class="input font-mono"
              style="min-height: 400px; resize: vertical;"
              placeholder="Voer hier je servicevoorwaarden in..."
            />
          </div>

          <!-- Preview link -->
          <a
            :href="`/voorwaarden/${partner.slug}`"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Bekijk voorwaarden
            <AppIcon name="external" :size="14" />
          </a>
        </div>
      </div>

      <!-- Right column -->
      <div class="space-y-6">
        <!-- Branding -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="solar" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Branding</h2>
          </div>
          <p class="mb-4 text-xs text-gray-500">Deze kleuren worden automatisch toegepast in het klantportaal.</p>

          <div class="grid grid-cols-2 gap-4">
            <div class="rounded-xl border border-gray-200 p-3">
              <p class="text-xs font-medium text-gray-500 mb-2">Primair</p>
              <div class="flex items-center gap-2">
                <div class="relative shrink-0">
                  <div
                    class="h-9 w-9 rounded-lg shadow-sm cursor-pointer"
                    :style="{ backgroundColor: partner.primary_color }"
                  />
                  <input
                    type="color"
                    :value="partner.primary_color"
                    class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    @input="partner.primary_color = ($event.target as HTMLInputElement).value"
                  />
                </div>
                <input
                  type="text"
                  v-model="partner.primary_color"
                  class="input font-mono text-sm !py-1.5"
                  placeholder="#000000"
                  maxlength="7"
                />
              </div>
            </div>
            <div class="rounded-xl border border-gray-200 p-3">
              <p class="text-xs font-medium text-gray-500 mb-2">Achtergrond</p>
              <div class="flex items-center gap-2">
                <div class="relative shrink-0">
                  <div
                    class="h-9 w-9 rounded-lg border border-gray-200 shadow-sm cursor-pointer"
                    :style="{ backgroundColor: partner.secondary_color }"
                  />
                  <input
                    type="color"
                    :value="partner.secondary_color"
                    class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    @input="partner.secondary_color = ($event.target as HTMLInputElement).value"
                  />
                </div>
                <input
                  type="text"
                  v-model="partner.secondary_color"
                  class="input font-mono text-sm !py-1.5"
                  placeholder="#ffffff"
                  maxlength="7"
                />
              </div>
            </div>
          </div>

          <!-- Preview -->
          <div class="mt-4 rounded-lg border border-gray-200 p-3">
            <p class="text-xs font-medium text-gray-400 mb-2">Preview</p>
            <div class="flex items-center gap-2">
              <button class="btn-primary text-xs py-1.5 px-3">Knop voorbeeld</button>
              <a href="#" class="text-sm font-medium" :style="{ color: partner.primary_color }">Link voorbeeld</a>
            </div>
          </div>
        </div>

        <!-- Module pricing -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="euro" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Module prijzen</h2>
          </div>

          <div v-if="!pricingLoaded" class="py-4 text-center">
            <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="config in moduleConfigs"
              :key="config.id"
              class="rounded-xl border border-gray-200 p-4"
            >
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="flex h-7 w-7 items-center justify-center rounded-lg" :class="moduleColors[config.module_definition?.type] || 'bg-gray-100'">
                    <AppIcon :name="moduleIcons[config.module_definition?.type] || 'puzzle'" :size="14" />
                  </div>
                  <span class="text-sm font-medium text-gray-900">{{ config.module_definition?.name }}</span>
                </div>
                <button
                  class="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
                  :class="config.is_enabled ? 'bg-green-500' : 'bg-gray-300'"
                  @click="config.is_enabled = !config.is_enabled; savePricing(config)"
                >
                  <span class="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform" :class="config.is_enabled ? 'translate-x-4' : 'translate-x-1'" />
                </button>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="text-[10px] text-gray-400 uppercase">Per maand</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-gray-400">&euro;</span>
                    <input
                      :value="formatPrice(config.price_monthly)"
                      type="text"
                      class="input !py-1 text-sm"
                      @change="config.price_monthly = Math.round(parseFloat(($event.target as HTMLInputElement).value.replace(',','.')) * 100); savePricing(config)"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-[10px] text-gray-400 uppercase">Per jaar</label>
                  <div class="flex items-center gap-1">
                    <span class="text-xs text-gray-400">&euro;</span>
                    <input
                      :value="formatPrice(config.price_yearly)"
                      type="text"
                      class="input !py-1 text-sm"
                      @change="config.price_yearly = Math.round(parseFloat(($event.target as HTMLInputElement).value.replace(',','.')) * 100); savePricing(config)"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-[10px] text-gray-400 uppercase">Min. maanden</label>
                  <input
                    v-model.number="config.min_contract_months"
                    type="number"
                    class="input !py-1 text-sm"
                    @change="savePricing(config)"
                  />
                </div>
              </div>
              <p v-if="pricingSaving === config.id" class="mt-1 text-[10px] text-green-600">Opgeslagen</p>
            </div>
          </div>
        </div>

        <!-- Wachtwoord wijzigen -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="shield" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Wachtwoord wijzigen</h2>
          </div>

          <form @submit.prevent="handleChangePassword" class="space-y-3">
            <div>
              <label class="label">Nieuw wachtwoord</label>
              <input v-model="newPw" type="password" class="input" placeholder="Minimaal 8 tekens" required autocomplete="new-password" />
            </div>
            <div>
              <label class="label">Bevestig wachtwoord</label>
              <input v-model="confirmPw" type="password" class="input" placeholder="Herhaal wachtwoord" required autocomplete="new-password" />
            </div>

            <p v-if="pwError" class="text-sm text-red-500">{{ pwError }}</p>
            <p v-if="pwSuccess" class="text-sm text-green-600 font-medium">Wachtwoord gewijzigd!</p>

            <button
              type="submit"
              class="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              :disabled="pwSaving || !newPw || !confirmPw"
            >
              {{ pwSaving ? 'Wijzigen...' : 'Wachtwoord wijzigen' }}
            </button>
          </form>
        </div>

        <!-- Monitoring integrations -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="puzzle" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Monitoring integraties</h2>
          </div>
          <p class="mb-3 text-xs text-gray-500">Koppel met monitoringplatforms om apparaten van klanten real-time te volgen.</p>

          <div class="space-y-3">
            <button
              v-for="int in monitoringIntegrations"
              :key="int.name"
              class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm"
              @click="openConfig(int)"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg"
                  :class="[getModuleTheme(int.type).bg, getModuleTheme(int.type).text]"
                >
                  <AppIcon :name="getModuleTheme(int.type).icon" :size="16" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ int.name }}</p>
                  <p class="text-xs text-gray-500">{{ int.desc }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="badge"
                  :class="int.connected ? 'badge--green' : 'badge--yellow'"
                >
                  {{ int.connected ? 'Verbonden' : 'Niet geconfigureerd' }}
                </span>
                <AppIcon name="chevron-right" :size="16" class="text-gray-300" />
              </div>
            </button>
          </div>
        </div>

        <!-- Admin / Facturatie integrations -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="credit-card" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Administratie & facturatie</h2>
          </div>
          <p class="mb-3 text-xs text-gray-500">Koppelingen met boekhouding, CRM en betalingsverwerking.</p>

          <div class="space-y-3">
            <button
              v-for="int in adminIntegrations"
              :key="int.name"
              class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm"
              @click="openConfig(int)"
            >
              <div class="flex items-center gap-3">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <AppIcon :name="int.icon" :size="16" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ int.name }}</p>
                  <p class="text-xs text-gray-500">{{ int.desc }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="badge"
                  :class="int.connected ? 'badge--green' : 'badge--yellow'"
                >
                  {{ int.connected ? 'Verbonden' : 'Niet geconfigureerd' }}
                </span>
                <AppIcon name="chevron-right" :size="16" class="text-gray-300" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-6 flex items-center gap-3">
      <button
        class="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors disabled:opacity-50"
        :disabled="isSavingPartner"
        @click="handleSavePartner"
      >
        <svg v-if="isSavingPartner" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <AppIcon v-else name="check" :size="16" />
        {{ isSavingPartner ? 'Opslaan...' : 'Instellingen opslaan' }}
      </button>
      <span v-if="saveSuccess" class="text-sm text-green-600 font-medium">Opgeslagen!</span>
      <span v-if="saveError" class="text-sm text-red-500">{{ saveError }}</span>
    </div>

    <!-- Integration Config Modal -->
    <IntegrationConfigModal
      :open="configModalOpen"
      :integration="selectedIntegration"
      @close="configModalOpen = false"
      @saved="handleSaved"
    />
  </div>
</template>
