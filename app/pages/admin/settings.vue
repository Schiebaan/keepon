<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { partner } = useMockData()

// Ensure terms_placeholders is initialized with defaults
if (!partner.terms_placeholders) {
  partner.terms_placeholders = {
    bedrijfsnaam: partner.name || '',
    kvk: '',
    adres: '',
    email: partner.support_email || '',
    telefoon: partner.support_phone || '',
  }
}

const placeholderFields = [
  { key: 'bedrijfsnaam', label: 'Bedrijfsnaam', tag: '\u007B\u007Bbedrijfsnaam\u007D\u007D' },
  { key: 'kvk', label: 'KvK-nummer', tag: '\u007B\u007Bkvk\u007D\u007D' },
  { key: 'adres', label: 'Adres', tag: '\u007B\u007Badres\u007D\u007D' },
  { key: 'email', label: 'E-mail', tag: '\u007B\u007Bemail\u007D\u007D' },
  { key: 'telefoon', label: 'Telefoon', tag: '\u007B\u007Btelefoon\u007D\u007D' },
]

const monitoringIntegrations = reactive([
  { name: 'Sundata', desc: 'Zonnepaneel monitoring (alle merken)', type: 'solar', category: 'monitoring' as const, connected: true },
  { name: 'Weheat', desc: 'Warmtepomp monitoring', type: 'heat_pump', category: 'monitoring' as const, connected: true },
  { name: 'Easee', desc: 'Laadpaal monitoring', type: 'ev_charger', category: 'monitoring' as const, connected: false },
])

const adminIntegrations = reactive([
  { name: 'Mollie Payments', desc: 'Betalingen & automatische incasso', icon: 'euro', category: 'admin' as const, connected: true },
  { name: 'Basecone', desc: 'Documentverwerking & boekhoudkoppeling', icon: 'building', category: 'admin' as const, connected: false },
  { name: 'Boekhoudgemak', desc: 'Online boekhoudsoftware', icon: 'chart', category: 'admin' as const, connected: false },
  { name: 'Gripp.com', desc: 'CRM & projectmanagement', icon: 'users', category: 'admin' as const, connected: false },
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
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string
    if (dataUrl) {
      partner.logo_url = dataUrl
      logoUploading.value = false
      logoSuccess.value = true
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
                <span class="text-sm text-gray-400 whitespace-nowrap">.runon.nl</span>
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
            <label class="rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-gray-300 transition-colors">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <div
                    class="h-10 w-10 rounded-lg shadow-sm"
                    :style="{ backgroundColor: partner.primary_color }"
                  />
                  <input
                    type="color"
                    :value="partner.primary_color"
                    class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    @input="partner.primary_color = ($event.target as HTMLInputElement).value"
                  />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-500">Primair</p>
                  <p class="font-mono text-sm text-gray-900">{{ partner.primary_color }}</p>
                </div>
              </div>
            </label>
            <label class="rounded-xl border border-gray-200 p-3 cursor-pointer hover:border-gray-300 transition-colors">
              <div class="flex items-center gap-3">
                <div class="relative">
                  <div
                    class="h-10 w-10 rounded-lg border border-gray-200 shadow-sm"
                    :style="{ backgroundColor: partner.secondary_color }"
                  />
                  <input
                    type="color"
                    :value="partner.secondary_color"
                    class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    @input="partner.secondary_color = ($event.target as HTMLInputElement).value"
                  />
                </div>
                <div>
                  <p class="text-xs font-medium text-gray-500">Achtergrond</p>
                  <p class="font-mono text-sm text-gray-900">{{ partner.secondary_color }}</p>
                </div>
              </div>
            </label>
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

    <p class="mt-6 text-xs text-gray-400">
      Wijzigingen worden automatisch opgeslagen.
    </p>

    <!-- Integration Config Modal -->
    <IntegrationConfigModal
      :open="configModalOpen"
      :integration="selectedIntegration"
      @close="configModalOpen = false"
      @saved="handleSaved"
    />
  </div>
</template>
