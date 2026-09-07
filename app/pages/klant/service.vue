<script setup lang="ts">
import { formatTicketRef } from '~/utils/formatters'

definePageMeta({ layout: 'customer', middleware: ['auth', 'customer-onboarding'] })

const { partner } = usePartner()

// --- Types ---
interface TicketMessage { id: string; role: 'customer' | 'installer'; text: string; at: string; author_name?: string | null }
interface Ticket {
  id: string
  subject: string
  description: string | null
  status: 'nieuw' | 'in_behandeling' | 'opgelost' | 'gesloten' | string
  urgency: string
  module_type: 'solar' | 'heat_pump' | 'ev_charger' | 'battery' | null
  response: string | null
  helped_by_name?: string | null
  messages: TicketMessage[]
  latest_message?: TicketMessage | null
  message_count?: number
  created_at: string
  updated_at: string
}

interface AiMsg {
  id: string
  role: 'customer' | 'ai' | 'installer'
  content: string
  timestamp: string
  author_name?: string | null
  metadata?: {
    systemCheck?: boolean
    dataPoints?: { label: string; value: string }[]
    shouldEscalate?: boolean
    escalateReason?: string
    /** Door de assistent opgestelde ticketinhoud, zodra 'ie genoeg weet. */
    ticketDraft?: { subject: string; description: string; urgency: string; module_type: string | null }
  }
}

interface ChatSession {
  subject: string
  moduleType: string | null
  messages: AiMsg[]
  status: 'actief' | 'ai_opgelost' | 'geescaleerd'
  ticketId?: string       // set when this chat is viewing/linked to a real ticket
  ticketNumber?: number   // partner-scoped human-friendly counter
  ticketStatus?: string   // raw ticket.status — used to gate "wie heeft je geholpen?"
  helpedByName?: string | null
}

// --- State ---
const tickets = ref<Ticket[]>([])
const ticketsLoading = ref(true)
const activeChat = ref<ChatSession | null>(null)
const startInput = ref('')
const messageInput = ref('')
const isAiTyping = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

// Track which ticket updates the user has already seen (unread indicator)
const LAST_SEEN_KEY = 'upsol-ticket-last-seen'
function loadLastSeen(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try { return JSON.parse(localStorage.getItem(LAST_SEEN_KEY) || '{}') } catch { return {} }
}
function saveLastSeen(map: Record<string, string>) {
  if (typeof window !== 'undefined') localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(map))
}
const lastSeen = ref<Record<string, string>>(loadLastSeen())

// --- Helpers ---
async function authHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}
}

function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  })
}

watch(() => activeChat.value?.messages.length, scrollToBottom)

function formatTime(t: string) {
  return new Date(t).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' })
}

function timeAgo(t: string) {
  const then = new Date(t).getTime()
  const diffMin = Math.round((Date.now() - then) / 60000)
  if (diffMin < 1) return 'zojuist'
  if (diffMin < 60) return `${diffMin} min geleden`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `${diffH} uur geleden`
  const diffD = Math.round(diffH / 24)
  if (diffD < 7) return `${diffD} dag${diffD === 1 ? '' : 'en'} geleden`
  return new Date(t).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })
}

function isUnread(t: Ticket): boolean {
  if (t.status === 'gesloten') return false
  // Highlight if the latest message is from the installer AND customer hasn't seen it yet
  const last = t.latest_message
  if (!last || last.role !== 'installer') return false
  const seen = lastSeen.value[t.id]
  return !seen || new Date(seen).getTime() < new Date(last.at || t.updated_at).getTime()
}

function markSeen(id: string, timestamp: string) {
  lastSeen.value[id] = timestamp
  saveLastSeen(lastSeen.value)
}

// --- Quick actions ---
const quickActions = [
  { label: 'Hoe presteren mijn zonnepanelen?', moduleType: 'solar', icon: 'solar' },
  { label: 'Vraag over mijn warmtepomp', moduleType: 'heat_pump', icon: 'heat-pump' },
  { label: 'Status van mijn laadpaal', moduleType: 'ev_charger', icon: 'ev-charger' },
  { label: 'Vraag over mijn factuur', moduleType: null, icon: 'file-text' },
]

