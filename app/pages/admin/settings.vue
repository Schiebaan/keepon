<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { partner, save: savePartner, isLoading: isSavingPartner, loadFullPartner } = usePartner()

// Settings page needs terms_content + terms_placeholders — load them on mount
const { isConnected: isIntegrationConnected, loadStatus: loadIntegrationStatus } = useIntegrations()

onMounted(() => {
  loadFullPartner()
  loadIntegrationStatus()
})

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
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return
  await $fetch('/api/partners/pricing', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
    body: { id: config.id, price_monthly: config.price_monthly, price_yearly: config.price_yearly, is_enabled: config.is_enabled, min_contract_months: config.min_contract_months },
  })
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

    // Fire-and-forget security notification email to the user's address
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.access_token) return
      $fetch('/api/auth/password-changed', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      }).catch(() => {})
    })

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

// Dirty tracking — compare current partner to snapshot
const partnerSnapshot = ref<string>('')
const pricingSnapshot = ref<string>('')
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
const saveError = ref('')

function snapshotString(obj: any) {
  return JSON.stringify(obj)
}

function currentPartnerSnapshot() {
  return snapshotString({
    name: partner.value.name,
    slug: partner.value.slug,
    support_email: partner.value.support_email,
    support_phone: partner.value.support_phone,
    primary_color: partner.value.primary_color,
    secondary_color: partner.value.secondary_color,
    logo_url: partner.value.logo_url,
    terms_content: partner.value.terms_content,
    terms_url: partner.value.terms_url,
    terms_placeholders: partner.value.terms_placeholders,
  })
}

function currentPricingSnapshot() {
  return snapshotString(moduleConfigs.value.map(c => ({
    id: c.id, price_monthly: c.price_monthly, price_yearly: c.price_yearly, is_enabled: c.is_enabled, min_contract_months: c.min_contract_months,
  })))
}

// Initialize snapshots when data loads
watch(() => partner.value.id, () => { partnerSnapshot.value = currentPartnerSnapshot() }, { immediate: true })
watch(pricingLoaded, (v) => { if (v) pricingSnapshot.value = currentPricingSnapshot() })

const partnerDirty = computed(() => partnerSnapshot.value && partnerSnapshot.value !== currentPartnerSnapshot())
const pricingDirty = computed(() => pricingSnapshot.value && pricingSnapshot.value !== currentPricingSnapshot())
const hasChanges = computed(() => partnerDirty.value || pricingDirty.value)

async function saveAll() {
  saveStatus.value = 'saving'
  saveError.value = ''
  try {
    if (partnerDirty.value) {
      await savePartner()
      partnerSnapshot.value = currentPartnerSnapshot()
    }
    if (pricingDirty.value) {
      for (const config of moduleConfigs.value) {
        await savePricing(config)
      }
      pricingSnapshot.value = currentPricingSnapshot()
    }
    saveStatus.value = 'saved'
    setTimeout(() => { if (saveStatus.value === 'saved') saveStatus.value = 'idle' }, 2000)
  } catch (e: any) {
    saveStatus.value = 'error'
    saveError.value = e?.data?.message || e?.message || 'Opslaan mislukt'
  }
}

const confirmDialog = useConfirm()
async function discardChanges() {
  const ok = await confirmDialog({
    title: 'Wijzigingen annuleren?',
    message: 'Alle niet-opgeslagen aanpassingen gaan verloren.',
    confirmLabel: 'Ja, annuleren',
    cancelLabel: 'Doorgaan',
    dangerous: true,
  })
  if (ok) window.location.reload()
}

// Warn before leaving with unsaved changes
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', (e) => {
    if (hasChanges.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  })
}

