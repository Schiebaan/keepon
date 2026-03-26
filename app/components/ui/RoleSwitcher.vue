<script setup lang="ts">
import type { UserRole } from '~~/shared/types/database'

const config = useRuntimeConfig()
const { userRole, switchRole } = useAuth()

const isOpen = ref(false)

const roles = [
  { role: 'platform_admin' as UserRole, label: 'Platform beheer', color: '#111827', path: '/platform', icon: 'globe' },
  { role: 'partner_admin' as UserRole, label: 'Installateur', color: '#1a56db', path: '/admin', icon: 'settings' },
  { role: 'customer' as UserRole, label: 'Klant', color: '#059669', path: '/klant', icon: 'home' },
]

const currentRole = computed(() => roles.find(r => r.role === userRole.value) || roles[0])

function selectRole(r: typeof roles[0]) {
  switchRole(r.role)
  isOpen.value = false
  navigateTo(r.path)
}

// Close on click outside
function onClickOutside(e: MouseEvent) {
  const el = (e.target as HTMLElement).closest('.role-switcher')
  if (!el) isOpen.value = false
}

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<template>
  <div v-if="config.public.demoMode" class="role-switcher fixed bottom-5 right-5 z-50">
    <!-- Expanded menu -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-100 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <div v-if="isOpen" class="mb-2 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200">
        <div class="px-3 py-2 text-xs font-medium text-gray-400">
          Wissel van rol
        </div>
        <button
          v-for="r in roles"
          :key="r.role"
          class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"
          :class="r.role === userRole ? 'bg-gray-50 font-medium' : 'text-gray-600'"
          @click="selectRole(r)"
        >
          <span class="flex h-5 w-5 items-center justify-center rounded-full" :style="{ backgroundColor: r.color }">
            <AppIcon :name="r.icon" :size="12" class="text-white" />
          </span>
          {{ r.label }}
          <AppIcon v-if="r.role === userRole" name="check" :size="14" class="ml-auto text-gray-400" />
        </button>
      </div>
    </Transition>

    <!-- Toggle button -->
    <button
      class="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-lg ring-1 ring-gray-200 transition-all hover:shadow-xl"
      @click.stop="isOpen = !isOpen"
    >
      <span class="flex h-6 w-6 items-center justify-center rounded-full" :style="{ backgroundColor: currentRole.color }">
        <AppIcon :name="currentRole.icon" :size="13" class="text-white" />
      </span>
      <span class="text-sm font-medium text-gray-700">{{ currentRole.label }}</span>
      <AppIcon :name="isOpen ? 'chevron-up' : 'chevron-down'" :size="14" class="text-gray-400" />
    </button>
  </div>
</template>
