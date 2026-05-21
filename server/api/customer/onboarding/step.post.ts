import { getServiceRoleClient } from '~~/server/utils/supabase'

const STEP_ORDER = ['hero', 'voorstel', 'incasso', 'done'] as const
const STEP_INDEX: Record<string, number> = Object.fromEntries(STEP_ORDER.map((s, i) => [s, i]))

/** Update the onboarding step for the current customer (resume support).
 *  Enforces a monotonic state machine: never accept a step that's earlier than
 *  the customer's current position. This prevents stale /welkom/index hits
 *  from regressing an already-accepted customer back to 'voorstel'.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const step = body?.step
  if (!step || !(step in STEP_INDEX)) {
    throw createError({ statusCode: 400, message: 'Onbekende stap' })
  }

  const supabase = getServiceRoleClient(event)
  const current = (user.user_metadata as any)?.onboarding || {}
  const currentStep = current.step || 'hero'
  const currentIdx = STEP_INDEX[currentStep] ?? 0
  const nextIdx = STEP_INDEX[step]

  // Reject regressions: silently no-op so the client doesn't need to know.
  if (nextIdx < currentIdx) {
    return { step: currentStep, regression_blocked: true }
  }

  // Dual-write: user_metadata + customers.onboarding_step kolom
  await Promise.all([
    supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata as any),
        onboarding: { ...current, step },
      },
    }),
    supabase.from('customers')
      .update({ onboarding_step: step })
      .eq('auth_user_id', user.id),
  ])

  return { step }
})
