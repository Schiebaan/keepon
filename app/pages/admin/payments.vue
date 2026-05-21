<script setup lang="ts">
definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

interface PaymentRow {
  id: string
  customer_id: string
  mollie_payment_id: string
  mollie_method: string | null
  amount_cents: number
  currency: string
  description: string | null
  status: string
  created_at: string
  paid_at: string | null
  failed_at: string | null
  refunded_at: string | null
  charged_back_at: string | null
  period_start: string | null
  period_end: string | null
  customer: { id: string; full_name: string | null; email: string } | null
}

interface PaymentsResponse {
  rows: PaymentRow[]
  total: number
  limit: number
  offset: number
  has_more: boolean
  totals: { paid_cents: number; open_cents: number; failed_cents: number; count: number }
}

const loading = ref(true)
const error = ref('')
const rows = ref<PaymentRow[]>([])
const total = ref(0)
const totals = ref({ paid_cents: 0, open_cents: 0, failed_cents: 0, count: 0 })

const statusFilter = ref<'all' | 'paid' | 'open' | 'failed'>('all')
const search = ref('')

async function loadPayments() {
  loading.value = true
  error.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    const params = new URLSearchParams()
    params.set('limit', '200')
    if (statusFilter.value !== 'all') params.set('status', statusFilter.value)
    if (search.value.trim()) params.set('q', search.value.trim())

    const res = await $fetch<PaymentsResponse>(`/api/payments?${params.toString()}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    rows.value = res.rows
    total.value = res.total
    totals.value = res.totals
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Betalingen ophalen mislukt'
  } finally {
    loading.value = false
  }
}
onMounted(loadPayments)

// Debounced search re-fetch
let searchTimer: ReturnType<typeof setTimeout> | null = null
watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(loadPayments, 250)
})
watch(statusFilter, () => loadPayments())

function euros(cents: number): string {
  return '€ ' + (cents / 100).toFixed(2).replace('.', ',')
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function statusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case 'paid':
      return { label: 'Betaald', cls: 'bg-green-50 text-green-700 border-green-200' }
    case 'open':
      return { label: 'Open', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'pending':
      return { label: 'Onderweg', cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'authorized':
      return { label: 'Geautoriseerd', cls: 'bg-blue-50 text-blue-700 border-blue-200' }
    case 'failed':
      return { label: 'Mislukt', cls: 'bg-red-50 text-red-700 border-red-200' }
    case 'expired':
      return { label: 'Verlopen', cls: 'bg-gray-100 text-gray-700 border-gray-200' }
    case 'canceled':
      return { label: 'Geannuleerd', cls: 'bg-gray-100 text-gray-700 border-gray-200' }
    case 'chargeback':
      return { label: 'Storno', cls: 'bg-red-50 text-red-800 border-red-200' }
    default:
      return { label: status, cls: 'bg-gray-100 text-gray-700 border-gray-200' }
  }
}
</script>

<template>
  <div>
    <div class="mb-6 flex items-start justify-between gap-4 flex-wrap">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Betalingen</h1>
        <p class="mt-1 text-sm text-gray-500">Overzicht van alle incasso's en handmatige betalingen via Mollie.</p>
      </div>
      <button
        class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        :disabled="loading"
        @click="loadPayments"
      >
        <AppIcon name="refresh" :size="14" />
        Verversen
      </button>
    </div>

    <!-- Totals strip -->
    <div class="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div class="card flex items-start gap-3">
        <div class="rounded-lg bg-green-50 p-2">
          <AppIcon name="check-circle" :size="20" class="text-green-600" />
        </div>
        <div>
          <p class="text-xs text-gray-500">Betaald</p>
          <p class="text-lg font-bold text-gray-900">{{ euros(totals.paid_cents) }}</p>
        </div>
      </div>
      <div class="card flex items-start gap-3">
        <div class="rounded-lg bg-amber-50 p-2">
          <AppIcon name="clock" :size="20" class="text-amber-600" />
        </div>
        <div>
          <p class="text-xs text-gray-500">Onderweg / open</p>
          <p class="text-lg font-bold text-gray-900">{{ euros(totals.open_cents) }}</p>
        </div>
      </div>
      <div class="card flex items-start gap-3">
        <div class="rounded-lg bg-red-50 p-2">
          <AppIcon name="x-circle" :size="20" class="text-red-600" />
        </div>
        <div>
          <p class="text-xs text-gray-500">Mislukt / verlopen</p>
          <p class="text-lg font-bold text-gray-900">{{ euros(totals.failed_cents) }}</p>
        </div>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex gap-1 rounded-lg bg-gray-100 p-1">
          <button
            v-for="opt in [
              { v: 'all', label: 'Alle' },
              { v: 'paid', label: 'Betaald' },
              { v: 'open', label: 'Open' },
              { v: 'failed', label: 'Mislukt' },
            ]"
            :key="opt.v"
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors"
            :class="statusFilter === opt.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
            @click="statusFilter = opt.v as any"
          >
            {{ opt.label }}
          </button>
        </div>
        <div class="flex-1 min-w-[200px] relative">
          <AppIcon name="search" :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="search"
            type="text"
            placeholder="Zoek op Mollie-ID of omschrijving..."
            class="input pl-9 w-full text-sm"
          />
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="py-12 text-center">
      <div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="card border-red-200 bg-red-50 text-sm text-red-800" role="alert">
      {{ error }}
    </div>

    <!-- Empty state -->
    <div v-else-if="rows.length === 0" class="card py-16 text-center">
      <AppIcon name="credit-card" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen betalingen</h2>
      <p class="text-sm text-gray-500 max-w-md mx-auto">
        Open een klantkaart en gebruik <span class="font-medium">"Stuur factuur"</span> om de eerste incasso te versturen.
        Mandaat-bevestigingen verschijnen hier ook automatisch.
      </p>
    </div>

    <!-- Table -->
    <div v-else class="card overflow-hidden p-0">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <th class="px-4 py-2.5">Klant</th>
              <th class="px-4 py-2.5">Omschrijving</th>
              <th class="px-4 py-2.5">Bedrag</th>
              <th class="px-4 py-2.5">Status</th>
              <th class="px-4 py-2.5">Periode</th>
              <th class="px-4 py-2.5">Aangemaakt</th>
              <th class="px-4 py-2.5">Mollie-ID</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="row in rows" :key="row.id" class="hover:bg-gray-50">
              <td class="px-4 py-2.5">
                <NuxtLink
                  v-if="row.customer"
                  :to="`/admin/customers/${row.customer_id}`"
                  class="text-gray-900 font-medium hover:underline"
                >
                  {{ row.customer.full_name || row.customer.email }}
                </NuxtLink>
                <span v-else class="text-gray-400">— verwijderd —</span>
              </td>
              <td class="px-4 py-2.5 text-gray-700 max-w-[260px] truncate">{{ row.description || '—' }}</td>
              <td class="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">{{ euros(row.amount_cents) }}</td>
              <td class="px-4 py-2.5">
                <span
                  class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
                  :class="statusBadge(row.status).cls"
                >
                  {{ statusBadge(row.status).label }}
                </span>
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                <template v-if="row.period_start || row.period_end">
                  {{ fmtDate(row.period_start) }}<span v-if="row.period_end"> – {{ fmtDate(row.period_end) }}</span>
                </template>
                <span v-else class="text-gray-300">—</span>
              </td>
              <td class="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">{{ fmtDateTime(row.created_at) }}</td>
              <td class="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">{{ row.mollie_payment_id }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="total > rows.length" class="px-4 py-2.5 text-xs text-gray-500 border-t border-gray-100">
        Toon {{ rows.length }} van {{ total }} betalingen.
      </div>
    </div>
  </div>
</template>
