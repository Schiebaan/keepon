import type { UserRole } from '~~/shared/types/database'

export function useAuth() {
  const config = useRuntimeConfig()

  const userRole = useState<UserRole | null>('userRole', () => null)
  const isLoading = useState('authLoading', () => false)

  // In demo mode, provide mock auth with role switching
  if (config.public.demoMode) {
    if (!userRole.value) userRole.value = 'platform_admin'

    return {
      user: ref({ id: 'demo-user', email: 'demo@upsol.nl' }),
      userRole,
      isLoading,
      resolveRole: async () => userRole.value ?? 'platform_admin',
      signInWithMagicLink: async (_email: string) => {},
      signOut: async () => navigateTo('/'),
      switchRole: (role: UserRole) => { userRole.value = role },
      isCustomer: computed(() => userRole.value === 'customer'),
      isPartnerAdmin: computed(() => userRole.value === 'partner_admin'),
      isPlatformAdmin: computed(() => userRole.value === 'platform_admin'),
      isAdmin: computed(() => userRole.value === 'partner_admin' || userRole.value === 'platform_admin'),
    }
  }

  // Production mode with Supabase
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  async function resolveRole() {
    if (!user.value) {
      userRole.value = null
      return null
    }

    isLoading.value = true
    try {
      // Get current session token
      const { data: { session } } = await supabase.auth.getSession()
      const headers: Record<string, string> = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      // Fetch role via server API (bypasses RLS issues)
      const data = await $fetch('/api/auth/role', { headers })
      userRole.value = (data?.role as UserRole) ?? null
      return userRole.value
    } finally {
      isLoading.value = false
    }
  }

  async function signInWithMagicLink(email: string) {
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    })
    if (error) throw error
  }

  async function signInWithPassword(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  async function resetPassword(email: string) {
    const redirectTo = `${window.location.origin}/auth/reset-password`
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })
    if (error) throw error
  }

  async function updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })
    if (error) throw error
  }

  async function signOut() {
    await supabase.auth.signOut()
    userRole.value = null
    navigateTo('/login')
  }

  const isCustomer = computed(() => userRole.value === 'customer')
  const isPartnerAdmin = computed(() => userRole.value === 'partner_admin')
  const isPlatformAdmin = computed(() => userRole.value === 'platform_admin')
  const isAdmin = computed(() => isPartnerAdmin.value || isPlatformAdmin.value)

  return {
    user,
    userRole,
    isLoading,
    resolveRole,
    signInWithMagicLink,
    signInWithPassword,
    resetPassword,
    updatePassword,
    signOut,
    switchRole: (_role: UserRole) => {}, // no-op in production
    isCustomer,
    isPartnerAdmin,
    isPlatformAdmin,
    isAdmin,
  }
}
