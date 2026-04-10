import { sendEmail, buildActivationConfirmEmail, buildFromCustomTemplate, getPartnerTemplate, moduleTypeLabel } from '~~/server/utils/email'
import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')

  const body = await readBody(event)
  const { customerEmail, customerName, moduleType, partnerId } = body

  if (!customerEmail || !customerName || !moduleType) {
    throw createError({ statusCode: 400, message: 'customerEmail, customerName, and moduleType are required' })
  }

  const supabase = getServiceRoleClient(event)

  let partner = null
  if (partnerId) {
    const { data } = await supabase
      .from('partners')
      .select('name, slug, primary_color, secondary_color, logo_url, support_email')
      .eq('id', partnerId)
      .single()
    partner = data
  }

  const loginUrl = `https://${partner?.slug ? partner.slug + '.' : ''}upsol.nl/login`

  // Try custom template
  let emailContent: { subject: string; html: string }

  const customTemplate = partnerId
    ? await getPartnerTemplate(supabase, partnerId, 'activatie_bevestiging')
    : null

  if (customTemplate) {
    if (!customTemplate.enabled) return { success: false, reason: 'template_disabled' }
    emailContent = buildFromCustomTemplate({
      subject: customTemplate.subject,
      heading: customTemplate.heading,
      body: customTemplate.body,
      buttonText: customTemplate.button_text,
      buttonUrl: loginUrl,
      customerName,
      customerEmail,
      moduleName: moduleTypeLabel(moduleType),
      partner: partner || undefined,
    })
  } else {
    emailContent = buildActivationConfirmEmail({
      customerName,
      loginUrl,
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
