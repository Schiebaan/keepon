<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/formatters'

definePageMeta({ layout: 'platform', middleware: ['auth', 'role-platform'] })

const route = useRoute()
const { partners, getPartnerCustomers, getPartnerActiveModuleCount, getPartnerMonthlyRevenue, getPartnerPayments, allSubscriptions, updatePartner, deletePartner } = useMockData()

const partner = computed(() => partners.find(p => p.slug === route.params.slug))
const partnerCustomers = computed(() => partner.value ? getPartnerCustomers(partner.value.id) : [])
const partnerPayments = computed(() => partner.value ? getPartnerPayments(partner.value.id) : [])

// --- Edit mode ---
const isEditing = ref(false)
const isSaving = ref(false)
const editForm = ref({
  name: '',
  support_email: '',
  support_phone: '',
  terms_url: '',
  primary_color: '',
  secondary_color: '',
  is_active: true,
})

function startEdit() {
  if (!partner.value) return
  editForm.value = {
    name: partner.value.name,
    support_email: partner.value.support_email || '',
    support_phone: partner.value.support_phone || '',
    terms_url: partner.value.terms_url || '',
    primary_color: partner.value.primary_color,
    secondary_color: partner.value.secondary_color,
    is_active: partner.value.is_active,
  }
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
}

function saveEdit() {
  if (!partner.value) return
  isSaving.value = true
  setTimeout(() => {
    updatePartner(partner.value!.id, {
      name: editForm.value.name,
      support_email: editForm.value.support_email || null,
      support_phone: editForm.value.support_phone || null,
      terms_url: editForm.value.terms_url || null,
      primary_color: editForm.value.primary_color,
      secondary_color: editForm.value.secondary_color,
      is_active: editForm.value.is_active,
    })
    isEditing.value = false
    isSaving.value = false
  }, 400)
}

// --- Delete ---
const showDeleteModal = ref(false)

function confirmDelete() {
  if (!partner.value) return
  deletePartner(partner.value.id)
  showDeleteModal.value = false
  navigateTo('/platform/partners')
}

// Customer search
const search = ref('')
const filteredCustomers = computed(() => {
  if (!search.value) return partnerCustomers.value
  const q = search.value.toLowerCase()
  return partnerCustomers.value.filter(c =>
    (c.full_name?.toLowerCase().includes(q)) ||
    c.email.toLowerCase().includes(q) ||
    (c.city?.toLowerCase().includes(q))
  )
})

function getCustomerModuleCount(customerId: string) {
  return allSubscriptions.filter(s => s.customer_id === customerId && s.status === 'active').length
}

const paymentStats = computed(() => {
  const thisMonth = partnerPayments.value.filter(p => p.created_at >= '2025-07-01')
  return {
    revenue: thisMonth.reduce((sum, p) => p.status === 'paid' ? sum + p.amount_cents : sum, 0),
    pending: thisMonth.filter(p => p.status === 'pending').length,
    failed: thisMonth.filter(p => p.status === 'failed').length,
  }
})
</script>

