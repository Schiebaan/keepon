<script setup lang="ts">
import { formatDate } from '~/utils/formatters'
// Types

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { partner } = usePartner()
const { templates: emailTemplates, updateTemplate: updateEmailTemplate, resetTemplate: resetEmailTemplate } = useEmailTemplates()
// Notifications will come from real email log later
const notifications: any[] = []

const totalSent = computed(() => notifications.filter(n => n.status === 'verzonden').length)
const totalFailed = computed(() => notifications.filter(n => n.status === 'mislukt').length)
const thisMonth = computed(() => notifications.filter(n => n.created_at >= '2025-04-01').length)

// Active tab
const activeTab = ref<'log' | 'templates'>('templates')

// Template editing
const editingTemplate = ref<string | null>(null)
const previewTemplate = ref<string | null>(null)

function typeLabel(type: MockNotification['type']) {
  const labels: Record<string, string> = {
    factuur_verzonden: 'Factuur',
    contract_bevestiging: 'Contract',
    opzegging_bevestiging: 'Opzegging',
    verhuizing_melding: 'Verhuizing',
    incasso_alert: 'Incasso alert',
    welkomstmail: 'Welkom',
  }
  return labels[type] || type
}

function typeClass(type: MockNotification['type']) {
  const classes: Record<string, string> = {
    factuur_verzonden: 'bg-blue-50 text-blue-700',
    contract_bevestiging: 'bg-green-50 text-green-700',
    opzegging_bevestiging: 'bg-gray-100 text-gray-700',
    verhuizing_melding: 'bg-amber-50 text-amber-700',
    incasso_alert: 'bg-red-50 text-red-700',
    welkomstmail: 'bg-purple-50 text-purple-700',
  }
  return classes[type] || 'bg-gray-100 text-gray-700'
}

function statusClass(status: string) {
  switch (status) {
    case 'verzonden': return 'badge--green'
    case 'gepland': return 'badge--yellow'
    case 'mislukt': return 'badge--red'
    default: return 'badge--gray'
  }
}

// Available placeholder tags
const placeholders = [
  { tag: '{{voornaam}}', desc: 'Voornaam klant' },
  { tag: '{{naam}}', desc: 'Volledige naam klant' },
  { tag: '{{email}}', desc: 'E-mailadres klant' },
  { tag: '{{bedrijfsnaam}}', desc: 'Naam van je bedrijf' },
  { tag: '{{module}}', desc: 'Naam van de module' },
]

function handleReset(type: string) {
  if (confirm('Weet je zeker dat je dit template wilt terugzetten naar de standaardtekst?')) {
    resetEmailTemplate(type)
  }
}

// Preview: replace placeholders with example values
function previewText(text: string) {
  return text
    .replace(/\{\{voornaam\}\}/g, 'Jan')
    .replace(/\{\{naam\}\}/g, 'Jan de Vries')
    .replace(/\{\{email\}\}/g, 'jan@voorbeeld.nl')
    .replace(/\{\{bedrijfsnaam\}\}/g, partner.name || 'Uw bedrijf')
    .replace(/\{\{module\}\}/g, 'Zonnepanelen monitoring')
}

