<script setup lang="ts">
definePageMeta({ layout: false })

const { resolveRole } = useAuth()

onMounted(async () => {
  // Supabase handles the token exchange automatically
  // We just need to resolve the user's role and redirect
  const role = await resolveRole()

  switch (role) {
    case 'platform_admin':
      navigateTo('/platform')
      break
    case 'partner_admin':
      navigateTo('/admin')
      break
    case 'customer':
      navigateTo('/klant')
      break
    default:
      navigateTo('/')
      break
  }
})
</script>

<template>
  <div class="flex min-h-screen items-center justify-center">
    <div class="text-center">
      <div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-brand-primary" />
      <p class="mt-4 text-sm text-gray-500">
        Even geduld, je wordt ingelogd...
      </p>
    </div>
  </div>
</template>
