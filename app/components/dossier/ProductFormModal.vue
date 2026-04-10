<script setup lang="ts">
import type { ProductCategory } from '~~/shared/types/database'

const props = defineProps<{
  modelValue: boolean
  editProduct?: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: any]
}>()

const form = ref({
  category: 'solar_panel' as ProductCategory,
  brand: '',
  model: '',
  name: '',
  capacity_wp: '',
  orientation: '',
  tilt: '',
  installation_date: '',
  notes: '',
})

const categories: { value: ProductCategory; label: string }[] = [
  { value: 'solar_panel', label: 'Zonnepanelen' },
  { value: 'inverter', label: 'Omvormer' },
  { value: 'heat_pump', label: 'Warmtepomp' },
  { value: 'ev_charger', label: 'Laadpaal' },
  { value: 'battery', label: 'Batterij' },
  { value: 'other', label: 'Overig' },
]

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

const isSolar = computed(() => form.value.category === 'solar_panel')
const isEditing = computed(() => !!props.editProduct)

watch(() => props.modelValue, (open) => {
  if (open && props.editProduct) {
    form.value = {
      category: props.editProduct.category || 'solar_panel',
      brand: props.editProduct.brand || '',
      model: props.editProduct.model || '',
      name: props.editProduct.name || '',
      capacity_wp: props.editProduct.notes?.match(/(\d+)\s*Wp/)?.[1] || '',
      orientation: props.editProduct.notes?.match(/oriëntatie:\s*(\S+)/i)?.[1] || '',
      tilt: props.editProduct.notes?.match(/helling:\s*(\d+)/i)?.[1] || '',
      installation_date: props.editProduct.installation_date || '',
      notes: (props.editProduct.notes || '').replace(/\d+\s*Wp.*?(·|$)/, '').trim(),
    }
  } else if (open) {
    resetForm()
  }
})

function close() {
  emit('update:modelValue', false)
  setTimeout(resetForm, 300)
}

function resetForm() {
  form.value = { category: 'solar_panel', brand: '', model: '', name: '', capacity_wp: '', orientation: '', tilt: '', installation_date: '', notes: '' }
}

function handleSubmit() {
  if (!form.value.brand) return

  const productName = form.value.name || `${form.value.brand} ${form.value.model}`.trim()

  let notes = form.value.notes || ''
  if (isSolar.value) {
    const solarMeta = []
    if (form.value.capacity_wp) solarMeta.push(`${form.value.capacity_wp} Wp`)
    if (form.value.orientation) solarMeta.push(`oriëntatie: ${form.value.orientation}`)
    if (form.value.tilt) solarMeta.push(`helling: ${form.value.tilt}°`)
    notes = solarMeta.join(', ') + (notes ? ' · ' + notes : '')
  }

  emit('save', {
    id: props.editProduct?.id,
    name: productName,
    brand: form.value.brand || null,
    model: form.value.model || null,
    category: form.value.category,
    serial_number: null,
    installation_date: form.value.installation_date || null,
    notes: notes || null,
  })
  close()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
          <div class="border-b border-gray-100 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">{{ isEditing ? 'Product bewerken' : 'Product toevoegen' }}</h3>
              <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" @click="close">
                <AppIcon name="x" :size="18" />
              </button>
            </div>
          </div>

          <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label class="label">Type product</label>
              <select v-model="form.category" class="input">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="label">Merk <span class="text-red-400">*</span></label>
                <input v-model="form.brand" type="text" class="input" placeholder="Bijv. Longi" required>
              </div>
              <div>
                <label class="label">Model</label>
                <input v-model="form.model" type="text" class="input" placeholder="Bijv. Hi-MO 6 480Wp">
              </div>
            </div>

            <div>
              <label class="label">Label <span class="text-gray-400 font-normal">(optioneel)</span></label>
              <input v-model="form.name" type="text" class="input" placeholder="Bijv. Schuur, Voorkant">
            </div>

            <!-- Solar-specific fields -->
            <template v-if="isSolar">
              <div class="border-t border-gray-100 pt-3">
                <p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Installatie details</p>
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="label">Vermogen (Wp)</label>
                    <input v-model="form.capacity_wp" type="number" step="1" class="input" placeholder="8400">
                  </div>
                  <div>
                    <label class="label">Oriëntatie</label>
                    <select v-model="form.orientation" class="input">
                      <option value="">Kies...</option>
                      <option v-for="o in orientationOptions" :key="o.value" :value="o.value">{{ o.label }}</option>
                    </select>
                  </div>
                  <div>
                    <label class="label">Helling (°)</label>
                    <input v-model="form.tilt" type="number" step="1" min="0" max="90" class="input" placeholder="35">
                  </div>
                </div>
              </div>
            </template>

            <div>
              <label class="label">Installatiedatum</label>
              <input v-model="form.installation_date" type="date" class="input">
            </div>

            <div>
              <label class="label">Notities</label>
              <textarea v-model="form.notes" class="input" rows="2" placeholder="Optioneel"></textarea>
            </div>
          </form>

          <div class="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
            <button class="btn-secondary" @click="close">Annuleren</button>
            <button class="btn-primary" :disabled="!form.brand" :class="{ 'opacity-50 cursor-not-allowed': !form.brand }" @click="handleSubmit">
              <AppIcon name="check" :size="16" />
              {{ isEditing ? 'Opslaan' : 'Toevoegen' }}
            </button>
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
