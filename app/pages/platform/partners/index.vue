<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/formatters'

definePageMeta({ layout: 'platform' })

const { partners, getPartnerCustomers, getPartnerActiveModuleCount, getPartnerMonthlyRevenue, addPartner } = useMockData()

const search = ref('')

const filteredPartners = computed(() => {
  if (!search.value) return partners
  const q = search.value.toLowerCase()
  return partners.filter(p =>
    p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
  )
})

// --- Add partner form ---
const showAddForm = ref(false)
const isAdding = ref(false)
const addForm = ref({
  name: '',
  slug: '',
  primary_color: '#3b82f6',
  secondary_color: '#f3f4f6',
  support_email: '',
  support_phone: '',
})

// Auto-generate slug from name
function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

watch(() => addForm.value.name, (name) => {
  addForm.value.slug = generateSlug(name)
})

function resetAddForm() {
  addForm.value = { name: '', slug: '', primary_color: '#3b82f6', secondary_color: '#f3f4f6', support_email: '', support_phone: '' }
  showAddForm.value = false
}

function submitAdd() {
  if (!addForm.value.name || !addForm.value.slug) return
  isAdding.value = true
  setTimeout(() => {
    const newPartner = addPartner(addForm.value)
    isAdding.value = false
    resetAddForm()
    navigateTo(`/platform/partners/${newPartner.slug}`)
  }, 400)
}
</script>

<template>
  <div>
    <div class="mb-8 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Partners</h1>
        <p class="mt-1 text-sm text-gray-500">{{ partners.length }} partners op het platform</p>
      </div>
      <button
        v-if="!showAddForm"
        class="btn-primary inline-flex items-center gap-2"
        @click="showAddForm = true"
      >
        <AppIcon name="plus" :size="16" />
        Partner toevoegen
      </button>
    </div>

    <!-- Add partner form -->
    <div v-if="showAddForm" class="section mb-6">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Nieuwe partner</h2>
        <div class="flex gap-2">
          <button
            class="btn-primary text-sm inline-flex items-center gap-1.5"
            :disabled="isAdding || !addForm.name"
            @click="submitAdd"
          >
            <AppIcon name="check" :size="14" />
            {{ isAdding ? 'Aanmaken...' : 'Aanmaken' }}
          </button>
          <button class="btn-secondary text-sm" @click="resetAddForm">Annuleren</button>
        </div>
      </div>

      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label class="label">Bedrijfsnaam</label>
          <input v-model="addForm.name" type="text" class="input" placeholder="Bijv. EnergieWerkt" />
        </div>
        <div>
          <label class="label">Slug</label>
          <input v-model="addForm.slug" type="text" class="input font-mono text-sm" />
          <p v-if="addForm.slug" class="mt-1 text-xs text-gray-400">{{ addForm.slug }}.keepon.nl</p>
        </div>
        <div>
          <label class="label">Support e-mail</label>
          <input v-model="addForm.support_email" type="email" class="input" placeholder="info@bedrijf.nl" />
        </div>
        <div>
          <label class="label">Telefoon</label>
          <input v-model="addForm.support_phone" type="tel" class="input" placeholder="020-1234567" />
        </div>
        <div>
          <label class="label">Primaire kleur</label>
          <div class="flex items-center gap-2">
            <input v-model="addForm.primary_color" type="color" class="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5" />
            <input v-model="addForm.primary_color" type="text" class="input flex-1 font-mono text-sm" />
          </div>
        </div>
        <div>
          <label class="label">Achtergrondkleur</label>
          <div class="flex items-center gap-2">
            <input v-model="addForm.secondary_color" type="color" class="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5" />
            <input v-model="addForm.secondary_color" type="text" class="input flex-1 font-mono text-sm" />
          </div>
        </div>
      </div>
    </div>

    <!-- Search -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="search"
          type="text"
          placeholder="Zoek partner..."
          class="input pl-10"
        />
      </div>
    </div>

    <!-- Partner cards -->
    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="p in filteredPartners"
        :key="p.id"
        :to="`/platform/partners/${p.slug}`"
        class="section group cursor-pointer transition-all hover:shadow-md hover:border-gray-300"
      >
        <div class="flex items-start gap-4">
          <img :src="p.logo_url!" :alt="p.name" class="h-12 w-12 rounded-xl" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <h3 class="font-semibold text-gray-900">{{ p.name }}</h3>
              <span class="badge" :class="p.is_active ? 'badge--green' : 'badge--gray'">
                {{ p.is_active ? 'Actief' : 'Inactief' }}
              </span>
            </div>
            <p class="mt-0.5 text-sm text-gray-500">{{ p.slug }}.keepon.nl</p>
            <p class="mt-0.5 text-xs text-gray-400">Sinds {{ formatDate(p.created_at) }}</p>
          </div>
          <AppIcon name="chevron-right" :size="16" class="mt-1 text-gray-300 transition-colors group-hover:text-gray-500" />
        </div>

        <!-- Stats row -->
        <div class="mt-4 flex gap-4 border-t border-gray-100 pt-4">
          <div class="flex-1 text-center">
            <p class="text-lg font-bold text-gray-900">{{ getPartnerCustomers(p.id).length }}</p>
            <p class="text-xs text-gray-500">Klanten</p>
          </div>
          <div class="flex-1 text-center">
            <p class="text-lg font-bold text-gray-900">{{ getPartnerActiveModuleCount(p.id) }}</p>
            <p class="text-xs text-gray-500">Modules</p>
          </div>
          <div class="flex-1 text-center">
            <p class="text-lg font-bold text-gray-900">{{ formatCurrency(getPartnerMonthlyRevenue(p.id)) }}</p>
            <p class="text-xs text-gray-500">MRR</p>
          </div>
        </div>

        <!-- Branding preview -->
        <div class="mt-3 flex items-center gap-2">
          <div class="h-4 w-4 rounded-full" :style="{ backgroundColor: p.primary_color }" />
          <span class="text-xs text-gray-400">{{ p.primary_color }}</span>
        </div>
      </NuxtLink>
    </div>

    <p v-if="filteredPartners.length === 0" class="mt-8 text-center text-sm text-gray-500">
      Geen partners gevonden voor "{{ search }}"
    </p>
  </div>
</template>
