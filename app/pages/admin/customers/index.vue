<script setup lang="ts">
import { formatDate } from '~/utils/formatters'
import type { Customer } from '~~/shared/types/database'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { customers, total: customersTotal, hasMore: customersHasMore, isLoading: customersLoading, refresh: refreshCustomers, loadMore: loadMoreCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers({ autoLoad: false })
const router = useRouter()

const searchQuery = ref('')

// Server-side search with debounce. Only refetch accepted customers (this page
// shows the portfolio; uitnodigingen lives on its own page).
let searchTimer: number | undefined
const currentFilters = computed(() => ({ q: searchQuery.value || undefined, accepted: 'true' as const }))

watch(searchQuery, () => {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    refreshCustomers(currentFilters.value)
  }, 250) as unknown as number
})

// Initial load: ensure we have only accepted customers shown
onMounted(() => {
  refreshCustomers(currentFilters.value)
})

function handleLoadMore() {
  loadMoreCustomers(currentFilters.value)
}

// --- Module + onboarding-status helpers ---
const MODULE_LABEL: Record<string, string> = {
  solar_panel: 'Zon',
  heat_pump:   'Warmtepomp',
  ev_charger:  'Laadpaal',
  battery:     'Batterij',
}

type ModuleTone = 'linked' | 'pending' | 'overdue' | 'idle'

/**
 * Decide the visual state of a module-pill for one customer:
 *   - linked:  module is connected to its monitoring platform → green
 *   - overdue: customer paid (mandate active) but module not connected → red
 *   - pending: customer agreed but mandate not yet active → amber
 *   - idle:   customer hasn't accepted yet → light grey
 *
 * Today only solar can be "linked" (via the Sundata serial_number hack);
 * other modules always read as not-linked, which is correct: the installer
 * still has to wire them up.
 */
function moduleTone(c: any, category: string): ModuleTone {
  const link = c?.module_linkage?.[category]
  if (link && link.linked > 0) return 'linked'
  const o = c?.onboarding
  if (!o?.accepted_at) return 'idle'
  if (o.mandate_at) return 'overdue'
  return 'pending'
}

const TONE_STYLE: Record<ModuleTone, { bg: string; fg: string; dot: string }> = {
  linked:  { bg: '#dcfce7', fg: '#166534', dot: '#16a34a' },
  pending: { bg: '#fef3c7', fg: '#92400e', dot: '#d97706' },
  overdue: { bg: '#fee2e2', fg: '#991b1b', dot: '#dc2626' },
  idle:    { bg: '#f1f5f9', fg: '#475569', dot: '#94a3b8' },
}
function moduleBadge(c: any, category: string) {
  const tone = moduleTone(c, category)
  return { label: MODULE_LABEL[category] || category, ...TONE_STYLE[tone], tone }
}

// --- Legenda -------------------------------------------------------------
// De tabel gebruikt twee onafhankelijke kleursystemen (module-pills en
// status-badge). Zonder uitleg is niet te raden wat rood versus amber
// betekent, dus dit staat uitklapbaar boven de tabel én in de kennisbank.
const showLegend = ref(false)

const MODULE_LEGEND: { tone: ModuleTone; label: string; hint: string }[] = [
  { tone: 'linked',  label: 'Groen',  hint: 'Monitoring is gekoppeld — de klant ziet live data in zijn portaal.' },
  { tone: 'pending', label: 'Amber',  hint: 'Klant heeft akkoord gegeven, maar de monitoring moet nog gekoppeld worden.' },
  { tone: 'overdue', label: 'Rood',   hint: 'Klant betaalt al, maar de monitoring is nog niet gekoppeld. Actie nodig.' },
  { tone: 'idle',    label: 'Grijs',  hint: 'Klant heeft nog geen akkoord gegeven — er valt nog niets te koppelen.' },
]

const STATUS_LEGEND: { label: string; cls: string; hint: string }[] = [
  { label: 'Mail verstuurd',        cls: 'bg-gray-100 text-gray-600',   hint: 'Uitnodiging is de deur uit, klant heeft nog niets gedaan.' },
  { label: 'Wacht op akkoord',      cls: 'bg-amber-100 text-amber-800', hint: 'Klant heeft het voorstel gezien maar nog niet geaccepteerd.' },
  { label: 'Akkoord, incasso open', cls: 'bg-blue-50 text-blue-700',    hint: 'Contract staat, maar de klant heeft nog geen IBAN afgegeven. Je kunt nog niet incasseren.' },
  { label: 'Volledig actief',       cls: 'bg-green-100 text-green-800', hint: 'Akkoord én incasso geregeld. Hier kun je factureren.' },
  { label: 'Akkoord zonder modules', cls: 'bg-red-100 text-red-800',    hint: 'Zeldzaam: akkoord gegeven zonder onderdelen te kiezen. Er zijn geen contractregels, dus factureren lukt niet. Meld dit bij support.' },
]

