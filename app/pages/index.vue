<script setup lang="ts">
// Landing page — kies je rol (demo mode)
definePageMeta({ layout: false })

const { partner } = useMockData()
</script>

<template>
  <BrandedShell>
    <div class="flex min-h-screen items-center justify-center px-4">
      <div class="w-full max-w-md">
        <div class="mb-8 text-center">
          <!-- Partner logo or fallback -->
          <div class="mx-auto mb-4 flex items-center justify-center">
            <img
              v-if="partner.logo_url"
              :src="partner.logo_url"
              :alt="partner.name"
              class="h-14 w-14 rounded-2xl"
            />
            <div
              v-else
              class="flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
              :style="{ backgroundColor: partner.primary_color }"
            >
              {{ partner.name.charAt(0) }}
            </div>
          </div>
          <h1 class="text-2xl font-bold text-gray-900">{{ partner.name }}</h1>
          <p class="mt-2 text-sm text-gray-500">
            Modulair klantportaal voor installateurs
          </p>
        </div>

        <div class="space-y-3">
          <NuxtLink
            to="/platform"
            class="group flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm transition-all hover:border-gray-700 hover:shadow-md"
          >
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors">
              <AppIcon name="globe" :size="24" />
            </div>
            <div>
              <p class="font-semibold text-white">Platform beheer</p>
              <p class="text-sm text-gray-400">Partners, klanten en platform inzicht</p>
            </div>
            <AppIcon name="chevron-right" :size="18" class="ml-auto text-gray-500 transition-colors group-hover:text-gray-300" />
          </NuxtLink>

          <NuxtLink
            to="/admin"
            class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div
              class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors"
              :style="{ backgroundColor: partner.primary_color + '15', color: partner.primary_color }"
            >
              <AppIcon name="settings" :size="24" />
            </div>
            <div>
              <p class="font-semibold text-gray-900">Installateur portaal</p>
              <p class="text-sm text-gray-500">Klanten, modules en omzet beheren</p>
            </div>
            <AppIcon name="chevron-right" :size="18" class="ml-auto text-gray-300 transition-colors group-hover:text-gray-500" />
          </NuxtLink>

          <NuxtLink
            to="/klant"
            class="group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
          >
            <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
              <AppIcon name="home" :size="24" />
            </div>
            <div>
              <p class="font-semibold text-gray-900">Klant portaal</p>
              <p class="text-sm text-gray-500">Mijn huis, systemen en abonnementen</p>
            </div>
            <AppIcon name="chevron-right" :size="18" class="ml-auto text-gray-300 transition-colors group-hover:text-gray-500" />
          </NuxtLink>
        </div>

        <p class="mt-6 text-center text-xs text-gray-400">
          Demo modus · klik op een portaal om te starten
        </p>
      </div>
    </div>
  </BrandedShell>
</template>
