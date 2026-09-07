<script setup lang="ts">
import type { CustomerProduct, ProductCategory } from '~~/shared/types/database'
import { getModuleTheme } from '~/utils/module-theme'

const props = defineProps<{ customerId: string; partnerId: string; customerName?: string }>()
const emit = defineEmits<{ 'open-connector': [type: string] }>()
const { products, addProduct, removeProduct, refresh } = useCustomerDossier(props.customerId)

/** Parse the sundata:companyId/plantId/meterId marker stored in serial_number. */
function getSundataLink(product: any): { companyId: number; plantId: number; meterId: number } | null {
  const s = product?.serial_number
  if (!s || typeof s !== 'string' || !s.startsWith('sundata:')) return null
  const [companyId, plantId, meterId] = s.slice('sundata:'.length).split('/').map(Number)
  if (!companyId || !plantId || !meterId) return null
  return { companyId, plantId, meterId }
}

function onSolarConnect() {
  emit('open-connector', 'solar')
}

/** Parse the easee:chargerId marker stored in serial_number. */
function getEaseeLink(product: any): { chargerId: string } | null {
  const s = product?.serial_number
  if (!s || typeof s !== 'string' || !s.startsWith('easee:')) return null
  const chargerId = s.slice('easee:'.length).trim()
  return chargerId ? { chargerId } : null
}

/** Parse the weheat:heatpumpId marker stored in serial_number. */
function getWeheatLink(product: any): { heatpumpId: string } | null {
  const s = product?.serial_number
  if (!s || typeof s !== 'string' || !s.startsWith('weheat:')) return null
  const heatpumpId = s.slice('weheat:'.length).trim()
  return heatpumpId ? { heatpumpId } : null
}

defineExpose({ refresh })

const showAddModal = ref(false)
const editingProduct = ref<any>(null)

// Label, icoon en kleur komen uit de centrale module-theme, zodat een
// warmtepomp overal dezelfde kleur heeft. Deze component had een eigen map
// waarin heat_pump rood en ev_charger groen was — precies de twee kleuren die
// we voor koppelstatus gebruiken, dus elke warmtepomp leek stuk en elke
// laadpaal leek gekoppeld.
const categoryLabels: Record<ProductCategory, string> = {
  solar_panel: 'Zonnepanelen', inverter: 'Omvormer', heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal', battery: 'Batterij', other: 'Overig',
}
function categoryIcon(cat: ProductCategory): string {
  return getModuleTheme(cat).icon
}
function categoryColor(cat: ProductCategory): string {
  return getModuleTheme(cat).accent
}

async function handleAdd(data: any) {
  if (!props.partnerId) {
    alert('Partner gegevens nog niet geladen, even wachten...')
    return
  }
  const wasNew = !data.id
  const isSolar = data.category === 'solar_panel'
  try {
    await addProduct({ ...data, customer_id: props.customerId, partner_id: props.partnerId })
  } catch (e: any) {
    alert(e?.data?.message || e?.message || 'Product toevoegen mislukt')
    showAddModal.value = false
    editingProduct.value = null
    return
  }
  showAddModal.value = false
  editingProduct.value = null
  // Auto-open the Sundata wizard only on first-time solar panel add, and wait for form modal close
  if (wasNew && isSolar) {
    await nextTick()
    setTimeout(() => emit('open-connector', 'solar'), 350)
  }
}

function openEdit(product: any) {
  editingProduct.value = product
  showAddModal.value = true
}

const confirm = useConfirm()
async function handleRemove(id: string) {
  const ok = await confirm({
    title: 'Product verwijderen?',
    message: 'Het product wordt verwijderd uit het klantdossier. Bestaande monitoringkoppelingen blijven bewaard in Sundata.',
    confirmLabel: 'Verwijderen',
    dangerous: true,
  })
  if (ok) await removeProduct(id)
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
          :style="{ backgroundColor: categoryColor(product.category) + '15', color: categoryColor(product.category) }"
        >
          <AppIcon :name="categoryIcon(product.category)" :size="20" />
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-medium text-gray-900 text-sm">
              {{ product.brand }} {{ product.model }}
            </p>
            <span
              class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
              :style="{ backgroundColor: categoryColor(product.category) + '15', color: categoryColor(product.category) }"
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

          <!-- Sundata status: connected badge OR connect button -->
          <template v-if="product.category === 'solar_panel'">
            <div
              v-if="getSundataLink(product)"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
            >
              <AppIcon name="check-circle" :size="12" />
              Gekoppeld met Sundata
              <span class="font-mono text-green-500/70">
                · plant #{{ getSundataLink(product)!.plantId }}
              </span>
            </div>
            <button
              v-else
              type="button"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              @click.stop="onSolarConnect"
            >
              <AppIcon name="zap" :size="12" />
              Koppel monitoring via Sundata
            </button>
          </template>

          <!-- Easee status: connected badge OR connect button -->
          <template v-if="product.category === 'ev_charger'">
            <div
              v-if="getEaseeLink(product)"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
            >
              <AppIcon name="check-circle" :size="12" />
              Gekoppeld met Easee
              <span class="font-mono text-green-500/70">
                · {{ getEaseeLink(product)!.chargerId }}
              </span>
            </div>
            <button
              v-else
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              @click="emit('open-connector', 'easee')"
            >
              <AppIcon name="zap" :size="12" />
              Koppel laadpaal via Easee
            </button>
          </template>

          <!-- Weheat status: connected badge OR connect button -->
          <template v-if="product.category === 'heat_pump'">
            <div
              v-if="getWeheatLink(product)"
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700"
            >
              <AppIcon name="check-circle" :size="12" />
              Gekoppeld met Weheat
              <span class="font-mono text-green-500/70">
                · {{ getWeheatLink(product)!.heatpumpId.slice(0, 12) }}
              </span>
            </div>
            <button
              v-else
              class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
              @click="emit('open-connector', 'weheat')"
            >
              <AppIcon name="zap" :size="12" />
              Koppel warmtepomp via Weheat
            </button>
          </template>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-1 shrink-0">
          <button
            class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="Bewerken"
            @click="openEdit(product)"
          >
            <AppIcon name="settings" :size="14" />
          </button>
          <button
            class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
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