// --- Load tickets ---
async function loadTickets(background = false) {
  if (!background) ticketsLoading.value = true
  try {
    tickets.value = await $fetch<Ticket[]>('/api/customer/tickets', { headers: await authHeaders() })
  } catch {
    // Achtergrondverversing: bestaande lijst laten staan bij een netwerkhikje.
    if (!background) tickets.value = []
  }
  finally { if (!background) ticketsLoading.value = false }
}

onMounted(() => { loadTickets() })

// Ook aan de klantkant: een reactie van de installateur hoort te verschijnen
// zonder dat de klant zelf ververst.
useLiveRefresh(() => loadTickets(true), { intervalMs: 60_000 })

const openTickets = computed(() => tickets.value.filter(t => t.status !== 'opgelost' && t.status !== 'gesloten'))
const resolvedTickets = computed(() => tickets.value.filter(t => t.status === 'opgelost' || t.status === 'gesloten'))
const unreadCount = computed(() => tickets.value.filter(isUnread).length)

// --- AI chat flow ---
async function callAi(question: string, moduleType: string | null): Promise<AiMsg> {
  const headers = await authHeaders()
  // De hele dialoog meesturen, niet alleen het laatste bericht. Anders leest de
  // assistent het antwoord op zijn eigen vervolgvraag als een nieuwe, losse
  // vraag — en kan hij dus per definitie niet doorvragen.
  const history = (activeChat.value?.messages || [])
    .filter(m => m.role === 'customer' || m.role === 'ai')
    .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content }))
  try {
    const reply = await $fetch<any>('/api/customer/ai-assist', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: { message: question, moduleType, messages: history },
    })
    return {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: reply.content,
      timestamp: new Date().toISOString(),
      metadata: {
        systemCheck: reply.systemCheck,
        dataPoints: reply.dataPoints,
        shouldEscalate: reply.shouldEscalate,
        escalateReason: reply.escalateReason,
        ticketDraft: reply.ticketDraft,
      },
    }
  } catch {
    return {
      id: `ai-${Date.now()}`,
      role: 'ai',
      content: `Het lukt me nu niet om je vraag te verwerken. Ik kan deze doorsturen naar ${partner.value.name || 'je installateur'}.`,
      timestamp: new Date().toISOString(),
      metadata: { shouldEscalate: true },
    }
  }
}

async function startChat(text: string, moduleType: string | null = null) {
  if (!text.trim()) return
  const subject = text.length > 60 ? text.slice(0, 57) + '...' : text
  const first: AiMsg = {
    id: `c-${Date.now()}`,
    role: 'customer',
    content: text,
    timestamp: new Date().toISOString(),
  }
  activeChat.value = { subject, moduleType, messages: [first], status: 'actief' }
  startInput.value = ''
  isAiTyping.value = true
  scrollToBottom()
  const reply = await callAi(text, moduleType)
  activeChat.value.messages.push(reply)
  isAiTyping.value = false
  scrollToBottom()
}

async function sendMessage() {
  if (!messageInput.value.trim() || !activeChat.value) return
  const text = messageInput.value.trim()
  messageInput.value = ''
  activeChat.value.messages.push({
    id: `c-${Date.now()}`,
    role: 'customer',
    content: text,
    timestamp: new Date().toISOString(),
  })
  isAiTyping.value = true
  scrollToBottom()
  const reply = await callAi(text, activeChat.value.moduleType)
  activeChat.value.messages.push(reply)
  isAiTyping.value = false
  scrollToBottom()
}

function resolveChat() {
  if (!activeChat.value) return
  activeChat.value.status = 'ai_opgelost'
  activeChat.value.messages.push({
    id: `c-${Date.now()}`,
    role: 'customer',
    content: 'Bedankt, dit is duidelijk!',
    timestamp: new Date().toISOString(),
  })
}

const isEscalating = ref(false)

