<script setup lang="ts">
definePageMeta({ layout: 'customer', middleware: ['auth', 'customer-onboarding'] })

interface PaymentRow {
  id: string
  mollie_payment_id: string
  mollie_method: string | null
  amount_cents: number
  currency: string
  description: string | null
  status: string
  created_at: string
  paid_at: string | null
  failed_at: string | null
  period_start: string | null
  period_end: string | null
}

interface PaymentsResponse {
  customer: { mandate_active: boolean; mandate_at: string | null; mandate_skipped: boolean } | null
  rows: PaymentRow[]
}

const loading = ref(true)
const error = ref('')
const rows = ref<PaymentRow[]>([])
const mandateInfo = ref<PaymentsResponse['customer']>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const supabase = useSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Niet ingelogd')

    const res = await $fetch<PaymentsResponse>('/api/customer/payments', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    rows.value = res.rows
    mandateInfo.value = res.customer
  } catch (e: any) {
    error.value = e?.data?.message || e?.message || 'Facturen ophalen mislukt'
  } finally {
    loading.value = false
  }
}
onMounted(load)

function euros(cents: number): string {
  return '€ ' + (cents / 100).toFixed(2).replace('.', ',')
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return '' }
}

function statusLabel(status: string): { label: string; cls: string } {
  switch (status) {
    case 'paid':
      return { label: 'Betaald', cls: 'bg-green-50 text-green-700 border-green-200' }
    case 'open':
    case 'pending':
    case 'authorized':
      return { label: 'In behandeling', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
    case 'failed':
      return { label: 'Mislukt', cls: 'bg-red-50 text-red-700 border-red-200' }
    case 'expired':
    case 'canceled':
      return { label: 'Verlopen', cls: 'bg-gray-100 text-gray-700 border-gray-200' }
    case 'chargeback':
      return { label: 'Storno', cls: 'bg-red-50 text-red-800 border-red-200' }
    default:
      return { label: status, cls: 'bg-gray-100 text-gray-700 border-gray-200' }
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Facturen</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van je facturen en automatische incasso's.</p>
    </div>

    <!-- Mandaat-status banner -->
    <div
      v-if="!loading && mandateInfo"
      class="card mb-6 flex items-start gap-3"
      :class="{
        'border-green-200 bg-green-50': mandateInfo.mandate_active,
        'border-amber-200 bg-amber-50': !mandateInfo.mandate_active && mandateInfo.mandate_at && !mandateInfo.mandate_skipped,
        'border-gray-200 bg-gray-50': mandateInfo.mandate_skipped,
      }"
    >
      <AppIcon
        :name="mandateInfo.mandate_active ? 'check-circle' : (mandateInfo.mandate_skipped ? 'clock' : 'clock')"
        :size="18"
        class="mt-0.5 shrink-0"
        :class="{
          'text-green-600': mandateInfo.mandate_active,
          'text-amber-600': !mandateInfo.mandate_active && mandateInfo.mandate_at && !mandateInfo.mandate_skipped,
          'text-gray-400': mandateInfo.mandate_skipped,
        }"
      />
      <div class="min-w-0">
        <template v-if="mandateInfo.mandate_active">
          <p class="text-sm font-medium text-green-900">Automatische incasso is actief</p>
          <p class="text-xs text-green-800/80 mt-0.5">Maandelijkse servicekosten worden automatisch van je rekening afgeschreven.</p>
        </template>
        <template v-else-if="mandateInfo.mandate_at && !mandateInfo.mandate_skipped">
          <p class="text-sm font-medium text-amber-900">Mandaat wordt bevestigd</p>
          <p class="text-xs text-amber-800/80 mt-0.5">We wachten op bevestiging van je bank. Dit duurt meestal enkele seconden tot een paar minuten.</p>
        </template>
        <template v-else-if="mandateInfo.mandate_skipped">
          <p class="text-sm font-medium text-gray-700">Incasso nog niet geregeld</p>
          <p class="text-xs text-gray-600 mt-0.5">
            <NuxtLink to="/welkom/incasso" class="underline hover:text-gray-900">Regel automatische incasso</NuxtLink>
            zodat we maandfacturen direct kunnen verwerken.
          </p>
        </template>
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
    <div v-else-if="rows.length === 0" class="section py-12 text-center">
      <AppIcon name="credit-card" :size="40" class="mx-auto text-gray-300 mb-4" />
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen facturen</h2>
      <p class="text-sm text-gray-500 max-w-sm mx-auto">
        Zodra je eerste maandfactuur is aangemaakt, verschijnt deze hier.
      </p>
    </div>

    <!-- List -->
    <div v-else class="space-y-3">
      <div
        v-for="row in rows"
        :key="row.id"
        class="card flex items-start justify-between gap-4"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-medium text-gray-900 truncate">{{ row.description || 'Servicekosten' }}</p>
            <span
              class="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"
              :class="statusLabel(row.status).cls"
            >
              {{ statusLabel(row.status).label }}
            </span>
          </div>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
            <span class="flex items-center gap-1">
              <AppIcon name="calendar" :size="12" />
              {{ fmtDate(row.created_at) }}
            </span>
            <span v-if="row.period_start || row.period_end" class="flex items-center gap-1">
              <AppIcon name="clock" :size="12" />
              Periode {{ fmtDate(row.period_start) }}<template v-if="row.period_end"> – {{ fmtDate(row.period_end) }}</template>
            </span>
            <span v-if="row.paid_at" class="flex items-center gap-1 text-green-700">
              <AppIcon name="check" :size="12" />
              Betaald op {{ fmtDate(row.paid_at) }}
            </span>
            <span v-else-if="row.failed_at" class="flex items-center gap-1 text-red-700">
              <AppIcon name="x" :size="12" />
              Mislukt op {{ fmtDate(row.failed_at) }}
            </span>
          </div>
        </div>
        <div class="text-right shrink-0">
          <p class="text-lg font-bold text-gray-900 whitespace-nowrap">{{ euros(row.amount_cents) }}</p>
          <p v-if="row.mollie_method === 'directdebit'" class="text-[11px] text-gray-400 mt-0.5">Automatische incasso</p>
          <p v-else-if="row.mollie_method" class="text-[11px] text-gray-400 mt-0.5">{{ row.mollie_method }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
