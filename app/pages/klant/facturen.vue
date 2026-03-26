<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/formatters'

definePageMeta({ layout: 'customer' })

const { currentCustomer, getCustomerInvoices } = useMockData()

const invoices = computed(() => getCustomerInvoices(currentCustomer.id))

const totalPaid = computed(() =>
  invoices.value.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount_cents, 0)
)
const totalOpen = computed(() =>
  invoices.value.filter(i => i.status === 'open' || i.status === 'overdue').reduce((sum, i) => sum + i.amount_cents, 0)
)

function statusLabel(status: string) {
  switch (status) {
    case 'paid': return 'Betaald'
    case 'open': return 'Openstaand'
    case 'overdue': return 'Achterstallig'
    default: return status
  }
}

function statusClass(status: string) {
  switch (status) {
    case 'paid': return 'badge--green'
    case 'open': return 'badge--yellow'
    case 'overdue': return 'badge--red'
    default: return 'badge--gray'
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Mijn facturen</h1>
      <p class="mt-1 text-sm text-gray-500">Overzicht van alle facturen en betalingen.</p>
    </div>

    <!-- Summary cards -->
    <div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div class="section">
        <p class="text-sm text-gray-500">Totaal betaald</p>
        <p class="mt-1 text-2xl font-bold text-gray-900">{{ formatCurrency(totalPaid) }}</p>
      </div>
      <div class="section">
        <p class="text-sm text-gray-500">Openstaand</p>
        <p class="mt-1 text-2xl font-bold" :class="totalOpen > 0 ? 'text-amber-600' : 'text-gray-900'">{{ formatCurrency(totalOpen) }}</p>
      </div>
      <div class="section">
        <p class="text-sm text-gray-500">Betaalmethode</p>
        <div class="mt-1 flex items-center gap-2">
          <AppIcon name="credit-card" :size="18" class="text-gray-400" />
          <span class="text-sm font-medium text-gray-900">Automatische incasso</span>
        </div>
        <p class="mt-1 text-xs text-gray-400">Volgende incasso: 1 juni 2025</p>
      </div>
    </div>

    <!-- Invoices table -->
    <div class="section">
      <h2 class="mb-4 text-lg font-semibold text-gray-900">Facturenhistorie</h2>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              <th class="pb-3 pr-4">Factuurnr.</th>
              <th class="pb-3 pr-4">Datum</th>
              <th class="pb-3 pr-4">Omschrijving</th>
              <th class="pb-3 pr-4">Bedrag</th>
              <th class="pb-3 pr-4">Status</th>
              <th class="pb-3">Betaalmethode</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="inv in invoices" :key="inv.id" class="hover:bg-gray-50">
              <td class="py-3 pr-4 font-mono text-sm font-medium text-gray-900">{{ inv.invoice_number }}</td>
              <td class="py-3 pr-4 text-gray-500">{{ formatDate(inv.invoice_date) }}</td>
              <td class="py-3 pr-4 text-gray-700">{{ inv.description }}</td>
              <td class="py-3 pr-4 font-medium text-gray-900">{{ formatCurrency(inv.amount_cents) }}</td>
              <td class="py-3 pr-4">
                <span class="badge" :class="statusClass(inv.status)">{{ statusLabel(inv.status) }}</span>
              </td>
              <td class="py-3 text-gray-500">
                <span class="flex items-center gap-1">
                  <AppIcon name="credit-card" :size="12" class="text-gray-400" />
                  Automatische incasso
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Incasso info -->
    <div class="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <div class="flex items-start gap-3">
        <AppIcon name="warning" :size="18" class="mt-0.5 text-amber-600" />
        <div>
          <p class="text-sm font-medium text-amber-800">Over automatische incasso</p>
          <p class="mt-1 text-xs text-amber-700">
            Facturen worden automatisch afgeschreven via SEPA automatische incasso. Bij het opzeggen van de incasso
            wordt automatisch een melding verstuurd naar de servicedesk. Neem contact op als je vragen hebt over je betalingen.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
