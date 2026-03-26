export default defineNuxtRouteMiddleware(async () => {
  const { userRole, resolveRole } = useAuth()

  if (!userRole.value) {
    await resolveRole()
  }

  if (userRole.value !== 'platform_admin') {
    return navigateTo('/')
  }
})