async function escalateChat() {
  if (!activeChat.value) return
  const chat = activeChat.value
  // Zonder dit slot levert driemaal klikken drie tickets op. De knop gaf geen
  // enkele terugkoppeling, dus dat is precies wat er gebeurde.
  if (isEscalating.value || chat.status === 'geescaleerd') return
  isEscalating.value = true
  try {
    const lastAi = [...chat.messages].reverse().find(m => m.role === 'ai')

    // Heeft de assistent doorgevraagd, dan is zijn samenvatting het ticket. Die
    // bevat symptoom, sinds wanneer en wat al geprobeerd is — waar de monteur
    // iets aan heeft. Alleen als die ontbreekt vallen we terug op de ruwe
    // chatregels, wat neerkomt op "zonnepaneel is kapot".
    const draft = lastAi?.metadata?.ticketDraft
    const transcript = chat.messages
      .filter(m => m.role === 'customer' || m.role === 'ai')
      .map(m => `${m.role === 'ai' ? 'Assistent' : 'Klant'}: ${m.content}`)
      .join('\n')

    const description = draft?.description
      ? `${draft.description}\n\n— Gespreksverloop —\n${transcript}`
      : transcript

    const ticket = await $fetch<Ticket>('/api/customer/tickets', {
      method: 'POST',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: {
        subject: draft?.subject || chat.subject,
        description,
        module_type: draft?.module_type || chat.moduleType || null,
        urgency: draft?.urgency || 'normaal',
      },
    })

    chat.status = 'geescaleerd'
    chat.ticketId = ticket.id
    chat.ticketNumber = (ticket as any).ticket_number
    chat.messages.push({
      id: `i-${Date.now()}`,
      role: 'installer',
      content: `Je vraag is doorgestuurd naar ${partner.value.name}. We nemen zo snel mogelijk contact met je op. Je vindt deze melding ook terug in het overzicht.`,
      timestamp: new Date().toISOString(),
    })
    tickets.value.unshift(ticket)
    markSeen(ticket.id, ticket.updated_at)
  } catch {
    chat.messages.push({
      id: `i-${Date.now()}`,
      role: 'installer',
      content: 'Doorsturen is niet gelukt. Probeer het nogmaals of neem direct contact op.',
      timestamp: new Date().toISOString(),
    })
  } finally {
    isEscalating.value = false
  }
}

function openTicketAsChat(t: Ticket) {
  const msgs: AiMsg[] = []
  // Opening message = description
  msgs.push({ id: `c-${t.id}`, role: 'customer', content: t.description || t.subject, timestamp: t.created_at })
  // All subsequent thread messages
  for (const m of (t.messages || [])) {
    msgs.push({
      id: m.id,
      role: m.role === 'installer' ? 'installer' : 'customer',
      content: m.text,
      timestamp: m.at,
      author_name: m.author_name || null,
    })
  }
  activeChat.value = {
    subject: t.subject,
    moduleType: t.module_type,
    messages: msgs,
    status: t.status === 'opgelost' || t.status === 'gesloten' ? 'ai_opgelost' : 'geescaleerd',
    ticketId: t.id,
    ticketNumber: (t as any).ticket_number,
    ticketStatus: t.status,
    helpedByName: t.helped_by_name || null,
  }
  helpedByError.value = ''
  // Seen-marker based on most recent activity in the thread
  const last = t.latest_message
  markSeen(t.id, last?.at || t.updated_at)
  scrollToBottom()
}

