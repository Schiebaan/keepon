<script setup lang="ts">
import { formatCurrency } from '~/utils/formatters'
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin' })

const { partnerModuleConfigs, subscriptions } = useMockData()

const editingId = ref<string | null>(null)
const editForm = ref({ price_monthly: 0, price_yearly: 0, is_enabled: true, min_contract_months: 12 })
const isSaving = ref(false)

function getSubscriptionCount(configId: string) {
  return subscriptions.filter(s => s.partner_module_config_id === configId && s.status === 'active').length
}

function startEdit(config: typeof partnerModuleConfigs[0]) {
  editingId.value = config.id
  editForm.value = {
    price_monthly: config.price_monthly,
    price_yearly: config.price_yearly,
    is_enabled: config.is_enabled,
    min_contract_months: (config as any).min_contract_months ?? 12,
  }
}

function cancelEdit() {
  editingId.value = null
}

function saveEdit(configId: string) {
  isSaving.value = true
  setTimeout(() => {
    const config = partnerModuleConfigs.find(c => c.id === configId)
    if (config) {
      config.price_monthly = editForm.value.price_monthly
      config.price_yearly = editForm.value.price_yearly
      config.is_enabled = editForm.value.is_enabled
      ;(config as any).min_contract_months = editForm.value.min_contract_months
    }
    editingId.value = null
    isSaving.value = false
  }, 500)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Modules & Prijzen</h1>
      <p class="mt-1 text-sm text-gray-500">Configureer de beschikbare modules en prijzen voor jouw klanten.</p>
    </div>

    <div class="space-y-4">
      <div
        v-for="config in partnerModuleConfigs"
        :key="config.id"
        class="section"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-start gap-4">
            <div
              class="flex h-12 w-12 items-center justify-center rounded-xl"
              :class="[
                getModuleTheme(config.module_definition?.type || 'solar').bg,
                getModuleTheme(config.module_definition?.type || 'solar').text,
              ]"
            >
              <AppIcon
                :name="getModuleTheme(config.module_definition?.type || 'solar').icon"
                :size="24"
              />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">
                {{ config.module_definition?.name }}
              </h3>
              <p class="mt-1 text-sm text-gray-500">
                {{ config.module_definition?.description }}
              </p>
              <p class="mt-1 flex items-center gap-1 text-xs text-gray-400">
                <AppIcon name="users" :size="12" />
                {{ getSubscriptionCount(config.id) }} actieve abonnementen
              </p>
            </div>
          </div>
          <span
            class="badge"
            :class="config.is_enabled ? 'badge--green' : 'badge--gray'"
          >
            {{ config.is_enabled ? 'Actief' : 'Uitgeschakeld' }}
          </span>
        </div>

        <!-- Display mode -->
        <div v-if="editingId !== config.id" class="mt-4 border-t border-gray-100 pt-4">
          <div class="flex items-center justify-between">
            <div class="flex gap-6 text-sm">
              <div>
                <span class="text-gray-500">Maandprijs:</span>
                <span class="ml-1 font-semibold text-gray-900">{{ formatCurrency(config.price_monthly) }}</span>
              </div>
              <div>
                <span class="text-gray-500">Jaarprijs:</span>
                <span class="ml-1 font-semibold text-gray-900">{{ formatCurrency(config.price_yearly) }}</span>
              </div>
            </div>
            <button class="btn-secondary text-sm" @click="startEdit(config)">
              <AppIcon name="settings" :size="14" />
              Bewerken
            </button>
          </div>
          <p class="mt-2 text-sm text-gray-500">
            Contractduur: minimaal {{ (config as any).min_contract_months ?? 12 }} maanden
          </p>
        </div>

        <!-- Edit mode -->
        <div v-else class="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div class="flex gap-4">
            <div>
              <label class="label">Maandprijs</label>
              <div class="flex items-center gap-1">
                <span class="text-sm text-gray-500">&euro;</span>
                <input
                  :value="(editForm.price_monthly / 100).toFixed(2)"
                  type="number"
                  class="input w-28"
                  min="0"
                  step="0.01"
                  @input="editForm.price_monthly = Math.round(Number(($event.target as HTMLInputElement).value) * 100)"
                />
              </div>
            </div>
            <div>
              <label class="label">Jaarprijs</label>
              <div class="flex items-center gap-1">
                <span class="text-sm text-gray-500">&euro;</span>
                <input
                  :value="(editForm.price_yearly / 100).toFixed(2)"
                  type="number"
                  class="input w-28"
                  min="0"
                  step="0.01"
                  @input="editForm.price_yearly = Math.round(Number(($event.target as HTMLInputElement).value) * 100)"
                />
              </div>
            </div>
          </div>

          <div>
            <label class="label">Minimum contractduur</label>
            <select v-model.number="editForm.min_contract_months" class="input w-40">
              <option :value="1">1 maand</option>
              <option :value="3">3 maanden</option>
              <option :value="6">6 maanden</option>
              <option :value="12">12 maanden</option>
              <option :value="24">24 maanden</option>
            </select>
          </div>

          <label class="flex items-center gap-2">
            <input
              v-model="editForm.is_enabled"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300"
            />
            <span class="text-sm text-gray-700">Module beschikbaar voor klanten</span>
          </label>

          <div class="flex gap-2">
            <button
              class="btn-primary text-sm"
              :disabled="isSaving"
              @click="saveEdit(config.id)"
            >
              <AppIcon name="check" :size="14" />
              {{ isSaving ? 'Opslaan...' : 'Opslaan' }}
            </button>
            <button class="btn-secondary text-sm" @click="cancelEdit">
              Annuleren
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
