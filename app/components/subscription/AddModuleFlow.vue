<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'
import { getModuleBenefits } from '~/utils/module-benefits'

const props = defineProps<{
  modelValue: boolean
  preSelectedModule?: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  added: [moduleType: string]
}>()

const { partner } = usePartner()
const { partnerModuleConfigs, serviceTiers, addSubscription, subscriptions, getActiveModuleTypes } = useMockData()

// --- State ---
const step = ref<1 | 2 | 3>(1)
const selectedModuleType = ref<string | null>(props.preSelectedModule ?? null)
const termsAccepted = ref(false)

// --- Computed ---

// Active module types the customer already has
const existingModuleTypes = computed(() => getActiveModuleTypes())

// Available modules to add (enabled, not already subscribed)
const availableModules = computed(() =>
  partnerModuleConfigs.filter(c => {
    const type = c.module_definition?.type
    return type && !existingModuleTypes.value.includes(type) && c.is_enabled
  })
)

// The selected config object
const selectedConfig = computed(() => {
  if (!selectedModuleType.value) return null
  return availableModules.value.find(
    c => c.module_definition?.type === selectedModuleType.value
  ) ?? null
})

// Theme and benefits for selected module
const selectedTheme = computed(() =>
  selectedModuleType.value ? getModuleTheme(selectedModuleType.value) : null
)

const selectedBenefits = computed(() =>
  selectedModuleType.value ? getModuleBenefits(selectedModuleType.value) : null
)

const selectedModuleName = computed(() =>
  selectedConfig.value?.module_definition?.name ?? ''
)

const contractMonths = computed(() =>
  (selectedConfig.value as any)?.min_contract_months ?? 12
)

// Slim service tier
const slimTier = computed(() =>
  serviceTiers.find(t => t.slug === 'slim') ?? null
)

// Key features from Slim tier (first 3 included features)
const slimFeatures = computed(() =>
  slimTier.value?.features.filter(f => f.included).slice(0, 3) ?? []
)

// Auto-advance: if only 1 module available or preSelectedModule, skip selection
const skipSelection = computed(() =>
  availableModules.value.length <= 1 || !!props.preSelectedModule
)

// --- Watchers ---

watch(() => props.modelValue, (open) => {
  if (open) {
    // Reset state when opening
    step.value = 1
    termsAccepted.value = false
    selectedModuleType.value = props.preSelectedModule ?? null

    // Auto-select if only 1 available and no preselect
    if (!selectedModuleType.value && availableModules.value.length === 1) {
      selectedModuleType.value = availableModules.value[0].module_definition?.type ?? null
    }
  }
})

watch(() => props.preSelectedModule, (val) => {
  if (val) selectedModuleType.value = val
})

// --- Methods ---

function close() {
  emit('update:modelValue', false)
  // Reset after animation completes
  setTimeout(() => {
    step.value = 1
    termsAccepted.value = false
    selectedModuleType.value = null
  }, 300)
}

function selectModule(type: string) {
  selectedModuleType.value = type
}

function goToConfirmation() {
  if (!selectedConfig.value) return
  step.value = 2
}

function goBackToBenefits() {
  termsAccepted.value = false
  step.value = 1
}

function confirmAndActivate() {
  if (!selectedConfig.value || !termsAccepted.value) return
  // Call addSubscription with inst-1 and the selected config ID
  addSubscription('inst-1', selectedConfig.value.id)
  step.value = 3
  emit('added', selectedModuleType.value!)
}

