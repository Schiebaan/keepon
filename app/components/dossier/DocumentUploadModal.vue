<script setup lang="ts">
import type { DocumentCategory } from '~~/shared/types/database'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'save': [data: any]
}>()

const form = ref({
  name: '',
  category: 'overig' as DocumentCategory,
  notes: '',
})

const selectedFile = ref<File | null>(null)
const fileInputRef = ref<HTMLInputElement>()

const categories: { value: DocumentCategory; label: string }[] = [
  { value: 'factuur', label: 'Factuur' },
  { value: 'datasheet', label: 'Datasheet' },
  { value: 'opleverdocument', label: 'Opleverdocument' },
  { value: 'garantiebewijs', label: 'Garantiebewijs' },
  { value: 'offerte', label: 'Offerte' },
  { value: 'overig', label: 'Overig' },
]

function close() {
  emit('update:modelValue', false)
  setTimeout(resetForm, 300)
}

function resetForm() {
  form.value = { name: '', category: 'overig', notes: '' }
  selectedFile.value = null
}

function handleFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) {
    selectedFile.value = file
    if (!form.value.name) {
      form.value.name = file.name.replace(/\.[^.]+$/, '')
    }
  }
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function handleSubmit() {
  if (!form.value.name) return

  const now = new Date().toISOString()
  emit('save', {
    name: form.value.name,
    category: form.value.category,
    file_path: `customer-documents/demo/${form.value.name.replace(/\s+/g, '-').toLowerCase()}.pdf`,
    file_size_bytes: selectedFile.value?.size || 0,
    mime_type: selectedFile.value?.type || 'application/pdf',
    notes: form.value.notes || null,
    uploaded_at: now,
  })
  close()
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
              <h3 class="text-lg font-semibold text-gray-900">Document uploaden</h3>
              <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" @click="close">
                <AppIcon name="x" :size="18" />
              </button>
            </div>
          </div>

          <!-- Form -->
          <form @submit.prevent="handleSubmit" class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <!-- File upload area -->
            <div>
              <label class="label">Bestand</label>
              <div
                class="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors cursor-pointer"
                :class="selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
                @click="fileInputRef?.click()"
              >
                <input
                  ref="fileInputRef"
                  type="file"
                  class="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
                  @change="handleFileChange"
                >
                <template v-if="selectedFile">
                  <AppIcon name="check-circle" :size="24" class="text-green-500 mb-2" />
                  <p class="text-sm font-medium text-green-700">{{ selectedFile.name }}</p>
                  <p class="text-xs text-green-600 mt-0.5">{{ formatFileSize(selectedFile.size) }}</p>
                </template>
                <template v-else>
                  <AppIcon name="upload" :size="24" class="text-gray-400 mb-2" />
                  <p class="text-sm text-gray-600">Klik om een bestand te selecteren</p>
                  <p class="text-xs text-gray-400 mt-0.5">PDF, Word, Excel, afbeeldingen</p>
                </template>
              </div>
            </div>

            <div>
              <label class="label">Categorie</label>
              <select v-model="form.category" class="input">
                <option v-for="cat in categories" :key="cat.value" :value="cat.value">{{ cat.label }}</option>
              </select>
            </div>

            <div>
              <label class="label">Naam <span class="text-red-400">*</span></label>
              <input v-model="form.name" type="text" class="input" placeholder="Bijv. Factuur installatie 2025" required>
            </div>

            <div>
              <label class="label">Notities</label>
              <textarea v-model="form.notes" class="input" rows="2" placeholder="Optioneel"></textarea>
            </div>
          </form>

          <!-- Actions -->
          <div class="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
            <button class="btn-secondary" @click="close">Annuleren</button>
            <button
              class="btn-primary"
              :disabled="!form.name"
              :class="{ 'opacity-50 cursor-not-allowed': !form.name }"
              @click="handleSubmit"
            >
              <AppIcon name="upload" :size="16" />
              Uploaden
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
