import { resolvePartnerId } from '~~/server/utils/partner-scope'
import { sendEmail, buildFromCustomTemplate } from '~~/server/utils/email'
import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')

  const body = await readBody(event)
  const { customerEmail, customerName, moduleName, message, partnerId } = body

  if (!customerEmail || !customerName || !message) {
    throw createError({ statusCode: 400, message: 'customerEmail, customerName, and message are required' })
  }

  const supabase = getServiceRoleClient(event)

  // Alleen in de eigen huisstijl mailen. partnerId kwam uit het verzoek, dus
  // elke installateur kon mail versturen namens een andere installateur.
  const supabaseScope = getServiceRoleClient(event)
  const eigenPartner = await resolvePartnerId(event, supabaseScope, user.id)
  if (partnerId && partnerId !== eigenPartner) {
    throw createError({ statusCode: 403, message: 'Geen toegang tot deze partner' })
  }
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
    // Geen replyTo — alerts zijn transactioneel; reageren gaat via het portaal.
  })

  return result
})
