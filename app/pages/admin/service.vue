<script setup lang="ts">
import { formatDate } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'
import type { MockConversation } from '~/composables/useMockData'

definePageMeta({ layout: 'admin' })

const {
  conversations,
  maintenanceRecords,
  partner,
  sendInstallerMessage,
  resolveConversation,
} = useMockData()

// --- Filters ---
const statusFilter = ref('alle')
const searchQuery = ref('')

const filterOptions = [
  { value: 'alle', label: 'Alle' },
  { value: 'geescaleerd', label: 'Bij installateur' },
  { value: 'ai_opgelost', label: 'AI opgelost' },
  { value: 'requires_visit', label: 'Monteur nodig' },
  { value: 'gesloten', label: 'Gesloten' },
]

const filteredConversations = computed(() => {
  let result = [...conversations]

  // Status filter
  if (statusFilter.value === 'requires_visit') {
    result = result.filter(c => c.requires_visit)
  } else if (statusFilter.value !== 'alle') {
    result = result.filter(c => c.status === statusFilter.value)
  }

  // Search
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(c =>
      c.customer_name.toLowerCase().includes(q)
      || c.subject.toLowerCase().includes(q)
    )
  }

  return result.sort((a, b) => b.updated_at.localeCompare(a.updated_at))
})

// --- KPI stats ---
const aiResolvedCount = computed(() =>
  conversations.filter(c => c.status === 'ai_opgelost').length,
)
const escalatedCount = computed(() =>
  conversations.filter(c => c.status === 'geescaleerd').length,
)
const visitRequiredCount = computed(() =>
  conversations.filter(c => c.requires_visit).length,
)

// --- Selected conversation ---
const selectedConversation = ref<MockConversation | null>(null)
const replyText = ref('')
const showSuccess = ref(false)
const successMessage = ref('')
const chatContainer = ref<HTMLElement | null>(null)

function selectConversation(conv: MockConversation) {
  selectedConversation.value = conv
  replyText.value = ''
  showSuccess.value = false
  nextTick(() => scrollChatToBottom())
}

function scrollChatToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function handleSendReply() {
  if (!selectedConversation.value || !replyText.value.trim()) return
  sendInstallerMessage(selectedConversation.value.id, replyText.value.trim())
  replyText.value = ''
  nextTick(() => scrollChatToBottom())
}

function handleResolve() {
  if (!selectedConversation.value) return
  resolveConversation(selectedConversation.value.id)
  showToast('Conversatie is gesloten')
}

function handlePlanVisit() {
  showToast('Afspraak wordt ingepland')
}

function showToast(msg: string) {
  successMessage.value = msg
  showSuccess.value = true
  setTimeout(() => { showSuccess.value = false }, 3000)
}

// --- Status badges ---
const statusBadgeClass: Record<string, string> = {
  geescaleerd: 'badge--yellow',
  ai_opgelost: 'badge--green',
  gesloten: 'badge--gray',
  actief: 'badge--blue',
}

const statusLabel: Record<string, string> = {
  geescaleerd: 'Actie vereist',
  ai_opgelost: 'AI opgelost',
  gesloten: 'Gesloten',
  actief: 'Actief',
}

