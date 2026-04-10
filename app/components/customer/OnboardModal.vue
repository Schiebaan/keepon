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

function resetForm() {
  form.value = { erp_project_id: '', full_name: '', email: '', phone: '', street: '', house_number: '', postal_code: '', city: '' }
  selectedModules.value = new Set()
  result.value = null
  submitting.value = false
  importLoading.value = false
  importError.value = ''
  inputMode.value = 'manual'
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
    const customer = await createCustomer({
      email: form.value.email,
      full_name: form.value.full_name,
      phone: form.value.phone || undefined,
      street: form.value.street || undefined,
      house_number: form.value.house_number || undefined,
      postal_code: form.value.postal_code || undefined,
      city: form.value.city || undefined,
      modules: [...selectedModules.value],
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
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
          <!-- Header -->
          <div class="border-b border-gray-100 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Nieuwe klant toevoegen</h3>
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
              <p class="mt-3 text-base font-semibold text-gray-900">{{ result.customer.full_name }} is aangemaakt!</p>
              <p class="mt-1 text-sm text-gray-500">Welkomsmail verstuurd naar {{ result.customer.email }}</p>
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
              <a
                v-if="result.customer?.id"
                :href="`/admin/customers/${result.customer.id}`"
                class="btn-primary inline-flex items-center gap-2"
              >
                <AppIcon name="folder" :size="14" />
                Naar dossier
              </a>
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
                  <span>Modules</span>
                  <div class="flex-1 border-t border-gray-200" />
                </div>
                <p class="text-xs text-gray-500 mb-3">Selecteer welke modules bij deze klant geïnstalleerd zijn. Je koppelt de monitoring later in het klantdossier.</p>

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
                  :disabled="!form.full_name || !form.email || submitting"
                  :class="{ 'opacity-50 cursor-not-allowed': !form.full_name || !form.email || submitting }"
                  @click="handleSubmit"
                >
                  <AppIcon v-if="!submitting" name="plus" :size="16" />
                  <span v-if="submitting" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  {{ submitting ? 'Bezig...' : 'Klant toevoegen' }}
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
