<script setup lang="ts">
/**
 * Koppel een Easee-laadpaal aan een klant. Zelfde opzet als WeheatWizard:
 * lijst ophalen via het installateursaccount → laadpaal kiezen → koppelen.
 */
interface Charger {
  id: string
  name: string
  serial?: string | null
  createdOn?: string | null
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

const chargers = ref<Charger[]>([])
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const selectedId = ref<string | null>(null)
const linking = ref(false)
const linkError = ref('')
const done = ref(false)

const filteredChargers = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return chargers.value
  return chargers.value.filter(c =>
    c.id?.toLowerCase().includes(q)
    || c.name?.toLowerCase().includes(q)
    || c.serial?.toLowerCase().includes(q),
  )
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
    const data = await $fetch<Charger[]>('/api/integrations/easee/devices', {
      headers: await authHeaders(),
    })
    chargers.value = data || []
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Kan de lijst met laadpalen niet laden'
  } finally {
    loading.value = false
  }
}

watch(() => props.modelValue, (open) => {
  if (open) {
    selectedId.value = null
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
        // Easee laat de naam vaak leeg of op "1" staan; dan is het
        // charger-ID herkenbaarder voor de installateur.
        name: selectedCharger.value.name && selectedCharger.value.name.length > 2
          ? selectedCharger.value.name
          : `Laadpaal ${selectedCharger.value.id}`,
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
                <p class="mt-3 text-sm text-gray-500">Laadpalen ophalen bij Easee...</p>
              </div>

              <!-- Ophalen mislukt -->
              <div v-else-if="loadError" class="rounded-xl border border-red-200 bg-red-50 p-4">
                <div class="flex items-start gap-2">
                  <AppIcon name="warning" :size="16" class="mt-0.5 shrink-0 text-red-600" />
                  <div class="min-w-0">
                    <p class="text-sm font-medium text-red-900">Kan de laadpalen niet ophalen</p>
                    <p class="mt-1 text-sm text-red-800/90">{{ loadError }}</p>
                    <button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900" @click="loadDevices">
                      Opnieuw proberen
                    </button>
                  </div>
                </div>
              </div>

              <!-- Geen laadpalen -->
              <div v-else-if="!chargers.length" class="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">
                <AppIcon name="ev-charger" :size="32" class="mx-auto mb-3 text-gray-300" />
                <p class="text-sm text-gray-600">Geen laadpalen gevonden op je Easee-account.</p>
                <p class="mx-auto mt-2 max-w-sm text-xs text-gray-500">
                  Wij tonen precies wat Easee ons teruggeeft. Zie je in de Easee-app wél laadpalen?
                  Dan hangen die aan een ander account dan het gekoppelde installateursaccount.
                </p>
              </div>

              <!-- Lijst -->
              <template v-else>
                <div class="relative mb-3">
                  <AppIcon name="search" :size="15" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    v-model="search"
                    type="search"
                    class="input pl-9 text-sm"
                    placeholder="Zoek op naam of laadpaal-ID..."
                  />
                </div>

                <p class="mb-2 text-xs text-gray-500">
                  {{ filteredChargers.length }} van {{ chargers.length }} laadpalen
                </p>

                <div class="space-y-2">
                  <button
                    v-for="c in filteredChargers"
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
                      <p class="text-sm font-medium text-gray-900">
                        {{ c.name && c.name.length > 2 ? c.name : `Laadpaal ${c.id}` }}
                      </p>
                      <p class="mt-0.5 text-xs text-gray-500">
                        <span class="font-mono">{{ c.id }}</span>
                        <template v-if="c.createdOn">
                          · in gebruik sinds {{ formatDate(c.createdOn) }}
                        </template>
                      </p>
                    </div>
                  </button>
                </div>
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
