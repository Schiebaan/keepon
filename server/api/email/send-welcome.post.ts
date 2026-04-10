import { sendEmail, buildWelcomeEmail, buildFromCustomTemplate, getPartnerTemplate, moduleTypeLabel } from '~~/server/utils/email'
import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Require auth
  const { user } = await requireRole(event, 'partner_admin')

  const body = await readBody(event)
  const { customerEmail, customerName, moduleType, onboardingToken, partnerId } = body

  if (!customerEmail || !customerName || !moduleType) {
    throw createError({ statusCode: 400, message: 'customerEmail, customerName, and moduleType are required' })
  }

  const supabase = getServiceRoleClient(event)

  // Get partner branding
  let partner = null
  if (partnerId) {
    const { data } = await supabase
      .from('partners')
      .select('name, slug, primary_color, secondary_color, logo_url, support_email')
      .eq('id', partnerId)
      .single()
    partner = data
  }

  // Build onboarding URL
  const baseUrl = `https://${partner?.slug ? partner.slug + '.' : ''}upsol.nl`
  const onboardingUrl = onboardingToken
    ? `${baseUrl}/welkom/${onboardingToken}`
    : `${baseUrl}/login`

  // Try to use partner's custom template
  let emailContent: { subject: string; html: string }

  const customTemplate = partnerId
    ? await getPartnerTemplate(supabase, partnerId, 'welkomstmail')
    : null

  if (customTemplate) {
    if (!customTemplate.enabled) {
      return { success: false, reason: 'template_disabled' }
    }
    emailContent = buildFromCustomTemplate({
      subject: customTemplate.subject,
      heading: customTemplate.heading,
      body: customTemplate.body,
      buttonText: customTemplate.button_text,
      buttonUrl: onboardingUrl,
      customerName,
      customerEmail,
      moduleName: moduleTypeLabel(moduleType),
      partner: partner || undefined,
    })
  } else {
    // Fall back to default template
    emailContent = buildWelcomeEmail({
      customerName,
      customerEmail,
      onboardingUrl,
      moduleName: moduleTypeLabel(moduleType),
      partner: partner || undefined,
    })
  }

  const result = await sendEmail({
    to: customerEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    replyTo: partner?.support_email || undefined,
  })

  return result
})
