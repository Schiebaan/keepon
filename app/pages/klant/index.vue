<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth', 'customer-onboarding'] })

const { partner } = usePartner()
const { customer, isLoading } = useCurrentCustomer()
const { summary: solar, load: loadSolar } = useSolarSummary()
const { evCharger, heatPump, load: loadProducts } = useCustomerProducts()
const { data: laadpaal, load: loadLaadpaal } = useLaadpaalData()
const { data: warmtepomp, load: loadWarmtepomp } = useWarmtepompData()

interface Ticket { id: string; status: string; subject: string; updated_at: string }
const tickets = ref<Ticket[]>([])
const openTickets = computed(() => tickets.value.filter(t => t.status !== 'opgelost' && t.status !== 'gesloten'))
const latestTicket = computed(() => tickets.value[0])

async function loadTickets() {
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return
    tickets.value = await $fetch<Ticket[]>('/api/customer/tickets', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
  } catch {
    tickets.value = []
  }
}

onMounted(async () => {
  loadSolar()
  loadTickets()
  await loadProducts()
  // Pull live module data once we know which integrations are linked
  if (evCharger.value?.linked) loadLaadpaal()
  if (heatPump.value?.linked) loadWarmtepomp()
})

function fmtKwhShort(kwh: number): string {
  if (kwh >= 1000) return `${(kwh / 1000).toFixed(1)} MWh`
  if (kwh >= 10) return `${kwh.toFixed(0)} kWh`
  return `${kwh.toFixed(1)} kWh`
}
function fmtEuro(v: number): string {
  return v.toFixed(2).replace('.', ',')
}

// Time-based greeting
const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Goedemorgen'
  if (hour < 18) return 'Goedemiddag'
  return 'Goedenavond'
})

const firstName = computed(() => customer.value?.full_name?.split(' ')[0] || 'daar')

function formatKwh(wh?: number) {
  const v = (wh || 0) / 1000
  if (v >= 1000) return `${(v / 1000).toFixed(1)} MWh`
  if (v >= 10) return `${v.toFixed(0)} kWh`
  return `${v.toFixed(1)} kWh`
}

/**
 * Incasso-status afgeleid uit klantkolommen (mollie_mandate_id, mandate_at,
 * mandate_skipped). Zelfde logica als /klant/contracten — bewust hier
 * gedupliceerd zodat het dashboard geen extra API-call hoeft te doen.
 */
const mandateState = computed<'active' | 'pending' | 'skipped' | 'not_set' | null>(() => {
  const c = customer.value as any
  if (!c) return null
  if (c.mollie_mandate_id) return 'active'
  if (c.mandate_at) return 'pending'
  if (c.mandate_skipped) return 'skipped'
  // Alleen "not_set" tonen als de klant ook daadwerkelijk akkoord heeft gegeven
  // — anders is het onboarding-flow, niet een herinneringssituatie
  if (c.accepted_at) return 'not_set'
  return null
})

/** Today's tile shows "Komt vanavond binnen" when 0 but system is otherwise reporting. */
function todayText(): { text: string; pending: boolean } {
  const y = solar.value?.yield
  if (!y) return { text: '—', pending: false }
  if (y.today_wh && y.today_wh > 0) return { text: formatKwh(y.today_wh), pending: false }
  if (y.has_any_recent_data) return { text: 'Komt vanavond', pending: true }
  return { text: 'Nog geen data', pending: true }
}
</script>