/** Customer reply to an existing ticket via the thread API. */
async function replyToTicket() {
  if (!activeChat.value?.ticketId || !messageInput.value.trim()) return
  const text = messageInput.value.trim()
  const ticketId = activeChat.value.ticketId
  messageInput.value = ''
  try {
    const updated = await $fetch<Ticket>(`/api/customer/tickets/${ticketId}/messages`, {
      method: 'POST',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: { text },
    })
    // Reflect locally
    activeChat.value.messages.push({
      id: `c-${Date.now()}`,
      role: 'customer',
      content: text,
      timestamp: new Date().toISOString(),
    })
    activeChat.value.status = 'geescaleerd' // reopened/active
    activeChat.value.ticketStatus = updated.status
    // Update list entry
    const idx = tickets.value.findIndex(x => x.id === ticketId)
    if (idx !== -1) tickets.value[idx] = { ...tickets.value[idx], ...updated }
    markSeen(ticketId, new Date().toISOString())
    scrollToBottom()
  } catch {
    activeChat.value.messages.push({
      id: `e-${Date.now()}`,
      role: 'installer',
      content: 'Versturen is niet gelukt. Probeer het opnieuw of bel direct.',
      timestamp: new Date().toISOString(),
    })
  }
}

// --- "Wie heeft je geholpen?" — kiezen uit echte company-users op dit ticket ---
const helpedBySaving = ref(false)
const helpedByError = ref('')

/**
 * Distinct namen van company-users die op dit ticket gereageerd hebben — in
 * volgorde van eerste verschijning. Dit is wat we de klant als chips aanbieden,
 * zodat ze niet hoeven te typen.
 */
const helpedByOptions = computed<string[]>(() => {
  if (!activeChat.value) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const m of activeChat.value.messages) {
    if (m.role !== 'installer') continue
    const n = (m.author_name || '').trim()
    if (!n || seen.has(n)) continue
    seen.add(n)
    out.push(n)
  }
  return out
})

async function submitHelpedBy(name: string) {
  if (!activeChat.value?.ticketId) return
  const trimmed = name.trim()
  if (!trimmed) return
  helpedBySaving.value = true
  helpedByError.value = ''
  try {
    const res = await $fetch<{ ok: boolean; helped_by_name: string | null }>(
      `/api/customer/tickets/${activeChat.value.ticketId}/helped-by`,
      {
        method: 'POST',
        headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
        body: { name: trimmed },
      },
    )
    activeChat.value.helpedByName = res.helped_by_name
    // Keep the local ticket list in sync
    const idx = tickets.value.findIndex(x => x.id === activeChat.value!.ticketId)
    if (idx !== -1) tickets.value[idx] = { ...tickets.value[idx], helped_by_name: res.helped_by_name || null }
  } catch (e: any) {
    helpedByError.value = e?.data?.message || e?.message || 'Opslaan mislukt'
  } finally {
    helpedBySaving.value = false
  }
}

function goBack() {
  activeChat.value = null
}

function statusLabel(t: Ticket) {
  if (t.status === 'opgelost') return 'Opgelost'
  if (t.status === 'gesloten') return 'Afgehandeld'
  const last = t.latest_message
  if (last?.role === 'installer') {
    return last.author_name
      ? `Reactie van ${last.author_name} (${partner.value.name})`
      : `Reactie van ${partner.value.name}`
  }
  if (last?.role === 'customer') return 'Wacht op installateur'
  if (t.status === 'in_behandeling') return 'In behandeling'
  return `Ontvangen · wacht op ${partner.value.name}`
}

function statusDotClass(t: Ticket) {
  if (t.status === 'opgelost' || t.status === 'gesloten') return 'bg-gray-300'
  if (isUnread(t)) return 'bg-green-500 animate-pulse'
  const last = t.latest_message
  if (last?.role === 'installer') return 'bg-green-500'
  return 'bg-blue-500'
}

function cardClass(t: Ticket) {
  if (isUnread(t)) return 'border-green-200 bg-green-50/40 hover:bg-green-50'
  if (t.status === 'opgelost' || t.status === 'gesloten') return 'border-gray-100 bg-white/60 hover:bg-white'
  return 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
}

