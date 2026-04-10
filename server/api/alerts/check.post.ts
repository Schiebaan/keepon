import { sendEmail, buildFromCustomTemplate, getPartnerTemplate } from '~~/server/utils/email'
import { getServiceRoleClient } from '~~/server/utils/supabase'

// This endpoint can be called by a cron job to check system health
// and send email alerts for issues
export default defineEventHandler(async (event) => {
  await requireRole(event, 'platform_admin')

  const supabase = getServiceRoleClient(event)

  // Get all active subscriptions with integration errors
  const { data: errorSubs } = await supabase
    .from('subscriptions')
    .select(`
      id, integration_status, integration_meta,
      customer:customers(id, email, full_name, partner_id),
      partner_module_config:partner_module_configs(
        module_definition:module_definitions(name, type)
      )
    `)
    .eq('status', 'active')
    .eq('integration_status', 'error')

  if (!errorSubs?.length) {
    return { checked: true, alerts_sent: 0 }
  }

  let alertsSent = 0

  for (const sub of errorSubs) {
    const customer = sub.customer as any
    const moduleName = sub.partner_module_config?.module_definition?.name || 'je systeem'

    if (!customer?.email) continue

    // Get partner info for branding
    const { data: partner } = await supabase
      .from('partners')
      .select('name, primary_color, logo_url, support_email')
      .eq('id', customer.partner_id)
      .single()

    const emailContent = buildFromCustomTemplate({
      subject: `Let op: ${moduleName} meldt een storing`,
      heading: 'Er is een storing gedetecteerd',
      body: `Hallo {{voornaam}}, we hebben een probleem gedetecteerd met je ${moduleName}. Ons team is op de hoogte gebracht en neemt zo nodig contact met je op.`,
      buttonText: 'Bekijk status',
      buttonUrl: `https://upsol.nl/klant`,
      customerName: customer.full_name || 'Klant',
      customerEmail: customer.email,
      moduleName,
      partner: partner || undefined,
    })

    const result = await sendEmail({
      to: customer.email,
      subject: emailContent.subject,
      html: emailContent.html,
      replyTo: partner?.support_email || undefined,
    })

    if (result.success) alertsSent++
  }

  return { checked: true, alerts_sent: alertsSent, errors_found: errorSubs.length }
})
