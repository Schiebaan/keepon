<script setup lang="ts">
import { formatDate } from '~/utils/formatters'
import type { Customer } from '~~/shared/types/database'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { customers, isLoading: customersLoading, total: customersTotal, hasMore: customersHasMore, refresh: refreshCustomers, loadMore: loadMoreCustomers } = useCustomers()
const confirm = useConfirm()

// --- "Klant uitnodigen" modal (verhuisd vanaf /admin/klanten) ---
// Aanmaken = uitnodiging versturen: hier is dat conceptueel de juiste plek.
const showOnboardModal = ref(false)
const onboardToast = ref('')
async function handleOnboarded(result: any) {
  if (!result?.customer) return
  onboardToast.value = `${result.customer.full_name || result.customer.email} is uitgenodigd!`
  setTimeout(() => { onboardToast.value = '' }, 3000)
  // Verfrissen zodat de nieuwe klant direct verschijnt in de pending-lijst
  await refreshCustomers(currentFilters.value)
}

// --- Filter to uninvited / not-yet-accepted customers ---
// Server-side filter applies accepted=false, so customers.value is already
// the pending set. The computed alias keeps the rest of the template stable.
const pending = computed(() => customers.value)

// --- Selection state ---
const selected = ref<Set<string>>(new Set())
function toggle(id: string) {
  const next = new Set(selected.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selected.value = next
}
function toggleAll() {
  if (selected.value.size === filteredPending.value.length) {
    selected.value = new Set()
  } else {
    selected.value = new Set(filteredPending.value.map(c => c.id))
  }
}
const allSelected = computed(() =>
  filteredPending.value.length > 0 && selected.value.size === filteredPending.value.length,
)

// --- Filters ---
const searchQuery = ref('')
const ageFilter = ref<'all' | '7d' | '30d' | '90d'>('all')
const moduleFilter = ref<string | 'all'>('all')
const batchFilter = ref<'all' | 'never_mailed' | 'mailed_30d'>('all')

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

// Search + module filter are applied server-side. Age + batch_filter stay
// client-side: they depend on data we already enriched per row and don't gain
// from going server-side.
const filteredPending = computed(() => {
  let list = pending.value
  if (ageFilter.value !== 'all') {
    const cutoffDays = { '7d': 7, '30d': 30, '90d': 90 }[ageFilter.value]!
    list = list.filter(c => {
      const d = daysSince(c.created_at)
      return d !== null && d <= cutoffDays
    })
  }
  if (batchFilter.value === 'never_mailed') {
    list = list.filter(c => !c.latest_batch)
  } else if (batchFilter.value === 'mailed_30d') {
    list = list.filter(c => {
      const d = daysSince(c.latest_batch?.created_at)
      return d !== null && d <= 30
    })
  }
  return list
})

// Server-side re-fetch on search / module change with debounce
let searchTimer: number | undefined
const currentFilters = computed(() => ({
  accepted: 'false' as const,
  q: searchQuery.value || undefined,
  module: moduleFilter.value === 'all' ? undefined : moduleFilter.value,
}))

function refetchPending() {
  if (searchTimer) window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    refreshCustomers(currentFilters.value)
  }, 250) as unknown as number
}

watch([searchQuery, moduleFilter], refetchPending)

onMounted(() => refreshCustomers(currentFilters.value))

function handleLoadMore() {
  loadMoreCustomers(currentFilters.value)
}

// --- Recent batches (sidebar) ---
interface BatchRow { id: string; name: string; description: string | null; customer_count: number; mailchimp_tag: string | null; created_at: string }
const batches = ref<BatchRow[]>([])
const batchesLoading = ref(false)

async function loadBatches() {
  batchesLoading.value = true
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    const headers = session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined
    batches.value = await $fetch<BatchRow[]>('/api/partners/mailing-batches', { headers })
  } catch { /* silent */ } finally {
    batchesLoading.value = false
  }
}
onMounted(loadBatches)

// --- Create-batch modal ---
const showCreate = ref(false)
const creating = ref(false)
const createError = ref('')
const batchName = ref('')
const batchTag = ref('')
const ignoreRecentDups = ref(true)

function suggestBatchName(): string {
  const n = selectedCustomers.value.length
  const date = new Date().toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })
  return `Uitnodigingen ${date} — ${n} ${n === 1 ? 'klant' : 'klanten'}`
}

