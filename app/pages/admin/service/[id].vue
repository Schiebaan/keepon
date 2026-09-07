<script setup lang="ts">
import { formatTicketRef } from '~/utils/formatters'
import { labelChip, type TicketLabel } from '~/utils/ticket-labels'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const route = useRoute()
const ticketId = route.params.id as string
const { partner } = usePartner()

interface TicketMessage {
  id: string
  role: 'customer' | 'installer'
  text: string
  at: string
  author_name?: string | null
}

interface Ticket {
  id: string
  subject: string
  description: string | null
  status: string
  urgency: string
  module_type: string | null
  response: string | null
  helped_by_name: string | null
  created_at: string
  updated_at: string
  messages: TicketMessage[]
  labels?: TicketLabel[]
  customer: {
    id: string; full_name: string | null; email: string; phone?: string | null
    street?: string | null; house_number?: string | null; postal_code?: string | null; city?: string | null
  } | null
}

const ticket = ref<Ticket | null>(null)
const isLoading = ref(true)
const loadError = ref('')

const replyText = ref('')
const isSending = ref(false)
const sendError = ref('')
const flash = ref('')

// Inline edit state
const isEditing = ref(false)
const editForm = ref({ subject: '', description: '' })
const editSaving = ref(false)

async function getAuthHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

async function loadTicket() {
  isLoading.value = true
  loadError.value = ''
  try {
    ticket.value = await $fetch<Ticket>(`/api/tickets/${ticketId}`, { headers: await authHeaders() })
  } catch (e: any) {
    loadError.value = e?.data?.message || 'Ticket niet gevonden'
  } finally {
    isLoading.value = false
  }
}
const authHeaders = getAuthHeaders

onMounted(loadTicket)

// --- Actions ---
function showFlash(msg: string) {
  flash.value = msg
  setTimeout(() => { if (flash.value === msg) flash.value = '' }, 2500)
}

