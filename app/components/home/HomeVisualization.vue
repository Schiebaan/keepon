<script setup lang="ts">
import { getModuleTheme } from '~/utils/module-theme'

const props = defineProps<{
  address: {
    street: string
    houseNumber: string
    postalCode: string
    city: string
  }
  activeModules: string[] // array of module types: 'solar', 'heat_pump', 'ev_charger'
}>()

const hasSolar = computed(() => props.activeModules.includes('solar'))
const hasHeatPump = computed(() => props.activeModules.includes('heat_pump'))
const hasEvCharger = computed(() => props.activeModules.includes('ev_charger'))

const googleMapsUrl = computed(() => {
  const q = encodeURIComponent(`${props.address.street} ${props.address.houseNumber}, ${props.address.postalCode} ${props.address.city}`)
  return `https://www.google.com/maps/search/?api=1&query=${q}`
})
</script>

<template>
  <div class="relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 via-sky-50 to-green-50 p-6 pb-4">
    <!-- Sky background with subtle clouds -->
    <div class="absolute inset-0 overflow-hidden">
      <div class="absolute top-4 left-8 h-6 w-16 rounded-full bg-white/40" />
      <div class="absolute top-8 left-20 h-4 w-10 rounded-full bg-white/30" />
      <div class="absolute top-6 right-16 h-5 w-14 rounded-full bg-white/35" />
    </div>

    <!-- House SVG -->
    <div class="relative mx-auto max-w-xs">
      <svg viewBox="0 0 300 240" class="w-full" xmlns="http://www.w3.org/2000/svg">
        <!-- Roof -->
        <polygon points="150,20 40,100 260,100" fill="#78716c" stroke="#57534e" stroke-width="2" />
        <!-- Roof ridge -->
        <line x1="150" y1="20" x2="150" y2="100" stroke="#57534e" stroke-width="1" opacity="0.3" />

        <!-- Solar panels on roof (left side) -->
        <g v-if="hasSolar" class="animate-pulse" style="animation-duration: 3s;">
          <!-- Panel row 1 -->
          <rect x="70" y="55" width="35" height="20" rx="2" fill="#1e40af" stroke="#1e3a8a" stroke-width="1" transform="rotate(-33, 87, 65)" />
          <rect x="110" y="55" width="35" height="20" rx="2" fill="#1e40af" stroke="#1e3a8a" stroke-width="1" transform="rotate(-33, 127, 65)" />
          <!-- Panel grid lines -->
          <line x1="78" y1="56" x2="78" y2="74" stroke="#3b82f6" stroke-width="0.5" transform="rotate(-33, 87, 65)" />
          <line x1="88" y1="56" x2="88" y2="74" stroke="#3b82f6" stroke-width="0.5" transform="rotate(-33, 87, 65)" />
          <line x1="98" y1="56" x2="98" y2="74" stroke="#3b82f6" stroke-width="0.5" transform="rotate(-33, 87, 65)" />
          <!-- Sun rays hitting panels -->
          <line x1="80" y1="30" x2="85" y2="48" stroke="#f59e0b" stroke-width="1.5" opacity="0.6" />
          <line x1="100" y1="25" x2="105" y2="43" stroke="#f59e0b" stroke-width="1.5" opacity="0.6" />
          <line x1="120" y1="28" x2="125" y2="46" stroke="#f59e0b" stroke-width="1.5" opacity="0.6" />
        </g>
        <!-- Inactive solar indicator -->
        <g v-else>
          <rect x="70" y="55" width="35" height="20" rx="2" fill="#9ca3af" opacity="0.3" transform="rotate(-33, 87, 65)" />
          <rect x="110" y="55" width="35" height="20" rx="2" fill="#9ca3af" opacity="0.3" transform="rotate(-33, 127, 65)" />
        </g>

        <!-- House body -->
        <rect x="60" y="100" width="180" height="120" fill="#fef3c7" stroke="#d97706" stroke-width="1.5" rx="2" />
        <!-- House front -->
        <rect x="62" y="102" width="176" height="116" fill="#fffbeb" rx="1" />

        <!-- Door -->
        <rect x="130" y="155" width="40" height="65" rx="3" fill="#92400e" stroke="#78350f" stroke-width="1.5" />
        <circle cx="162" cy="190" r="2.5" fill="#d97706" />

        <!-- Windows -->
        <rect x="80" y="120" width="35" height="28" rx="2" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1" />
        <line x1="97.5" y1="120" x2="97.5" y2="148" stroke="#93c5fd" stroke-width="0.8" />
        <line x1="80" y1="134" x2="115" y2="134" stroke="#93c5fd" stroke-width="0.8" />

        <rect x="185" y="120" width="35" height="28" rx="2" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1" />
        <line x1="202.5" y1="120" x2="202.5" y2="148" stroke="#93c5fd" stroke-width="0.8" />
        <line x1="185" y1="134" x2="220" y2="134" stroke="#93c5fd" stroke-width="0.8" />

        <!-- Window glow when active -->
        <rect v-if="hasSolar || hasHeatPump" x="80" y="120" width="35" height="28" rx="2" fill="#fef08a" opacity="0.3" />

        <!-- Heat pump (right side of house) -->
        <g v-if="hasHeatPump">
          <!-- Unit box -->
          <rect x="248" y="170" width="40" height="45" rx="4" fill="#f1f5f9" stroke="#94a3b8" stroke-width="1.5" />
          <!-- Fan grill -->
          <circle cx="268" cy="188" r="12" fill="none" stroke="#64748b" stroke-width="1.5" />
          <!-- Rotating fan blades -->
          <g class="origin-center" style="transform-origin: 268px 188px; animation: spin 2s linear infinite;">
            <line x1="268" y1="176" x2="268" y2="200" stroke="#64748b" stroke-width="1.5" />
            <line x1="256" y1="188" x2="280" y2="188" stroke="#64748b" stroke-width="1.5" />
          </g>
          <!-- Status LED -->
          <circle cx="262" cy="208" r="2" fill="#22c55e">
            <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
          </circle>
          <!-- Connection pipe -->
          <line x1="248" y1="185" x2="240" y2="185" stroke="#94a3b8" stroke-width="2" stroke-dasharray="3,2" />
          <!-- Label -->
          <text x="268" y="225" text-anchor="middle" class="fill-rose-600 text-[8px] font-medium">Actief</text>
        </g>
        <g v-else>
          <rect x="248" y="170" width="40" height="45" rx="4" fill="#f1f5f9" stroke="#d1d5db" stroke-width="1" opacity="0.4" />
          <circle cx="268" cy="188" r="12" fill="none" stroke="#d1d5db" stroke-width="1" opacity="0.4" />
        </g>

        <!-- EV Charger (left side, driveway) -->
        <g v-if="hasEvCharger">
          <!-- Charger post -->
          <rect x="15" y="155" width="8" height="55" rx="1" fill="#374151" />
          <!-- Charger head -->
          <rect x="10" y="148" width="18" height="14" rx="3" fill="#1f2937" stroke="#111827" stroke-width="1" />
          <!-- Screen -->
          <rect x="13" y="151" width="12" height="7" rx="1" fill="#22d3ee">
            <animate attributeName="fill" values="#22d3ee;#06b6d4;#22d3ee" dur="3s" repeatCount="indefinite" />
          </rect>
          <!-- Cable -->
          <path d="M23 162 Q35 168 40 180 Q45 195 35 210" fill="none" stroke="#374151" stroke-width="2" stroke-linecap="round" />
          <!-- Plug connector -->
          <circle cx="35" cy="210" r="3" fill="#374151" />
          <!-- Lightning bolt -->
          <text x="19" y="170" class="fill-cyan-400 text-[10px]">⚡</text>
        </g>
        <g v-else>
          <rect x="15" y="155" width="8" height="55" rx="1" fill="#9ca3af" opacity="0.3" />
          <rect x="10" y="148" width="18" height="14" rx="3" fill="#9ca3af" opacity="0.3" />
        </g>

        <!-- Ground / grass -->
        <rect x="0" y="218" width="300" height="22" fill="#86efac" opacity="0.4" rx="2" />
        <!-- Driveway -->
        <rect x="0" y="218" width="55" height="22" fill="#d6d3d1" opacity="0.5" rx="1" />
      </svg>

    </div>

    <!-- Address bar -->
    <div class="relative mt-3 flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 backdrop-blur-sm">
      <div class="flex items-center gap-2">
        <AppIcon name="map-pin" :size="16" class="text-gray-400" />
        <div>
          <p class="text-sm font-medium text-gray-800">
            {{ address.street }} {{ address.houseNumber }}
          </p>
          <p class="text-xs text-gray-500">
            {{ address.postalCode }} {{ address.city }}
          </p>
        </div>
      </div>
      <a
        :href="googleMapsUrl"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm transition-colors hover:text-gray-900"
      >
        <AppIcon name="external" :size="12" />
        Bekijk op kaart
      </a>
    </div>

    <!-- Module status pills -->
    <div class="relative mt-3 flex flex-wrap gap-2">
      <div
        v-if="hasSolar"
        class="flex items-center gap-1.5 rounded-full px-3 py-1"
        :class="[getModuleTheme('solar').bg, getModuleTheme('solar').text]"
      >
        <span class="status-dot status-dot--active" />
        <AppIcon :name="getModuleTheme('solar').icon" :size="14" />
        <span class="text-xs font-medium">Zonnepanelen</span>
      </div>
      <div
        v-if="hasHeatPump"
        class="flex items-center gap-1.5 rounded-full px-3 py-1"
        :class="[getModuleTheme('heat_pump').bg, getModuleTheme('heat_pump').text]"
      >
        <span class="status-dot status-dot--active" />
        <AppIcon :name="getModuleTheme('heat_pump').icon" :size="14" />
        <span class="text-xs font-medium">Warmtepomp</span>
      </div>
      <div
        v-if="hasEvCharger"
        class="flex items-center gap-1.5 rounded-full px-3 py-1"
        :class="[getModuleTheme('ev_charger').bg, getModuleTheme('ev_charger').text]"
      >
        <span class="status-dot status-dot--active" />
        <AppIcon :name="getModuleTheme('ev_charger').icon" :size="14" />
        <span class="text-xs font-medium">Laadpaal</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
