<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'customer' })

const { conversations, startConversation, sendMessage, escalateConversation, partner } = useMockData()

// --- State ---
const activeConversation = ref<typeof conversations[number] | null>(null)
const messageInput = ref('')
const startInput = ref('')
const isAiTyping = ref(false)
const showHistory = ref(false)

// Message container ref for auto-scroll
const messagesContainer = ref<HTMLElement | null>(null)

// Customer conversations only
const myConversations = computed(() =>
  conversations.filter(c => c.customer_id === 'cust-1')
)

const historyConversations = computed(() =>
  myConversations.value.filter(c => c.status !== 'actief')
)

const historyCount = computed(() => historyConversations.value.length)

// Scroll to bottom of messages
function scrollToBottom() {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// Watch for new messages to auto-scroll
watch(
  () => activeConversation.value?.messages.length,
  () => scrollToBottom()
)

// --- Quick action chips ---
const quickActions = [
  { label: 'Hoe presteren mijn zonnepanelen?', moduleType: 'solar' },
  { label: 'Is er iets mis met mijn warmtepomp?', moduleType: 'heat_pump' },
  { label: 'Status van mijn laadpaal', moduleType: 'ev_charger' },
  { label: 'Vraag over mijn factuur', moduleType: null },
]

// --- Actions ---
function handleStartConversation(message: string, moduleType: string | null = null) {
  if (!message.trim()) return
  const subject = message.length > 60 ? message.slice(0, 57) + '...' : message
  const conv = startConversation(subject, message, moduleType)
  activeConversation.value = conv
  startInput.value = ''
  isAiTyping.value = true
  scrollToBottom()
  setTimeout(() => {
    isAiTyping.value = false
    scrollToBottom()
  }, 1500)
}

function handleSendMessage() {
  if (!messageInput.value.trim() || !activeConversation.value) return
  const msg = messageInput.value.trim()
  messageInput.value = ''
  sendMessage(activeConversation.value.id, msg)
  isAiTyping.value = true
  scrollToBottom()
  setTimeout(() => {
    isAiTyping.value = false
    scrollToBottom()
  }, 1500)
}

function handleQuickAction(action: typeof quickActions[number]) {
  handleStartConversation(action.label, action.moduleType)
}

function handleResolve() {
  if (!activeConversation.value) return
  sendMessage(activeConversation.value.id, 'Bedankt, dit is duidelijk!')
  isAiTyping.value = true
  scrollToBottom()
  setTimeout(() => {
    isAiTyping.value = false
    scrollToBottom()
  }, 1500)
}

function handleEscalate() {
  if (!activeConversation.value) return
  escalateConversation(activeConversation.value.id)
  scrollToBottom()
}

function openConversation(conv: typeof conversations[number]) {
  activeConversation.value = conv
  showHistory.value = false
  scrollToBottom()
}

function goBack() {
  activeConversation.value = null
  showHistory.value = false
}

// --- Helpers ---
function statusBadgeClass(status: string) {
  switch (status) {
    case 'actief': return 'badge--blue'
    case 'ai_opgelost': return 'badge--green'
    case 'geescaleerd': return 'badge--yellow'
    case 'gesloten': return 'badge--gray'
    default: return 'badge--gray'
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'actief': return 'Actief'
    case 'ai_opgelost': return 'AI opgelost'
    case 'geescaleerd': return 'Bij installateur'
    case 'gesloten': return 'Afgehandeld'
    default: return status
  }
}

function formatTime(timestamp: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

function formatDateShort(timestamp: string) {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(timestamp))
}

function moduleIcon(type: string | null): string {
  if (!type) return 'help-circle'
  return getModuleTheme(type).icon
}
</script>

<template>
  <div class="flex h-full flex-col">

    <!-- ============================================ -->
    <!-- A. START SCREEN (no active conversation)     -->
    <!-- ============================================ -->
    <template v-if="!activeConversation && !showHistory">
      <div class="flex flex-1 flex-col">
        <!-- Hero area -->
        <div class="mb-6 pt-4 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-200">
            <AppIcon name="help-circle" :size="32" />
          </div>
          <h1 class="text-2xl font-bold text-gray-900">Hoe kunnen we helpen?</h1>
          <p class="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Stel een vraag en onze AI-assistent helpt je direct. Kom je er niet uit? Dan schakelen we je installateur in.
          </p>
        </div>

        <!-- Start input -->
        <div class="section mb-4">
          <form class="flex items-center gap-3" @submit.prevent="handleStartConversation(startInput)">
            <input
              v-model="startInput"
              type="text"
              class="input flex-1"
              placeholder="Stel je vraag..."
            />
            <button
              type="submit"
              :disabled="!startInput.trim()"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600"
            >
              <AppIcon name="send" :size="18" />
            </button>
          </form>
        </div>

        <!-- Quick action chips -->
        <div class="mb-6 flex flex-wrap gap-2">
          <button
            v-for="action in quickActions"
            :key="action.label"
            class="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-700 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
            @click="handleQuickAction(action)"
          >
            <AppIcon :name="moduleIcon(action.moduleType)" :size="16" class="opacity-60" />
            {{ action.label }}
          </button>
        </div>

        <!-- History link -->
        <div v-if="historyCount > 0" class="mb-6">
          <button
            class="flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
            @click="showHistory = true"
          >
            <AppIcon name="clock" :size="16" />
            Eerdere gesprekken ({{ historyCount }})
            <AppIcon name="chevron-right" :size="14" />
          </button>
        </div>

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Direct contact footer -->
        <div class="pb-4 text-center text-xs text-gray-400">
          Liever direct contact?
          <a v-if="partner.support_phone" :href="`tel:${partner.support_phone}`" class="font-medium text-gray-500 hover:text-indigo-600">
            Bel {{ partner.support_phone }}
          </a>
          <template v-if="partner.support_phone && partner.support_email"> of </template>
          <a v-if="partner.support_email" :href="`mailto:${partner.support_email}`" class="font-medium text-gray-500 hover:text-indigo-600">
            mail {{ partner.support_email }}
          </a>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- C. CONVERSATION HISTORY                      -->
    <!-- ============================================ -->
    <template v-else-if="showHistory && !activeConversation">
      <div class="flex flex-1 flex-col">
        <!-- Header -->
        <div class="mb-4 flex items-center gap-3">
          <button
            class="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
            @click="showHistory = false"
          >
            <AppIcon name="arrow-right" :size="16" class="rotate-180" />
            Terug
          </button>
          <h2 class="text-lg font-bold text-gray-900">Eerdere gesprekken</h2>
        </div>

        <!-- Conversation list -->
        <div class="space-y-2">
          <button
            v-for="conv in myConversations"
            :key="conv.id"
            class="section flex w-full items-center gap-3 text-left transition-all hover:ring-2 hover:ring-indigo-200"
            @click="openConversation(conv)"
          >
            <!-- Module icon -->
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              :class="conv.module_type
                ? [getModuleTheme(conv.module_type).bg, getModuleTheme(conv.module_type).text]
                : ['bg-gray-100', 'text-gray-500']"
            >
              <AppIcon :name="moduleIcon(conv.module_type)" :size="20" />
            </div>

            <!-- Content -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <h3 class="truncate text-sm font-semibold text-gray-900">{{ conv.subject }}</h3>
                <span class="shrink-0 text-xs text-gray-400">{{ formatDateShort(conv.started_at) }}</span>
              </div>
              <div class="mt-1 flex items-center gap-2">
                <span :class="['badge text-[11px]', statusBadgeClass(conv.status)]">
                  {{ statusLabel(conv.status) }}
                </span>
                <span class="truncate text-xs text-gray-400">
                  {{ conv.messages.length }} berichten
                </span>
              </div>
            </div>

            <AppIcon name="chevron-right" :size="16" class="shrink-0 text-gray-300" />
          </button>
        </div>

        <div v-if="!myConversations.length" class="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <AppIcon name="message" :size="40" class="text-gray-200" />
          <p class="mt-3 text-sm text-gray-400">Nog geen gesprekken</p>
        </div>

        <!-- Spacer + footer -->
        <div class="flex-1" />
        <div class="pb-4 text-center text-xs text-gray-400">
          Liever direct contact?
          <a v-if="partner.support_phone" :href="`tel:${partner.support_phone}`" class="font-medium text-gray-500 hover:text-indigo-600">
            Bel {{ partner.support_phone }}
          </a>
          <template v-if="partner.support_phone && partner.support_email"> of </template>
          <a v-if="partner.support_email" :href="`mailto:${partner.support_email}`" class="font-medium text-gray-500 hover:text-indigo-600">
            mail {{ partner.support_email }}
          </a>
        </div>
      </div>
    </template>

    <!-- ============================================ -->
    <!-- B. CHAT INTERFACE                            -->
    <!-- ============================================ -->
    <template v-else-if="activeConversation">
      <div class="flex flex-1 flex-col overflow-hidden">

        <!-- Top bar -->
        <div class="mb-3 flex items-center gap-3 border-b border-gray-100 pb-3">
          <button
            class="flex items-center gap-1.5 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
            @click="goBack"
          >
            <AppIcon name="arrow-right" :size="16" class="rotate-180" />
            Terug
          </button>
          <div class="min-w-0 flex-1">
            <h2 class="truncate text-sm font-semibold text-gray-900">{{ activeConversation.subject }}</h2>
          </div>
          <span :class="['badge text-[11px]', statusBadgeClass(activeConversation.status)]">
            {{ statusLabel(activeConversation.status) }}
          </span>
        </div>

        <!-- Message area -->
        <div ref="messagesContainer" class="space-y-4 overflow-y-auto pb-4 pr-1" style="max-height: calc(100vh - 280px);">
          <template v-for="msg in activeConversation.messages" :key="msg.id">

            <!-- AI message -->
            <div v-if="msg.role === 'ai'" class="flex items-start gap-2.5">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <AppIcon name="zap" :size="14" />
              </div>
              <div class="max-w-[85%]">
                <div class="chat-bubble-ai">
                  <p class="whitespace-pre-line text-sm text-gray-800">{{ msg.content }}</p>
                </div>
                <!-- Data points card -->
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
                <p class="mt-1 text-[11px] text-gray-400">{{ formatTime(msg.timestamp) }}</p>
              </div>
            </div>

            <!-- Customer message -->
            <div v-else-if="msg.role === 'customer'" class="flex items-start justify-end gap-2.5">
              <div class="max-w-[85%]">
                <div class="chat-bubble-customer">
                  <p class="whitespace-pre-line text-sm">{{ msg.content }}</p>
                </div>
                <p class="mt-1 text-right text-[11px] text-gray-400">{{ formatTime(msg.timestamp) }}</p>
              </div>
            </div>

            <!-- Installer message -->
            <div v-else-if="msg.role === 'installer'" class="flex items-start gap-2.5">
              <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
                <AppIcon name="tool" :size="14" />
              </div>
              <div class="max-w-[85%]">
                <div class="chat-bubble-installer">
                  <p class="mb-1 text-[11px] font-semibold text-orange-700">{{ partner.name }}</p>
                  <p class="whitespace-pre-line text-sm text-gray-800">{{ msg.content }}</p>
                </div>
                <p class="mt-1 text-[11px] text-gray-400">{{ formatTime(msg.timestamp) }}</p>
              </div>
            </div>

          </template>

          <!-- AI typing indicator -->
          <div v-if="isAiTyping" class="flex items-start gap-2.5">
            <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <AppIcon name="zap" :size="14" />
            </div>
            <div class="chat-bubble-ai">
              <div class="typing-indicator">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        </div>

        <!-- Action buttons after AI response (only when active and not typing) -->
        <div
          v-if="activeConversation.status === 'actief' && !isAiTyping && activeConversation.messages.length > 1"
          class="mb-3 flex flex-wrap gap-2"
        >
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 transition-all hover:bg-green-50"
            @click="handleResolve"
          >
            <AppIcon name="check" :size="14" />
            Dit helpt, bedankt!
          </button>
          <button
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition-all hover:bg-gray-50"
            @click="handleEscalate"
          >
            <AppIcon name="phone" :size="14" />
            Ik wil persoonlijk contact
          </button>
        </div>

        <!-- Bottom input bar -->
        <div class="border-t border-gray-100 pt-3">
          <form class="flex items-center gap-2" @submit.prevent="handleSendMessage">
            <input
              v-model="messageInput"
              type="text"
              class="input flex-1"
              placeholder="Typ een bericht..."
              :disabled="activeConversation.status === 'gesloten' || activeConversation.status === 'ai_opgelost'"
            />
            <button
              type="submit"
              :disabled="!messageInput.trim() || isAiTyping || activeConversation.status === 'gesloten' || activeConversation.status === 'ai_opgelost'"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm transition-all hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600"
            >
              <AppIcon name="send" :size="18" />
            </button>
          </form>
          <p class="mt-2 text-center text-[11px] text-gray-400">
            Liever bellen?
            <a v-if="partner.support_phone" :href="`tel:${partner.support_phone}`" class="font-medium text-gray-500 hover:text-indigo-600">
              {{ partner.support_phone }}
            </a>
          </p>
        </div>

        <!-- History link inside chat -->
        <div v-if="historyCount > 0" class="mt-2 border-t border-gray-100 pt-2">
          <button
            class="flex items-center gap-2 text-xs font-medium text-gray-400 transition-colors hover:text-indigo-600"
            @click="activeConversation = null; showHistory = true"
          >
            <AppIcon name="clock" :size="14" />
            Eerdere gesprekken ({{ historyCount }})
          </button>
        </div>
      </div>
    </template>

  </div>
</template>

<style scoped>
/* Chat bubbles */
.chat-bubble-ai {
  @apply rounded-2xl rounded-tl-md bg-gray-100 px-4 py-3;
}

.chat-bubble-customer {
  @apply rounded-2xl rounded-tr-md bg-gray-800 px-4 py-3 text-white;
}

.chat-bubble-installer {
  @apply rounded-2xl rounded-tl-md bg-orange-50 px-4 py-3;
}

/* Typing indicator */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 0;
}

.typing-indicator span {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #9ca3af;
  animation: typing-bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: 0s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.16s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.4;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
