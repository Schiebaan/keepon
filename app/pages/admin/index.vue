<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const { partner } = usePartner()

// Bewust NIET meeliften op de gedeelde klanten-state van useCustomers().
// Die wordt door /admin/klanten gevuld met alleen 'accepted' en door
// /admin/uitnodigingen met alleen 'pending'. Kwam je via een van die pagina's
// hierheen, dan telde dit dashboard hun filter mee en stond er een te laag
// getal. We vragen hier dus onze eigen, ongefilterde telling op.
//
// En we nemen `total` van de server, niet rows.length — die lijst is op 100
// afgekapt, dus vanaf de 101e klant zou de tegel blijven staan op 100.
const { query: queryCustomers } = useCustomers({ autoLoad: false })
const customerCount = ref(0)
const customersLoading = ref(true)

async function loadCustomerCount() {
  try {
    const r = await queryCustomers({ limit: 1 })
    customerCount.value = r.total
  } catch {
    // Achtergrondverversing: laatst bekende telling laten staan.
  } finally {
    customersLoading.value = false
  }
}
const stats = computed(() => [
  {
    label: 'Klanten',
    value: customerCount.value,
    change: '',
    changePositive: true,
    icon: 'users',
    color: '#1a56db',
  },
  {
    label: 'Actieve modules',
    value: totalActiveModules.value,
    change: '',
    changePositive: true,
    icon: 'puzzle',
    color: '#059669',
  },
  {
    label: 'Maandomzet',
    value: '—',
    change: 'Binnenkort beschikbaar',
    changePositive: true,
    icon: 'euro',
    color: '#7c3aed',
  },
  {
    label: 'Openstaand',
    value: '—',
    change: '',
    changePositive: true,
    icon: 'clock',
    color: '#dc2626',
  },
])

// --- Recente activiteit (uit audit_log) ---
interface ActivityItem {
  id: string
  type: 'customer' | 'ticket' | 'installation' | 'email' | 'partner' | 'other'
  icon: string
  text: string
  link: string | null
  at: string
}

const recentActivity = ref<ActivityItem[]>([])
const activityLoading = ref(true)

