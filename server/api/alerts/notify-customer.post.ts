import { sendEmail, buildFromCustomTemplate } from '~~/server/utils/email'
import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  await requireRole(event, 'partner_admin')

  const body = await readBody(event)
  const { customerEmail, customerName, moduleName, message, partnerId } = body

  if (!customerEmail || !customerName || !message) {
    throw createError({ statusCode: 400, message: 'customerEmail, customerName, and message are required' })
  }

  const supabase = getServiceRoleClient(event)

  let partner = null
  if (partnerId) {
    const { data } = await supabase
      .from('partners')
      .select('name, primary_color, logo_url, support_email')
      .eq('id', partnerId)
      .single()
    partner = data
  }

  const emailContent = buildFromCustomTemplate({
    subject: `Update over je ${moduleName || 'systeem'}`,
    heading: 'Bericht van je installateur',
    body: message,
    buttonText: 'Naar mijn dashboard',
    buttonUrl: 'https://upsol.nl/klant',
    customerName,
    customerEmail,
    moduleName: moduleName || '',
    partner: partner || undefined,
  })

  const result = await sendEmail({
    to: customerEmail,
    subject: emailContent.subject,
    html: emailContent.html,
    replyTo: partner?.support_email || undefined,
  })

  return result
})
