<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'onboarded': [result: any]
}>()

const { partner } = usePartner()
const { isConnected } = useIntegrations()
const { createCustomer } = useCustomers()

const grippConnected = computed(() => isConnected(partner.value.id, 'gripp'))
const submitError = ref('')

const inputMode = ref<'manual' | 'import'>('manual')
const form = ref({
  erp_project_id: '',
  full_name: '',
  email: '',
  phone: '',
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
})

const selectedModules = ref<Set<string>>(new Set())

const availableModules = [
  { type: 'solar', label: 'Zonnepanelen', desc: 'Monitoring via Sundata', icon: 'solar' },
  { type: 'heat_pump', label: 'Warmtepomp', desc: 'Monitoring via Weheat', icon: 'heat-pump' },
  { type: 'ev_charger', label: 'Laadpaal', desc: 'Monitoring via Easee', icon: 'ev-charger' },
]

// --- Speciale voorwaarden (default dicht) ---
const showAdvanced = ref(false)
const billingInterval = ref<'monthly' | 'yearly'>('monthly')
const yearlyDiscountMonths = ref<number | null>(null)
const trialMonths = ref<number | null>(null)
// Per-module override: keyed op het UI-type ('solar', 'heat_pump', ...) — bij
// submit map ik naar het DB-type ('solar_panel', etc.) in customers.post.ts.
const overridePrice = ref<Record<string, number | null>>({})
const overrideReason = ref<Record<string, string>>({})

function priceEur(cents: number | null | undefined): string {
  if (!cents) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}