function openCreate() {
  if (!selected.value.size) return
  batchName.value = suggestBatchName()
  batchTag.value = ''
  ignoreRecentDups.value = true
  createError.value = ''
  showCreate.value = true
}

const selectedCustomers = computed(() =>
  filteredPending.value.filter(c => selected.value.has(c.id)),
)

const recentlyMailedSelected = computed(() =>
  selectedCustomers.value.filter(c => {
    const d = daysSince(c.latest_batch?.created_at)
    return d !== null && d <= 30
  }),
)

const finalCustomerIds = computed(() =>
  ignoreRecentDups.value
    ? selectedCustomers.value
        .filter(c => {
          const d = daysSince(c.latest_batch?.created_at)
          return d === null || d > 30
        })
        .map(c => c.id)
    : selectedCustomers.value.map(c => c.id),
)

async function submitBatch() {
  if (creating.value) return
  if (!batchName.value.trim()) { createError.value = 'Geef de batch een naam'; return }
  if (!finalCustomerIds.value.length) { createError.value = 'Geen klanten over na filtering'; return }

  creating.value = true
  createError.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    const blob: Blob = await $fetch('/api/partners/mailing-batches', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: {
        name: batchName.value.trim(),
        mailchimp_tag: batchTag.value.trim() || null,
        customer_ids: finalCustomerIds.value,
        segment_filter: {
          age: ageFilter.value,
          module: moduleFilter.value,
          batch: batchFilter.value,
          search: searchQuery.value || null,
          ignore_recent_dups: ignoreRecentDups.value,
        },
      },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = batchName.value.replace(/[^A-Za-z0-9-_]+/g, '-').slice(0, 60) || 'batch'
    a.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    showCreate.value = false
    selected.value = new Set()
    await loadBatches()
  } catch (e: any) {
    // When responseType:'blob' is set, ofetch can swallow the JSON body of
    // error responses. Re-parse the blob (if present) to surface the real
    // server message instead of a bare "500".
    let msg = e?.data?.message || e?.message
    const blob: Blob | undefined = e?.response?._data || (e?.data instanceof Blob ? e.data : undefined)
    if ((!msg || msg === 'Failed to fetch') && blob && typeof blob.text === 'function') {
      try {
        const text = await blob.text()
        const parsed = JSON.parse(text)
        msg = parsed?.message || parsed?.statusMessage || msg
      } catch { /* swallow */ }
    }
    createError.value = msg || `Aanmaken mislukt (HTTP ${e?.response?.status || '500'})`
  } finally {
    creating.value = false
  }
}

// --- Send single invitation to one customer (uses existing welcome-mail flow) ---
const sendingForId = ref<string | null>(null)
const sendResult = ref<{ id: string; type: 'success' | 'error'; text: string } | null>(null)

async function sendOneInvite(c: Customer) {
  if (sendingForId.value) return
  const ok = await confirm({
    title: 'Uitnodiging versturen?',
    message: `${c.full_name || c.email}\n\nDe klant krijgt nu een mail met een persoonlijke inloglink, 30 dagen geldig.`,
    confirmLabel: 'Versturen',
  })
  if (!ok) return

  sendingForId.value = c.id
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    const res = await $fetch<{ sent: boolean; to: string }>(
      `/api/customers/${c.id}/send-welcome`,
      { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } },
    )
    sendResult.value = { id: c.id, type: 'success', text: `Uitnodiging verstuurd naar ${res.to}` }
    setTimeout(() => { if (sendResult.value?.id === c.id) sendResult.value = null }, 4000)
  } catch (e: any) {
    sendResult.value = { id: c.id, type: 'error', text: e?.data?.message || e?.message || 'Versturen mislukt' }
    setTimeout(() => { if (sendResult.value?.id === c.id) sendResult.value = null }, 5000)
  } finally {
    sendingForId.value = null
  }
}

