import { getServiceRoleClient } from '~~/server/utils/supabase'
import { sendEmail, buildFromCustomTemplate } from '~~/server/utils/email'

// Send magic link via Resend instead of Supabase's own email
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email) throw createError({ statusCode: 400, message: 'Email is verplicht' })

  const supabase = getServiceRoleClient(event)

  // Get the host to determine the redirect URL
  const host = getHeader(event, 'host') || 'upsol.nl'
  const redirectTo = `https://${host}/auth/callback`

  // Generate magic link via admin API
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo },
  })

  if (error) {
    throw createError({ statusCode: 400, message: 'Kan geen inloglink genereren. Controleer het e-mailadres.' })
  }

  const magicLinkUrl = data?.properties?.action_link
  if (!magicLinkUrl) {
    throw createError({ statusCode: 500, message: 'Inloglink genereren mislukt' })
  }

  // Get partner branding from tenant context
  const tenant = event.context.tenant
  let partner = null
  if (tenant) {
    partner = tenant
  } else {
    const { data: p } = await supabase.from('partners').select('name, slug, primary_color, logo_url, support_email').eq('is_active', true).order('created_at').limit(1).single()
    partner = p
  }

  // Send via Resend with branding
  const { subject, html } = buildFromCustomTemplate({
    subject: `Inloggen bij ${partner?.name || 'UPsol'}`,
    heading: 'Inloggen',
    body: 'Klik op de knop hieronder om in te loggen. Deze link is 1 uur geldig.',
    buttonText: 'Inloggen',
    buttonUrl: magicLinkUrl,
    customerName: email.split('@')[0],
    customerEmail: email,
    partner: partner || undefined,
  })

  const result = await sendEmail({
    to: email,
    subject,
    html,
    // Geen replyTo — magic-link mails zijn transactioneel; replies horen niet
    // in de partner-inbox te belanden.
  })

  if (!result.success) {
    throw createError({ statusCode: 500, message: 'Email versturen mislukt' })
  }

  return { success: true }
})
