<script setup lang="ts">
definePageMeta({ layout: false })

const config = useRuntimeConfig()
const { resolveRole } = useAuth()

// Check if we're on a partner subdomain
const isSubdomain = typeof window !== 'undefined'
  && config.public.baseDomain
  && window.location.hostname !== config.public.baseDomain
  && window.location.hostname !== `www.${config.public.baseDomain}`
  && window.location.hostname.endsWith(config.public.baseDomain as string)

onMounted(async () => {
  const role = await resolveRole()

  switch (role) {
    case 'platform_admin':
      // On a subdomain, go to partner admin view; on main domain, go to platform
      navigateTo(isSubdomain ? '/admin' : '/platform')
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
