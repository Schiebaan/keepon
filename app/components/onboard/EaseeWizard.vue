<script setup lang="ts">
/**
 * Koppel een Easee-laadpaal aan een klant. Zelfde opzet als WeheatWizard:
 * lijst ophalen via het installateursaccount → laadpaal kiezen → koppelen.
 */
/**
 * Twee stappen, en dat is geen omweg maar een verbetering.
 *
 * Easee's /api/chargers geeft alleen de palen die het account zélf bezit — bij
 * Volt4U twee, terwijl er 115 klantinstallaties zijn. Die zitten onder "sites",
 * en die dragen wél de naam en het adres van de klant. Dus zoekt de
 * installateur eerst zijn klant op, en pas daarna halen we de paal op.
 *
 * Bijkomend voordeel: zoeken op "Jansen" of een straatnaam werkt, in plaats van
 * op een laadpaal-ID dat niemand uit zijn hoofd kent.
 */
interface Site {
  id: number
  name: string
  address: string | null
  installerAlias: string | null
}
interface Charger {
  id: string
  name: string
}

const props = defineProps<{
  modelValue: boolean
  customerId: string
  customerName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'completed': [result: { chargerId: string; name: string }]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const sites = ref<Site[]>([])
const chargers = ref<Charger[]>([])
const loading = ref(false)
const loadingChargers = ref(false)
const loadError = ref('')
const search = ref('')
const selectedSite = ref<Site | null>(null)
const selectedId = ref<string | null>(null)
const linking = ref(false)
const linkError = ref('')
const done = ref(false)

const filteredSites = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return sites.value.slice(0, 60)
  return sites.value.filter(s =>
    s.name?.toLowerCase().includes(q)
    || s.address?.toLowerCase().includes(q)
    || s.installerAlias?.toLowerCase().includes(q),
  ).slice(0, 60)
})

const selectedCharger = computed(() => chargers.value.find(c => c.id === selectedId.value) || null)

async function authHeaders() {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Niet ingelogd')
  return { Authorization: `Bearer ${session.access_token}` }
}

async function loadDevices() {
  loading.value = true
  loadError.value = ''
  try {
    sites.value = await $fetch<Site[]>('/api/integrations/easee/sites', {
      headers: await authHeaders(),
    }) || []
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Kan de installaties niet laden'
  } finally {
    loading.value = false
  }
}

async function pickSite(site: Site) {
  selectedSite.value = site
  selectedId.value = null
  chargers.value = []
  loadingChargers.value = true
  linkError.value = ''
  try {
    chargers.value = await $fetch<Charger[]>('/api/integrations/easee/site-chargers', {
      headers: await authHeaders(),
      query: { site_id: site.id },
    }) || []
    // Vrijwel elke installatie heeft er precies één; dan is kiezen zinloos.
    if (chargers.value.length === 1) selectedId.value = chargers.value[0].id
  } catch (e: any) {
    linkError.value = e?.data?.message || 'Kon de laadpalen van deze installatie niet ophalen.'
  } finally {
    loadingChargers.value = false
  }
}

function backToSites() {
  selectedSite.value = null
  chargers.value = []
  selectedId.value = null
  linkError.value = ''
}

watch(() => props.modelValue, (open) => {
  if (open) {
    selectedId.value = null
    selectedSite.value = null
    chargers.value = []
    search.value = ''
    linkError.value = ''
    done.value = false
    loadDevices()
  }
})

async function handleLink() {
  if (!selectedCharger.value || linking.value) return
  linking.value = true
  linkError.value = ''
  try {
    await $fetch(`/api/customers/${props.customerId}/link-easee`, {
      method: 'POST',
      headers: { ...(await authHeaders()), 'Content-Type': 'application/json' },
      body: {
        charger_id: selectedCharger.value.id,
        name: selectedCharger.value.name,
        brand: 'Easee',
      },
    })
    done.value = true
    emit('completed', { chargerId: selectedCharger.value.id, name: selectedCharger.value.name })
  } catch (e: any) {
    linkError.value = e?.data?.message || e?.message || 'Koppelen mislukt'
  } finally {
    linking.value = false
  }
}

function close() {
  isOpen.value = false
}