async function loadActivity() {
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    recentActivity.value = await $fetch<ActivityItem[]>('/api/partners/activity', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch {
    // Bij een achtergrondverversing de bestaande lijst laten staan; alleen bij
    // de eerste laadpoging is een lege lijst het eerlijke antwoord.
    if (activityLoading.value) recentActivity.value = []
  } finally {
    activityLoading.value = false
  }
}

onMounted(loadActivity)

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

function activityIconBg(type: string) {
  switch (type) {
    case 'customer':     return 'bg-blue-50 text-blue-600'
    case 'ticket':       return 'bg-amber-50 text-amber-600'
    case 'installation': return 'bg-green-50 text-green-600'
    case 'email':        return 'bg-indigo-50 text-indigo-600'
    default:             return 'bg-gray-100 text-gray-500'
  }
}

// Openstaande storingen op gekoppelde installaties. Stond hier hardcoded op
// een lege lijst met "later"; er werd dan ook niets gedetecteerd. De
// cron-taak check-alerts vult device_alerts nu periodiek.
interface DeviceAlert {
  id: string
  kind: 'error' | 'unreachable' | 'stale'
  detail: string
  since: string
  customerId: string
  customerName: string
  productName: string
  category: string | null
}
const systemAlerts = ref<DeviceAlert[]>([])

async function loadAlerts() {
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    systemAlerts.value = await $fetch<DeviceAlert[]>('/api/partners/alerts', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch {
    // Achtergrondverversing: laatst bekende lijst laten staan.
  }
}

const ALERT_LABELS: Record<string, string> = {
  error: 'Storing',
  unreachable: 'Niet bereikbaar',
  stale: 'Geen data',
  integration_down: 'Koppeling stuk',
}

// --- Module breakdown: live counts per category ---
interface ModuleStat { total: number; monitored: number }
const moduleStats = ref<Record<string, ModuleStat>>({
  solar_panel: { total: 0, monitored: 0 },
  heat_pump:   { total: 0, monitored: 0 },
  ev_charger:  { total: 0, monitored: 0 },
  battery:     { total: 0, monitored: 0 },
})

async function loadModuleStats() {
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    moduleStats.value = await $fetch('/api/partners/module-stats', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch {}
}

onMounted(loadModuleStats)
onMounted(loadCustomerCount)
onMounted(loadAlerts)

// Het dashboard laadde alles één keer in onMounted en daarna nooit meer. Wie
// het scherm open liet staan keek naar cijfers van uren geleden.
const { lastRefreshed } = useLiveRefresh(
  () => Promise.all([loadActivity(), loadModuleStats(), loadCustomerCount(), loadAlerts()]),
  { intervalMs: 60_000 },
)
const bijgewerkt = useRelativeTime(lastRefreshed)

const moduleBreakdown = computed(() => [
  {
    name: 'Zonnepanelen', type: 'solar', dbKey: 'solar_panel',
    count: moduleStats.value.solar_panel.total,
    monitored: moduleStats.value.solar_panel.monitored,
    theme: getModuleTheme('solar'),
  },
  {
    name: 'Warmtepomp', type: 'heat_pump', dbKey: 'heat_pump',
    count: moduleStats.value.heat_pump.total,
    monitored: moduleStats.value.heat_pump.monitored,
    theme: getModuleTheme('heat_pump'),
  },
  {
    name: 'Laadpaal', type: 'ev_charger', dbKey: 'ev_charger',
    count: moduleStats.value.ev_charger.total,
    monitored: moduleStats.value.ev_charger.monitored,
    theme: getModuleTheme('ev_charger'),
  },
])

const totalActiveModules = computed(() =>
  Object.values(moduleStats.value).reduce((s, m) => s + m.total, 0)
)
</script>

<template>
  <div>
    <!-- Page header -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p class="mt-1 text-sm text-gray-500">
        Overzicht van {{ partner.name }}
        <span v-if="bijgewerkt" class="text-gray-400"> · bijgewerkt {{ bijgewerkt }}</span>
      </p>
    </div>

    <!-- Welcome banner when no customers yet -->
    <div v-if="!customersLoading && customerCount === 0" class="mb-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
      <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <AppIcon name="users" :size="28" class="text-gray-400" />
      </div>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Welkom bij {{ partner.name }}!</h2>
      <p class="text-sm text-gray-500 max-w-md mx-auto mb-6">
        Je portaal is klaar. Begin met het toevoegen van je eerste klant, of pas je instellingen aan.
      </p>
      <div class="flex items-center justify-center gap-3">
        <NuxtLink
          to="/admin/customers"
          class="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors"
          :style="{ backgroundColor: partner.primary_color }"
        >
          <AppIcon name="plus" :size="16" />
          Eerste klant toevoegen
        </NuxtLink>
        <NuxtLink
          to="/admin/settings"
          class="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <AppIcon name="settings" :size="16" />
          Instellingen
        </NuxtLink>
      </div>
    </div>

    <!-- KPI Stat Cards with accent bars -->
    <div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="stat-card"
        :style="{ '--stat-color': stat.color }"
      >
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
          <div
            class="flex h-9 w-9 items-center justify-center rounded-lg"
            :style="{ backgroundColor: stat.color + '10', color: stat.color }"
          >
            <AppIcon :name="stat.icon" :size="18" />
          </div>
        </div>
        <p class="mt-2 text-2xl font-bold text-gray-900">{{ stat.value }}</p>
        <p
          class="mt-1 text-xs font-medium"
          :class="stat.changePositive ? 'text-green-600' : 'text-red-500'"
        >
          {{ stat.change }}
        </p>
      </div>
    </div>

    <!-- System Alerts -->
    <div v-if="systemAlerts.length > 0" class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <AppIcon name="warning" :size="18" class="text-red-500" />
        <h2 class="text-base font-semibold text-gray-900">Aandacht vereist</h2>
        <span class="badge badge--red">{{ systemAlerts.length }}</span>
      </div>
      <div class="space-y-2">
        <NuxtLink
          v-for="alert in systemAlerts"
          :key="alert.id"
          :to="`/admin/customers/${alert.customerId}`"
          class="flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-sm no-underline"
          :class="alert.kind === 'stale' ? 'border-amber-200 bg-amber-50/50' : 'border-red-200 bg-red-50/50'"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
            :class="alert.kind === 'stale' ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'"
          >
            <AppIcon :name="alert.kind === 'stale' ? 'clock' : 'warning'" :size="20" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-medium text-gray-900">{{ alert.customerName }}</p>
              <span
                class="rounded-full px-2 py-0.5 text-[10px] font-medium"
                :class="alert.kind === 'stale' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'"
              >
                {{ ALERT_LABELS[alert.kind] || alert.kind }}
              </span>
              <span class="text-[11px] text-gray-500">{{ alert.productName }}</span>
            </div>
            <p class="text-xs text-gray-600 mt-0.5">{{ alert.detail }}</p>
            <p class="text-[11px] text-gray-400 mt-0.5">Gesignaleerd {{ timeAgo(alert.since) }}</p>
          </div>
          <AppIcon name="chevron-right" :size="16" class="text-gray-300 shrink-0" />
        </NuxtLink>
      </div>
    </div>

    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Recente activiteit -->
      <div class="lg:col-span-2">
        <div class="section">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">Recente activiteit</h2>
            <NuxtLink to="/admin/customers" class="text-xs font-medium text-gray-400 hover:text-gray-600">
              Alle klanten &rarr;
            </NuxtLink>
          </div>
          <div v-if="activityLoading" class="py-8 text-center">
            <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
          </div>
          <div v-else-if="recentActivity.length === 0" class="py-8 text-center">
            <AppIcon name="activity" :size="24" class="mx-auto text-gray-300 mb-2" />
            <p class="text-sm text-gray-400">Activiteit verschijnt hier zodra klanten worden toegevoegd of service-meldingen binnenkomen.</p>
          </div>
          <div v-else class="space-y-1">
            <component
              :is="item.link ? 'NuxtLink' : 'div'"
              v-for="item in recentActivity"
              :key="item.id"
              :to="item.link || undefined"
              class="flex items-start gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors"
              :class="item.link ? 'hover:bg-gray-50 cursor-pointer no-underline' : ''"
            >
              <div
                class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                :class="activityIconBg(item.type)"
              >
                <AppIcon :name="item.icon" :size="15" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-700 truncate">{{ item.text }}</p>
                <p class="mt-0.5 text-xs text-gray-400">{{ timeAgo(item.at) }}</p>
              </div>
              <AppIcon v-if="item.link" name="chevron-right" :size="14" class="text-gray-300 mt-2 shrink-0" />
            </component>
          </div>
        </div>
      </div>

      <!-- Module verdeling -->
      <div>
        <div class="section">
          <div class="mb-5 flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900">Modules</h2>
            <NuxtLink to="/admin/modules" class="text-xs font-medium text-gray-400 hover:text-gray-600">
              Beheren &rarr;
            </NuxtLink>
          </div>
          <div class="space-y-3">
            <div
              v-for="mod in moduleBreakdown"
              :key="mod.type"
              class="flex items-center justify-between rounded-xl p-3"
              :class="mod.theme.bg"
            >
              <div class="flex items-center gap-3">
                <div
                  class="flex h-8 w-8 items-center justify-center rounded-lg"
                  :class="[mod.theme.bg, mod.theme.text]"
                >
                  <AppIcon :name="mod.theme.icon" :size="16" />
                </div>
                <div>
                  <p class="text-sm font-medium" :class="mod.theme.text">{{ mod.name }}</p>
                  <p v-if="mod.monitored > 0 && mod.monitored < mod.count" class="text-[11px] opacity-70" :class="mod.theme.text">
                    {{ mod.monitored }} met monitoring
                  </p>
                  <p v-else-if="mod.monitored > 0 && mod.monitored === mod.count" class="text-[11px] opacity-70" :class="mod.theme.text">
                    Alle gekoppeld
                  </p>
                  <p v-else-if="mod.count > 0" class="text-[11px] opacity-70" :class="mod.theme.text">
                    Nog niet gekoppeld
                  </p>
                </div>
              </div>
              <span
                class="badge"
                :class="mod.theme.bg + ' ' + mod.theme.text"
              >
                {{ mod.count }}
              </span>
            </div>
          </div>

          <!-- Payment link -->
          <div class="mt-5 border-t border-gray-100 pt-4">
            <NuxtLink to="/admin/payments" class="inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600">
              <AppIcon name="credit-card" :size="12" />
              Betalingen bekijken
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
