<script setup lang="ts">
const route = useRoute()

const navItems = [
  { label: 'Dashboard', to: '/platform' },
  { label: 'Partners', to: '/platform/partners' },
  { label: 'Integraties', to: '/platform/integrations' },
]

function isActive(to: string) {
  if (to === '/platform') return route.path === '/platform'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="border-b border-gray-200 bg-gray-900">
      <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div class="flex items-center gap-8">
          <NuxtLink to="/platform" class="text-lg font-semibold text-white">UPsol Platform</NuxtLink>
          <nav class="flex items-center gap-1">
            <NuxtLink
              v-for="item in navItems"
              :key="item.to"
              :to="item.to"
              class="rounded-lg px-3 py-1.5 text-sm transition-colors"
              :class="isActive(item.to) ? 'bg-white/15 font-medium text-white' : 'text-gray-400 hover:text-white'"
            >
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-400">Platform Admin</span>
          <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-white">
            K
          </div>
        </div>
      </div>
    </header>
    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
      <slot />
    </main>
  </div>
</template>
