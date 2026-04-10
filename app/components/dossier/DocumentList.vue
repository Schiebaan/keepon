<script setup lang="ts">
import type { CustomerDocument, DocumentCategory } from '~~/shared/types/database'

const props = defineProps<{ customerId: string; partnerId: string }>()
const { documents, addDocument, removeDocument } = useCustomerDossier(props.customerId)

const showUploadModal = ref(false)

const categoryLabels: Record<DocumentCategory, string> = {
  factuur: 'Factuur',
  datasheet: 'Datasheet',
  opleverdocument: 'Opleverdocument',
  garantiebewijs: 'Garantiebewijs',
  offerte: 'Offerte',
  overig: 'Overig',
}

const categoryColors: Record<DocumentCategory, string> = {
  factuur: 'bg-blue-50 text-blue-700',
  datasheet: 'bg-gray-100 text-gray-700',
  opleverdocument: 'bg-green-50 text-green-700',
  garantiebewijs: 'bg-yellow-50 text-yellow-700',
  offerte: 'bg-indigo-50 text-indigo-700',
  overig: 'bg-gray-100 text-gray-600',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB'
  return (bytes / 1048576).toFixed(1) + ' MB'
}

function handleUpload(data: any) {
  addDocument({
    ...data,
    customer_id: props.customerId,
    partner_id: props.partnerId,
  })
  showUploadModal.value = false
}

function handleRemove(id: string) {
  if (confirm('Weet je zeker dat je dit document wilt verwijderen?')) {
    removeDocument(id)
  }
}

function handleDownload(doc: CustomerDocument) {
  // Demo: show alert since files aren't actually stored
  alert(`Demo: download van "${doc.name}" is niet beschikbaar in demo modus.`)
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-900">
        Documenten <span class="text-gray-400 font-normal">({{ documents.length }})</span>
      </h3>
      <button
        class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
        @click="showUploadModal = true"
      >
        <AppIcon name="upload" :size="14" />
        Document uploaden
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="documents.length === 0" class="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
      <AppIcon name="folder" :size="32" class="mx-auto text-gray-300 mb-3" />
      <p class="text-sm text-gray-500">Nog geen documenten geüpload</p>
      <button
        class="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900"
        @click="showUploadModal = true"
      >
        + Eerste document uploaden
      </button>
    </div>

    <!-- Document grid -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div
        v-for="doc in documents"
        :key="doc.id"
        class="group relative flex flex-col rounded-xl border border-gray-100 bg-white p-4 hover:border-gray-200 transition-colors"
      >
        <div class="flex items-start gap-3">
          <!-- File icon -->
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">
            <AppIcon name="file-text" :size="20" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium text-sm text-gray-900 truncate">{{ doc.name }}</p>
            <div class="mt-1 flex items-center gap-2">
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                :class="categoryColors[doc.category]"
              >
                {{ categoryLabels[doc.category] }}
              </span>
              <span class="text-[11px] text-gray-400">{{ formatFileSize(doc.file_size_bytes) }}</span>
            </div>
          </div>
        </div>

        <div class="mt-3 flex items-center justify-between">
          <span class="text-[11px] text-gray-400">{{ formatDate(doc.uploaded_at) }}</span>
          <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              class="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              title="Downloaden"
              @click="handleDownload(doc)"
            >
              <AppIcon name="download" :size="14" />
            </button>
            <button
              class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="Verwijderen"
              @click="handleRemove(doc.id)"
            >
              <AppIcon name="trash" :size="14" />
            </button>
          </div>
        </div>

        <p v-if="doc.notes" class="mt-2 text-xs text-gray-400 border-t border-gray-50 pt-2">{{ doc.notes }}</p>
      </div>
    </div>

    <!-- Upload modal -->
    <DocumentUploadModal
      v-model="showUploadModal"
      @save="handleUpload"
    />
  </div>
</template>