async function sendReply() {
  if (!replyText.value.trim() || isSending.value) return
  isSending.value = true
  sendError.value = ''
  try {
    const updated = await $fetch<Ticket>(`/api/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: { text: replyText.value },
    })
    ticket.value = updated
    replyText.value = ''
    showFlash('Reactie verstuurd · klant is gemaild')
  } catch (e: any) {
    sendError.value = e?.data?.message || 'Versturen mislukt'
  } finally {
    isSending.value = false
  }
}

async function updateTicket(updates: Record<string, any>, label?: string) {
  try {
    ticket.value = await $fetch<Ticket>(`/api/tickets/${ticketId}`, {
      method: 'PUT',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: updates,
    })
    if (label) showFlash(label)
  } catch (e: any) {
    sendError.value = e?.data?.message || 'Opslaan mislukt'
  }
}

async function changeStatus(status: string) {
  const labelByStatus: Record<string, string> = {
    nieuw: 'Heropend',
    in_behandeling: 'In behandeling',
    opgelost: 'Opgelost',
    gesloten: 'Gesloten',
  }
  await updateTicket({ status }, `Status: ${labelByStatus[status] || status}`)
}

async function changeUrgency(urgency: string) {
  await updateTicket({ urgency }, 'Urgentie bijgewerkt')
}

// --- Labels ---
const labelCatalog = ref<TicketLabel[]>([])
const showLabelPicker = ref(false)
const labelSaving = ref(false)

async function loadLabelCatalog() {
  try {
    labelCatalog.value = await $fetch<TicketLabel[]>('/api/partners/ticket-labels', { headers: await authHeaders() })
  } catch { labelCatalog.value = [] }
}
onMounted(loadLabelCatalog)

const assignedLabelIds = computed(() => new Set((ticket.value?.labels || []).map(l => l.id)))

async function toggleLabel(labelId: string) {
  if (!ticket.value || labelSaving.value) return
  const current = new Set(assignedLabelIds.value)
  current.has(labelId) ? current.delete(labelId) : current.add(labelId)
  labelSaving.value = true
  try {
    const res = await $fetch<{ ok: boolean; labels: TicketLabel[] }>(
      `/api/tickets/${ticketId}/labels`,
      {
        method: 'PUT',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
        body: { label_ids: [...current] },
      },
    )
    if (ticket.value) ticket.value.labels = res.labels
  } catch (e: any) {
    sendError.value = e?.data?.message || 'Label bijwerken mislukt'
  } finally {
    labelSaving.value = false
  }
}

// Edit subject + description
function startEdit() {
  if (!ticket.value) return
  editForm.value = {
    subject: ticket.value.subject || '',
    description: ticket.value.description || '',
  }
  isEditing.value = true
}
async function saveEdit() {
  if (!editForm.value.subject.trim()) return
  editSaving.value = true
  try {
    await updateTicket({
      subject: editForm.value.subject,
      description: editForm.value.description,
    }, 'Ticket bijgewerkt')
    isEditing.value = false
  } finally {
    editSaving.value = false
  }
}
function cancelEdit() { isEditing.value = false }

// Keyboard: Cmd/Ctrl+Enter = send reply
function onKeydown(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault()
    if (replyText.value.trim()) sendReply()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// --- Visual helpers ---
const statusMeta: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  nieuw:           { label: 'Nieuw',          dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
  open:            { label: 'Nieuw',          dot: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700' },
  in_behandeling:  { label: 'In behandeling', dot: 'bg-amber-500',  bg: 'bg-amber-50',  text: 'text-amber-700' },
  opgelost:        { label: 'Opgelost',       dot: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700' },
  gesloten:        { label: 'Gesloten',       dot: 'bg-gray-400',   bg: 'bg-gray-100',  text: 'text-gray-600' },
}
const urgencyMeta: Record<string, { label: string; bg: string; text: string }> = {
  laag:    { label: 'Laag',    bg: 'bg-gray-50',  text: 'text-gray-500' },
  normaal: { label: 'Normaal', bg: 'bg-blue-50',  text: 'text-blue-700' },
  hoog:    { label: 'Hoog',    bg: 'bg-red-50',   text: 'text-red-700' },
}
const moduleIcons: Record<string, string> = { solar: 'solar', heat_pump: 'heat-pump', ev_charger: 'ev-charger', battery: 'battery' }
const moduleLabels: Record<string, string> = { solar: 'Zonnepanelen', heat_pump: 'Warmtepomp', ev_charger: 'Laadpaal', battery: 'Batterij' }
const moduleTints: Record<string, { bg: string; text: string }> = {
  solar:     { bg: 'bg-amber-50',   text: 'text-amber-600' },
  heat_pump: { bg: 'bg-orange-50',  text: 'text-orange-600' },
  ev_charger:{ bg: 'bg-sky-50',     text: 'text-sky-600' },
  battery:   { bg: 'bg-violet-50',  text: 'text-violet-600' },
}
function moduleIcon(m: string | null) { return m && moduleIcons[m] || 'tool' }
function moduleTint(m: string | null) { return (m && moduleTints[m]) || { bg: 'bg-gray-100', text: 'text-gray-500' } }
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'zojuist'
  if (min < 60) return `${min} min geleden`
  const h = Math.round(min / 60)
  if (h < 24) return `${h} uur geleden`
  const d = Math.round(h / 24)
  if (d < 7) return `${d} dag${d === 1 ? '' : 'en'} geleden`
  return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}
function initials(name: string | null | undefined) {
  if (!name) return '?'
  return name.split(' ').map(p => p.charAt(0).toUpperCase()).slice(0, 2).join('')
}
const customerAddress = computed(() => {
  const c = ticket.value?.customer
  if (!c?.street || !c?.house_number) return null
  return `${c.street} ${c.house_number}, ${c.postal_code || ''} ${c.city || ''}`.replace(/\s+/g, ' ').trim()
})

const isClosed = computed(() => ticket.value?.status === 'opgelost' || ticket.value?.status === 'gesloten')
</script>

<template>
  <div>
    <NuxtLink to="/admin/service" class="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 no-underline">
      <AppIcon name="chevron-right" :size="14" class="rotate-180" />
      Terug naar service
    </NuxtLink>

    <div v-if="isLoading" class="py-16 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <div v-else-if="loadError" class="rounded-2xl border border-red-100 bg-red-50 p-6 text-center">
      <AppIcon name="alert-circle" :size="28" class="mx-auto text-red-400 mb-2" />
      <p class="text-sm font-medium text-red-700">{{ loadError }}</p>
    </div>

    <template v-else-if="ticket">
      <!-- Header card -->
      <div class="mb-4 rounded-2xl border border-gray-100 bg-white p-5">
        <div class="flex items-start gap-4">
          <div
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
            :class="[moduleTint(ticket.module_type).bg, moduleTint(ticket.module_type).text]"
          >
            <AppIcon :name="moduleIcon(ticket.module_type)" :size="24" />
          </div>

          <div class="flex-1 min-w-0">
            <!-- Subject (display or edit) -->
            <template v-if="isEditing">
              <input
                v-model="editForm.subject"
                type="text"
                class="input text-lg font-semibold"
                maxlength="200"
                placeholder="Onderwerp"
              />
              <textarea
                v-model="editForm.description"
                class="input mt-2 text-sm"
                rows="4"
                placeholder="Beschrijving"
              />
              <div class="mt-2 flex gap-2">
                <button
                  class="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                  :disabled="editSaving || !editForm.subject.trim()"
                  @click="saveEdit"
                >
                  <AppIcon name="check" :size="12" />
                  Opslaan
                </button>
                <button class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50" @click="cancelEdit">
                  Annuleren
                </button>
              </div>
            </template>
            <template v-else>
              <div class="flex items-start gap-2">
                <h1 class="text-lg font-semibold text-gray-900 flex-1 break-words">{{ ticket.subject }}</h1>
                <button
                  class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Bewerk onderwerp &amp; beschrijving"
                  @click="startEdit"
                >
                  <AppIcon name="settings" :size="14" />
                </button>
              </div>
              <div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                <span
                  class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium"
                  :class="[statusMeta[ticket.status]?.bg || 'bg-gray-100', statusMeta[ticket.status]?.text || 'text-gray-600']"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta[ticket.status]?.dot || 'bg-gray-400'" />
                  {{ statusMeta[ticket.status]?.label || ticket.status }}
                </span>
                <span v-if="ticket.module_type" class="text-gray-500">{{ moduleLabels[ticket.module_type] }}</span>
                <span class="text-gray-400">·</span>
                <span class="text-gray-500">Geopend {{ timeAgo(ticket.created_at) }}</span>
                <span v-if="ticket.updated_at !== ticket.created_at" class="text-gray-400">· bijgewerkt {{ timeAgo(ticket.updated_at) }}</span>
              </div>
            </template>
          </div>

          <!-- Flash message -->
          <Transition name="fade">
            <span
              v-if="flash"
              class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
            >
              <AppIcon name="check" :size="12" />
              {{ flash }}
            </span>
          </Transition>
        </div>
      </div>

      <!-- Main grid: thread + sidebar -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Thread + composer -->
        <div class="lg:col-span-2 space-y-3">
          <!-- Opening message (description) -->
          <div class="rounded-2xl border border-gray-100 bg-white p-5">
            <div class="flex items-start gap-3 mb-2">
              <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                {{ initials(ticket.customer?.full_name) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900">{{ ticket.customer?.full_name || 'Onbekende klant' }}</p>
                <p class="text-xs text-gray-400">Opening · {{ formatDateTime(ticket.created_at) }}</p>
              </div>
            </div>
            <p v-if="ticket.description" class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{{ ticket.description }}</p>
            <p v-else class="text-sm italic text-gray-400">Geen toelichting.</p>
          </div>

          <!-- Thread messages -->
          <div
            v-for="msg in ticket.messages"
            :key="msg.id"
            class="rounded-2xl border p-5"
            :class="msg.role === 'installer'
              ? 'border-amber-100 bg-amber-50/40'
              : 'border-gray-100 bg-white'"
          >
            <div class="flex items-start gap-3 mb-2">
              <div
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                :class="msg.role === 'installer'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700'"
              >
                <AppIcon v-if="msg.role === 'installer'" name="tool" :size="16" />
                <span v-else>{{ initials(msg.author_name || ticket.customer?.full_name) }}</span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900">
                  {{ msg.role === 'installer'
                      ? (msg.author_name ? `${msg.author_name} · ${partner.name}` : partner.name)
                      : (msg.author_name || ticket.customer?.full_name || 'Klant') }}
                </p>
                <p class="text-xs text-gray-400">{{ formatDateTime(msg.at) }}</p>
              </div>
            </div>
            <p class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">{{ msg.text }}</p>
          </div>

          <!-- Composer -->
          <div v-if="!isClosed" class="rounded-2xl border border-gray-100 bg-white p-5">
            <p class="text-sm font-semibold text-gray-900 mb-2">Nieuwe reactie</p>

            <textarea
              v-model="replyText"
              rows="5"
              class="input text-sm"
              placeholder="Typ je reactie. Cmd/Ctrl+Enter om te versturen."
            />

            <p v-if="sendError" class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{{ sendError }}</p>

            <div class="mt-3 flex flex-wrap items-center gap-2">
              <button
                class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"
                :disabled="!replyText.trim() || isSending"
                @click="sendReply"
              >
                <svg v-if="isSending" class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <AppIcon v-else name="send" :size="14" />
                {{ isSending ? 'Versturen...' : 'Verstuur reactie' }}
              </button>

              <button
                v-if="ticket.status !== 'opgelost'"
                class="inline-flex items-center gap-2 rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50"
                @click="changeStatus('opgelost')"
              >
                <AppIcon name="check" :size="14" />
                Markeer als opgelost
              </button>

              <div class="flex-1" />
              <kbd class="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-500">⌘↵</kbd>
            </div>

            <p class="mt-2 text-xs text-gray-400">
              <template v-if="ticket.status === 'nieuw' || ticket.status === 'open'">
                Bij versturen wordt het ticket automatisch op <strong>In behandeling</strong> gezet en krijgt de klant een mail.
              </template>
              <template v-else>
                De klant krijgt direct een mail met je reactie en kan ook weer antwoorden.
              </template>
            </p>
          </div>

          <!-- Closed banner -->
          <div v-else class="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center">
            <p class="text-sm text-gray-600">
              <span class="font-medium text-gray-900">Dit ticket is {{ ticket.status === 'gesloten' ? 'gesloten' : 'opgelost' }}.</span>
              Nieuwe reacties van de klant heropenen het ticket automatisch.
            </p>
            <button
              class="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              @click="changeStatus('in_behandeling')"
            >
              <AppIcon name="zap" :size="14" />
              Heropen ticket
            </button>
          </div>
        </div>

        <!-- Sidebar -->
        <aside class="space-y-4">
          <!-- Customer card -->
          <div class="rounded-2xl border border-gray-100 bg-white p-5">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Klant</p>
            <div class="flex items-center gap-3 mb-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700">
                {{ initials(ticket.customer?.full_name) }}
              </div>
              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-gray-900">{{ ticket.customer?.full_name || 'Onbekend' }}</p>
                <p class="truncate text-xs text-gray-500">{{ ticket.customer?.email }}</p>
              </div>
            </div>

            <div class="space-y-1.5 text-sm">
              <a v-if="ticket.customer?.email" :href="`mailto:${ticket.customer.email}`" class="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <AppIcon name="mail" :size="14" class="text-gray-400" />
                <span class="truncate">{{ ticket.customer.email }}</span>
              </a>
              <a v-if="ticket.customer?.phone" :href="`tel:${ticket.customer.phone}`" class="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <AppIcon name="phone" :size="14" class="text-gray-400" />
                <span>{{ ticket.customer.phone }}</span>
              </a>
              <p v-if="customerAddress" class="flex items-start gap-2 text-gray-600">
                <AppIcon name="home" :size="14" class="text-gray-400 mt-0.5" />
                <span class="text-xs">{{ customerAddress }}</span>
              </p>
            </div>

            <NuxtLink
              v-if="ticket.customer?.id"
              :to="`/admin/customers/${ticket.customer.id}`"
              class="mt-4 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
            >
              Open klantkaart
              <AppIcon name="chevron-right" :size="12" />
            </NuxtLink>
          </div>

          <!-- Labels -->
          <div class="rounded-2xl border border-gray-100 bg-white p-5">
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Labels</p>
              <button
                class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800"
                @click="showLabelPicker = !showLabelPicker"
              >
                <AppIcon :name="showLabelPicker ? 'check' : 'plus'" :size="12" />
                {{ showLabelPicker ? 'Klaar' : 'Wijzig' }}
              </button>
            </div>

            <!-- Toegewezen labels (compact, view-mode) -->
            <div v-if="!showLabelPicker">
              <div v-if="ticket.labels && ticket.labels.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="l in ticket.labels"
                  :key="l.id"
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                  :class="[labelChip(l.color).bg, labelChip(l.color).text]"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="labelChip(l.color).dot" />
                  {{ l.name }}
                </span>
              </div>
              <p v-else class="text-xs text-gray-400">Nog geen labels. Klik op "Wijzig".</p>
            </div>

            <!-- Picker (edit-mode) — toggle uit de catalogus -->
            <div v-else>
              <div v-if="labelCatalog.length" class="flex flex-wrap gap-1.5">
                <button
                  v-for="l in labelCatalog"
                  :key="l.id"
                  type="button"
                  class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all disabled:opacity-50"
                  :class="assignedLabelIds.has(l.id)
                    ? [labelChip(l.color).bg, labelChip(l.color).text, 'ring-1', labelChip(l.color).ring]
                    : 'bg-gray-50 text-gray-400 hover:bg-gray-100'"
                  :disabled="labelSaving"
                  @click="toggleLabel(l.id)"
                >
                  <span class="h-1.5 w-1.5 rounded-full" :class="assignedLabelIds.has(l.id) ? labelChip(l.color).dot : 'bg-gray-300'" />
                  {{ l.name }}
                  <AppIcon v-if="assignedLabelIds.has(l.id)" name="check" :size="10" />
                </button>
              </div>
              <p v-else class="text-xs text-gray-400">
                Nog geen labels ingesteld.
                <NuxtLink to="/admin/settings" class="text-blue-600 hover:underline">Beheer ze in Instellingen.</NuxtLink>
              </p>
            </div>
          </div>

          <!-- Status actions -->
          <div class="rounded-2xl border border-gray-100 bg-white p-5">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Status</p>
            <div class="grid grid-cols-2 gap-1.5">
              <button
                v-for="s in ['nieuw', 'in_behandeling', 'opgelost', 'gesloten']"
                :key="s"
                class="flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors"
                :class="ticket.status === s || (s === 'nieuw' && ticket.status === 'open')
                  ? `${statusMeta[s].bg} ${statusMeta[s].text} border-transparent`
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
                :disabled="ticket.status === s"
                @click="changeStatus(s)"
              >
                <span class="h-1.5 w-1.5 rounded-full" :class="statusMeta[s].dot" />
                {{ statusMeta[s].label }}
              </button>
            </div>
          </div>

          <!-- Urgency -->
          <div class="rounded-2xl border border-gray-100 bg-white p-5">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Urgentie</p>
            <div class="grid grid-cols-3 gap-1.5">
              <button
                v-for="u in ['laag', 'normaal', 'hoog']"
                :key="u"
                class="rounded-lg border px-2 py-2 text-xs font-medium transition-colors"
                :class="ticket.urgency === u
                  ? `${urgencyMeta[u].bg} ${urgencyMeta[u].text} border-transparent`
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'"
                :disabled="ticket.urgency === u"
                @click="changeUrgency(u)"
              >
                {{ urgencyMeta[u].label }}
              </button>
            </div>
          </div>

          <!-- Geholpen door (klant-feedback) -->
          <div
            v-if="ticket.helped_by_name"
            class="rounded-2xl border border-green-100 bg-green-50/60 p-5"
          >
            <p class="flex items-center gap-1.5 text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
              <AppIcon name="check-circle" :size="12" />
              Geholpen door
            </p>
            <p class="text-base font-semibold text-gray-900">{{ ticket.helped_by_name }}</p>
            <p class="mt-1 text-[11px] text-gray-500">Door de klant zelf ingevuld na afronden.</p>
          </div>

          <!-- Details -->
          <div class="rounded-2xl border border-gray-100 bg-white p-5 text-xs space-y-2">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Details</p>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Aangemaakt</span>
              <span class="text-gray-900">{{ formatDateTime(ticket.created_at) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Laatst bijgewerkt</span>
              <span class="text-gray-900">{{ formatDateTime(ticket.updated_at) }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Reacties</span>
              <span class="text-gray-900">{{ ticket.messages.length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-gray-500">Module</span>
              <span class="text-gray-900">{{ ticket.module_type ? moduleLabels[ticket.module_type] : 'Algemeen' }}</span>
            </div>
            <div v-if="formatTicketRef(ticket)" class="flex items-center justify-between">
              <span class="text-gray-500">Ticketnummer</span>
              <span class="text-sm font-semibold text-gray-900">#{{ formatTicketRef(ticket) }}</span>
            </div>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
