<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <RoleSwitcher v-if="useRuntimeConfig().public.demoMode" />
</template>
