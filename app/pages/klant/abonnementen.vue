<script setup lang="ts">
import { formatCurrency, formatDate } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'customer' })

const { currentCustomer, currentCustomerInstallations, subscriptions, cancelSubscription, addSubscription, partner } = useMockData()

const installation = currentCustomerInstallations[0]

// Reactive list of subscriptions for this customer
const mySubscriptions = computed(() =>
  subscriptions.filter(s => s.customer_id === currentCustomer.id)
)

const activeSubscriptions = computed(() =>
  mySubscriptions.value.filter(s => s.status === 'active')
)

const cancelledSubscriptions = computed(() =>
  mySubscriptions.value.filter(s => s.status === 'cancelled')
)

// Existing module types (for AddModuleModal)
const existingModuleTypes = computed(() =>
  activeSubscriptions.value
    .map(s => s.partner_module_config?.module_definition?.type)
    .filter(Boolean) as string[]
)

// Modal state
const showAddFlow = ref(false)
const showCancelModal = ref(false)
const cancelTarget = ref<{ id: string; name: string } | null>(null)

function openCancelModal(subId: string, moduleName: string) {
  cancelTarget.value = { id: subId, name: moduleName }
  showCancelModal.value = true
}

function confirmCancel() {
  if (cancelTarget.value) {
    cancelSubscription(cancelTarget.value.id)
    showCancelModal.value = false
    cancelTarget.value = null
  }
}

function handleModuleAdded() {
  showAddFlow.value = false
}

// Monthly total
const monthlyTotal = computed(() =>
  activeSubscriptions.value.reduce((sum, s) => {
    if (s.billing_interval === 'monthly') return sum + s.price_cents
    return sum + Math.round(s.price_cents / 12)
  }, 0)
)
</script>

<template>
  <div>
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Mijn servicecontracten</h1>
        <p class="mt-1 text-sm text-gray-500">
          Beheer je servicecontracten . voeg producten toe, upgrade of zeg op.
        </p>
      </div>
      <button class="btn-primary" @click="showAddFlow = true">
        <AppIcon name="plus" :size="16" />
        Module toevoegen
      </button>
    </div>

    <!-- Monthly summary -->
    <div class="mb-6 flex items-center gap-6 rounded-xl bg-white p-4 ring-1 ring-gray-100">
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Actieve modules</p>
        <p class="mt-0.5 text-xl font-bold text-gray-900">{{ activeSubscriptions.length }}</p>
      </div>
      <div class="h-8 w-px bg-gray-200" />
      <div>
        <p class="text-xs font-medium uppercase tracking-wider text-gray-400">Maandelijkse kosten</p>
        <p class="mt-0.5 text-xl font-bold text-gray-900">{{ formatCurrency(monthlyTotal) }}</p>
      </div>
    </div>

    <!-- Active subscriptions -->
    <div v-if="activeSubscriptions.length" class="mb-8">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Actief</h2>
      <div class="space-y-3">
        <div
          v-for="sub in activeSubscriptions"
          :key="sub.id"
          class="section"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div
                class="flex h-11 w-11 items-center justify-center rounded-xl"
                :class="[
                  getModuleTheme(sub.partner_module_config?.module_definition?.type || 'solar').bg,
                  getModuleTheme(sub.partner_module_config?.module_definition?.type || 'solar').text,
                ]"
              >
                <AppIcon
                  :name="getModuleTheme(sub.partner_module_config?.module_definition?.type || 'solar').icon"
                  :size="22"
                />
              </div>
              <div>
                <h3 class="text-sm font-semibold text-gray-900">
                  Servicecontract . {{ sub.partner_module_config?.module_definition?.name }}
                </h3>
                <p class="text-xs text-gray-500">
                  {{ formatCurrency(sub.price_cents) }} /
                  {{ sub.billing_interval === 'monthly' ? 'maand' : 'jaar' }}
                  &middot; Automatische incasso
                </p>
              </div>
            </div>

            <div class="flex items-center gap-3">
              <span class="badge badge--green">
                <span class="status-dot status-dot--active" />
                Actief
              </span>
              <button
                class="btn-ghost text-xs text-red-500 hover:bg-red-50 hover:text-red-600"
                @click="openCancelModal(sub.id, sub.partner_module_config?.module_definition?.name || 'Module')"
              >
                Opzeggen
              </button>
            </div>
          </div>

          <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
            <span v-if="sub.activated_at" class="flex items-center gap-1">
              <AppIcon name="clock" :size="12" />
              Actief sinds {{ formatDate(sub.activated_at) }}
            </span>
            <NuxtLink
              :to="'/voorwaarden/' + (partner.slug || 'volt4u')"
              class="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              <AppIcon name="external" :size="12" />
              Servicevoorwaarden
            </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="!activeSubscriptions.length" class="mb-8 rounded-2xl bg-white p-8 text-center ring-1 ring-gray-100">
      <AppIcon name="puzzle" :size="40" class="mx-auto text-gray-300" />
      <h3 class="mt-3 text-sm font-semibold text-gray-700">Geen actieve modules</h3>
      <p class="mt-1 text-xs text-gray-500">Voeg een module toe om te beginnen met monitoring.</p>
      <button class="btn-primary mt-4" @click="showAddFlow = true">
        <AppIcon name="plus" :size="16" />
        Module toevoegen
      </button>
    </div>

    <!-- Cancelled subscriptions -->
    <div v-if="cancelledSubscriptions.length">
      <h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">Opgezegd</h2>
      <div class="space-y-3">
        <div
          v-for="sub in cancelledSubscriptions"
          :key="sub.id"
          class="rounded-xl bg-gray-50 p-4 ring-1 ring-gray-100"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3 opacity-60">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 text-gray-400">
                <AppIcon
                  :name="getModuleTheme(sub.partner_module_config?.module_definition?.type || 'solar').icon"
                  :size="18"
                />
              </div>
              <div>
                <h3 class="text-sm font-medium text-gray-600">
                  {{ sub.partner_module_config?.module_definition?.name }}
                </h3>
                <p class="text-xs text-gray-400">
                  {{ formatCurrency(sub.price_cents) }} /
                  {{ sub.billing_interval === 'monthly' ? 'maand' : 'jaar' }}
                </p>
              </div>
            </div>
            <span class="badge badge--red">Opgezegd</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Cancel confirmation modal -->
    <ConfirmModal
      :open="showCancelModal"
      title="Module opzeggen"
      :message="`Weet je zeker dat je ${cancelTarget?.name || 'deze module'} wilt opzeggen? Je verliest direct toegang tot de monitoring data.`"
      confirm-label="Ja, opzeggen"
      variant="danger"
      @confirm="confirmCancel"
      @cancel="showCancelModal = false"
    />

    <!-- Add module flow -->
    <AddModuleFlow
      v-model="showAddFlow"
      @added="handleModuleAdded"
    />
  </div>
</template>
