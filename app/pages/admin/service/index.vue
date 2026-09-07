<script setup lang="ts">
import { formatTicketRef } from '~/utils/formatters'
import { labelChip, type TicketLabel } from '~/utils/ticket-labels'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { customers } = useCustomers()
const router = useRouter()
const route = useRoute()

interface LatestMsg { id: string; role: 'customer' | 'installer'; text: string; at: string; author_name?: string | null }

interface Ticket {
  id: string
  subject: string
  description: string | null
  status: string
  urgency: string
  module_type: string | null
  response: string | null
  created_at: string
  updated_at: string
  latest_message: LatestMsg | null
  message_count: number
  labels?: TicketLabel[]
  customer: { id: string; full_name: string | null; email: string; phone?: string | null } | null
}

const tickets = ref<Ticket[]>([])
const isLoading = ref(true)
const showCreateModal = ref(false)
const { onMouseDown: onCreateBackdropDown, onClick: onCreateBackdropClick } = useBackdropClose(() => { showCreateModal.value = false })

const activeFilter = ref<'alle' | 'nieuw' | 'in_behandeling' | 'opgelost'>('nieuw')
const searchQuery = ref('')

async function getAuthHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function loadTickets() {
  isLoading.value = true
  try {
    const headers = await getAuthHeaders()
    tickets.value = await $fetch<Ticket[]>('/api/tickets', { headers })
  } catch {
    tickets.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(loadTickets)

// Normalize legacy 'open' status to 'nieuw' for display
function normStatus(s: string) {
  return s === 'open' ? 'nieuw' : s
}

// Counters per filter
const counts = computed(() => {
  const c = { alle: tickets.value.length, nieuw: 0, in_behandeling: 0, opgelost: 0 }
  for (const t of tickets.value) {
    const s = normStatus(t.status)
    if (s === 'nieuw') c.nieuw++
    else if (s === 'in_behandeling') c.in_behandeling++
    else if (s === 'opgelost' || s === 'gesloten') c.opgelost++
  }
  return c
})

const filteredTickets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return tickets.value.filter(t => {
    const s = normStatus(t.status)
    if (activeFilter.value === 'nieuw' && s !== 'nieuw') return false
    if (activeFilter.value === 'in_behandeling' && s !== 'in_behandeling') return false
    if (activeFilter.value === 'opgelost' && s !== 'opgelost' && s !== 'gesloten') return false
    if (!q) return true
    const haystack = [
      t.subject || '',
      t.description || '',
      t.latest_message?.text || '',
      t.customer?.full_name || '',
      t.customer?.email || '',
    ].join(' ').toLowerCase()
    return haystack.includes(q)
  })
})

/** Label to show in the list: who sent the most recent message, and what. */
function lastMessagePreview(t: Ticket): { who: string; text: string; isCustomer: boolean } {
  if (t.latest_message) {
    const who = t.latest_message.role === 'customer'
      ? (t.customer?.full_name || 'Klant')
      : 'Jullie'
    return { who, text: t.latest_message.text, isCustomer: t.latest_message.role === 'customer' }
  }
  return { who: t.customer?.full_name || 'Klant', text: t.description || '', isCustomer: true }
}

/** True when the newest activity is from the customer — needs a reply. */
function awaitsReply(t: Ticket): boolean {
  if (t.status === 'opgelost' || t.status === 'gesloten') return false
  // No messages yet → the opening description counts as the customer waiting
  if (!t.latest_message) return true
  return t.latest_message.role === 'customer'
}

// --- Create ticket modal ---
const createForm = ref({ customer_id: '', subject: '', description: '', urgency: 'normaal', module_type: '' })
const creating = ref(false)
const createError = ref('')

function openCreate(customerId?: string) {
  const prefill = customerId || (route.query.customer as string) || ''
  createForm.value = { customer_id: prefill, subject: '', description: '', urgency: 'normaal', module_type: '' }
  createError.value = ''
  showCreateModal.value = true
}

// Auto-open create modal when arriving with ?customer=...
if (route.query.customer) {
  onMounted(() => openCreate(route.query.customer as string))
}

async function submitCreate() {
  if (!createForm.value.customer_id || !createForm.value.subject) return
  creating.value = true
  createError.value = ''
  try {
    const headers = await getAuthHeaders()
    const ticket = await $fetch<Ticket>('/api/tickets', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: createForm.value,
    })
    tickets.value.unshift(ticket)
    showCreateModal.value = false
    router.push(`/admin/service/${ticket.id}`)
  } catch (e: any) {
    createError.value = e?.data?.message || 'Aanmaken mislukt'
  } finally {
    creating.value = false
  }
}