function moduleTooltip(c: any, category: string): string {
  const tone = moduleTone(c, category)
  const label = MODULE_LABEL[category] || category
  switch (tone) {
    case 'linked':  return `${label}: gekoppeld met monitoring`
    case 'overdue': return `${label}: klant betaalt maar de monitoring is nog niet gekoppeld`
    case 'pending': return `${label}: klant heeft akkoord gegeven, nog gekoppeld worden`
    case 'idle':    return `${label}: wacht op akkoord van de klant`
  }
}

type OnboardingState = { step?: string; accepted_at?: string | null; accepted_modules?: string[] | null; mandate_at?: string | null; mandate_skipped?: boolean } | null
function customerOnboarding(c: any): OnboardingState { return (c?.onboarding as OnboardingState) || null }

function statusBadge(c: any): { label: string; tone: 'idle' | 'pending' | 'ok' | 'partial' | 'broken' } {
  const o = customerOnboarding(c)
  if (!o) return { label: 'Mail verstuurd', tone: 'idle' }
  if (!o.accepted_at) return { label: 'Wacht op akkoord', tone: 'pending' }
  // Akkoord gegeven maar geen geaccepteerde modules → deze klant kan niet
  // gefactureerd worden. Ontstond bij oudere akkoorden voordat we hierop
  // valideerden; expliciet tonen zodat het niet stilletjes blijft hangen.
  if (!o.accepted_modules?.length) return { label: 'Akkoord zonder modules', tone: 'broken' }
  if (o.mandate_at) return { label: 'Volledig actief', tone: 'ok' }
  if (o.mandate_skipped) return { label: 'Akkoord, incasso later', tone: 'partial' }
  return { label: 'Akkoord, incasso open', tone: 'partial' }
}

function statusTooltip(c: any): string {
  const o = customerOnboarding(c)
  if (!o) return 'Uitnodiging verstuurd — klant heeft nog niets gedaan'
  if (!o.accepted_at) return 'Klant heeft het voorstel nog niet geaccepteerd'
  if (!o.accepted_modules?.length) {
    return 'Akkoord gegeven zonder onderdelen te kiezen — er zijn geen contractregels, dus factureren lukt niet. Neem contact op met support.'
  }
  if (o.mandate_at) return 'Akkoord én incasso geregeld — je kunt factureren'
  if (o.mandate_skipped) return 'Akkoord gegeven, klant koos "incasso later regelen"'
  return 'Akkoord gegeven, maar nog geen IBAN afgegeven — incasseren kan nog niet'
}

function goToCustomer(id: string) {
  router.push(`/admin/customers/${id}`)
}

// Server-side filter is `accepted=true` so the list already contains only
// accepted customers. We still need the pending-count for the header chip;
// that's one cheap COUNT-only query (limit=1) on the side.
const { query: queryCustomers } = useCustomers({ autoLoad: false })
const pendingCount = ref(0)
async function loadPendingCount() {
  try {
    const res = await queryCustomers({ accepted: 'false', limit: 1 })
    pendingCount.value = res.total
  } catch { pendingCount.value = 0 }
}
onMounted(loadPendingCount)
const acceptedCustomers = computed(() => customers.value)

// Server already returned the filtered list (search + accepted=true).
const filteredCustomers = computed(() => acceptedCustomers.value)

// Toast for incidentele meldingen (verwijderen, etc.). Klant aanmaken
// — wat in feite een uitnodiging is — gebeurt nu op /admin/uitnodigingen.
const onboardToast = ref('')

// Edit modal state
const editModalOpen = ref(false)
const editingCustomer = ref<Customer | null>(null)
const editForm = ref({ full_name: '', email: '', phone: '', street: '', house_number: '', postal_code: '', city: '' })
const editSaved = ref(false)

