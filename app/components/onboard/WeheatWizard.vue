<script setup lang="ts">
interface HeatPump {
  id: string
  name: string
  serial: string
  model?: number | string | null
  partNumber?: string | null
  commissionedAt?: string | null
}

const props = defineProps<{
  modelValue: boolean
  customerId: string
  customerName?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [v: boolean]
  'completed': [result: { heatpumpId: string; serial: string }]
}>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v),
})

const heatPumps = ref<HeatPump[]>([])
const loading = ref(false)
const loadError = ref('')
const search = ref('')
const selectedId = ref<string | null>(null)
const linking = ref(false)
const linkError = ref('')
const done = ref(false)

const filteredPumps = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return heatPumps.value
  return heatPumps.value.filter(hp =>
    hp.serial?.toLowerCase().includes(q)
    || hp.name?.toLowerCase().includes(q)
    || hp.partNumber?.toLowerCase().includes(q)
    || hp.id?.toLowerCase().startsWith(q),
  )
})

const selectedPump = computed(() => heatPumps.value.find(hp => hp.id === selectedId.value) || null)

async function loadDevices() {
  loading.value = true
  loadError.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    const data = await $fetch<HeatPump[]>('/api/integrations/weheat/devices', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    heatPumps.value = data || []
  } catch (e: any) {
    loadError.value = e?.data?.message || e?.message || 'Kan lijst niet laden'
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
  if (!selectedPump.value || linking.value) return
  linking.value = true
  linkError.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    await $fetch(`/api/customers/${props.customerId}/link-weheat`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: {
        heatpump_id: selectedPump.value.id,
        name: selectedPump.value.name || 'Warmtepomp',
        brand: 'Weheat',
        model: 'ATLAS',
      },
    })
    done.value = true
    emit('completed', { heatpumpId: selectedPump.value.id, serial: selectedPump.value.serial })
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
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <AppIcon name="heat-pump" :size="20" />
              </div>
              <div>
                <h3 class="text-base font-semibold text-gray-900">Warmtepomp koppelen via Weheat</h3>
                <p class="text-xs text-gray-500">Kies de juiste warmtepomp voor {{ customerName || 'deze klant' }}.</p>
              </div>
            </div>
            <button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" @click="close">
              <AppIcon name="x" :size="18" />
            </button>
          </div>

          <!-- Done state -->
          <div v-if="done" class="px-6 py-10 text-center">
            <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
              <AppIcon name="check-circle" :size="28" />
            </div>
            <h4 class="text-base font-semibold text-gray-900 mb-1">Gekoppeld</h4>
            <p class="text-sm text-gray-500">
              <strong>{{ selectedPump?.serial }}</strong> staat nu aan {{ customerName || 'deze klant' }} gekoppeld.
              <br/>De klant ziet z'n warmtepomp direct in z'n portaal.
            </p>
            <button class="btn-primary mt-5" @click="close">Sluiten</button>
          </div>

          <!-- Loading -->
          <div v-else-if="loading" class="px-6 py-16 text-center">
            <div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" />
            <p class="mt-3 text-sm text-gray-500">Warmtepompen van Weheat ophalen...</p>
          </div>

          <!-- Error loading -->
          <div v-else-if="loadError" class="px-6 py-10 text-center">
            <AppIcon name="alert-circle" :size="32" class="mx-auto text-amber-400 mb-3" />
            <p class="text-sm text-gray-700">{{ loadError }}</p>
            <button class="btn-secondary mt-4" @click="loadDevices">Probeer opnieuw</button>
          </div>

          <!-- List + selection -->
          <template v-else>
            <!-- Filter -->
            <div class="px-6 py-3 border-b border-gray-100 shrink-0">
              <div class="relative">
                <AppIcon name="search" :size="14" class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  v-model="search"
                  type="search"
                  class="input pl-8 text-sm"
                  :placeholder="`Zoek in ${heatPumps.length} warmtepompen op serial, partnummer...`"
                />
              </div>
              <p v-if="search && filteredPumps.length === 0" class="mt-2 text-xs text-gray-400">
                Geen resultaten.
              </p>
            </div>

            <!-- List -->
            <div class="flex-1 overflow-y-auto px-6 py-3 space-y-1.5">
              <button
                v-for="hp in filteredPumps"
                :key="hp.id"
                class="w-full text-left flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors"
                :class="selectedId === hp.id
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'"
                @click="selectedId = hp.id"
              >
                <div
                  class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"
                  :class="selectedId === hp.id ? 'border-orange-500 bg-orange-500' : 'border-gray-300'"
                >
                  <div v-if="selectedId === hp.id" class="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline gap-2">
                    <p class="font-mono text-sm font-semibold text-gray-900">{{ hp.serial }}</p>
                    <span v-if="hp.model" class="text-[11px] text-gray-500">Model {{ hp.model }}</span>
                  </div>
                  <p class="mt-0.5 text-xs text-gray-500 flex flex-wrap gap-x-3">
                    <span v-if="hp.partNumber" class="font-mono">{{ hp.partNumber }}</span>
                    <span v-if="hp.commissionedAt">Geïnstalleerd {{ formatDate(hp.commissionedAt) }}</span>
                  </p>
                </div>
              </button>
            </div>

            <!-- Footer / actions -->
            <div class="border-t border-gray-100 px-6 py-3 flex items-center justify-between gap-3 shrink-0">
              <p v-if="linkError" class="text-xs text-red-600">{{ linkError }}</p>
              <p v-else-if="selectedPump" class="text-xs text-gray-500">
                Geselecteerd: <span class="font-mono font-semibold">{{ selectedPump.serial }}</span>
              </p>
              <p v-else class="text-xs text-gray-400">{{ heatPumps.length }} warmtepompen beschikbaar.</p>
              <div class="flex gap-2 shrink-0">
                <button class="btn-secondary" @click="close">Annuleren</button>
                <button
                  class="btn-primary"
                  :disabled="!selectedPump || linking"
                  @click="handleLink"
                >
                  <AppIcon name="check" :size="14" />
                  {{ linking ? 'Koppelen...' : 'Koppel aan klant' }}
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