// Ensure terms_placeholders is initialized with defaults (tarieven + module_terms) and
// KEEPS them present when loadFullPartner() completes. Run as a reactive effect so we
// re-apply defaults whenever partner data (re)loads from the API.
function ensurePlaceholderDefaults() {
  if (!partner.value.terms_placeholders || typeof partner.value.terms_placeholders !== 'object') {
    partner.value.terms_placeholders = {} as any
  }
  const ph = partner.value.terms_placeholders as Record<string, any>
  if (!ph.bedrijfsnaam) ph.bedrijfsnaam = partner.value.name || ''
  if (!ph.kvk) ph.kvk = ''
  if (!ph.adres) ph.adres = ''
  if (!ph.email) ph.email = partner.value.support_email || ''
  if (!ph.telefoon) ph.telefoon = partner.value.support_phone || ''
  if (ph.uurtarief === undefined) ph.uurtarief = ''
  if (ph.voorrijkosten === undefined) ph.voorrijkosten = ''
  if (!ph.module_terms || typeof ph.module_terms !== 'object') {
    ph.module_terms = { solar: '', heat_pump: '', ev_charger: '', battery: '' }
  } else {
    for (const k of ['solar', 'heat_pump', 'ev_charger', 'battery']) {
      if (ph.module_terms[k] === undefined) ph.module_terms[k] = ''
    }
  }
}
ensurePlaceholderDefaults()
// Re-run after loadFullPartner merges in DB data — keeps module_terms present
watch(() => partner.value.terms_placeholders, () => ensurePlaceholderDefaults(), { deep: false })
watch(() => partner.value.id, () => ensurePlaceholderDefaults())

const placeholderFields = [
  { key: 'bedrijfsnaam',  label: 'Bedrijfsnaam', tag: '{{bedrijfsnaam}}' },
  { key: 'kvk',           label: 'KvK-nummer',   tag: '{{kvk}}' },
  { key: 'adres',         label: 'Adres',        tag: '{{adres}}' },
  { key: 'email',         label: 'E-mail',       tag: '{{email}}' },
  { key: 'telefoon',      label: 'Telefoon',     tag: '{{telefoon}}' },
  { key: 'uurtarief',     label: 'Uurtarief',    tag: '{{uurtarief}}' },
  { key: 'voorrijkosten', label: 'Voorrijkosten',tag: '{{voorrijkosten}}' },
]

// --- Product-specific terms: tab switcher ---
const moduleTermTabs = [
  { key: 'solar',      label: 'Zonnepanelen', icon: 'solar',      appendix: 'A' },
  { key: 'heat_pump',  label: 'Warmtepomp',   icon: 'heat-pump',  appendix: 'B' },
  { key: 'ev_charger', label: 'Laadpaal',     icon: 'ev-charger', appendix: 'C' },
  { key: 'battery',    label: 'Batterij',     icon: 'battery',    appendix: 'D' },
]
const activeModuleTab = ref<'solar' | 'heat_pump' | 'ev_charger' | 'battery'>('solar')