// Open preview in new tab via the email preview API
function openPreview(type: string) {
  const tmpl = emailTemplates.find(t => t.type === type)
  if (!tmpl) return
  // Map template type to preview API template name
  const previewMap: Record<string, string> = {
    welkomstmail: 'welcome',
    activatie_bevestiging: 'activation',
    wachtwoord_reset: 'reset',
  }
  const previewType = previewMap[type]
  if (previewType) {
    window.open(`/api/email/preview?template=${previewType}`, '_blank')
  } else {
    previewTemplate.value = previewTemplate.value === type ? null : type
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Communicatie</h1>
      <p class="mt-1 text-sm text-gray-500">Beheer automatische berichten en bekijk het verzendoverzicht.</p>
    </div>

    <!-- KPI Stats -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="stat-card" :style="{ '--stat-color': '#1a56db' } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Verzonden</span>
          <AppIcon name="mail" :size="18" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ totalSent }}</p>
        <p class="mt-1 text-xs text-green-600">Alle kanalen</p>
      </div>
      <div class="stat-card" :style="{ '--stat-color': '#059669' } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Deze maand</span>
          <AppIcon name="clock" :size="18" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ thisMonth }}</p>
      </div>
      <div class="stat-card" :style="{ '--stat-color': '#dc2626' } as any">
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-gray-500">Mislukt</span>
          <AppIcon name="warning" :size="18" class="text-gray-400" />
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ totalFailed }}</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6">
      <button
        class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'templates' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        @click="activeTab = 'templates'"
      >
        <AppIcon name="settings" :size="16" />
        E-mail templates
      </button>
      <button
        class="flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
        :class="activeTab === 'log' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
        @click="activeTab = 'log'"
      >
        <AppIcon name="mail" :size="16" />
        Berichtenlog
      </button>
    </div>

    <!-- Templates tab -->
    <div v-if="activeTab === 'templates'">
      <!-- Placeholder reference -->
      <div class="mb-5 rounded-xl bg-blue-50 border border-blue-100 p-4">
        <p class="text-xs font-semibold text-blue-800 mb-2">Beschikbare placeholders</p>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="p in placeholders"
            :key="p.tag"
            class="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-mono text-blue-700 border border-blue-200"
            :title="p.desc"
          >
            {{ p.tag }}
            <span class="text-blue-400 font-sans">{{ p.desc }}</span>
          </span>
        </div>
      </div>

      <!-- Template cards -->
      <div class="space-y-4">
        <div
          v-for="tmpl in emailTemplates"
          :key="tmpl.type"
          class="rounded-xl border border-gray-200 bg-white overflow-hidden"
        >
          <!-- Template header -->
          <div
            class="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
            @click="editingTemplate = editingTemplate === tmpl.type ? null : tmpl.type"
          >
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                <AppIcon name="mail" :size="16" />
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900">{{ tmpl.label }}</p>
                <p class="text-xs text-gray-500">{{ tmpl.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <!-- Enabled toggle -->
              <button
                class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                :class="tmpl.enabled ? 'bg-green-500' : 'bg-gray-300'"
                @click.stop="tmpl.enabled = !tmpl.enabled"
              >
                <span
                  class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
                  :class="tmpl.enabled ? 'translate-x-6' : 'translate-x-1'"
                />
              </button>
              <AppIcon
                name="chevron-down"
                :size="16"
                class="text-gray-400 transition-transform"
                :class="editingTemplate === tmpl.type ? 'rotate-180' : ''"
              />
            </div>
          </div>

          <!-- Expanded editor -->
          <div v-if="editingTemplate === tmpl.type" class="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50">
            <div>
              <label class="label">Onderwerp</label>
              <input
                v-model="tmpl.subject"
                type="text"
                class="input font-mono text-sm"
                placeholder="Onderwerpregel"
              />
            </div>

            <div>
              <label class="label">Koptekst</label>
              <input
                v-model="tmpl.heading"
                type="text"
                class="input text-sm"
                placeholder="Koptekst in de email"
              />
            </div>

            <div>
              <label class="label">Berichttekst</label>
              <textarea
                v-model="tmpl.body"
                class="input text-sm"
                rows="3"
                placeholder="De hoofdtekst van je bericht..."
              />
            </div>

            <div>
              <label class="label">Knoptekst</label>
              <input
                v-model="tmpl.buttonText"
                type="text"
                class="input text-sm"
                placeholder="Tekst op de actieknop"
              />
            </div>

            <!-- Preview -->
            <div v-if="previewTemplate === tmpl.type" class="rounded-lg border border-gray-200 bg-white p-4">
              <p class="text-xs font-medium text-gray-400 mb-2">Preview</p>
              <p class="text-xs text-gray-500 mb-1">Onderwerp: <strong class="text-gray-700">{{ previewText(tmpl.subject) }}</strong></p>
              <div class="mt-2 rounded-lg bg-gray-50 p-3">
                <p class="text-base font-bold text-gray-900 mb-1">{{ previewText(tmpl.heading) }}</p>
                <p class="text-sm text-gray-600 mb-3">{{ previewText(tmpl.body) }}</p>
                <span
                  class="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white"
                  :style="{ backgroundColor: partner.primary_color }"
                >
                  {{ tmpl.buttonText }}
                </span>
              </div>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-2">
              <div class="flex items-center gap-2">
                <button
                  class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  @click.stop="previewTemplate = previewTemplate === tmpl.type ? null : tmpl.type"
                >
                  <AppIcon name="search" :size="12" />
                  {{ previewTemplate === tmpl.type ? 'Verberg preview' : 'Toon preview' }}
                </button>
                <button
                  v-if="['welkomstmail', 'activatie_bevestiging', 'wachtwoord_reset'].includes(tmpl.type)"
                  class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  @click.stop="openPreview(tmpl.type)"
                >
                  <AppIcon name="external" :size="12" />
                  HTML preview
                </button>
              </div>
              <button
                class="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                @click.stop="handleReset(tmpl.type)"
              >
                <AppIcon name="refresh" :size="12" />
                Terugzetten
              </button>
            </div>
          </div>
        </div>
      </div>

      <p class="mt-4 text-xs text-gray-400">
        Wijzigingen worden automatisch opgeslagen. Gebruik placeholders om berichten te personaliseren.
      </p>
    </div>

    <!-- Log tab -->
    <div v-if="activeTab === 'log'">
      <div class="section">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th class="pb-3 pr-3">Datum</th>
                <th class="pb-3 pr-3">Type</th>
                <th class="pb-3 pr-3">Ontvanger</th>
                <th class="pb-3 pr-3">Onderwerp</th>
                <th class="pb-3">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="n in notifications" :key="n.id" class="hover:bg-gray-50">
                <td class="py-3 pr-3 text-xs text-gray-500 whitespace-nowrap">{{ formatDate(n.created_at) }}</td>
                <td class="py-3 pr-3">
                  <span class="inline-flex rounded-md px-2 py-0.5 text-xs font-medium" :class="typeClass(n.type)">
                    {{ typeLabel(n.type) }}
                  </span>
                </td>
                <td class="py-3 pr-3">
                  <p class="text-sm text-gray-900">{{ n.recipient_name }}</p>
                  <p class="text-xs text-gray-400">{{ n.recipient_email }}</p>
                </td>
                <td class="py-3 pr-3 text-sm text-gray-700 max-w-xs truncate">{{ n.subject }}</td>
                <td class="py-3">
                  <span class="badge" :class="statusClass(n.status)">{{ n.status }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
