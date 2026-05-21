/**
 * If a logged-in customer hasn't accepted the proposal yet, redirect them to
 * /welkom/voorstel. Once `accepted_at` is set, the portal is fully available;
 * incasso is a parallel, optional follow-up and never a blocker.
 *
 * We gate on `accepted_at` (the timestamp) rather than `step`. If those two
 * ever drift (e.g. a stale /welkom/index call regresses step back to
 * 'voorstel'), the timestamp is the source of truth for "did the customer
 * give akkoord". Without this, a state drift would lock the customer out of
 * their own portal.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (typeof window === 'undefined') return
  const config = useRuntimeConfig()
  if (config.public.demoMode) return

  // Welkom flow itself, login, callback, voorwaarden — let through
  if (
    to.path.startsWith('/welkom') ||
    to.path.startsWith('/auth/') ||
    to.path.startsWith('/login') ||
    to.path.startsWith('/voorwaarden')
  ) return

  const user = useSupabaseUser()
  if (!user.value) return // auth middleware handles this

  const onboarding = (user.value?.user_metadata as any)?.onboarding
  let acceptedAt: string | null | undefined = onboarding?.accepted_at
  const step = onboarding?.step

  // Fallback: the user metadata may be a beat behind right after accept (the
  // Supabase user-ref takes a moment to refresh after a session refresh).
  // The /welkom/voorstel page mirrors the same field into a useState shared
  // across the app, so we accept that as a "just accepted" indicator.
  if (!acceptedAt) {
    const localState = useState<any>('onboardingState')
    if (localState.value?.accepted_at) acceptedAt = localState.value.accepted_at
  }

  // Already accepted (acceptedAt set) OR legacy customer with no onboarding
  // metadata at all (undefined) → let through. Only block when we know the
  // customer is mid-flow and hasn't accepted yet.
  if (acceptedAt) return
  if (!onboarding) return

  if (step === 'hero' || step === 'voorstel') {
    return navigateTo('/welkom/voorstel')
  }
})