function moduleTermsHasContent(key: string) {
  return !!(partner.value.terms_placeholders?.module_terms?.[key] || '').trim()
}

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
  <div :class="hasChanges || saveStatus !== 'idle' ? 'pb-20' : ''">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Instellingen</h1>
      <p class="mt-1 text-sm text-gray-500">Beheer je partneromgeving, branding en koppelingen.</p>
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <!-- Left column: Partnerinformatie, Branding, Logo, Servicevoorwaarden -->
      <div class="space-y-6">
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
                  <div class="h-9 w-9 rounded-lg shadow-sm cursor-pointer" :style="{ backgroundColor: partner.primary_color }" />
                  <input type="color" :value="partner.primary_color" class="absolute inset-0 h-full w-full cursor-pointer opacity-0" @input="partner.primary_color = ($event.target as HTMLInputElement).value" />
                </div>
                <input type="text" v-model="partner.primary_color" class="input font-mono text-sm !py-1.5" placeholder="#000000" maxlength="7" />
              </div>
            </div>
            <div class="rounded-xl border border-gray-200 p-3">
              <p class="text-xs font-medium text-gray-500 mb-2">Achtergrond</p>
              <div class="flex items-center gap-2">
                <div class="relative shrink-0">
                  <div class="h-9 w-9 rounded-lg border border-gray-200 shadow-sm cursor-pointer" :style="{ backgroundColor: partner.secondary_color }" />
                  <input type="color" :value="partner.secondary_color" class="absolute inset-0 h-full w-full cursor-pointer opacity-0" @input="partner.secondary_color = ($event.target as HTMLInputElement).value" />
                </div>
                <input type="text" v-model="partner.secondary_color" class="input font-mono text-sm !py-1.5" placeholder="#ffffff" maxlength="7" />
              </div>
            </div>
          </div>
        </div>

        <!-- Logo upload -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="home" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Logo</h2>
          </div>

          <div class="flex items-start gap-5">
            <button
              class="group relative flex h-16 w-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:bg-gray-100 shrink-0"
              @click="triggerLogoUpload"
            >
              <img
                v-if="partner.logo_url"
                :src="partner.logo_url"
                :alt="partner.name"
                class="h-12 w-auto max-w-[7rem] object-contain"
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
            <div class="min-w-0 flex-1">
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

          <!-- Tips als discrete disclosure — alleen zichtbaar als de partner
               'em opent. Voorkomt dat het hele Logo-blok dichtgeplamuurd
               wordt met advies dat de meeste partners maar één keer nodig
               hebben. -->
          <details class="mt-3 group">
            <summary class="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 select-none list-none">
              <AppIcon name="help-circle" :size="12" />
              <span class="underline-offset-2 group-hover:underline">Tips voor het beste resultaat</span>
              <AppIcon name="chevron-down" :size="11" class="transition-transform group-open:rotate-180" />
            </summary>
            <ul class="mt-2 ml-5 space-y-1 text-xs text-gray-500 max-w-xl">
              <li>
                <strong class="text-gray-700">Snij witruimte rondom weg.</strong>
                Het logo wordt op ~56 px hoog getoond — extra padding in de afbeelding maakt 'em onnodig klein.
              </li>
              <li>
                <strong class="text-gray-700">Transparante PNG of SVG.</strong>
                Een witte achtergrond geeft een rechthoek in gekleurde headers.
              </li>
              <li>
                <strong class="text-gray-700">Lang en smal werkt het best.</strong>
                Streefverhouding ~3:1 of 4:1 (bv. 600&times;180 px).
              </li>
              <li>
                <strong class="text-gray-700">Minimaal 280 px breed.</strong>
                Scherp op Retina-/4K-schermen.
              </li>
            </ul>
          </details>
        </div>

        <!-- Tarieven -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="euro" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Tarieven</h2>
          </div>
          <p class="mb-4 text-xs text-gray-500">
            Deze tarieven verschijnen als
            <code class="rounded bg-gray-100 px-1 font-mono text-[11px]" v-pre>{{uurtarief}}</code>
            en
            <code class="rounded bg-gray-100 px-1 font-mono text-[11px]" v-pre>{{voorrijkosten}}</code>
            in je voorwaarden en offertes.
          </p>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="label">Uurtarief <span class="text-gray-400 font-normal">(€ excl. btw)</span></label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                <input
                  type="text"
                  inputmode="decimal"
                  v-model="partner.terms_placeholders.uurtarief"
                  placeholder="95,00"
                  class="input pl-7"
                />
              </div>
            </div>
            <div>
              <label class="label">Voorrijkosten <span class="text-gray-400 font-normal">(€ excl. btw)</span></label>
              <div class="relative">
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                <input
                  type="text"
                  inputmode="decimal"
                  v-model="partner.terms_placeholders.voorrijkosten"
                  placeholder="25,00"
                  class="input pl-7"
                />
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
            <h3 class="text-sm font-semibold text-gray-800 mb-1">Bedrijfsgegevens</h3>
            <p class="text-xs text-gray-500 mb-3">
              Deze waarden worden automatisch ingevuld in je voorwaarden. E-mail en telefoon worden samen met je
              <em>support-gegevens</em> opgeslagen, zodat klanten overal hetzelfde nummer zien.
            </p>
            <div class="grid grid-cols-2 gap-3">
              <div v-for="field in placeholderFields.slice(0, 5)" :key="field.key">
                <label class="label">{{ field.label }}</label>
                <input
                  v-if="field.key === 'email'"
                  type="email"
                  v-model="partner.support_email"
                  class="input"
                />
                <input
                  v-else-if="field.key === 'telefoon'"
                  type="tel"
                  v-model="partner.support_phone"
                  class="input"
                />
                <input
                  v-else
                  type="text"
                  v-model="partner.terms_placeholders[field.key]"
                  class="input"
                />
              </div>
            </div>
          </div>

          <!-- Terms text editor -->
          <div class="mb-4">
            <h3 class="text-sm font-semibold text-gray-800 mb-1">Algemene voorwaarden</h3>
            <p class="text-xs text-gray-500 mb-2">
              Gebruik placeholders in je tekst. Verwijs naar product-specifieke bijlagen met bv.
              <span class="rounded bg-gray-100 px-1 font-mono text-[11px]">Bijlage A: Zonnepanelen</span>.
            </p>
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
              placeholder="Voer hier je algemene servicevoorwaarden in..."
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

        <!-- Aanvullende voorwaarden per product -->
        <div class="section">
          <div class="mb-4 flex items-center gap-3">
            <AppIcon name="document" :size="18" class="text-gray-400" />
            <h2 class="text-base font-semibold text-gray-900">Aanvullende voorwaarden per product</h2>
          </div>
          <p class="mb-4 text-xs text-gray-500">
            Deze teksten verschijnen als <strong>bijlagen</strong> onder je algemene voorwaarden. Lege bijlagen worden verborgen.
          </p>

          <!-- Tab switcher -->
          <div class="mb-3 flex gap-1 rounded-xl bg-gray-100 p-1 overflow-x-auto">
            <button
              v-for="tab in moduleTermTabs"
              :key="tab.key"
              type="button"
              class="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
              :class="activeModuleTab === tab.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              @click="activeModuleTab = tab.key as any"
            >
              <AppIcon :name="tab.icon" :size="14" />
              Bijlage {{ tab.appendix }}: {{ tab.label }}
              <span
                v-if="moduleTermsHasContent(tab.key)"
                class="h-1.5 w-1.5 rounded-full bg-green-500"
                title="Bevat tekst"
              />
            </button>
          </div>

          <textarea
            v-if="partner.terms_placeholders?.module_terms"
            v-model="partner.terms_placeholders.module_terms[activeModuleTab]"
            class="input font-mono"
            style="min-height: 260px; resize: vertical;"
            :placeholder="`Aanvullende voorwaarden voor ${moduleTermTabs.find(t => t.key === activeModuleTab)?.label}. Verwijs gerust naar {{uurtarief}} en {{voorrijkosten}} — die worden automatisch ingevuld.`"
          />

          <p class="mt-2 text-[11px] text-gray-400">
            Tip: verwijs in je algemene voorwaarden naar de juiste bijlage, bv. <em>"Voor specifieke voorwaarden rond zonnepanelen, zie Bijlage A hieronder."</em>
          </p>
        </div>
      </div>

      <!-- Right column: Module prijzen, Monitoring integraties, Administratie & facturatie, Wachtwoord -->
      <div class="space-y-6">
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
                  @click="config.is_enabled = !config.is_enabled"
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
                      @change="config.price_monthly = Math.round(parseFloat(($event.target as HTMLInputElement).value.replace(',','.')) * 100)"
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
                      @change="config.price_yearly = Math.round(parseFloat(($event.target as HTMLInputElement).value.replace(',','.')) * 100)"
                    />
                  </div>
                </div>
                <div>
                  <label class="text-[10px] text-gray-400 uppercase">Min. maanden</label>
                  <input
                    v-model.number="config.min_contract_months"
                    type="number"
                    class="input !py-1 text-sm"
                  />
                </div>
              </div>
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
      </div>
    </div>

    <!-- Sticky save bar -->
    <Transition name="slide-up">
      <div
        v-if="hasChanges || saveStatus !== 'idle'"
        class="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg"
      >
        <div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div class="flex items-center gap-3">
            <template v-if="saveStatus === 'saving'">
              <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
              <span class="text-sm text-gray-600">Bezig met opslaan...</span>
            </template>
            <template v-else-if="saveStatus === 'saved'">
              <AppIcon name="check-circle" :size="18" class="text-green-500" />
              <span class="text-sm text-green-600 font-medium">Opgeslagen</span>
            </template>
            <template v-else-if="saveStatus === 'error'">
              <AppIcon name="warning" :size="18" class="text-red-500" />
              <span class="text-sm text-red-500">{{ saveError }}</span>
            </template>
            <template v-else>
              <div class="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span class="text-sm text-gray-700">
                Je hebt onopgeslagen wijzigingen
              </span>
            </template>
          </div>
          <div class="flex items-center gap-2">
            <button
              v-if="hasChanges && saveStatus === 'idle'"
              class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
              @click="discardChanges"
            >
              Annuleren
            </button>
            <button
              v-if="hasChanges"
              class="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              :disabled="saveStatus === 'saving'"
              @click="saveAll"
            >
              <AppIcon name="check" :size="16" />
              Wijzigingen opslaan
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Integration Config Modal -->
    <IntegrationConfigModal
      :open="configModalOpen"
      :integration="selectedIntegration"
      @close="configModalOpen = false"
      @saved="handleSaved"
    />
  </div>
</template>

<style scoped>
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Verberg native disclosure-driehoekje zodat onze eigen chevron leidend is. */
summary::-webkit-details-marker { display: none; }
summary { list-style: none; }
</style>
