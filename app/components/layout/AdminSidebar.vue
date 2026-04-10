<script setup lang="ts">
const { partner } = usePartner()
const { signOut } = useAuth()
const route = useRoute()

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', to: '/admin' },
  { label: 'Klanten', icon: 'users', to: '/admin/customers' },
  { label: 'Betalingen', icon: 'credit-card', to: '/admin/payments' },
  { label: 'Service', icon: 'tool', to: '/admin/service' },
  { label: 'Communicatie', icon: 'mail', to: '/admin/communicatie' },
  { label: 'Gebruikers', icon: 'users', to: '/admin/users' },
  { label: 'Instellingen', icon: 'settings', to: '/admin/settings' },
]

function isActive(to: string) {
  if (to === '/admin') return route.path === '/admin'
  return route.path.startsWith(to)
}
</script>

<template>
  <aside class="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
    <!-- Logo area -->
    <div class="flex h-16 items-center gap-3 border-b border-gray-100 px-5">
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
        <div>
          <p class="text-sm font-semibold text-gray-900">{{ partner.name }}</p>
          <p class="text-[11px] text-gray-400">Beheerportaal</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 space-y-1 px-3 py-4">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="nav-link"
        :class="{ 'nav-link--active': isActive(item.to) }"
      >
        <AppIcon :name="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </NuxtLink>
    </nav>

    <!-- Bottom section -->
    <div class="border-t border-gray-100 p-4">
      <button
        class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700"
        @click="signOut()"
      >
        <AppIcon name="logout" :size="16" />
        <span>Uitloggen</span>
      </button>
    </div>
  </aside>
</template>
