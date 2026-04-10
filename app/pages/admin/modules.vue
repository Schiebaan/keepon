<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

definePageMeta({ layout: 'admin', middleware: ['auth', 'role-partner'] })

const modules = [
  { type: 'solar', name: 'Zonnepanelen monitoring', integration: 'Sundata', theme: getModuleTheme('solar') },
  { type: 'heat_pump', name: 'Warmtepomp monitoring', integration: 'Weheat', theme: getModuleTheme('heat_pump') },
  { type: 'ev_charger', name: 'Laadpaal monitoring', integration: 'Easee', theme: getModuleTheme('ev_charger') },
]
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Modules</h1>
      <p class="mt-1 text-sm text-gray-500">Beschikbare monitoringmodules voor je klanten.</p>
    </div>

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="mod in modules"
        :key="mod.type"
        class="section"
      >
        <div class="flex items-center gap-3 mb-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-xl"
            :class="[mod.theme.bg, mod.theme.text]"
          >
            <AppIcon :name="mod.theme.icon" :size="20" />
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ mod.name }}</h3>
            <p class="text-xs text-gray-500">Integratie: {{ mod.integration }}</p>
          </div>
        </div>
        <p class="text-sm text-gray-500">
          Koppel deze module aan klanten via het klantdossier. Configureer de integratie via Instellingen.
        </p>
      </div>
    </div>
  </div>
</template>