// --- Visual helpers ---
const statusMeta: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  nieuw:           { label: 'Nieuw',          dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
  in_behandeling:  { label: 'In behandeling', dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700' },
  opgelost:        { label: 'Opgelost',       dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700' },
  gesloten:        { label: 'Gesloten',       dot: 'bg-gray-400',   bg: 'bg-gray-100',  text: 'text-gray-600' },
}

function statusFor(t: Ticket) {
  return statusMeta[normStatus(t.status)] || statusMeta.nieuw
}

const moduleIcons: Record<string, string> = {
  solar: 'solar', heat_pump: 'heat-pump', ev_charger: 'ev-charger', battery: 'battery',
}
const moduleTints: Record<string, { bg: string; text: string }> = {
  solar:     { bg: 'bg-amber-50',   text: 'text-amber-600' },
  heat_pump: { bg: 'bg-orange-50',  text: 'text-orange-600' },
  ev_charger:{ bg: 'bg-sky-50',     text: 'text-sky-600' },
  battery:   { bg: 'bg-violet-50',  text: 'text-violet-600' },
}

function moduleIcon(m: string | null) { return m && moduleIcons[m] || 'tool' }
function moduleTint(m: string | null) { return (m && moduleTints[m]) || { bg: 'bg-gray-100', text: 'text-gray-500' } }

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'zojuist'
  if (min < 60) return `${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} uur`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function shortPreview(s: string | null, max = 140) {
  if (!s) return ''
  const clean = s.replace(/\s+/g, ' ').trim()
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean
}

function initials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('')
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-6 flex items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Service</h1>
        <p class="mt-1 text-sm text-gray-500">
          <template v-if="counts.nieuw">
            <span class="font-medium text-blue-700">{{ counts.nieuw }} nieuw</span>
            <span v-if="counts.in_behandeling"> · {{ counts.in_behandeling }} in behandeling</span>
          </template>
          <template v-else-if="counts.in_behandeling">
            {{ counts.in_behandeling }} in behandeling
          </template>
          <template v-else>
            Alle meldingen afgehandeld
          </template>
        </p>
      </div>
      <button
        class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
        @click="openCreate()"
      >
        <AppIcon name="plus" :size="16" />
        Nieuw ticket
      </button>
    </div>

    <!-- Filter tabs + search -->
    <div class="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
      <div class="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button
          v-for="f in [
            { k: 'nieuw',          label: 'Nieuw',          count: counts.nieuw },
            { k: 'in_behandeling', label: 'In behandeling', count: counts.in_behandeling },
            { k: 'opgelost',       label: 'Opgelost',       count: counts.opgelost },
            { k: 'alle',           label: 'Alle',           count: counts.alle },
          ]"
          :key="f.k"
          class="rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
          :class="activeFilter === f.k ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
          @click="activeFilter = f.k as any"
        >
          {{ f.label }} <span class="ml-1 text-xs text-gray-400">({{ f.count }})</span>
        </button>
      </div>

      <div class="relative w-full sm:w-72">
        <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          class="input pl-9"
          placeholder="Zoek op klant, onderwerp..."
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="section py-12 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Empty state -->
    <div v-else-if="filteredTickets.length === 0" class="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
      <AppIcon name="message" :size="32" class="mx-auto text-gray-300 mb-3" />
      <p class="text-sm text-gray-500">
        <template v-if="searchQuery">Geen tickets gevonden voor "{{ searchQuery }}"</template>
        <template v-else-if="activeFilter === 'nieuw'">Geen nieuwe tickets</template>
        <template v-else-if="activeFilter === 'in_behandeling'">Geen tickets in behandeling</template>
        <template v-else-if="activeFilter === 'opgelost'">Nog niets opgelost</template>
        <template v-else>Nog geen tickets</template>
      </p>
      <button v-if="!searchQuery" class="mt-4 text-sm font-medium text-gray-700 hover:text-gray-900" @click="openCreate()">
        + Nieuw ticket aanmaken
      </button>
    </div>

    <!-- Tickets list -->
    <div v-else class="space-y-2">
      <NuxtLink
        v-for="t in filteredTickets"
        :key="t.id"
        :to="`/admin/service/${t.id}`"
        class="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-sm no-underline"
      >
        <!-- Module icon -->
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
          :class="[moduleTint(t.module_type).bg, moduleTint(t.module_type).text]"
        >
          <AppIcon :name="moduleIcon(t.module_type)" :size="20" />
        </div>

        <div class="flex-1 min-w-0">
          <!-- Header row: ticket-nr + subject + badges -->
          <div class="flex items-center gap-2 flex-wrap">
            <span
              v-if="formatTicketRef(t)"
              class="shrink-0 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 tabular-nums"
            >
              #{{ formatTicketRef(t) }}
            </span>
            <p class="truncate font-semibold text-gray-900 text-sm">{{ t.subject }}</p>
            <span
              class="shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
              :class="[statusFor(t).bg, statusFor(t).text]"
            >
              <span class="h-1.5 w-1.5 rounded-full" :class="statusFor(t).dot" />
              {{ statusFor(t).label }}
            </span>
            <span v-if="t.urgency === 'hoog'" class="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700">
              <AppIcon name="alert-circle" :size="10" />
              Urgent
            </span>
          </div>

          <!-- Customer row -->
          <div class="mt-1 flex items-center gap-2 text-xs text-gray-500">
            <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600">
              {{ initials(t.customer?.full_name) }}
            </div>
            <span class="truncate">{{ t.customer?.full_name || 'Onbekend' }}</span>
            <span class="text-gray-300">·</span>
            <span class="shrink-0">{{ timeAgo(t.updated_at) }}</span>
          </div>

          <!-- Labels -->
          <div v-if="t.labels && t.labels.length" class="mt-2 flex flex-wrap gap-1">
            <span
              v-for="l in t.labels"
              :key="l.id"
              class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
              :class="[labelChip(l.color).bg, labelChip(l.color).text]"
            >
              <span class="h-1 w-1 rounded-full" :class="labelChip(l.color).dot" />
              {{ l.name }}
            </span>
          </div>

          <!-- Message preview + thread count + awaits-reply dot -->
          <div class="mt-2 flex items-center gap-2 min-w-0">
            <span
              v-if="awaitsReply(t)"
              class="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800"
              title="Wacht op je reactie"
            >
              <span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Reactie nodig
            </span>
            <p class="truncate text-xs text-gray-500">
              <span class="font-medium text-gray-700">{{ lastMessagePreview(t).who }}:</span>
              {{ shortPreview(lastMessagePreview(t).text) }}
            </p>
            <span v-if="t.message_count > 0" class="shrink-0 text-[11px] text-gray-400">
              · {{ t.message_count }} {{ t.message_count === 1 ? 'reactie' : 'reacties' }}
            </span>
          </div>
        </div>

        <AppIcon name="chevron-right" :size="16" class="shrink-0 text-gray-300 mt-2" />
      </NuxtLink>
    </div>

    <!-- === Create ticket modal === -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" @mousedown="onCreateBackdropDown" @click="onCreateBackdropClick">
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
          <div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden">
            <div class="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Nieuw ticket</h3>
              <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" @click="showCreateModal = false">
                <AppIcon name="x" :size="18" />
              </button>
            </div>

            <form @submit.prevent="submitCreate" class="px-6 py-5 space-y-4">
              <div>
                <label class="label">Klant <span class="text-red-400">*</span></label>
                <select v-model="createForm.customer_id" class="input" required>
                  <option value="" disabled>Selecteer klant...</option>
                  <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.full_name || c.email }}</option>
                </select>
              </div>
              <div>
                <label class="label">Onderwerp <span class="text-red-400">*</span></label>
                <input v-model="createForm.subject" type="text" class="input" placeholder="Bijv. Storing zonnepanelen" required />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="label">Module</label>
                  <select v-model="createForm.module_type" class="input">
                    <option value="">Algemeen</option>
                    <option value="solar">Zonnepanelen</option>
                    <option value="heat_pump">Warmtepomp</option>
                    <option value="ev_charger">Laadpaal</option>
                    <option value="battery">Batterij</option>
                  </select>
                </div>
                <div>
                  <label class="label">Urgentie</label>
                  <select v-model="createForm.urgency" class="input">
                    <option value="laag">Laag</option>
                    <option value="normaal">Normaal</option>
                    <option value="hoog">Hoog</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="label">Omschrijving</label>
                <textarea v-model="createForm.description" class="input" rows="3" placeholder="Beschrijf het probleem..." />
              </div>
              <p v-if="createError" class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ createError }}</p>
            </form>

            <div class="border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <button class="btn-secondary" @click="showCreateModal = false">Annuleren</button>
              <button
                class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                :disabled="!createForm.customer_id || !createForm.subject || creating"
                @click="submitCreate"
              >
                <AppIcon name="plus" :size="16" />
                {{ creating ? 'Aanmaken...' : 'Ticket aanmaken' }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