<template>
  <div>
    <!-- Loading -->
    <div v-if="isLoading" class="py-16 text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <template v-else>
      <!-- Greeting -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">{{ greeting }}, {{ firstName }}</h1>
        <p class="mt-1 text-sm text-gray-500">Welkom bij je persoonlijke portaal.</p>
      </div>

      <!-- Mandaat-status banner — alleen tonen als er iets te melden is.
           In "active"-staat verbergen we 'm: dan is alles in orde en
           hoeven we het dashboard niet vol te zetten. -->
      <div
        v-if="mandateState && mandateState !== 'active'"
        class="mb-6 rounded-2xl border p-4 flex items-start gap-3"
        :class="{
          'border-amber-200 bg-amber-50/70': mandateState === 'pending',
          'border-red-200 bg-red-50/70': mandateState === 'skipped' || mandateState === 'not_set',
        }"
      >
        <div
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          :class="{
            'bg-amber-100 text-amber-700': mandateState === 'pending',
            'bg-red-100 text-red-700': mandateState === 'skipped' || mandateState === 'not_set',
          }"
        >
          <AppIcon :name="mandateState === 'pending' ? 'clock' : 'warning'" :size="18" />
        </div>
        <div class="min-w-0 flex-1">
          <template v-if="mandateState === 'pending'">
            <p class="text-sm font-semibold text-amber-900">Mandaat wordt bevestigd</p>
            <p class="mt-0.5 text-xs text-amber-800/80">
              We wachten op bevestiging van je bank. Doorgaans binnen een paar minuten.
            </p>
          </template>
          <template v-else>
            <p class="text-sm font-semibold text-red-900">Incasso nog instellen</p>
            <p class="mt-0.5 text-xs text-red-800/80">
              Zet je IBAN in zodat {{ partner.name }} de servicekosten automatisch kan afschrijven.
            </p>
          </template>
        </div>
        <NuxtLink
          v-if="mandateState !== 'pending'"
          to="/welkom/incasso"
          class="shrink-0 inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 whitespace-nowrap"
        >
          <AppIcon name="credit-card" :size="12" />
          Instellen
        </NuxtLink>
        <NuxtLink
          v-else
          to="/klant/contracten"
          class="shrink-0 text-xs font-semibold text-amber-900 hover:underline whitespace-nowrap"
        >
          Bekijken
        </NuxtLink>
      </div>

      <!-- Customer info card -->
      <div class="section mb-6">
        <div class="flex items-center gap-4">
          <div
            class="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white"
            :style="{ backgroundColor: partner.primary_color }"
          >
            {{ customer?.full_name?.charAt(0) || '?' }}
          </div>
          <div>
            <p class="font-medium text-gray-900">{{ customer?.full_name }}</p>
            <p class="text-sm text-gray-500">{{ customer?.email }}</p>
          </div>
        </div>
      </div>

      <!-- Solar card: only show when connected via Sundata -->
      <NuxtLink
        v-if="solar?.connected"
        to="/klant/zonnepanelen"
        class="mb-6 block rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 transition-shadow hover:shadow-sm no-underline"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <AppIcon name="solar" :size="22" />
            </div>
            <div>
              <p class="text-xs font-medium text-amber-700 uppercase tracking-wider">Zonnepanelen</p>
              <p class="text-lg font-semibold text-gray-900">{{ solar.product?.name }}</p>
              <p v-if="solar.meter?.peak_in_watt" class="text-xs text-gray-500">
                {{ (solar.meter.peak_in_watt / 1000).toFixed(1) }} kWp
                <span v-if="solar.plant?.monitored_since">· gemonitord sinds {{ new Date(solar.plant.monitored_since).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }) }}</span>
              </p>
            </div>
          </div>
          <AppIcon name="chevron-right" :size="18" class="text-gray-400 mt-1" />
        </div>

        <div class="mt-4 grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Vandaag</p>
            <p class="mt-1 text-base font-semibold" :class="todayText().pending ? 'text-gray-400' : 'text-gray-900'">
              {{ todayText().text }}
            </p>
          </div>
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Deze maand</p>
            <p class="mt-1 text-base font-semibold text-gray-900">{{ formatKwh(solar.yield?.month_wh) }}</p>
          </div>
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Dit jaar</p>
            <p class="mt-1 text-base font-semibold text-gray-900">{{ formatKwh(solar.yield?.year_wh) }}</p>
          </div>
        </div>

        <div
          v-if="solar.yield && !solar.yield.has_any_recent_data"
          class="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-amber-700"
        >
          Je installatie is gekoppeld. De eerste meetgegevens kunnen tot 24 uur duren.
        </div>
      </NuxtLink>

      <!-- EV charger card: only when a linked Easee charger is on file -->
      <NuxtLink
        v-if="evCharger && evCharger.linked"
        to="/klant/laadpaal"
        class="mb-6 block rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 transition-shadow hover:shadow-sm no-underline"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
              <AppIcon name="ev-charger" :size="22" />
            </div>
            <div>
              <p class="text-xs font-medium text-sky-700 uppercase tracking-wider">Laadpaal</p>
              <p class="text-lg font-semibold text-gray-900">
                {{ evCharger.name || (evCharger.brand && evCharger.model ? `${evCharger.brand} ${evCharger.model}` : 'Laadpaal') }}
              </p>
              <p class="text-xs text-gray-500">
                <span v-if="laadpaal?.online" class="inline-flex items-center gap-1 text-green-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-green-500" /> Online
                </span>
                <span v-else-if="laadpaal && laadpaal.online === false" class="inline-flex items-center gap-1 text-red-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-red-500" /> Offline
                </span>
                <span v-else>Gekoppeld met Easee</span>
                <span v-if="laadpaal?.op_mode_label && laadpaal.op_mode_label !== 'Onbekend'"> · {{ laadpaal.op_mode_label }}</span>
              </p>
            </div>
          </div>
          <AppIcon name="chevron-right" :size="18" class="text-gray-400 mt-1" />
        </div>

        <div class="mt-4 grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Deze maand</p>
            <p class="mt-1 text-base font-semibold text-gray-900 tabular-nums">
              {{ laadpaal ? fmtKwhShort(laadpaal.current_month?.kwh || 0) : '…' }}
            </p>
          </div>
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Kosten</p>
            <p class="mt-1 text-base font-semibold text-gray-900 tabular-nums">
              € {{ laadpaal ? fmtEuro(laadpaal.current_month?.cost_eur || 0) : '…' }}
            </p>
          </div>
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Sinds installatie</p>
            <p class="mt-1 text-base font-semibold text-gray-900 tabular-nums">
              {{ laadpaal ? fmtKwhShort(laadpaal.lifetime_kwh || 0) : '…' }}
            </p>
          </div>
        </div>
      </NuxtLink>

      <!-- Heat pump card: only when a linked Weheat heat pump is on file -->
      <NuxtLink
        v-if="heatPump && heatPump.linked"
        to="/klant/warmtepomp"
        class="mb-6 block rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-orange-50 p-5 transition-shadow hover:shadow-sm no-underline"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <AppIcon name="heat-pump" :size="22" />
            </div>
            <div>
              <p class="text-xs font-medium text-orange-700 uppercase tracking-wider">Warmtepomp</p>
              <p class="text-lg font-semibold text-gray-900">
                {{ heatPump.name || (heatPump.brand && heatPump.model ? `${heatPump.brand} ${heatPump.model}` : 'Warmtepomp') }}
              </p>
              <p class="text-xs text-gray-500">
                <span v-if="warmtepomp?.state_label" class="inline-flex items-center gap-1 text-orange-700">
                  <span class="h-1.5 w-1.5 rounded-full bg-orange-500" /> {{ warmtepomp.state_label }}
                </span>
                <span v-else>Gekoppeld met Weheat</span>
              </p>
            </div>
          </div>
          <AppIcon name="chevron-right" :size="18" class="text-gray-400 mt-1" />
        </div>

        <div class="mt-4 grid grid-cols-3 gap-3">
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Binnen</p>
            <p class="mt-1 text-base font-semibold text-gray-900 tabular-nums">
              {{ warmtepomp?.room_c != null ? `${warmtepomp.room_c.toFixed(1)} °C` : '…' }}
            </p>
          </div>
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Aanvoer</p>
            <p class="mt-1 text-base font-semibold text-gray-900 tabular-nums">
              {{ warmtepomp?.water_out_c != null ? `${warmtepomp.water_out_c.toFixed(1)} °C` : '…' }}
            </p>
          </div>
          <div class="rounded-xl bg-white/60 p-3">
            <p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">SCOP</p>
            <p class="mt-1 text-base font-semibold text-gray-900 tabular-nums">
              {{ warmtepomp?.scop ? warmtepomp.scop.toFixed(1) : '…' }}
            </p>
          </div>
        </div>
      </NuxtLink>

      <!-- Service card: always visible so customers can file a ticket -->
      <NuxtLink
        to="/klant/service"
        class="mb-6 block rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm no-underline"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="flex items-start gap-3">
            <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <AppIcon name="tool" :size="22" />
            </div>
            <div>
              <p class="text-xs font-medium text-indigo-700 uppercase tracking-wider">Service</p>
              <p class="text-lg font-semibold text-gray-900">
                <template v-if="openTickets.length">
                  {{ openTickets.length }} openstaande melding{{ openTickets.length === 1 ? '' : 'en' }}
                </template>
                <template v-else-if="tickets.length">
                  Alle meldingen afgehandeld
                </template>
                <template v-else>
                  Hulp nodig?
                </template>
              </p>
              <p class="text-xs text-gray-500 mt-0.5">
                <template v-if="openTickets.length">
                  Laatst bijgewerkt: {{ new Date(latestTicket.updated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' }) }}
                </template>
                <template v-else>
                  Maak een melding aan of neem contact op met {{ partner.name }}
                </template>
              </p>
            </div>
          </div>
          <AppIcon name="chevron-right" :size="18" class="text-gray-400 mt-1" />
        </div>
      </NuxtLink>

      <!-- Status: no modules yet -->
      <div v-if="!solar?.connected && !(evCharger && evCharger.linked) && !(heatPump && heatPump.linked)" class="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center mb-6">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
          <AppIcon name="home" :size="28" class="text-gray-400" />
        </div>
        <h2 class="text-lg font-semibold text-gray-900 mb-2">Je portaal wordt ingericht</h2>
        <p class="text-sm text-gray-500 max-w-md mx-auto">
          Je installateur is bezig met het koppelen van je systeem. Zodra dit klaar is, zie je hier je energiegegevens, monitoring en meer.
        </p>
      </div>

      <!-- Contact -->
      <div class="section">
        <h3 class="text-sm font-semibold text-gray-900 mb-3">Contact met {{ partner.name }}</h3>
        <div class="flex flex-wrap gap-4 text-sm text-gray-600">
          <span v-if="partner.support_email" class="flex items-center gap-1.5">
            <AppIcon name="mail" :size="14" class="text-gray-400" />
            <a :href="'mailto:' + partner.support_email" class="hover:underline">{{ partner.support_email }}</a>
          </span>
          <span v-if="partner.support_phone" class="flex items-center gap-1.5">
            <AppIcon name="phone" :size="14" class="text-gray-400" />
            {{ partner.support_phone }}
          </span>
        </div>
      </div>
    </template>
  </div>
</template>