async function redownload(batch: BatchRow) {
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    const blob: Blob = await $fetch(`/api/partners/mailing-batches/${batch.id}/download`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
      responseType: 'blob',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const safeName = batch.name.replace(/[^A-Za-z0-9-_]+/g, '-').slice(0, 60) || 'batch'
    a.download = `${safeName}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('Re-download mislukt:', e)
  }
}

// --- Module filter options derived from data ---
const moduleOptions = computed(() => {
  const set = new Set<string>()
  for (const c of pending.value) {
    for (const cat of (c.product_categories || [])) set.add(cat)
  }
  return Array.from(set)
})

const MODULE_LABEL: Record<string, string> = {
  solar_panel: 'Zonnepanelen',
  heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal',
  battery: 'Thuisbatterij',
}

function relativeDays(iso: string | null | undefined): string {
  const d = daysSince(iso)
  if (d === null) return ''
  if (d === 0) return 'vandaag'
  if (d === 1) return 'gisteren'
  if (d < 30) return `${d} dgn geleden`
  if (d < 365) return `${Math.floor(d / 30)} mnd geleden`
  return `${Math.floor(d / 365)} jr geleden`
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Uitnodigingen</h1>
        <p class="mt-1 text-sm text-gray-500">
          Klanten die nog geen akkoord hebben gegeven. Nodig één klant tegelijk uit, of exporteer een batch naar Mailchimp.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          :disabled="!selected.size"
          @click="openCreate"
        >
          <AppIcon name="send" :size="14" />
          Maak mailing-batch
          <span v-if="selected.size" class="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs">{{ selected.size }}</span>
        </button>
        <button class="btn-primary" @click="showOnboardModal = true">
          <AppIcon name="plus" :size="14" />
          Klant uitnodigen
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
      <!-- Main content: filters + list -->
      <div>
        <!-- Filters -->
        <div class="mb-4 rounded-xl border border-gray-100 bg-white p-3">
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative flex-1 min-w-[200px]">
              <AppIcon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                v-model="searchQuery"
                type="search"
                class="input pl-8 text-sm"
                placeholder="Zoek op naam, e-mail of plaats"
              />
            </div>
            <select v-model="ageFilter" class="input text-sm w-auto">
              <option value="all">Alle leeftijden</option>
              <option value="7d">Aangemaakt &le; 7 dgn</option>
              <option value="30d">Aangemaakt &le; 30 dgn</option>
              <option value="90d">Aangemaakt &le; 90 dgn</option>
            </select>
            <select v-model="moduleFilter" class="input text-sm w-auto">
              <option value="all">Alle modules</option>
              <option v-for="m in moduleOptions" :key="m" :value="m">{{ MODULE_LABEL[m] || m }}</option>
            </select>
            <select v-model="batchFilter" class="input text-sm w-auto">
              <option value="all">Mailing-historie: alles</option>
              <option value="never_mailed">Nog nooit gemaild</option>
              <option value="mailed_30d">Gemaild laatste 30 dgn</option>
            </select>
          </div>
        </div>

        <!-- Counter + select-all -->
        <div class="mb-2 flex items-center justify-between px-1 text-xs text-gray-500">
          <span>
            <strong class="text-gray-700">{{ filteredPending.length }}</strong>
            {{ filteredPending.length === 1 ? 'klant' : 'klanten' }} zonder akkoord
            <span v-if="selected.size">· {{ selected.size }} geselecteerd</span>
          </span>
          <button
            v-if="filteredPending.length"
            class="font-medium text-gray-700 hover:text-gray-900"
            @click="toggleAll"
          >
            {{ allSelected ? 'Selectie wissen' : 'Selecteer alle' }}
          </button>
        </div>

        <!-- List -->
        <div v-if="customersLoading" class="rounded-xl border border-gray-100 bg-white p-12 text-center">
          <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
        </div>
        <div v-else-if="!filteredPending.length" class="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
          <AppIcon name="mail" :size="32" class="mx-auto text-gray-300 mb-2" />
          <p class="text-sm text-gray-500">Geen klanten zonder akkoord met deze filters.</p>
        </div>
        <div v-else class="overflow-hidden rounded-xl border border-gray-100 bg-white">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400">
                <th class="px-3 py-2.5 w-10"></th>
                <th class="px-3 py-2.5">Naam</th>
                <th class="px-3 py-2.5">E-mail</th>
                <th class="px-3 py-2.5">Modules</th>
                <th class="px-3 py-2.5">Aangemaakt</th>
                <th class="px-3 py-2.5">Laatste batch</th>
                <th class="px-3 py-2.5 w-32 text-right">Actie</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-50">
              <tr
                v-for="c in filteredPending"
                :key="c.id"
                class="cursor-pointer hover:bg-gray-50/60"
                :class="{ 'bg-blue-50/40': selected.has(c.id) }"
                @click="toggle(c.id)"
              >
                <td class="px-3 py-2.5">
                  <input
                    type="checkbox"
                    :checked="selected.has(c.id)"
                    class="h-4 w-4 cursor-pointer"
                    @click.stop="toggle(c.id)"
                  />
                </td>
                <td class="px-3 py-2.5 font-medium text-gray-900">{{ c.full_name || '—' }}</td>
                <td class="px-3 py-2.5 text-gray-600">{{ c.email }}</td>
                <td class="px-3 py-2.5">
                  <span
                    v-for="cat in (c.product_categories || [])"
                    :key="cat"
                    class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 mr-1"
                  >
                    {{ MODULE_LABEL[cat] || cat }}
                  </span>
                </td>
                <td class="px-3 py-2.5 text-xs text-gray-500">{{ relativeDays(c.created_at) }}</td>
                <td class="px-3 py-2.5">
                  <span v-if="c.latest_batch" class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700" :title="c.latest_batch.name">
                    <AppIcon name="clock" :size="10" />
                    {{ relativeDays(c.latest_batch.created_at) }}
                  </span>
                  <span v-else class="text-[11px] text-gray-400">Nooit gemaild</span>
                </td>
                <td class="px-3 py-2.5 text-right">
                  <div v-if="sendResult && sendResult.id === c.id" class="inline-flex items-center gap-1 text-[11px] font-medium"
                       :class="sendResult.type === 'success' ? 'text-green-600' : 'text-red-600'">
                    <AppIcon :name="sendResult.type === 'success' ? 'check-circle' : 'alert-circle'" :size="12" />
                    {{ sendResult.type === 'success' ? 'Verstuurd' : 'Mislukt' }}
                  </div>
                  <button
                    v-else
                    class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    :disabled="sendingForId === c.id"
                    :title="c.latest_batch ? `Laatste mail: ${c.latest_batch.name}` : 'Nog niet eerder uitgenodigd'"
                    @click.stop="sendOneInvite(c)"
                  >
                    <svg v-if="sendingForId === c.id" class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <AppIcon v-else name="send" :size="11" />
                    {{ sendingForId === c.id ? 'Bezig...' : 'Stuur uitnodiging' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="customersHasMore" class="mt-2 text-center">
          <button
            class="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
            :disabled="customersLoading"
            @click="handleLoadMore"
          >
            {{ customersLoading ? 'Laden...' : `Toon volgende ${Math.min(100, customersTotal - pending.length)} klanten` }}
          </button>
        </div>
      </div>

      <!-- Sidebar: recent batches -->
      <aside class="rounded-xl border border-gray-100 bg-white p-4">
        <h2 class="text-sm font-semibold text-gray-900 mb-3">Eerdere batches</h2>
        <div v-if="batchesLoading" class="py-6 text-center">
          <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
        </div>
        <div v-else-if="!batches.length" class="text-xs text-gray-400 py-2">
          Nog geen batches verstuurd.
        </div>
        <ul v-else class="space-y-2">
          <li
            v-for="b in batches"
            :key="b.id"
            class="rounded-lg border border-gray-100 p-2.5 hover:bg-gray-50"
          >
            <p class="text-xs font-semibold text-gray-900">{{ b.name }}</p>
            <p class="mt-0.5 text-[11px] text-gray-500">
              {{ b.customer_count }} {{ b.customer_count === 1 ? 'klant' : 'klanten' }} · {{ relativeDays(b.created_at) }}
            </p>
            <p v-if="b.mailchimp_tag" class="mt-0.5 text-[10px] text-gray-400 font-mono">
              tag: {{ b.mailchimp_tag }}
            </p>
            <button
              class="mt-2 text-[11px] font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              @click="redownload(b)"
            >
              <AppIcon name="external" :size="10" />
              Download opnieuw
            </button>
          </li>
        </ul>
      </aside>
    </div>

    <!-- Create modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showCreate"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
          @click.self="showCreate = false"
        >
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <div class="border-b border-gray-100 px-6 py-4">
              <h3 class="text-lg font-semibold text-gray-900">Nieuwe mailing-batch</h3>
              <p class="mt-1 text-sm text-gray-500">
                Snapshot van wie er in deze mailing zit. De CSV download daarna direct.
              </p>
            </div>

            <div class="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div>
                <label class="label">Batch-naam</label>
                <input v-model="batchName" type="text" class="input" />
                <p class="mt-1 text-xs text-gray-400">Verschijnt later in de batch-historie. Tip: noem de aanleiding (bv. "Weheat-import mei", "Q2 herinnering").</p>
              </div>

              <div>
                <label class="label">Mailchimp-tag <span class="text-gray-400 font-normal">(optioneel)</span></label>
                <input v-model="batchTag" type="text" class="input" placeholder="upsol-batch-mei-2026" />
                <p class="mt-1 text-xs text-gray-400">Wordt als extra kolom in het CSV gezet. Handig om in Mailchimp opvolg-segmenten te maken.</p>
              </div>

              <!-- Selection summary -->
              <div class="rounded-xl border border-gray-200 bg-gray-50 p-3">
                <p class="text-xs font-semibold text-gray-700 mb-2">In deze batch</p>
                <p class="text-sm text-gray-900">
                  <strong>{{ finalCustomerIds.length }}</strong>
                  {{ finalCustomerIds.length === 1 ? 'klant' : 'klanten' }} krijgen een persoonlijke inloglink in het CSV.
                </p>

                <!-- Duplicate warning -->
                <div v-if="recentlyMailedSelected.length" class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs">
                  <p class="font-semibold text-amber-900 mb-1">
                    <AppIcon name="alert-circle" :size="12" class="inline -mt-0.5" />
                    {{ recentlyMailedSelected.length }} {{ recentlyMailedSelected.length === 1 ? 'klant zat' : 'klanten zaten' }} al in een recente batch
                  </p>
                  <ul class="ml-4 list-disc text-amber-800">
                    <li v-for="c in recentlyMailedSelected.slice(0, 5)" :key="c.id">
                      {{ c.full_name || c.email }} — {{ c.latest_batch?.name }} ({{ relativeDays(c.latest_batch?.created_at) }})
                    </li>
                    <li v-if="recentlyMailedSelected.length > 5" class="list-none text-amber-700 italic">
                      en nog {{ recentlyMailedSelected.length - 5 }} ander{{ recentlyMailedSelected.length - 5 === 1 ? 'e' : 'en' }}
                    </li>
                  </ul>
                  <label class="mt-2 flex items-center gap-2 cursor-pointer">
                    <input v-model="ignoreRecentDups" type="checkbox" class="h-3.5 w-3.5" />
                    <span class="font-medium text-amber-900">Sluit deze {{ recentlyMailedSelected.length }} uit (aanbevolen)</span>
                  </label>
                </div>
              </div>

              <!-- Safety warning -->
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                <p class="font-semibold mb-1 text-gray-800">Behandel het CSV als gevoelig</p>
                <p>De inloglinks geven volledige toegang tot een klantportaal. Bewaar het bestand niet langer dan nodig en deel het alleen binnen je mail-tool.</p>
              </div>

              <p v-if="createError" class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                {{ createError }}
              </p>
            </div>

            <div class="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3">
              <button class="btn-secondary" @click="showCreate = false">Annuleren</button>
              <button
                class="btn-primary"
                :disabled="creating || !finalCustomerIds.length || !batchName.trim()"
                @click="submitBatch"
              >
                <AppIcon v-if="!creating" name="external" :size="14" />
                {{ creating ? 'Aanmaken...' : 'Maak batch + download' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Klant uitnodigen (= klantrecord + welkomstmail) -->
    <OnboardModal v-model="showOnboardModal" @onboarded="handleOnboarded" />

    <!-- Toast voor net-uitgenodigde klant -->
    <Teleport to="body">
      <Transition name="toast">
        <div
          v-if="onboardToast"
          class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg"
        >
          {{ onboardToast }}
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }

.toast-enter-active, .toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 12px); }

/* Virtualize the invitation list — skip layout + paint of rows outside the
 * viewport. Each row is ~44px (single-line). */
tbody tr {
  content-visibility: auto;
  contain-intrinsic-size: 1px 44px;
}
</style>