function parseEurInput(v: string): number | null {
  if (!v || !v.trim()) return null
  const cleaned = v.replace(/€/g, '').replace(/\s+/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

function toggleModule(type: string) {
  if (selectedModules.value.has(type)) {
    selectedModules.value.delete(type)
  } else {
    selectedModules.value.add(type)
  }
}

const submitting = ref(false)
const result = ref<any>(null)
const importLoading = ref(false)
const importError = ref('')

function close() {
  emit('update:modelValue', false)
  setTimeout(() => { resetForm() }, 300)
}

// Backdrop close that survives text-selection drags
const { onMouseDown: onBackdropDown, onClick: onBackdropClick } = useBackdropClose(close)

function resetForm() {
  form.value = { erp_project_id: '', full_name: '', email: '', phone: '', street: '', house_number: '', postal_code: '', city: '' }
  selectedModules.value = new Set()
  result.value = null
  submitting.value = false
  importLoading.value = false
  importError.value = ''
  inputMode.value = 'manual'
  showAdvanced.value = false
  billingInterval.value = 'monthly'
  yearlyDiscountMonths.value = null
  trialMonths.value = null
  overridePrice.value = {}
  overrideReason.value = {}
}

async function importFromErp() {
  if (!form.value.erp_project_id) {
    importError.value = 'Vul eerst een projectnummer in'
    return
  }
  if (!grippConnected.value) {
    importError.value = 'Gripp is niet gekoppeld. Ga naar Instellingen → Gripp.com om de koppeling in te stellen.'
    return
  }
  importLoading.value = true
  importError.value = ''
  await new Promise(resolve => setTimeout(resolve, 1000))
  importError.value = 'Gripp koppeling is actief maar automatisch importeren is nog in ontwikkeling. Vul de gegevens handmatig in.'
  importLoading.value = false
}

async function handleSubmit() {
  if (!form.value.full_name || !form.value.email) return

  submitting.value = true
  submitError.value = ''

  try {
    // Bouw module-overrides — alleen voor modules die geselecteerd zijn én
    // een prijs hebben gekregen
    const overrides = [...selectedModules.value]
      .map((m) => {
        const cents = overridePrice.value[m]
        if (!cents) return null
        return {
          module_type: m,
          price_monthly_cents: cents,
          reason: overrideReason.value[m] || undefined,
        }
      })
      .filter(Boolean) as { module_type: string; price_monthly_cents: number; reason?: string }[]

    const customer = await createCustomer({
      email: form.value.email,
      full_name: form.value.full_name,
      phone: form.value.phone || undefined,
      street: form.value.street || undefined,
      house_number: form.value.house_number || undefined,
      postal_code: form.value.postal_code || undefined,
      city: form.value.city || undefined,
      modules: [...selectedModules.value],
      billing_interval: billingInterval.value,
      yearly_discount_months: yearlyDiscountMonths.value || 0,
      trial_months: trialMonths.value || 0,
      module_price_overrides: overrides,
    })

    result.value = {
      customer,
      selectedModules: [...selectedModules.value],
      isExisting: false,
      alreadyHasModule: false,
    }
    emit('onboarded', result.value)
  } catch (e: any) {
    submitError.value = e?.data?.message || e?.message || 'Aanmaken mislukt. Probeer het opnieuw.'
  } finally {
    submitting.value = false
  }
}
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
          <div class="border-b border-gray-100 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Klant uitnodigen</h3>
              <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" @click="close">
                <AppIcon name="x" :size="18" />
              </button>
            </div>
          </div>

          <!-- Success state -->
          <div v-if="result" class="px-6 py-8 space-y-5">
            <div class="text-center">
              <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
                <AppIcon name="check-circle" :size="28" class="text-green-500" />
              </div>
              <p class="mt-3 text-base font-semibold text-gray-900">{{ result.customer.full_name }} is uitgenodigd!</p>
              <p class="mt-1 text-sm text-gray-500">Welkomstmail verstuurd naar {{ result.customer.email }}</p>
            </div>

            <!-- Next steps per module -->
            <div v-if="result.selectedModules?.length" class="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p class="text-xs font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
                <AppIcon name="info" :size="14" />
                Volgende stap: modules koppelen
              </p>
              <div class="space-y-2">
                <div
                  v-for="modType in result.selectedModules"
                  :key="modType"
                  class="flex items-center gap-3 rounded-lg bg-white p-2.5"
                >
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-lg"
                    :class="[getModuleTheme(modType).bg, getModuleTheme(modType).text]"
                  >
                    <AppIcon :name="getModuleTheme(modType).icon" :size="16" />
                  </div>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900">{{ getModuleTheme(modType).label }}</p>
                    <p class="text-xs text-gray-500">Nog te koppelen via het klantdossier</p>
                  </div>
                  <span class="badge badge--yellow">Te koppelen</span>
                </div>
              </div>
              <p class="mt-3 text-xs text-amber-700">
                Ga naar het klantdossier om de monitoring per module te koppelen.
              </p>
            </div>

            <div class="flex justify-center gap-3">
              <button class="btn-secondary" @click="close">Sluiten</button>
              <NuxtLink
                v-if="result.customer?.id"
                :to="`/admin/customers/${result.customer.id}`"
                class="btn-primary inline-flex items-center gap-2"
                @click="close"
              >
                <AppIcon name="folder" :size="14" />
                Naar dossier
              </NuxtLink>
            </div>
          </div>

          <!-- Form -->
          <template v-else>
            <div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

              <!-- Input mode selector -->
              <div class="flex gap-1 rounded-lg bg-gray-100 p-1">
                <button
                  type="button"
                  class="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors"
                  :class="inputMode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                  @click="inputMode = 'manual'; importError = ''"
                >
                  <AppIcon name="user" :size="14" />
                  Handmatig invoeren
                </button>
                <button
                  type="button"
                  class="flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors"
                  :class="inputMode === 'import' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
                  @click="inputMode = 'import'; importError = ''"
                >
                  <AppIcon name="refresh" :size="14" />
                  Importeren uit CRM
                </button>
              </div>

              <!-- Import section -->
              <div v-if="inputMode === 'import'" class="rounded-xl border border-gray-200 p-4">
                <div class="flex items-center gap-3 mb-3">
                  <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <AppIcon name="users" :size="16" />
                  </div>
                  <div>
                    <p class="text-sm font-medium text-gray-900">Gripp.com</p>
                    <p class="text-xs" :class="grippConnected ? 'text-green-600' : 'text-gray-400'">
                      {{ grippConnected ? 'Verbonden' : 'Niet gekoppeld' }}
                    </p>
                  </div>
                </div>

                <div class="flex gap-2">
                  <input
                    v-model="form.erp_project_id"
                    type="text"
                    class="input flex-1"
                    placeholder="Projectnummer (bijv. GRP-2024-0847)"
                  />
                  <button
                    type="button"
                    class="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 shrink-0"
                    :disabled="!form.erp_project_id || importLoading"
                    @click="importFromErp"
                  >
                    <span v-if="importLoading" class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <AppIcon v-else name="download" :size="14" />
                    {{ importLoading ? 'Ophalen...' : 'Importeer' }}
                  </button>
                </div>

                <p v-if="importError" class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {{ importError }}
                </p>
              </div>

              <!-- Klantgegevens -->
              <div class="space-y-4">
                <div class="flex items-center gap-2 text-xs text-gray-400">
                  <div class="flex-1 border-t border-gray-200" />
                  <span>Klantgegevens</span>
                  <div class="flex-1 border-t border-gray-200" />
                </div>

                <div v-if="inputMode === 'manual'">
                  <label class="label">Referentienummer <span class="text-gray-400 font-normal">(optioneel)</span></label>
                  <input v-model="form.erp_project_id" type="text" class="input" placeholder="Intern projectnummer of referentie" />
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Naam <span class="text-red-400">*</span></label>
                    <input v-model="form.full_name" type="text" class="input" placeholder="Volledige naam" required />
                  </div>
                  <div>
                    <label class="label">E-mailadres <span class="text-red-400">*</span></label>
                    <input v-model="form.email" type="email" class="input" placeholder="klant@voorbeeld.nl" required />
                  </div>
                </div>

                <div>
                  <label class="label">Telefoon</label>
                  <input v-model="form.phone" type="tel" class="input" placeholder="06-12345678" />
                </div>

                <div class="grid grid-cols-3 gap-3">
                  <div class="col-span-2">
                    <label class="label">Straat</label>
                    <input v-model="form.street" type="text" class="input" placeholder="Straatnaam" />
                  </div>
                  <div>
                    <label class="label">Huisnummer</label>
                    <input v-model="form.house_number" type="text" class="input" placeholder="Nr." />
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Postcode</label>
                    <input v-model="form.postal_code" type="text" class="input" placeholder="1234 AB" />
                  </div>
                  <div>
                    <label class="label">Woonplaats</label>
                    <input v-model="form.city" type="text" class="input" placeholder="Stad" />
                  </div>
                </div>
              </div>

              <!-- Module selectie -->
              <div>
                <div class="flex items-center gap-2 text-xs text-gray-400 mb-3">
                  <div class="flex-1 border-t border-gray-200" />
                  <span>Modules <span class="text-red-500">*</span></span>
                  <div class="flex-1 border-t border-gray-200" />
                </div>
                <p class="text-xs text-gray-500 mb-3">
                  Selecteer welke modules bij deze klant geïnstalleerd zijn — <strong>ten minste één is verplicht</strong>.
                  Zonder module kan de klant niks activeren in het portaal. Monitoring koppel je later in het klantdossier.
                </p>

                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    v-for="mod in availableModules"
                    :key="mod.type"
                    type="button"
                    class="flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all text-center"
                    :class="selectedModules.has(mod.type)
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
                    @click="toggleModule(mod.type)"
                  >
                    <div
                      class="flex h-10 w-10 items-center justify-center rounded-lg"
                      :class="selectedModules.has(mod.type)
                        ? [getModuleTheme(mod.type).bg, getModuleTheme(mod.type).text]
                        : 'bg-gray-100 text-gray-400'"
                    >
                      <AppIcon :name="mod.icon" :size="20" />
                    </div>
                    <div>
                      <p class="text-xs font-medium" :class="selectedModules.has(mod.type) ? 'text-gray-900' : 'text-gray-600'">
                        {{ mod.label }}
                      </p>
                      <p class="text-[10px] text-gray-400 mt-0.5">{{ mod.desc }}</p>
                    </div>
                    <div v-if="selectedModules.has(mod.type)" class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900">
                      <AppIcon name="check" :size="12" class="text-white" />
                    </div>
                  </button>
                </div>
              </div>

              <!-- Speciale voorwaarden — default dicht, expand voor afwijkende prijs / proefperiode / termijn -->
              <div class="mt-5 rounded-xl border border-gray-200 bg-gray-50/60">
                <button
                  type="button"
                  class="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                  @click="showAdvanced = !showAdvanced"
                >
                  <div class="flex items-center gap-2">
                    <AppIcon name="settings" :size="14" class="text-gray-500" />
                    <span class="text-sm font-medium text-gray-900">Speciale voorwaarden</span>
                    <span class="text-xs text-gray-400">(optioneel)</span>
                  </div>
                  <AppIcon :name="showAdvanced ? 'chevron-up' : 'chevron-down'" :size="14" class="text-gray-400" />
                </button>

                <div v-if="showAdvanced" class="border-t border-gray-200 px-4 py-4 space-y-4 bg-white rounded-b-xl">
                  <!-- Termijn -->
                  <div>
                    <label class="label">Standaard termijn</label>
                    <div class="mt-1 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors"
                        :class="billingInterval === 'monthly' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                        @click="billingInterval = 'monthly'"
                      >Per maand</button>
                      <button
                        type="button"
                        class="rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors"
                        :class="billingInterval === 'yearly' ? 'border-gray-900 bg-gray-50 text-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'"
                        @click="billingInterval = 'yearly'"
                      >Per jaar</button>
                    </div>
                    <p class="mt-1 text-[11px] text-gray-500">Klant kan dit zelf nog wisselen op de akkoordpagina.</p>
                  </div>

                  <!-- Jaarkorting -->
                  <div>
                    <label class="label">Korting bij jaarbetaling (maanden gratis)</label>
                    <input
                      v-model.number="yearlyDiscountMonths"
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      class="input"
                      placeholder="bv. 1"
                    />
                    <p class="mt-1 text-[11px] text-gray-500">Bv. 1 = 1 maand gratis bij jaarbetaling. 0 = geen korting.</p>
                  </div>

                  <!-- Proefperiode -->
                  <div>
                    <label class="label">Proefperiode (maanden gratis na incasso-activatie)</label>
                    <input
                      v-model.number="trialMonths"
                      type="number"
                      min="0"
                      max="60"
                      step="1"
                      class="input"
                      placeholder="bv. 3"
                    />
                    <p class="mt-1 text-[11px] text-gray-500">Klant ziet "Eerste 3 maanden gratis". Telt vanaf het moment dat de IBAN is afgegeven.</p>
                  </div>

                  <!-- Per-module afwijkend tarief -->
                  <div v-if="selectedModules.size > 0">
                    <label class="label">Afwijkend tarief per module (optioneel)</label>
                    <p class="mt-1 mb-2 text-[11px] text-gray-500">Laat leeg om de standaardprijs van {{ partner.name }} aan te houden.</p>
                    <div class="space-y-2">
                      <div
                        v-for="mod in availableModules.filter(m => selectedModules.has(m.type))"
                        :key="mod.type"
                        class="grid grid-cols-[1fr_auto_2fr] gap-2 items-center"
                      >
                        <span class="text-sm text-gray-700">{{ mod.label }}</span>
                        <div class="relative">
                          <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">€</span>
                          <input
                            :value="overridePrice[mod.type] !== null && overridePrice[mod.type] !== undefined ? priceEur(overridePrice[mod.type]) : ''"
                            type="text"
                            class="input pl-6 w-24 text-sm tabular-nums"
                            placeholder="—"
                            @input="(e) => overridePrice[mod.type] = parseEurInput((e.target as HTMLInputElement).value)"
                          />
                        </div>
                        <input
                          v-model="overrideReason[mod.type]"
                          type="text"
                          class="input text-sm"
                          placeholder="Reden (intern, optioneel)"
                          maxlength="200"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Error -->
            <div v-if="submitError" class="px-6">
              <p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ submitError }}</p>
            </div>

            <!-- Actions -->
            <div class="border-t border-gray-100 px-6 py-4 flex items-center justify-between">
              <p class="text-xs text-gray-400">
                {{ selectedModules.size }} module{{ selectedModules.size !== 1 ? 's' : '' }} geselecteerd
              </p>
              <div class="flex gap-3">
                <button class="btn-secondary" @click="close">Annuleren</button>
                <button
                  class="btn-primary"
                  :disabled="!form.full_name || !form.email || selectedModules.size === 0 || submitting"
                  :class="{ 'opacity-50 cursor-not-allowed': !form.full_name || !form.email || selectedModules.size === 0 || submitting }"
                  :title="selectedModules.size === 0 ? 'Kies eerst minstens één module' : ''"
                  @click="handleSubmit"
                >
                  <AppIcon v-if="!submitting" name="plus" :size="16" />
                  <span v-if="submitting" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {{ submitting ? 'Bezig...' : 'Verstuur uitnodiging' }}
                </button>
              </div>
            </div>
          </template>
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