function goToDetail() {
  if (selectedBenefits.value?.detailUrl) {
    navigateTo(selectedBenefits.value.detailUrl)
  }
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="addflow">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 overflow-y-auto bg-white"
      >
        <!-- Close button (always visible) -->
        <button
          class="fixed right-4 top-4 z-10 rounded-full bg-gray-100 p-2 text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-700"
          @click="close"
        >
          <AppIcon name="x" :size="20" />
        </button>

        <!-- Content wrapper -->
        <div class="flex min-h-screen items-start justify-center px-4 py-12 sm:py-16">
          <div class="w-full max-w-md">

            <!-- ===== STEP 1: Voordelen (Benefits) ===== -->
            <Transition name="step" mode="out-in">
              <div v-if="step === 1" key="step1">

                <!-- No modules available -->
                <div v-if="availableModules.length === 0" class="py-12 text-center">
                  <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <AppIcon name="check-circle" :size="32" class="text-green-600" />
                  </div>
                  <h2 class="text-xl font-bold text-gray-900">Je hebt alle modules!</h2>
                  <p class="mt-2 text-sm text-gray-500">
                    Er zijn geen extra modules beschikbaar om toe te voegen.
                  </p>
                  <button class="btn-secondary mt-6" @click="close">
                    Sluiten
                  </button>
                </div>

                <!-- Module selection (when multiple available and no preselect) -->
                <div v-else-if="!skipSelection && !selectedModuleType">
                  <h2 class="text-xl font-bold text-gray-900">Module toevoegen</h2>
                  <p class="mt-2 text-sm text-gray-500">
                    Kies welke module je wilt toevoegen aan je account.
                  </p>

                  <div class="mt-6 space-y-3">
                    <button
                      v-for="config in availableModules"
                      :key="config.id"
                      class="flex w-full items-center gap-4 rounded-2xl border-2 border-gray-200 p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
                      @click="selectModule(config.module_definition?.type ?? '')"
                    >
                      <div
                        class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                        :class="[getModuleTheme(config.module_definition?.type ?? 'solar').bg, getModuleTheme(config.module_definition?.type ?? 'solar').text]"
                      >
                        <AppIcon :name="getModuleTheme(config.module_definition?.type ?? 'solar').icon" :size="24" />
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="font-semibold text-gray-900">{{ config.module_definition?.name }}</p>
                        <p class="mt-0.5 text-sm text-gray-500">{{ getModuleBenefits(config.module_definition?.type ?? '').pitch }}</p>
                      </div>
                      <AppIcon name="chevron-right" :size="18" class="shrink-0 text-gray-400" />
                    </button>
                  </div>
                </div>

                <!-- Benefits view (single module or selected) -->
                <div v-else-if="selectedConfig && selectedTheme && selectedBenefits">
                  <!-- Back to selection (only if multiple modules) -->
                  <button
                    v-if="!skipSelection"
                    class="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                    @click="selectedModuleType = null"
                  >
                    <AppIcon name="arrow-left" :size="16" />
                    Andere module kiezen
                  </button>

                  <!-- Module icon + heading -->
                  <div class="flex flex-col items-center text-center">
                    <div
                      class="flex h-16 w-16 items-center justify-center rounded-2xl"
                      :style="{ backgroundColor: selectedTheme.accent + '15', color: selectedTheme.accent }"
                    >
                      <AppIcon :name="selectedTheme.icon" :size="32" />
                    </div>
                    <h2 class="mt-4 text-xl font-bold text-gray-900">{{ selectedModuleName }}</h2>
                    <p class="mt-2 text-sm leading-relaxed text-gray-500">{{ selectedBenefits.pitch }}</p>
                  </div>

                  <!-- Benefits list -->
                  <div class="mt-8 space-y-3">
                    <div
                      v-for="(benefit, i) in selectedBenefits.benefits"
                      :key="i"
                      class="flex items-start gap-3"
                    >
                      <div class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100">
                        <AppIcon name="check" :size="14" class="text-green-600" />
                      </div>
                      <p class="text-sm leading-relaxed text-gray-700">{{ benefit.text }}</p>
                    </div>
                  </div>

                  <!-- Service tier section -->
                  <div v-if="slimTier" class="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div class="flex items-center gap-2">
                      <AppIcon name="shield" :size="18" class="text-gray-700" />
                      <p class="text-sm font-semibold text-gray-900">Inclusief servicepakket {{ slimTier.name }}</p>
                    </div>
                    <ul class="mt-3 space-y-2">
                      <li
                        v-for="(feature, i) in slimFeatures"
                        :key="i"
                        class="flex items-center gap-2 text-sm text-gray-600"
                      >
                        <AppIcon name="check" :size="14" class="shrink-0 text-green-500" />
                        <span>{{ feature.label }}<template v-if="feature.detail"> ({{ feature.detail }})</template></span>
                      </li>
                    </ul>
                  </div>

                  <!-- Price -->
                  <div class="mt-8 text-center">
                    <p class="text-3xl font-bold text-gray-900">
                      {{ formatCurrency(selectedConfig.price_monthly) }}
                      <span class="text-base font-normal text-gray-500">per maand</span>
                    </p>
                    <p class="mt-1.5 text-xs text-gray-400">
                      Minimaal {{ contractMonths }} maanden, daarna maandelijks opzegbaar
                    </p>
                  </div>

                  <!-- CTA -->
                  <button
                    class="mt-8 w-full rounded-xl py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
                    :style="{ backgroundColor: partner.primary_color }"
                    @click="goToConfirmation"
                  >
                    Toevoegen aan mijn account
                  </button>
                </div>
              </div>

              <!-- ===== STEP 2: Bevestiging (Confirmation) ===== -->
              <div v-else-if="step === 2 && selectedConfig && selectedTheme" key="step2">
                <!-- Back button -->
                <button
                  class="mb-6 flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                  @click="goBackToBenefits"
                >
                  <AppIcon name="arrow-left" :size="16" />
                  Terug
                </button>

                <h2 class="text-xl font-bold text-gray-900">Bevestig je keuze</h2>
                <p class="mt-2 text-sm text-gray-500">
                  Controleer de gegevens en bevestig je nieuwe module.
                </p>

                <!-- Summary card -->
                <div class="mt-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div class="flex items-center gap-4">
                    <div
                      class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                      :style="{ backgroundColor: selectedTheme.accent + '15', color: selectedTheme.accent }"
                    >
                      <AppIcon :name="selectedTheme.icon" :size="24" />
                    </div>
                    <div>
                      <p class="font-semibold text-gray-900">{{ selectedModuleName }}</p>
                      <p class="text-sm text-gray-500">Servicecontract</p>
                    </div>
                  </div>

                  <div class="mt-4 space-y-3 border-t border-gray-100 pt-4">
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-500">Maandelijks bedrag</span>
                      <span class="font-semibold text-gray-900">{{ formatCurrency(selectedConfig.price_monthly) }}</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-500">Minimale looptijd</span>
                      <span class="font-semibold text-gray-900">{{ contractMonths }} maanden</span>
                    </div>
                    <div class="flex items-center justify-between text-sm">
                      <span class="text-gray-500">Daarna</span>
                      <span class="font-semibold text-gray-900">Maandelijks opzegbaar</span>
                    </div>
                  </div>
                </div>

                <!-- Terms checkbox -->
                <label class="mt-6 flex cursor-pointer items-start gap-3">
                  <input
                    v-model="termsAccepted"
                    type="checkbox"
                    class="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
                  />
                  <span class="text-sm leading-relaxed text-gray-600">
                    Ik ga akkoord met de
                    <a
                      :href="'/voorwaarden/' + (partner.slug || 'volt4u')"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="font-medium underline"
                      :style="{ color: partner.primary_color }"
                    >servicevoorwaarden</a>
                    en de minimale contractduur van {{ contractMonths }} maanden.
                  </span>
                </label>

                <!-- Confirm button -->
                <button
                  class="mt-8 w-full rounded-xl py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all"
                  :style="{ backgroundColor: partner.primary_color }"
                  :class="termsAccepted ? 'hover:shadow-md' : 'cursor-not-allowed opacity-50'"
                  :disabled="!termsAccepted"
                  @click="confirmAndActivate"
                >
                  Bevestig en activeer
                </button>
              </div>

              <!-- ===== STEP 3: Succes ===== -->
              <div v-else-if="step === 3 && selectedTheme" key="step3">
                <div class="flex flex-col items-center py-8 text-center">
                  <!-- Animated check -->
                  <div class="success-icon flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                    <AppIcon name="check" :size="36" class="text-green-600" />
                  </div>

                  <h2 class="mt-6 text-xl font-bold text-gray-900">Module geactiveerd!</h2>
                  <p class="mt-2 text-sm text-gray-500">
                    {{ selectedModuleName }} is toegevoegd aan je account.
                  </p>

                  <!-- Detail button -->
                  <button
                    class="mt-8 w-full rounded-xl py-3.5 text-center text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md"
                    :style="{ backgroundColor: partner.primary_color }"
                    @click="goToDetail"
                  >
                    Bekijk {{ selectedModuleName }}
                  </button>

                  <button
                    class="mt-3 w-full rounded-xl py-3 text-center text-sm font-medium text-gray-500 transition-colors hover:text-gray-700"
                    @click="close"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
            </Transition>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* Full-screen overlay transition */
.addflow-enter-active,
.addflow-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.addflow-enter-from {
  opacity: 0;
  transform: translateY(16px);
}
.addflow-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* Step transition */
.step-enter-active,
.step-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.step-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.step-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}

/* Success icon animation */
.success-icon {
  animation: successPop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}
@keyframes successPop {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
