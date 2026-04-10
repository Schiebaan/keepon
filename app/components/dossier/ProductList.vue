<script setup lang="ts">
import type { CustomerProduct, ProductCategory } from '~~/shared/types/database'

const props = defineProps<{ customerId: string; partnerId: string; customerName?: string }>()
const emit = defineEmits<{ 'open-connector': [type: string] }>()
const { products, addProduct, removeProduct } = useCustomerDossier(props.customerId)

const showAddModal = ref(false)
const editingProduct = ref<any>(null)

const categoryLabels: Record<ProductCategory, string> = {
  solar_panel: 'Zonnepanelen', inverter: 'Omvormer', heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal', battery: 'Batterij', other: 'Overig',
}
const categoryIcons: Record<ProductCategory, string> = {
  solar_panel: 'solar', inverter: 'zap', heat_pump: 'heat-pump',
  ev_charger: 'ev-charger', battery: 'battery', other: 'package',
}
const categoryColors: Record<ProductCategory, string> = {
  solar_panel: '#eab308', inverter: '#3b82f6', heat_pump: '#ef4444',
  ev_charger: '#22c55e', battery: '#8b5cf6', other: '#6b7280',
}

async function handleAdd(data: any) {
  try {
    await addProduct({ ...data, customer_id: props.customerId, partner_id: props.partnerId })
    // After adding solar product, offer to connect
    if (['solar_panel', 'inverter'].includes(data.category)) {
      emit('open-connector', 'solar')
    }
  } catch (e: any) {
    alert(e?.data?.message || 'Product toevoegen mislukt')
  }
  showAddModal.value = false
  editingProduct.value = null
}

function openEdit(product: any) {
  editingProduct.value = product
  showAddModal.value = true
}

async function handleRemove(id: string) {
  if (confirm('Weet je zeker dat je dit product wilt verwijderen?')) {
    await removeProduct(id)
  }
}

function formatDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-sm font-semibold text-gray-900">
        Producten <span class="text-gray-400 font-normal">({{ products.length }})</span>
      </h3>
      <button
        class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors"
        @click="editingProduct = null; showAddModal = true"
      >
        <AppIcon name="plus" :size="14" />
        Product toevoegen
      </button>
    </div>

    <!-- Empty state -->
    <div v-if="products.length === 0" class="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
      <AppIcon name="package" :size="32" class="mx-auto text-gray-300 mb-3" />
      <p class="text-sm text-gray-500">Nog geen producten toegevoegd</p>
      <button class="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900" @click="editingProduct = null; showAddModal = true">
        + Eerste product toevoegen
      </button>
    </div>

    <!-- Product cards -->
    <div v-else class="space-y-3">
      <div
        v-for="product in products"
        :key="product.id"
        class="group flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 hover:border-gray-200 transition-colors"
      >
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
          :style="{ backgroundColor: categoryColors[product.category] + '15', color: categoryColors[product.category] }"
        >
          <AppIcon :name="categoryIcons[product.category]" :size="20" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium text-gray-900 text-sm">
              {{ product.brand }} {{ product.model }}
            </p>
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
              :style="{ backgroundColor: categoryColors[product.category] + '15', color: categoryColors[product.category] }"
            >
              {{ categoryLabels[product.category] }}
            </span>
          </div>
          <div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span v-if="product.name && product.name !== `${product.brand} ${product.model}`.trim()">{{ product.name }}</span>
            <span v-if="product.installation_date">
              <AppIcon name="calendar" :size="12" class="inline -mt-0.5" />
              {{ formatDate(product.installation_date) }}
            </span>
          </div>
          <p v-if="product.notes" class="mt-1.5 text-xs text-gray-400">{{ product.notes }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-all">
          <button
            v-if="['solar_panel', 'inverter'].includes(product.category)"
            class="rounded-lg px-2 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 transition-colors"
            title="Koppel monitoring via Sundata"
            @click="emit('open-connector', 'solar')"
          >
            <AppIcon name="zap" :size="14" />
          </button>
          <button
            class="rounded-lg p-1.5 text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Bewerken"
            @click="openEdit(product)"
          >
            <AppIcon name="settings" :size="14" />
          </button>
          <button
            class="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Verwijderen"
            @click="handleRemove(product.id)"
          >
            <AppIcon name="trash" :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit modal -->
    <ProductFormModal
      v-model="showAddModal"
      :edit-product="editingProduct"
      @save="handleAdd"
    />
  </div>
</template>
