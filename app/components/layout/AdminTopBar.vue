<script setup lang="ts">
defineProps<{
  title?: string
}>()
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6">
    <div>
      <slot name="title">
        <h1 v-if="title" class="text-lg font-semibold text-gray-900">{{ title }}</h1>
      </slot>
    </div>

    <div class="flex items-center gap-3">
      <!-- Search (cosmetic) -->
      <div class="relative hidden lg:block">
        <AppIcon name="search" :size="16" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Zoeken..."
          class="h-9 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-600 placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none"
        />
      </div>

      <!-- User avatar -->
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600">
        A
      </div>
    </div>
  </header>
</template>
