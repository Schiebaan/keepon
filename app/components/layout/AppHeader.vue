<script setup lang="ts">
const props = defineProps<{
  variant?: 'admin' | 'customer'
}>()

const { partner, subscriptions } = useMockData()
const { signOut } = useAuth()

// Customer nav: check active module types
const hasSolar = computed(() =>
  subscriptions.some(s => s.customer_id === 'cust-1' && s.status === 'active' && s.partner_module_config?.module_definition?.type === 'solar')
)
const hasHeatPump = computed(() =>
  subscriptions.some(s => s.customer_id === 'cust-1' && s.status === 'active' && s.partner_module_config?.module_definition?.type === 'heat_pump')
)
const hasEv = computed(() =>
  subscriptions.some(s => s.customer_id === 'cust-1' && s.status === 'active' && s.partner_module_config?.module_definition?.type === 'ev_charger')
)

// Mobile menu
const isMenuOpen = ref(false)

// Account dropdown
const showAccountMenu = ref(false)
const accountMenuRef = ref<HTMLElement | null>(null)

function toggleAccountMenu() {
  showAccountMenu.value = !showAccountMenu.value
}

function closeAccountMenu() {
  showAccountMenu.value = false
}

// Close dropdown on click outside
function onClickOutside(e: Event) {
  if (accountMenuRef.value && !accountMenuRef.value.contains(e.target as Node)) {
    showAccountMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside)
})

// Close mobile menu on route change
const route = useRoute()
watch(() => route.fullPath, () => {
  isMenuOpen.value = false
  showAccountMenu.value = false
})
</script>

<template>
  <header class="border-b bg-white" :style="{ borderBottomColor: `color-mix(in srgb, ${partner.primary_color} 30%, #e5e7eb)` }">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
      <!-- Logo -->
      <NuxtLink to="/" class="flex items-center gap-3 no-underline">
        <img
          v-if="partner.logo_url"
          :src="partner.logo_url"
          :alt="partner.name"
          class="h-8 w-auto"
        />
        <div
          v-else
          class="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
          :style="{ backgroundColor: partner.primary_color }"
        >
          {{ partner.name.charAt(0) }}
        </div>
        <span class="text-lg font-semibold text-gray-900">
          {{ partner.name }}
        </span>
      </NuxtLink>

      <!-- Customer nav (desktop) -->
      <nav v-if="variant === 'customer'" class="hidden items-center gap-1 md:flex">
        <NuxtLink
          to="/klant"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          exact-active-class="!bg-opacity-10 !font-semibold"
          :style="{ '--tw-bg-opacity': '0.08' }"
        >
          <AppIcon name="home" :size="16" />
          Mijn Huis
        </NuxtLink>

        <NuxtLink
          v-if="hasSolar"
          to="/klant/zonnepanelen"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          active-class="!bg-amber-50 !text-amber-700 !font-semibold"
        >
          <AppIcon name="solar" :size="16" />
          Zonnepanelen
        </NuxtLink>

        <NuxtLink
          v-if="hasHeatPump"
          to="/klant/warmtepomp"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          active-class="!bg-rose-50 !text-rose-700 !font-semibold"
        >
          <AppIcon name="heat-pump" :size="16" />
          Warmtepomp
        </NuxtLink>

        <NuxtLink
          v-if="hasEv"
          to="/klant/laadpaal"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          active-class="!bg-sky-50 !text-sky-700 !font-semibold"
        >
          <AppIcon name="ev-charger" :size="16" />
          Laadpaal
        </NuxtLink>

        <NuxtLink
          to="/klant/service"
          class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          active-class="!bg-gray-100 !text-gray-900 !font-semibold"
        >
          <AppIcon name="tool" :size="16" />
          Service
        </NuxtLink>

        <!-- Account dropdown -->
        <div ref="accountMenuRef" class="relative ml-1">
          <button
            class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            @click.stop="toggleAccountMenu"
          >
            <AppIcon name="user" :size="16" />
            Mijn Account
            <AppIcon name="chevron-down" :size="14" class="transition-transform" :class="{ 'rotate-180': showAccountMenu }" />
          </button>

          <Transition
            enter-active-class="transition duration-150 ease-out"
            enter-from-class="opacity-0 scale-95"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition duration-100 ease-in"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-95"
          >
            <div
              v-if="showAccountMenu"
              class="absolute right-0 top-full z-50 mt-1 w-48 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-lg"
            >
              <NuxtLink
                to="/klant/gegevens"
                class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                @click="closeAccountMenu"
              >
                <AppIcon name="user" :size="15" class="text-gray-400" />
                Gegevens
              </NuxtLink>
              <NuxtLink
                to="/klant/facturen"
                class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                @click="closeAccountMenu"
              >
                <AppIcon name="file-text" :size="15" class="text-gray-400" />
                Facturen
              </NuxtLink>
              <NuxtLink
                to="/klant/abonnementen"
                class="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                @click="closeAccountMenu"
              >
                <AppIcon name="document" :size="15" class="text-gray-400" />
                Contracten
              </NuxtLink>
              <div class="my-1 border-t border-gray-100" />
              <button
                class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                @click="closeAccountMenu(); signOut()"
              >
                <AppIcon name="logout" :size="15" class="text-gray-400" />
                Uitloggen
              </button>
            </div>
          </Transition>
        </div>
      </nav>

      <!-- Mobile hamburger (customer only) -->
      <button
        v-if="variant === 'customer'"
        class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden"
        @click="isMenuOpen = !isMenuOpen"
      >
        <AppIcon :name="isMenuOpen ? 'x' : 'menu'" :size="22" />
      </button>
    </div>

    <!-- Mobile menu (customer only) -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <nav v-if="variant === 'customer' && isMenuOpen" class="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden">
        <div class="space-y-1">
          <NuxtLink
            to="/klant"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <AppIcon name="home" :size="18" />
            Mijn Huis
          </NuxtLink>

          <NuxtLink
            v-if="hasSolar"
            to="/klant/zonnepanelen"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <AppIcon name="solar" :size="18" />
            Zonnepanelen
          </NuxtLink>

          <NuxtLink
            v-if="hasHeatPump"
            to="/klant/warmtepomp"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <AppIcon name="heat-pump" :size="18" />
            Warmtepomp
          </NuxtLink>

          <NuxtLink
            v-if="hasEv"
            to="/klant/laadpaal"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <AppIcon name="ev-charger" :size="18" />
            Laadpaal
          </NuxtLink>

          <NuxtLink
            to="/klant/service"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <AppIcon name="tool" :size="18" />
            Service
          </NuxtLink>

          <div class="my-2 border-t border-gray-100" />

          <NuxtLink
            to="/klant/gegevens"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <AppIcon name="user" :size="18" />
            Gegevens
          </NuxtLink>

          <NuxtLink
            to="/klant/facturen"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <AppIcon name="file-text" :size="18" />
            Facturen
          </NuxtLink>

          <NuxtLink
            to="/klant/abonnementen"
            class="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            <AppIcon name="document" :size="18" />
            Contracten
          </NuxtLink>

          <div class="my-2 border-t border-gray-100" />

          <button
            class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
            @click="signOut()"
          >
            <AppIcon name="logout" :size="18" />
            Uitloggen
          </button>
        </div>
      </nav>
    </Transition>
  </header>
</template>