function chatStatusBadge(s: string) {
  switch (s) {
    case 'actief': return 'bg-blue-50 text-blue-700'
    case 'ai_opgelost': return 'bg-green-50 text-green-700'
    case 'geescaleerd': return 'bg-amber-50 text-amber-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}
function chatStatusLabel(s: string) {
  switch (s) {
    case 'actief': return 'Actief'
    case 'ai_opgelost': return 'Opgelost'
    case 'geescaleerd': return 'Bij installateur'
    default: return s
  }
}
function moduleIcon(m: string | null): string {
  switch (m) {
    case 'solar': return 'solar'
    case 'heat_pump': return 'heat-pump'
    case 'ev_charger': return 'ev-charger'
    case 'battery': return 'battery'
    default: return 'help-circle'
  }
}
function moduleTint(m: string | null): { bg: string; text: string } {
  switch (m) {
    case 'solar':    return { bg: 'bg-amber-50',   text: 'text-amber-600' }
    case 'heat_pump':return { bg: 'bg-orange-50',    text: 'text-orange-600' }
    case 'ev_charger':return{ bg: 'bg-sky-50',     text: 'text-sky-600' }
    case 'battery':  return { bg: 'bg-violet-50',  text: 'text-violet-600' }
    default:         return { bg: 'bg-gray-100',   text: 'text-gray-500' }
  }
}

function shortPreview(s: string | null, max = 120) {
  if (!s) return ''
  const firstLine = s.split('\n')[0]
  return firstLine.length > max ? firstLine.slice(0, max - 1) + '…' : firstLine
}
</script>

<template>
  <div class="flex flex-col">
    <!-- ============================================ -->
    <!-- CHAT VIEW (full-width takeover)              -->
    <!-- ============================================ -->
    <template v-if="activeChat">
      <div class="flex flex-col">
        <!-- Top bar -->
        <div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-3">
          <button
            class="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
            @click="goBack"
          >
            <AppIcon name="chevron-right" :size="16" class="rotate-180" />
            Terug naar service
          </button>
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-sm font-semibold text-gray-900">{{ activeChat.subject }}</h2>
            <p v-if="formatTicketRef({ ticket_number: activeChat.ticketNumber })" class="text-[11px] text-gray-500">
              Ticket {{ formatTicketRef({ ticket_number: activeChat.ticketNumber }) }}
            </p>
          </div>
          <span class="rounded-full px-2 py-0.5 text-[11px] font-medium" :class="chatStatusBadge(activeChat.status)">
            {{ chatStatusLabel(activeChat.status) }}
          </span>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="space-y-4 overflow-y-auto pb-4 pr-1" style="max-height: calc(100vh - 340px); min-height: 300px;">
          <template v-for="msg in activeChat.messages" :key="msg.id">
            <div v-if="msg.role === 'ai'" class="flex items-start gap-2.5">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <AppIcon name="zap" :size="14" />
              </div>
              <div class="max-w-[85%]">
                <div class="chat-bubble-ai">
                  <p class="whitespace-pre-line text-sm text-gray-800">{{ msg.content }}</p>
                </div>
                <div
                  v-if="msg.metadata?.systemCheck && msg.metadata.dataPoints?.length"
                  class="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5"
                >
                  <p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-500">
                    <AppIcon name="activity" :size="12" />
                    Systeemcheck
                  </p>
                  <div class="grid grid-cols-3 gap-2">
                    <div v-for="dp in msg.metadata.dataPoints" :key="dp.label">
                      <p class="text-[11px] text-blue-400">{{ dp.label }}</p>
                      <p class="text-xs font-semibold text-blue-800">{{ dp.value }}</p>
                    </div>
                  </div>
                </div>
                <p class="mt-1 text-[11px] text-gray-400">AI-assistent · {{ formatTime(msg.timestamp) }}</p>
              </div>
            </div>

            <div v-else-if="msg.role === 'customer'" class="flex items-start justify-end gap-2.5">
              <div class="max-w-[85%]">
                <div class="chat-bubble-customer">
                  <p class="whitespace-pre-line text-sm">{{ msg.content }}</p>
                </div>
                <p class="mt-1 text-right text-[11px] text-gray-400">{{ formatTime(msg.timestamp) }}</p>
              </div>
            </div>

            <div v-else-if="msg.role === 'installer'" class="flex items-start gap-2.5">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                <AppIcon name="tool" :size="14" />
              </div>
              <div class="max-w-[85%]">
                <div class="chat-bubble-installer">
                  <p class="mb-1 text-[11px] font-semibold text-orange-700">
                    <template v-if="msg.author_name">{{ msg.author_name }} <span class="font-normal text-orange-600/70">van {{ partner.name }}</span></template>
                    <template v-else>{{ partner.name }}</template>
                  </p>
                  <p class="whitespace-pre-line text-sm text-gray-800">{{ msg.content }}</p>
                </div>
                <p class="mt-1 text-[11px] text-gray-400">{{ formatTime(msg.timestamp) }}</p>
              </div>
            </div>
          </template>

          <div v-if="isAiTyping" class="flex items-start gap-2.5">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <AppIcon name="zap" :size="14" />
            </div>
            <div class="chat-bubble-ai">
              <div class="typing-indicator"><span /><span /><span /></div>
            </div>
          </div>
        </div>

        <!-- "Wie heeft je geholpen?" — alleen op afgeronde tickets, alleen als er ≥1 reactie van het team was -->
        <div
          v-if="activeChat.ticketId
            && (activeChat.ticketStatus === 'opgelost' || activeChat.ticketStatus === 'gesloten')
            && (activeChat.helpedByName || helpedByOptions.length)"
          class="mb-3 rounded-xl border border-green-100 bg-green-50/60 p-3"
        >
          <template v-if="activeChat.helpedByName">
            <p class="flex items-center gap-2 text-sm text-green-900">
              <AppIcon name="check-circle" :size="14" class="text-green-600" />
              Bedankt — <strong>{{ activeChat.helpedByName }}</strong> staat genoteerd als degene die je geholpen heeft.
            </p>
          </template>
          <template v-else>
            <p class="text-xs font-medium text-gray-700 mb-2">
              Wie heeft je geholpen?
              <span class="font-normal text-gray-500">Tik op de naam van de juiste persoon.</span>
            </p>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="name in helpedByOptions"
                :key="name"
                type="button"
                class="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100 disabled:opacity-50"
                :disabled="helpedBySaving"
                @click="submitHelpedBy(name)"
              >
                <AppIcon name="user" :size="12" />
                {{ name }}
              </button>
            </div>
            <p v-if="helpedByError" class="mt-1.5 text-[11px] text-red-600">{{ helpedByError }}</p>
          </template>
        </div>

        <!-- Action buttons -->
        <div
          v-if="activeChat.status === 'actief' && !isAiTyping && activeChat.messages.length > 1"
          class="mb-3 flex flex-wrap gap-2"
        >
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50"
            @click="resolveChat"
          >
            <AppIcon name="check" :size="14" />
            Dit helpt, bedankt!
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            @click="escalateChat"
          >
            <AppIcon name="phone" :size="14" />
            Stuur door naar {{ partner.name }}
          </button>
        </div>

        <!-- Input -->
        <div class="border-t border-gray-100 pt-3">
          <form
            class="flex items-center gap-2"
            @submit.prevent="activeChat.ticketId ? replyToTicket() : sendMessage()"
          >
            <input
              v-model="messageInput"
              type="text"
              class="input flex-1"
              :placeholder="activeChat.ticketId ? `Reageer aan ${partner.name}...` : 'Typ een bericht...'"
              :disabled="(activeChat.status === 'ai_opgelost' && !activeChat.ticketId) || isAiTyping"
            />
            <button
              type="submit"
              :disabled="!messageInput.trim() || isAiTyping || (activeChat.status === 'ai_opgelost' && !activeChat.ticketId)"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600"
            >
              <AppIcon name="send" :size="18" />
            </button>
          </form>
          <p v-if="activeChat.ticketId" class="mt-2 text-center text-[11px] text-gray-500">
            Elke reactie stuurt een mail naar {{ partner.name }}. Gesloten meldingen worden automatisch heropend.
          </p>
          <p v-else-if="activeChat.status === 'geescaleerd'" class="mt-2 text-center text-[11px] text-gray-500">
            Deze melding is bij {{ partner.name }}. Je krijgt een reactie via e-mail en ziet 'm ook hier terug.
          </p>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- MAIN VIEW                                    -->
    <!-- ============================================ -->
    <template v-else>
      <!-- Page header with unread pill -->
      <div class="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Service</h1>
          <p class="mt-1 text-sm text-gray-500">Stel een vraag of bekijk je lopende meldingen.</p>
        </div>
        <div v-if="unreadCount" class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          <span class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          {{ unreadCount }} nieuw{{ unreadCount === 1 ? '' : 'e' }} reactie{{ unreadCount === 1 ? '' : 's' }}
        </div>
      </div>

      <!-- ============================================ -->
      <!-- 1. AI assistant (always on top, never hidden)-->
      <!-- ============================================ -->
      <div class="mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-sm">
        <div class="rounded-2xl bg-white p-5">
          <div class="flex items-start gap-4">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <AppIcon name="zap" :size="22" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-semibold uppercase tracking-wider text-indigo-600">AI-assistent</p>
              <p class="mt-0.5 text-base font-semibold text-gray-900">Hoe kunnen we helpen?</p>
              <p class="mt-0.5 text-xs text-gray-500">Direct antwoord met een live check op je systeem — of we sturen door naar {{ partner.name }}.</p>

              <form class="mt-3 flex items-center gap-2" @submit.prevent="startChat(startInput)">
                <input
                  v-model="startInput"
                  type="text"
                  class="input flex-1"
                  placeholder="Stel je vraag..."
                />
                <button
                  type="submit"
                  :disabled="!startInput.trim()"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600"
                >
                  <AppIcon name="send" :size="18" />
                </button>
              </form>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  v-for="action in quickActions"
                  :key="action.label"
                  class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                  @click="startChat(action.label, action.moduleType)"
                >
                  <AppIcon :name="action.icon" :size="12" />
                  {{ action.label }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================ -->
      <!-- 2. Active conversations (prominent)          -->
      <!-- ============================================ -->
      <section v-if="openTickets.length || ticketsLoading" class="mb-6">
        <div class="mb-3 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900">
            Lopende meldingen
            <span class="ml-1 text-gray-400 font-normal">({{ openTickets.length }})</span>
          </h2>
        </div>

        <div v-if="ticketsLoading" class="py-6 text-center">
          <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        </div>

        <div v-else class="space-y-2">
          <button
            v-for="t in openTickets"
            :key="t.id"
            class="flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all"
            :class="cardClass(t)"
            @click="openTicketAsChat(t)"
          >
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              :class="[moduleTint(t.module_type).bg, moduleTint(t.module_type).text]"
            >
              <AppIcon :name="moduleIcon(t.module_type)" :size="20" />
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 flex-wrap">
                <span
                  v-if="formatTicketRef(t)"
                  class="shrink-0 inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-700 tabular-nums"
                >
                  #{{ formatTicketRef(t) }}
                </span>
                <p class="truncate font-semibold text-gray-900 text-sm">{{ t.subject }}</p>
                <span v-if="isUnread(t)" class="shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white">
                  Nieuw
                </span>
                <span v-else-if="t.urgency === 'hoog'" class="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-red-600">
                  <AppIcon name="alert-circle" :size="10" /> Urgent
                </span>
              </div>

              <!-- Last message preview -->
              <p class="mt-1 truncate text-xs text-gray-500">
                <template v-if="t.latest_message">
                  <span class="font-medium text-gray-700">{{ t.latest_message.role === 'installer' ? (t.latest_message.author_name ? `${t.latest_message.author_name} van ${partner.name}` : partner.name) : 'Jij' }}:</span>
                  {{ shortPreview(t.latest_message.text) }}
                </template>
                <template v-else>
                  <span class="font-medium text-gray-700">Jouw melding:</span>
                  {{ shortPreview(t.description) }}
                </template>
                <span v-if="(t.message_count || 0) > 0" class="ml-1 text-gray-400">· {{ t.message_count }} {{ t.message_count === 1 ? 'reactie' : 'reacties' }}</span>
              </p>

              <div class="mt-2 flex items-center gap-3 text-[11px] text-gray-400">
                <span class="inline-flex items-center gap-1">
                  <span class="h-1.5 w-1.5 rounded-full" :class="statusDotClass(t)" />
                  {{ statusLabel(t) }}
                </span>
                <span>·</span>
                <span>{{ timeAgo(t.updated_at) }}</span>
              </div>
            </div>

            <AppIcon name="chevron-right" :size="16" class="shrink-0 text-gray-300 mt-3" />
          </button>
        </div>
      </section>

      <!-- ============================================ -->
      <!-- 3. Resolved (less prominent)                 -->
      <!-- ============================================ -->
      <section v-if="resolvedTickets.length" class="mb-6">
        <h2 class="mb-3 text-sm font-semibold text-gray-500">
          Afgehandeld
          <span class="ml-1 font-normal text-gray-400">({{ resolvedTickets.length }})</span>
        </h2>
        <div class="space-y-2">
          <button
            v-for="t in resolvedTickets"
            :key="t.id"
            class="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white/60 p-3 text-left transition-all hover:bg-white"
            @click="openTicketAsChat(t)"
          >
            <div
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-70"
              :class="[moduleTint(t.module_type).bg, moduleTint(t.module_type).text]"
            >
              <AppIcon :name="moduleIcon(t.module_type)" :size="16" />
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5">
                <span v-if="formatTicketRef(t)" class="text-[10px] font-semibold text-gray-400 shrink-0">#{{ formatTicketRef(t) }}</span>
                <p class="truncate text-sm text-gray-600">{{ t.subject }}</p>
              </div>
              <p class="text-[11px] text-gray-400">Opgelost · {{ timeAgo(t.updated_at) }}</p>
            </div>
            <AppIcon name="chevron-right" :size="14" class="shrink-0 text-gray-300" />
          </button>
        </div>
      </section>

      <!-- Empty state (no tickets at all) -->
      <div v-if="!ticketsLoading && !tickets.length" class="mb-6 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center">
        <AppIcon name="message" :size="32" class="mx-auto text-gray-300 mb-2" />
        <p class="text-sm text-gray-500">Nog geen meldingen. Stel hierboven een vraag of neem direct contact op.</p>
      </div>

      <!-- ============================================ -->
      <!-- 4. Direct contact (always visible footer)    -->
      <!-- ============================================ -->
      <div class="mt-2 rounded-2xl bg-white border border-gray-100 p-5">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Direct contact met {{ partner.name }}</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            v-if="partner.support_email"
            :href="'mailto:' + partner.support_email"
            class="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
          >
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <AppIcon name="mail" :size="18" />
            </div>
            <div>
              <p class="text-xs text-gray-400">E-mail</p>
              <p class="text-sm font-medium text-gray-900">{{ partner.support_email }}</p>
            </div>
          </a>
          <a
            v-if="partner.support_phone"
            :href="'tel:' + partner.support_phone"
            class="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
          >
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <AppIcon name="phone" :size="18" />
            </div>
            <div>
              <p class="text-xs text-gray-400">Telefoon</p>
              <p class="text-sm font-medium text-gray-900">{{ partner.support_phone }}</p>
            </div>
          </a>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.chat-bubble-ai { @apply rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3; }
.chat-bubble-customer { @apply rounded-2xl rounded-tr-md bg-gray-800 px-4 py-3 text-white; }
.chat-bubble-installer { @apply rounded-2xl rounded-tl-md bg-orange-50 px-4 py-3; }

.typing-indicator { display: flex; align-items: center; gap: 4px; padding: 4px 0; }
.typing-indicator span {
  display: block; width: 7px; height: 7px; border-radius: 50%;
  background-color: #9ca3af;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}
.typing-indicator span:nth-child(1) { animation-delay: 0s; }
.typing-indicator span:nth-child(2) { animation-delay: 0.16s; }
.typing-indicator span:nth-child(3) { animation-delay: 0.32s; }

@keyframes typing-bounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}
</style>