function formatDate(iso?: string | null): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="close"
      >
        <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" />
        <div class="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col" style="max-height: 85vh;">
          <!-- Header -->
          <div class="border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <AppIcon name="ev-charger" :size="20" />
              </div>
              <div>
                <h3 class="text-base font-semibold text-gray-900">Laadpaal koppelen via Easee</h3>
                <p class="text-xs text-gray-500">Kies de juiste laadpaal voor {{ customerName || 'deze klant' }}.</p>
              </div>
            </div>
            <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" @click="close">
              <AppIcon name="x" :size="18" />
            </button>
          </div>

          <!-- Done -->
          <div v-if="done" class="px-6 py-10 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <AppIcon name="check-circle" :size="28" />
            </div>
            <h4 class="text-base font-semibold text-gray-900 mb-1">Gekoppeld</h4>
            <p class="text-sm text-gray-500">
              De laadpaal is gekoppeld. {{ customerName || 'De klant' }} ziet vanaf nu laadsessies en verbruik in het portaal.
            </p>
            <button class="btn-primary mt-6" @click="close">Sluiten</button>
          </div>

          <template v-else>
            <!-- Body -->
            <div class="flex-1 overflow-y-auto px-6 py-4">
              <!-- Laden -->
              <div v-if="loading" class="py-12 text-center">
                <div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                <p class="mt-3 text-sm text-gray-500">Installaties ophalen bij Easee...</p>
              </div>

              <!-- Ophalen mislukt -->
              <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-4">
                <div class="flex items-start gap-2">
                  <AppIcon name="warning" :size="16" class="mt-0.5 shrink-0 text-red-600" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-red-900">Kan de installaties niet ophalen</p>
                    <p class="mt-1 text-sm text-red-800/90">{{ loadError }}</p>
                    <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900" @click="loadDevices">
                      Opnieuw proberen
                    </button>
                  </div>
                </div>
              </div>

              <!-- Geen installaties -->
              <div v-else-if="!sites.length" class="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                <AppIcon name="ev-charger" :size="32" class="mx-auto mb-3 text-gray-300" />
                <p class="text-sm text-gray-600">Geen installaties gevonden op je Easee-account.</p>
                <p class="mx-auto mt-2 max-w-sm text-xs text-gray-500">
                  Wij tonen de installaties waar jouw Easee-account toegang op heeft.
                  Zie je hier niets terwijl je in de Easee-app wel klanten hebt?
                  Dan hangen die aan een ander account.
                </p>
              </div>

              <!-- Stap 2: laadpaal binnen de gekozen installatie -->
              <template v-else-if="selectedSite">
                <button type="button" class="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800" @click="backToSites">
                  <AppIcon name="chevron-right" :size="14" class="rotate-180" />
                  Andere installatie kiezen
                </button>

                <div class="mb-3 rounded-xl bg-sky-50 px-3 py-2">
                  <p class="text-sm font-medium text-sky-900">{{ selectedSite.name }}</p>
                  <p v-if="selectedSite.address" class="text-xs text-sky-700/80">{{ selectedSite.address }}</p>
                </div>

                <div v-if="loadingChargers" class="py-8 text-center">
                  <div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  <p class="mt-2 text-sm text-gray-500">Laadpalen ophalen...</p>
                </div>

                <div v-else-if="!chargers.length" class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                  Op deze installatie staat geen laadpaal geregistreerd bij Easee.
                </div>

                <div v-else class="space-y-2">
                  <button
                    v-for="c in chargers"
                    :key="c.id"
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors"
                    :class="selectedId === c.id ? 'border-sky-500 bg-sky-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
                    @click="selectedId = c.id"
                  >
                    <span
                      class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
                      :class="selectedId === c.id ? 'border-sky-500 bg-sky-500' : 'border-gray-300'"
                    >
                      <AppIcon v-if="selectedId === c.id" name="check" :size="12" class="text-white" />
                    </span>
                    <div class="min-w-0 flex-1">
                      <p class="text-sm font-medium text-gray-900">{{ c.name }}</p>
                      <p class="mt-0.5 font-mono text-xs text-gray-500">{{ c.id }}</p>
                    </div>
                  </button>
                </div>
              </template>

              <!-- Stap 1: klant zoeken -->
              <template v-else>
                <div class="relative mb-3">
                  <AppIcon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    v-model="search"
                    type="search"
                    class="input pl-9 text-sm"
                    placeholder="Zoek op naam of adres van de klant..."
                  />
                </div>

                <p class="mb-2 text-xs text-gray-500">
                  {{ sites.length }} installaties op je Easee-account<span v-if="search"> · {{ filteredSites.length }} gevonden</span>
                </p>

                <div class="space-y-1.5">
                  <button
                    v-for="s in filteredSites"
                    :key="s.id"
                    type="button"
                    class="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
                    @click="pickSite(s)"
                  >
                    <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
                      <AppIcon name="ev-charger" :size="16" />
                    </div>
                    <div class="min-w-0 flex-1">
                      <p class="truncate text-sm font-medium text-gray-900">{{ s.name }}</p>
                      <p v-if="s.address" class="truncate text-xs text-gray-500">{{ s.address }}</p>
                    </div>
                    <AppIcon name="chevron-right" :size="15" class="shrink-0 text-gray-300" />
                  </button>
                </div>

                <p v-if="!search && sites.length > 60" class="mt-3 text-center text-xs text-gray-400">
                  Eerste 60 getoond — zoek om de rest te vinden.
                </p>
              </template>
            </div>

            <!-- Footer -->
            <div class="shrink-0 border-t border-gray-100 px-6 py-4">
              <p v-if="linkError" class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ linkError }}</p>
              <div class="flex items-center justify-between gap-3">
                <button class="btn-secondary" :disabled="linking" @click="close">Annuleren</button>
                <button
                  class="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  :disabled="!selectedCharger || linking"
                  @click="handleLink"
                >
                  <span v-if="linking" class="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent align-middle" />
                  {{ linking ? 'Koppelen...' : 'Koppel deze laadpaal' }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
