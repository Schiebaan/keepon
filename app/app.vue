<script setup lang="ts">
/**
 * Root component. Sets partner-branded document title, favicon and theme color
 * reactively so every page tab reflects the partner — even pages with
 * `layout: false` (login, voorwaarden, welkom, etc.) that don't mount BrandedShell.
 */
const { partner } = usePartner()

useHead({
  title: computed(() => partner.value?.name || 'UPsol'),
  meta: [
    { name: 'description', content: computed(() => partner.value?.name
      ? `Klantportaal van ${partner.value.name}`
      : 'Modulair klantportaal voor installateurs') },
    { name: 'theme-color', content: computed(() => partner.value?.primary_color || '#111827') },
  ],
  link: [
    {
      rel: 'icon',
      type: 'image/png',
      href: computed(() => partner.value?.logo_url || '/favicon.svg'),
    },
  ],
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ConfirmDialog />
  <RoleSwitcher v-if="useRuntimeConfig().public.demoMode" />
</template>
