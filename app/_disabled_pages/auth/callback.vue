<script setup lang="ts">
definePageMeta({ layout: false })

const { resolveRole } = useAuth()

onMounted(async () => {
  // Supabase handles the token exchange automatically
  // We just need to resolve the user's role and redirect
  const role = await resolveRole()

  if (role === 'platform_admin') {
    navigateTo('/platform')
  } else if (role === 'partner_admin') {
    navigateTo('/admin')
  } else {
    navigateTo('/')
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