<template>
  <div v-if="partner">
    <!-- Back link -->
    <NuxtLink to="/platform/partners" class="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
      <AppIcon name="chevron-right" :size="14" class="rotate-180" />
      Terug naar partners
    </NuxtLink>

    <!-- Partner header -->
    <div class="section mb-6">
      <!-- Display mode -->
      <template v-if="!isEditing">
        <div class="flex items-center gap-4">
          <img :src="partner.logo_url!" :alt="partner.name" class="h-14 w-14 rounded-2xl" />
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <h1 class="text-2xl font-bold text-gray-900">{{ partner.name }}</h1>
              <span class="badge" :class="partner.is_active ? 'badge--green' : 'badge--gray'">
                {{ partner.is_active ? 'Actief' : 'Inactief' }}
              </span>
            </div>
            <p class="text-sm text-gray-500">{{ partner.slug }}.runon.nl &middot; Sinds {{ formatDate(partner.created_at) }}</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="h-6 w-6 rounded-full ring-2 ring-white" :style="{ backgroundColor: partner.primary_color }" />
            <button class="btn-secondary inline-flex items-center gap-2" @click="startEdit">
              <AppIcon name="settings" :size="14" />
              Bewerken
            </button>
            <NuxtLink to="/admin" class="btn-primary inline-flex items-center gap-2">
              <AppIcon name="external" :size="14" />
              Open portaal
            </NuxtLink>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-6 border-t border-gray-100 pt-4 text-sm text-gray-500">
          <span v-if="partner.support_email">{{ partner.support_email }}</span>
          <span v-if="partner.support_phone">{{ partner.support_phone }}</span>
        </div>
      </template>

      <!-- Edit mode -->
      <template v-else>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Partner bewerken</h2>
          <div class="flex gap-2">
            <button class="btn-primary text-sm inline-flex items-center gap-1.5" :disabled="isSaving" @click="saveEdit">
              <AppIcon name="check" :size="14" />
              {{ isSaving ? 'Opslaan...' : 'Opslaan' }}
            </button>
            <button class="btn-secondary text-sm" @click="cancelEdit">Annuleren</button>
          </div>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label class="label">Bedrijfsnaam</label>
            <input v-model="editForm.name" type="text" class="input" />
          </div>
          <div>
            <label class="label">Slug</label>
            <input type="text" :value="partner.slug" class="input bg-gray-50" readonly />
            <p class="mt-1 text-xs text-gray-400">Slug kan niet gewijzigd worden</p>
          </div>
          <div>
            <label class="label">Support e-mail</label>
            <input v-model="editForm.support_email" type="email" class="input" />
          </div>
          <div>
            <label class="label">Telefoon</label>
            <input v-model="editForm.support_phone" type="tel" class="input" />
          </div>
          <div class="sm:col-span-2">
            <label class="label">Voorwaarden URL</label>
            <input v-model="editForm.terms_url" type="url" class="input" placeholder="https://" />
          </div>
          <div>
            <label class="label">Primaire kleur</label>
            <div class="flex items-center gap-2">
              <input v-model="editForm.primary_color" type="color" class="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5" />
              <input v-model="editForm.primary_color" type="text" class="input flex-1 font-mono text-sm" />
            </div>
          </div>
          <div>
            <label class="label">Achtergrondkleur</label>
            <div class="flex items-center gap-2">
              <input v-model="editForm.secondary_color" type="color" class="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5" />
              <input v-model="editForm.secondary_color" type="text" class="input flex-1 font-mono text-sm" />
            </div>
          </div>
          <div class="sm:col-span-2">
            <label class="flex items-center gap-2">
              <input v-model="editForm.is_active" type="checkbox" class="h-4 w-4 rounded border-gray-300" />
              <span class="text-sm text-gray-700">Partner is actief</span>
            </label>
          </div>
        </div>

        <!-- Branding preview -->
        <div class="mt-4 rounded-lg border border-gray-200 p-3">
          <p class="text-xs font-medium text-gray-400 mb-2">Preview</p>
          <div class="flex items-center gap-3">
            <div class="h-8 w-8 rounded-lg" :style="{ backgroundColor: editForm.primary_color }" />
            <div class="h-8 w-8 rounded-lg border border-gray-200" :style="{ backgroundColor: editForm.secondary_color }" />
            <button class="rounded-lg px-3 py-1.5 text-xs font-medium text-white" :style="{ backgroundColor: editForm.primary_color }">
              Knop voorbeeld
            </button>
          </div>
        </div>

        <!-- Danger zone -->
        <div class="mt-6 border-t border-red-100 pt-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-red-600">Partner verwijderen</p>
              <p class="text-xs text-gray-500">Dit verwijdert ook alle klanten, abonnementen en betalingen.</p>
            </div>
            <button
              class="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
              @click="showDeleteModal = true"
            >
              Verwijderen
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- Stats -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div class="stat-card" :style="{ '--stat-color': '#1a56db' } as any">
        <span class="text-sm font-medium text-gray-500">Klanten</span>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ partnerCustomers.length }}</p>
      </div>
      <div class="stat-card" :style="{ '--stat-color': '#059669' } as any">
        <span class="text-sm font-medium text-gray-500">Actieve modules</span>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ getPartnerActiveModuleCount(partner.id) }}</p>
      </div>
      <div class="stat-card" :style="{ '--stat-color': '#7c3aed' } as any">
        <span class="text-sm font-medium text-gray-500">MRR</span>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ formatCurrency(getPartnerMonthlyRevenue(partner.id)) }}</p>
      </div>
      <div class="stat-card" :style="{ '--stat-color': '#f59e0b' } as any">
        <span class="text-sm font-medium text-gray-500">Omzet deze maand</span>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ formatCurrency(paymentStats.revenue) }}</p>
        <p v-if="paymentStats.failed" class="mt-1 text-xs text-red-600">{{ paymentStats.failed }} mislukt</p>
      </div>
    </div>

    <!-- Customer table -->
    <div class="section">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Klanten ({{ partnerCustomers.length }})</h2>
        <div class="relative">
          <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Zoek klant..."
            class="input pl-10 w-64"
          />
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th class="pb-3 pr-4">Naam</th>
              <th class="pb-3 pr-4">E-mail</th>
              <th class="pb-3 pr-4">Plaats</th>
              <th class="pb-3 pr-4">Modules</th>
              <th class="pb-3">Aangemeld</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="c in filteredCustomers" :key="c.id" class="hover:bg-gray-50">
              <td class="py-3 pr-4 font-medium text-gray-900">{{ c.full_name }}</td>
              <td class="py-3 pr-4 text-gray-500">{{ c.email }}</td>
              <td class="py-3 pr-4 text-gray-500">{{ c.city }}</td>
              <td class="py-3 pr-4">
                <span class="badge badge--green">{{ getCustomerModuleCount(c.id) }} actief</span>
              </td>
              <td class="py-3 text-gray-500">{{ formatDate(c.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="filteredCustomers.length === 0" class="py-8 text-center text-sm text-gray-500">
        Geen klanten gevonden
      </p>
    </div>

    <!-- Delete modal -->
    <ConfirmModal
      :open="showDeleteModal"
      title="Partner verwijderen"
      :message="`Weet je zeker dat je ${partner.name} wilt verwijderen? Dit verwijdert ook ${partnerCustomers.length} klanten en alle bijbehorende data. Dit kan niet ongedaan worden.`"
      confirm-label="Verwijderen"
      variant="danger"
      @confirm="confirmDelete"
      @cancel="showDeleteModal = false"
    />
  </div>

  <!-- Not found -->
  <div v-else class="text-center py-12">
    <p class="text-gray-500">Partner niet gevonden</p>
    <NuxtLink to="/platform/partners" class="mt-2 inline-block text-sm text-blue-600 hover:text-blue-700">
      Terug naar partners
    </NuxtLink>
  </div>
</template>