function openEdit(customer: Customer) {
  editingCustomer.value = customer
  editForm.value = {
    full_name: customer.full_name || '',
    email: customer.email,
    phone: customer.phone || '',
    street: customer.street || '',
    house_number: customer.house_number || '',
    postal_code: customer.postal_code || '',
    city: customer.city || '',
  }
  editSaved.value = false
  editModalOpen.value = true
}

const editSaving = ref(false)
const editError = ref('')

async function saveEdit() {
  if (!editingCustomer.value) return
  editSaving.value = true
  editError.value = ''
  try {
    await updateCustomer(editingCustomer.value.id, editForm.value)
    editSaved.value = true
    setTimeout(() => {
      editModalOpen.value = false
      editSaved.value = false
    }, 1200)
  } catch (e: any) {
    editError.value = e?.data?.message || e?.message || 'Opslaan mislukt'
  } finally {
    editSaving.value = false
  }
}

// View customer dossier
function viewCustomerDossier(customer: Customer) {
  navigateTo(`/admin/customers/${customer.id}`)
}

// Delete customer
const confirm = useConfirm()
async function handleDelete(customer: Customer) {
  const ok = await confirm({
    title: 'Klant verwijderen',
    message: `${customer.full_name || customer.email}\n\nDit verwijdert ook alle producten, documenten en tickets. Niet ongedaan te maken.`,
    confirmLabel: 'Verwijderen',
    dangerous: true,
  })
  if (!ok) return
  try {
    await deleteCustomer(customer.id)
    onboardToast.value = `${customer.full_name || customer.email} is verwijderd`
    setTimeout(() => { onboardToast.value = '' }, 3000)
  } catch (e: any) {
    onboardToast.value = `Fout: ${e?.data?.message || 'Verwijderen mislukt'}`
    setTimeout(() => { onboardToast.value = '' }, 5000)
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Klanten</h1>
        <p class="mt-1 text-sm text-gray-500">
          <template v-if="customersLoading">&nbsp;</template>
          <template v-else>
            {{ customersTotal === 1 ? '1 actieve klant' : `${customersTotal} actieve klanten` }}<span v-if="searchQuery"> bij "{{ searchQuery }}"</span>
            <template v-if="pendingCount">
              · <NuxtLink to="/admin/uitnodigingen" class="text-blue-600 hover:underline">
                {{ pendingCount }} {{ pendingCount === 1 ? 'wacht' : 'wachten' }} op akkoord
              </NuxtLink>
            </template>
          </template>
        </p>
      </div>
      <NuxtLink to="/admin/uitnodigingen" class="btn-primary inline-flex items-center gap-1.5">
        <AppIcon name="plus" :size="16" />
        Klant uitnodigen
      </NuxtLink>
    </div>

    <!-- Search + legenda -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative max-w-sm flex-1 min-w-[240px]">
        <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="search"
          class="input pl-9"
          placeholder="Zoek op naam, e-mail of plaats..."
        />
      </div>
      <button
        class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
        :aria-expanded="showLegend"
        @click="showLegend = !showLegend"
      >
        <AppIcon name="help-circle" :size="14" />
        Wat betekenen de kleuren?
        <AppIcon name="chevron-down" :size="12" class="transition-transform" :class="showLegend ? 'rotate-180' : ''" />
      </button>
    </div>

    <!-- Legenda — uitklapbaar zodat 'ie geen permanente ruimte vreet voor
         mensen die het systeem al kennen -->
    <Transition name="fade">
      <div v-if="showLegend" class="mb-4 grid gap-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:grid-cols-2">
        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Kolom "Modules"</p>
          <p class="mb-2.5 text-[11px] text-gray-500">
            Toont per installatie of de monitoring gekoppeld is aan Sundata, Weheat of Easee.
          </p>
          <ul class="space-y-1.5">
            <li v-for="item in MODULE_LEGEND" :key="item.tone" class="flex items-start gap-2">
              <span
                class="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                :style="{ backgroundColor: TONE_STYLE[item.tone].bg, color: TONE_STYLE[item.tone].fg }"
              >
                <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: TONE_STYLE[item.tone].dot }" />
                {{ item.label }}
              </span>
              <span class="text-[11px] leading-relaxed text-gray-600">{{ item.hint }}</span>
            </li>
          </ul>
        </div>
        <div>
          <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Kolom "Status"</p>
          <p class="mb-2.5 text-[11px] text-gray-500">
            Hoe ver de klant is in de onboarding: van uitnodiging tot actieve incasso.
          </p>
          <ul class="space-y-1.5">
            <li v-for="item in STATUS_LEGEND" :key="item.label" class="flex items-start gap-2">
              <span
                class="mt-0.5 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                :class="item.cls"
              >
                {{ item.label }}
              </span>
              <span class="text-[11px] leading-relaxed text-gray-600">{{ item.hint }}</span>
            </li>
          </ul>
        </div>
        <p class="text-[11px] text-gray-400 sm:col-span-2">
          Meer uitleg over de onboarding-flow staat in de
          <a href="/support/wat-ziet-je-klant" target="_blank" class="text-blue-600 hover:underline">handleiding</a>.
        </p>
      </div>
    </Transition>

    <!-- Table (client-only to prevent hydration mismatch with async data) -->
    <ClientOnly>
    <div class="section overflow-hidden p-0">
      <div class="-mx-0 overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-100">
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Naam</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Contact</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Modules</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Aangemeld</th>
              <th class="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-400" aria-label="Open dossier"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-50">
            <tr
              v-for="customer in filteredCustomers"
              :key="customer.id"
              class="group transition-colors hover:bg-gray-50/50 cursor-pointer"
              @click="goToCustomer(customer.id)"
            >
              <td class="px-6 py-3.5">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium text-white"
                    :style="{ backgroundColor: `hsl(${(customer.full_name?.charCodeAt(0) || 65) * 5}, 50%, 55%)` }"
                  >
                    {{ customer.full_name?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <span class="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                      {{ customer.full_name || '-' }}
                    </span>
                  </div>
                </div>
              </td>
              <td class="px-6 py-3.5">
                <p class="text-sm text-gray-700">{{ customer.email }}</p>
                <p class="text-xs text-gray-400">
                  <template v-if="customer.phone">{{ customer.phone }}</template>
                  <template v-else-if="customer.street">{{ customer.street }} {{ customer.house_number }}, {{ customer.city }}</template>
                  <template v-else>Geen contactgegevens</template>
                </p>
              </td>
              <td class="px-6 py-3.5">
                <div v-if="customer.product_categories?.length" class="flex flex-wrap gap-1">
                  <span
                    v-for="cat in (customer.product_categories || [])"
                    :key="cat"
                    class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    :style="{ backgroundColor: moduleBadge(customer, cat).bg, color: moduleBadge(customer, cat).fg }"
                    :title="moduleTooltip(customer, cat)"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" :style="{ backgroundColor: moduleBadge(customer, cat).dot }" />
                    {{ moduleBadge(customer, cat).label }}
                  </span>
                </div>
                <span v-else class="text-xs text-gray-400">Geen</span>
              </td>
              <td class="px-6 py-3.5">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  :title="statusTooltip(customer)"
                  :class="{
                    'bg-gray-100 text-gray-600': statusBadge(customer).tone === 'idle',
                    'bg-amber-100 text-amber-800': statusBadge(customer).tone === 'pending',
                    'bg-blue-50 text-blue-700': statusBadge(customer).tone === 'partial',
                    'bg-green-100 text-green-800': statusBadge(customer).tone === 'ok',
                    'bg-red-100 text-red-800': statusBadge(customer).tone === 'broken',
                  }"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="{
                    'bg-gray-400': statusBadge(customer).tone === 'idle',
                    'bg-amber-500': statusBadge(customer).tone === 'pending',
                    'bg-blue-500': statusBadge(customer).tone === 'partial',
                    'bg-green-500': statusBadge(customer).tone === 'ok',
                    'bg-red-500': statusBadge(customer).tone === 'broken',
                  }" />
                  {{ statusBadge(customer).label }}
                </span>
              </td>
              <td class="px-6 py-3.5 text-sm text-gray-400">
                {{ formatDate(customer.created_at) }}
              </td>
              <td class="px-6 py-3.5">
                <div class="flex items-center justify-end gap-1.5 text-xs font-medium text-gray-400 group-hover:text-gray-700 transition-colors">
                  Open dossier
                  <AppIcon name="chevron-right" :size="14" class="transition-transform group-hover:translate-x-0.5" />
                </div>
              </td>
            </tr>
            <tr v-if="customersLoading">
              <td colspan="6" class="px-6 py-8 text-center">
                <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
              </td>
            </tr>
            <tr v-else-if="!filteredCustomers.length">
              <td colspan="6" class="px-6 py-8 text-center text-sm text-gray-400">
                {{ searchQuery ? 'Geen klanten gevonden.' : 'Nog geen klanten met akkoord. Nodig iemand uit via Uitnodigingen om te beginnen.' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="customersHasMore" class="border-t border-gray-100 px-6 py-3 text-center">
        <button
          class="text-sm font-medium text-gray-700 hover:text-gray-900 disabled:opacity-50"
          :disabled="customersLoading"
          @click="handleLoadMore"
        >
          {{ customersLoading ? 'Laden...' : `Toon volgende ${Math.min(100, customersTotal - filteredCustomers.length)} klanten` }}
        </button>
      </div>
    </div>
    </ClientOnly>

    <!-- Toast notification -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="onboardToast"
          class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
        >
          <AppIcon name="check-circle" :size="16" class="text-green-400" />
          {{ onboardToast }}
        </div>
      </Transition>
    </Teleport>

    <!-- Edit Customer Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="editModalOpen && editingCustomer"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="editModalOpen = false"
        >
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />

          <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <!-- Header -->
            <div class="border-b border-gray-100 px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white"
                    :style="{ backgroundColor: `hsl(${(editingCustomer.full_name?.charCodeAt(0) || 65) * 5}, 50%, 55%)` }"
                  >
                    {{ editingCustomer.full_name?.charAt(0) || '?' }}
                  </div>
                  <div>
                    <h3 class="text-lg font-semibold text-gray-900">Klant bewerken</h3>
                    <p class="text-sm text-gray-500">{{ editingCustomer.full_name }}</p>
                  </div>
                </div>
                <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" @click="editModalOpen = false">
                  <AppIcon name="x" :size="18" />
                </button>
              </div>
            </div>

            <!-- Form -->
            <div class="px-6 py-5 space-y-4">
              <!-- Success message -->
              <div v-if="editSaved" class="rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                <p class="text-sm font-medium text-green-700">
                  <AppIcon name="check-circle" :size="16" class="inline -mt-0.5" />
                  Klantgegevens opgeslagen
                </p>
              </div>

              <template v-if="!editSaved">
                <!-- Name + Email -->
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Naam</label>
                    <input v-model="editForm.full_name" type="text" class="input" />
                  </div>
                  <div>
                    <label class="label">E-mailadres</label>
                    <input v-model="editForm.email" type="email" class="input" />
                  </div>
                </div>

                <!-- Phone -->
                <div>
                  <label class="label">Telefoonnummer</label>
                  <input v-model="editForm.phone" type="tel" class="input" />
                </div>

                <!-- Address -->
                <div>
                  <label class="label text-gray-400 text-xs uppercase tracking-wider">Adres</label>
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <div class="col-span-2">
                    <label class="label">Straat</label>
                    <input v-model="editForm.street" type="text" class="input" />
                  </div>
                  <div>
                    <label class="label">Huisnummer</label>
                    <input v-model="editForm.house_number" type="text" class="input" />
                  </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                  <div>
                    <label class="label">Postcode</label>
                    <input v-model="editForm.postal_code" type="text" class="input" />
                  </div>
                  <div>
                    <label class="label">Plaats</label>
                    <input v-model="editForm.city" type="text" class="input" />
                  </div>
                </div>

                <!-- Dossier link -->
                <div class="rounded-xl border border-gray-100 bg-gray-50 p-3">
                  <NuxtLink
                    :to="`/admin/customers/${editingCustomer.id}`"
                    class="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                    @click="editModalOpen = false"
                  >
                    <AppIcon name="folder" :size="12" />
                    Bekijk klantdossier voor modules en documenten
                  </NuxtLink>
                </div>
              </template>
            </div>

            <!-- Actions -->
            <div v-if="!editSaved" class="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button class="btn-secondary" @click="editModalOpen = false">Annuleren</button>
              <button class="btn-primary" @click="saveEdit">
                <AppIcon name="check" :size="16" />
                Opslaan
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
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

/* Virtualize the customer table: the browser skips layout + paint for rows
 * outside the viewport. Each row is ~57px tall (avatar + 2 lines of text +
 * padding). With this in place the table stays smooth even at 1000+ rows.
 * No-op in older browsers (graceful degradation). */
tbody tr {
  content-visibility: auto;
  contain-intrinsic-size: 1px 57px;
}
</style>
