export default defineNuxtRouteMiddleware(async () => {
  const config = useRuntimeConfig()

  // Skip auth check in demo mode
  if (config.public.demoMode) {
    return
  }

  const user = useSupabaseUser()
  if (!user.value) {
    return navigateTo('/login')
  }
})