function formatTime(dateStr: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Service & AI-inzichten</h1>
      <p class="mt-1 text-sm text-gray-500">
        Overzicht van klantgesprekken, AI-analyses en servicehistorie.
      </p>
    </div>

    <!-- KPI cards -->
    <div class="mb-6 grid gap-4 sm:grid-cols-3">
      <div class="stat-card" style="--stat-color: #10b981">
        <p class="text-sm text-gray-500">AI opgelost</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ aiResolvedCount }}</p>
      </div>
      <div class="stat-card" style="--stat-color: #f59e0b">
        <p class="text-sm text-gray-500">Bij installateur</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ escalatedCount }}</p>
      </div>
      <div class="stat-card" style="--stat-color: #ef4444">
        <p class="text-sm text-gray-500">Monteur nodig</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ visitRequiredCount }}</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="mb-4 flex flex-wrap items-center gap-3">
      <div class="relative max-w-xs flex-1">
        <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="search"
          class="input pl-9"
          placeholder="Zoek op naam of onderwerp..."
        />
      </div>
      <div class="flex gap-1">
        <button
          v-for="opt in filterOptions"
          :key="opt.value"
          class="rounded-lg px-3 py-2 text-sm font-medium transition-colors"
          :class="statusFilter === opt.value
            ? 'bg-gray-900 text-white'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'"
          @click="statusFilter = opt.value"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="grid gap-6 lg:grid-cols-5">
      <!-- Left: Conversation list -->
      <div class="lg:col-span-3">
        <div class="section p-0">
          <div v-if="filteredConversations.length" class="divide-y divide-gray-50">
            <button
              v-for="conv in filteredConversations"
              :key="conv.id"
              class="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/50"
              :class="{ 'bg-blue-50/40': selectedConversation?.id === conv.id }"
              @click="selectConversation(conv)"
            >
              <!-- Module icon -->
              <div
                class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                :class="conv.module_type
                  ? [getModuleTheme(conv.module_type).bg, getModuleTheme(conv.module_type).text]
                  : ['bg-gray-100', 'text-gray-500']"
              >
                <AppIcon
                  :name="conv.module_type ? getModuleTheme(conv.module_type).icon : 'help-circle'"
                  :size="18"
                />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold text-gray-900">{{ conv.customer_name }}</p>
                  <!-- AI badge -->
                  <span
                    v-if="conv.status === 'ai_opgelost'"
                    class="inline-flex items-center rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-bold leading-none text-green-700"
                  >
                    AI
                  </span>
                  <!-- Visit indicator -->
                  <span
                    v-if="conv.requires_visit"
                    class="inline-block h-2 w-2 rounded-full bg-red-500"
                    title="Monteurbezoek nodig"
                  />
                </div>
                <p class="mt-0.5 truncate text-xs text-gray-500">{{ conv.subject }}</p>
                <div class="mt-2 flex items-center gap-2">
                  <span class="badge" :class="statusBadgeClass[conv.status]">
                    {{ statusLabel[conv.status] }}
                  </span>
                  <span class="text-xs text-gray-400">{{ formatDateTime(conv.updated_at) }}</span>
                </div>
              </div>

              <AppIcon name="chevron-right" :size="16" class="mt-2 shrink-0 text-gray-300" />
            </button>
          </div>
          <div v-else class="px-5 py-8 text-center">
            <AppIcon name="message" :size="32" class="mx-auto text-gray-300" />
            <p class="mt-2 text-sm text-gray-500">Geen conversaties gevonden</p>
          </div>
        </div>
      </div>

      <!-- Right: Detail panel -->
      <div class="lg:col-span-2">
        <div v-if="selectedConversation" class="section sticky top-6 p-0">
          <!-- Header -->
          <div class="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div class="min-w-0">
              <h3 class="text-sm font-semibold text-gray-900">{{ selectedConversation.customer_name }}</h3>
              <p class="mt-0.5 truncate text-xs text-gray-500">{{ selectedConversation.subject }}</p>
              <div class="mt-1.5 flex items-center gap-2">
                <span class="badge" :class="statusBadgeClass[selectedConversation.status]">
                  {{ statusLabel[selectedConversation.status] }}
                </span>
                <span
                  v-if="selectedConversation.module_type"
                  class="badge"
                  :class="{
                    'badge--yellow': selectedConversation.module_type === 'solar',
                    'badge--red': selectedConversation.module_type === 'heat_pump',
                    'badge--blue': selectedConversation.module_type === 'ev_charger',
                  }"
                >
                  {{ getModuleTheme(selectedConversation.module_type).label }}
                </span>
              </div>
            </div>
            <button
              class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              @click="selectedConversation = null"
            >
              <AppIcon name="x" :size="16" />
            </button>
          </div>

          <!-- AI Samenvatting block -->
          <div v-if="selectedConversation.ai_summary" class="mx-4 mt-4">
            <div class="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white shadow-sm">
              <div class="mb-2 flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="opacity-90">
                  <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                </svg>
                <span class="text-xs font-semibold uppercase tracking-wide opacity-90">AI Analyse</span>
              </div>
              <p class="text-sm leading-relaxed opacity-95">{{ selectedConversation.ai_summary }}</p>
            </div>
            <!-- Visit warning -->
            <div
              v-if="selectedConversation.requires_visit"
              class="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 ring-1 ring-red-200"
            >
              <AppIcon name="warning" :size="14" class="shrink-0 text-red-500" />
              <p class="text-xs font-medium text-red-700">Advies: monteurbezoek nodig</p>
            </div>
          </div>

          <!-- Chat messages -->
          <div
            ref="chatContainer"
            class="mx-4 mt-4 flex max-h-80 flex-col gap-3 overflow-y-auto scroll-smooth"
          >
            <div
              v-for="msg in selectedConversation.messages"
              :key="msg.id"
              class="flex"
              :class="msg.role === 'customer' ? 'justify-end' : 'justify-start'"
            >
              <!-- AI / Installer messages: left -->
              <div
                v-if="msg.role !== 'customer'"
                class="flex max-w-[85%] gap-2"
              >
                <!-- Avatar -->
                <div
                  v-if="msg.role === 'ai'"
                  class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 2l2.09 6.26L20 10l-5.91 1.74L12 18l-2.09-6.26L4 10l5.91-1.74L12 2z" />
                  </svg>
                </div>
                <div
                  v-else
                  class="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100"
                >
                  <AppIcon name="user" :size="12" class="text-blue-600" />
                </div>

                <!-- Bubble -->
                <div>
                  <div
                    class="rounded-2xl rounded-tl-md px-3 py-2 text-sm leading-relaxed"
                    :class="msg.role === 'ai'
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-blue-50 text-blue-900 ring-1 ring-blue-100'"
                  >
                    <p class="whitespace-pre-line">{{ msg.content }}</p>
                  </div>

                  <!-- System check data points -->
                  <div
                    v-if="msg.metadata?.systemCheck && msg.metadata?.dataPoints?.length"
                    class="mt-1.5 rounded-lg bg-indigo-50 p-2 ring-1 ring-indigo-100"
                  >
                    <p class="mb-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-500">Systeemcheck</p>
                    <div class="flex flex-wrap gap-x-3 gap-y-0.5">
                      <div
                        v-for="dp in msg.metadata.dataPoints"
                        :key="dp.label"
                        class="text-xs text-indigo-700"
                      >
                        <span class="font-medium">{{ dp.label }}:</span> {{ dp.value }}
                      </div>
                    </div>
                  </div>

                  <p class="mt-0.5 text-[10px] text-gray-400">
                    {{ msg.role === 'ai' ? 'AI' : partner.name }} · {{ formatTime(msg.timestamp) }}
                  </p>
                </div>
              </div>

              <!-- Customer messages: right -->
              <div
                v-else
                class="max-w-[85%]"
              >
                <div class="rounded-2xl rounded-tr-md bg-gray-800 px-3 py-2 text-sm leading-relaxed text-white">
                  <p class="whitespace-pre-line">{{ msg.content }}</p>
                </div>
                <p class="mt-0.5 text-right text-[10px] text-gray-400">
                  Klant · {{ formatTime(msg.timestamp) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Installer actions -->
          <div class="border-t border-gray-100 px-4 py-4">
            <!-- Reply input -->
            <div class="flex gap-2">
              <input
                v-model="replyText"
                type="text"
                class="input flex-1"
                placeholder="Typ een bericht..."
                @keydown.enter="handleSendReply"
              />
              <button
                class="btn-primary shrink-0 text-sm"
                :disabled="!replyText.trim()"
                :class="{ 'opacity-50 cursor-not-allowed': !replyText.trim() }"
                @click="handleSendReply"
              >
                <AppIcon name="send" :size="14" />
                Versturen
              </button>
            </div>

            <!-- Quick action buttons -->
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                v-if="selectedConversation.status !== 'gesloten'"
                class="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 ring-1 ring-green-200 transition-colors hover:bg-green-100"
                @click="handleResolve"
              >
                <AppIcon name="check-circle" :size="14" />
                Markeer als opgelost
              </button>
              <button
                class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
                @click="handlePlanVisit"
              >
                <AppIcon name="calendar" :size="14" />
                Plan afspraak
              </button>
              <a
                :href="`tel:${partner.support_phone}`"
                class="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
              >
                <AppIcon name="phone" :size="14" />
                Bel klant
              </a>
            </div>

            <!-- Success toast -->
            <Transition
              enter-active-class="transition duration-200 ease-out"
              enter-from-class="opacity-0 translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-150 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 translate-y-1"
            >
              <div v-if="showSuccess" class="mt-3 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 ring-1 ring-green-200">
                <AppIcon name="check-circle" :size="14" class="text-green-500" />
                <p class="text-xs font-medium text-green-700">{{ successMessage }}</p>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="section py-12 text-center">
          <AppIcon name="message" :size="32" class="mx-auto text-gray-300" />
          <p class="mt-2 text-sm text-gray-400">Selecteer een conversatie om details te bekijken</p>
        </div>
      </div>
    </div>

    <!-- Maintenance history -->
    <div class="section mt-8">
      <h2 class="mb-4 text-base font-semibold text-gray-900">
        <AppIcon name="tool" :size="16" class="inline -mt-0.5 text-gray-400" />
        Onderhoudshistorie
      </h2>
      <div class="divide-y divide-gray-50">
        <div
          v-for="record in [...maintenanceRecords].sort((a, b) => b.date.localeCompare(a.date))"
          :key="record.id"
          class="flex items-start gap-3 py-3"
        >
          <div
            class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            :class="record.module_type
              ? [getModuleTheme(record.module_type).bg, getModuleTheme(record.module_type).text]
              : ['bg-gray-100', 'text-gray-500']"
          >
            <AppIcon
              :name="record.module_type ? getModuleTheme(record.module_type).icon : 'tool'"
              :size="14"
            />
          </div>
          <div class="flex-1">
            <p class="text-sm text-gray-700">{{ record.description }}</p>
            <div class="mt-1 flex items-center gap-3 text-xs text-gray-400">
              <span>{{ formatDate(record.date) }}</span>
              <span>{{ record.technician }}</span>
              <span
                class="badge"
                :class="record.type === 'reparatie' ? 'badge--red' : record.type === 'inspectie' ? 'badge--green' : 'badge--blue'"
              >
                {{ record.type }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
