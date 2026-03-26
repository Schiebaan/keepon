<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'onboarded': [result: any]
}>()

const form = ref({
  gripp_project_id: '',
  full_name: '',
  email: '',
  phone: '',
  street: '',
  house_number: '',
  postal_code: '',
  city: '',
  module_type: 'solar' as 'solar' | 'heat_pump' | 'ev_charger',
})

const submitting = ref(false)
const result = ref<any>(null)
const grippImported = ref(false)

function close() {
  emit('update:modelValue', false)
  // Reset after animation
  setTimeout(() => {
    resetForm()
  }, 300)
}

function resetForm() {
  form.value = {
    gripp_project_id: '',
    full_name: '',
    email: '',
    phone: '',
    street: '',
    house_number: '',
    postal_code: '',
    city: '',
    module_type: 'solar',
  }
  result.value = null
  submitting.value = false
  grippImported.value = false
}

function importFromGripp() {
  form.value = {
    gripp_project_id: 'GRP-2024-0847',
    full_name: 'Henk van der Berg',
    email: 'henk.vanderberg@gmail.com',
    phone: '06-28394756',
    street: 'Beukenallee',
    house_number: '15',
    postal_code: '3511 BZ',
    city: 'Utrecht',
    module_type: 'solar',
  }
  grippImported.value = true
}

async function handleSubmit() {
  if (!form.value.full_name || !form.value.email) return

  submitting.value = true

  // Simulate brief network delay
  await new Promise(resolve => setTimeout(resolve, 600))

  const { onboardCustomer } = useMockData()
  const res = onboardCustomer({
    partner_id: 'partner-1',
    email: form.value.email,
    full_name: form.value.full_name,
    phone: form.value.phone,
    street: form.value.street,
    house_number: form.value.house_number,
    postal_code: form.value.postal_code,
    city: form.value.city,
    module_type: form.value.module_type,
    gripp_project_id: form.value.gripp_project_id || undefined,
  })

  submitting.value = false
  result.value = res
  emit('onboarded', res)
}

const moduleLabel = computed(() => {
  const labels: Record<string, string> = {
    solar: 'Zonnepanelen',
    heat_pump: 'Warmtepomp',
    ev_charger: 'Laadpaal',
  }
  return labels[form.value.module_type] || form.value.module_type
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

        <!-- Modal -->
        <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
          <!-- Header -->
          <div class="border-b border-gray-100 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Nieuwe klant onboarden</h3>
              <button
                class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                @click="close"
              >
                <AppIcon name="x" :size="18" />
              </button>
            </div>
          </div>

          <!-- Success state -->
          <div v-if="result" class="px-6 py-8 text-center space-y-4">
            <div
              class="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
              :class="result.alreadyHasModule ? 'bg-amber-50' : 'bg-green-50'"
            >
              <AppIcon
                :name="result.alreadyHasModule ? 'warning' : 'check-circle'"
                :size="28"
                :class="result.alreadyHasModule ? 'text-amber-500' : 'text-green-500'"
              />
            </div>

            <!-- New customer -->
            <template v-if="!result.isExisting">
              <div>
                <p class="text-base font-semibold text-gray-900">Klant aangemaakt!</p>
                <p class="mt-1 text-sm text-gray-600">
                  Magic link verstuurd naar {{ result.customer.email }}
                </p>
              </div>
              <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p class="text-xs text-gray-400 mb-1">Welkomstlink (demo)</p>
                <NuxtLink
                  :to="`/welkom/${result.token}`"
                  class="text-sm font-medium break-all hover:underline"
                  :style="{ color: 'var(--brand-primary)' }"
                >
                  /welkom/{{ result.token }}
                </NuxtLink>
              </div>
            </template>

            <!-- Existing customer, module added -->
            <template v-else-if="!result.alreadyHasModule">
              <div>
                <p class="text-base font-semibold text-gray-900">
                  {{ result.customer.full_name }} had al een account.
                </p>
                <p class="mt-1 text-sm text-gray-600">
                  {{ moduleLabel }} is toegevoegd.
                </p>
              </div>
            </template>

            <!-- Already has module -->
            <template v-else>
              <div>
                <p class="text-base font-semibold text-gray-900">
                  {{ result.customer.full_name }} heeft deze module al.
                </p>
              </div>
            </template>

            <button class="btn-primary mx-auto" @click="close">
              Sluiten
            </button>
          </div>

          <!-- Form -->
          <template v-else>
            <div class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <!-- Gripp import button -->
              <button
                type="button"
                class="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
                :class="{ 'border-green-300 bg-green-50 text-green-700': grippImported }"
                @click="importFromGripp"
              >
                <AppIcon :name="grippImported ? 'check-circle' : 'refresh'" :size="16" />
                {{ grippImported ? 'Geimporteerd uit Gripp' : 'Importeer uit Gripp' }}
              </button>

              <!-- Gripp project -->
              <div>
                <label class="label">Gripp projectnummer</label>
                <input
                  v-model="form.gripp_project_id"
                  type="text"
                  class="input"
                  placeholder="Bijv. GRP-2024-0847"
                />
              </div>

              <!-- Name + Email -->
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">
                    Naam <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="form.full_name"
                    type="text"
                    class="input"
                    placeholder="Volledige naam"
                    required
                  />
                </div>
                <div>
                  <label class="label">
                    E-mailadres <span class="text-red-400">*</span>
                  </label>
                  <input
                    v-model="form.email"
                    type="email"
                    class="input"
                    placeholder="klant@voorbeeld.nl"
                    required
                  />
                </div>
              </div>

              <!-- Phone -->
              <div>
                <label class="label">Telefoon</label>
                <input
                  v-model="form.phone"
                  type="tel"
                  class="input"
                  placeholder="06-12345678"
                />
              </div>

              <!-- Address -->
              <div class="grid grid-cols-3 gap-3">
                <div class="col-span-2">
                  <label class="label">Straat</label>
                  <input
                    v-model="form.street"
                    type="text"
                    class="input"
                    placeholder="Straatnaam"
                  />
                </div>
                <div>
                  <label class="label">Huisnummer</label>
                  <input
                    v-model="form.house_number"
                    type="text"
                    class="input"
                    placeholder="Nr."
                  />
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Postcode</label>
                  <input
                    v-model="form.postal_code"
                    type="text"
                    class="input"
                    placeholder="1234 AB"
                  />
                </div>
                <div>
                  <label class="label">Woonplaats</label>
                  <input
                    v-model="form.city"
                    type="text"
                    class="input"
                    placeholder="Stad"
                  />
                </div>
              </div>

              <!-- Module type -->
              <div>
                <label class="label">Module type</label>
                <select v-model="form.module_type" class="input">
                  <option value="solar">Zonnepanelen</option>
                  <option value="heat_pump">Warmtepomp</option>
                  <option value="ev_charger">Laadpaal</option>
                </select>
              </div>
            </div>

            <!-- Actions -->
            <div class="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button class="btn-secondary" @click="close">
                Annuleren
              </button>
              <button
                class="btn-primary"
                :disabled="!form.full_name || !form.email || submitting"
                :class="{ 'opacity-50 cursor-not-allowed': !form.full_name || !form.email || submitting }"
                @click="handleSubmit"
              >
                <AppIcon v-if="!submitting" name="plus" :size="16" />
                <span v-if="submitting" class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                {{ submitting ? 'Bezig...' : 'Klant onboarden' }}
              </button>
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
