import { getServiceRoleClient } from '~~/server/utils/supabase'
import { sendEmail, buildPasswordChangedEmail } from '~~/server/utils/email'

/**
 * Client-triggered confirmation that the current user's password just changed.
 * Sends a security notification to the user's email so they know if a malicious
 * actor changed their password.
 *
 * Called from:
 *   - /admin/settings (partner admin password change)
 *   - /klant/gegevens (customer password change, if/when added)
 *   - /auth/reset-password (after completing a reset)
 *
 * Idempotency: if multiple triggers fire within a short window (e.g. page reload
 * after change), we dedupe based on the audit_log so we don't spam the user.
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  // Dedup: if we already sent a password-changed mail to this user in the last 60 seconds, skip
  const since = new Date(Date.now() - 60 * 1000).toISOString()
  const { data: recent } = await supabase
    .from('audit_log')
    .select('id')
    .eq('action', 'email.password_changed_sent')
    .eq('entity_id', user.id)
    .gte('created_at', since)
    .limit(1)

  if (recent && recent.length > 0) {
    return { sent: false, reason: 'deduped' }
  }

  // Look up display name + partner context
  // First try customer record (most users will match here)
  const { data: customer } = await supabase
    .from('customers')
    .select('full_name, email, partner_id')
    .eq('auth_user_id', user.id)
    .single()

  const email = customer?.email || user.email
  const fullName = customer?.full_name || (user.email ? user.email.split('@')[0] : 'gebruiker')

  if (!email) {
    return { sent: false, reason: 'no_email' }
  }

  // Figure out the partner for branding. Customers have partner_id directly;
  // partner admins go via user_roles.
  let partnerId = customer?.partner_id
  if (!partnerId) {
    const { data: role } = await supabase
      .from('user_roles')
      .select('partner_id')
      .eq('user_id', user.id)
      .not('partner_id', 'is', null)
      .limit(1)
      .single()
    partnerId = role?.partner_id
  }

  let partner: any = null
  if (partnerId) {
    const { data } = await supabase
      .from('partners')
      .select('name, slug, primary_color, logo_url, support_email')
      .eq('id', partnerId)
      .single()
    partner = data
  }

  try {
    const mail = buildPasswordChangedEmail({
      customerName: fullName,
      changedAt: new Date(),
      partner: partner ? {
        name: partner.name,
        primary_color: partner.primary_color,
        logo_url: partner.logo_url,
        support_email: partner.support_email,
      } : undefined,
    })

    const result = await sendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html,
      // Geen replyTo — security-mail, geen reply verwacht.
    })

    await auditLog(event, 'email.password_changed_sent', 'auth_user', user.id, {
      to: email,
      success: result.success,
    })

    return { sent: result.success }
  } catch (e: any) {
    console.error('[auth] Failed to send password-changed email:', e?.message || e)
    return { sent: false, reason: 'send_error' }
  }
})
