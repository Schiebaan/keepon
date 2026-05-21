import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Resolve a company-user's display name for customer-facing surfaces.
 *
 * Cascade:
 *   1. user_roles.full_name (manually set)
 *   2. auth.users.user_metadata.full_name (Supabase default — set during invite)
 *   3. derived from email — "mark@volt4u.nl" → "Mark"
 *   4. literal "Team" as last resort (better than blank/email-as-name)
 */
export async function resolveAdminDisplayName(
  supabase: SupabaseClient,
  authUserId: string,
): Promise<string> {
  // 1. user_roles.full_name (most authoritative — partner-managed)
  const { data: role } = await supabase
    .from('user_roles')
    .select('full_name')
    .eq('user_id', authUserId)
    .not('full_name', 'is', null)
    .limit(1)
    .maybeSingle()
  if (role?.full_name && typeof role.full_name === 'string' && role.full_name.trim()) {
    return role.full_name.trim()
  }

  // 2 + 3. Auth user details
  try {
    const { data } = await supabase.auth.admin.getUserById(authUserId)
    const meta = (data?.user?.user_metadata || {}) as any
    const metaName = meta.full_name || meta.name
    if (typeof metaName === 'string' && metaName.trim()) return metaName.trim()

    const email = data?.user?.email || ''
    return deriveNameFromEmail(email)
  } catch {
    return 'Team'
  }
}

/** "mark.jansen@volt4u.nl" → "Mark Jansen", "info@x.nl" → "Team" */
export function deriveNameFromEmail(email: string): string {
  if (!email || typeof email !== 'string') return 'Team'
  const local = email.split('@')[0] || ''
  // Generic role-addresses don't carry a person's name — better to say "Team"
  const generic = new Set(['info', 'support', 'contact', 'service', 'helpdesk', 'admin', 'office'])
  if (generic.has(local.toLowerCase())) return 'Team'

  // Split on dots / dashes / underscores, titlecase each chunk
  const parts = local.split(/[._-]+/).filter(Boolean)
  if (!parts.length) return 'Team'
  return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(' ')
}
