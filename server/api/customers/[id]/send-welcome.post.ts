import { getServiceRoleClient } from '~~/server/utils/supabase'
import { sendEmail, buildWelcomeEmail, buildFromCustomTemplate, getPartnerTemplate } from '~~/server/utils/email'
import { createWelcomeToken } from '~~/server/utils/welcome-token'

const MODULE_LABELS: Record<string, string> = {
  solar_panel: 'Zonnepanelen',
  heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal',
  battery: 'Thuisbatterij',
}
const CATEGORY_TO_MODULE: Record<string, string> = {
  solar_panel: 'solar', heat_pump: 'heat_pump', ev_charger: 'ev_charger', battery: 'battery',
}

/**
 * Resend the welcome email to a customer. Used from the admin customer detail page
 * for customers who lost the original mail or whose link expired.
 *
 * Reuses the same long-lived welcome-token flow as the original onboarding mail —
 * customer clicks → fresh magic link → portal.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

  const supabase = getServiceRoleClient(event)

  const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const tenant = (event.context as any).tenant
    if (tenant?.id) partnerId = tenant.id
    else {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  // Verify the customer belongs to this partner
  const { data: customer } = await supabase
    .from('customers')
    .select('id, email, full_name, partner_id')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()

  if (!customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  const { data: partnerData } = await supabase
    .from('partners')
    .select('name, slug, primary_color, logo_url, support_email, support_phone')
    .eq('id', partnerId)
    .single()

  // Re-derive selected modules from existing customer_products so the email
  // reflects the actual installation, not what was selected at create time
  const { data: products } = await supabase
    .from('customer_products')
    .select('category')
    .eq('customer_id', customer.id)
  const seen = new Set<string>()
  const modulesForEmail: string[] = []
  for (const p of products || []) {
    const m = CATEGORY_TO_MODULE[p.category as string]
    if (m && !seen.has(m)) { seen.add(m); modulesForEmail.push(m) }
  }
  const moduleNames = modulesForEmail
    .map(m => Object.entries(CATEGORY_TO_MODULE).find(([_, v]) => v === m)?.[0])
    .map(c => c ? MODULE_LABELS[c] : null)
    .filter(Boolean)
    .join(' & ') || 'installatie'

  const baseUrl = `https://${partnerData?.slug ? partnerData.slug + '.' : ''}upsol.nl`
  const welcomeToken = createWelcomeToken(customer.id, 30)
  const magicLinkUrl = `${baseUrl}/api/welkom/start?token=${welcomeToken}`

  // Custom template if the partner has one, else default
  const customTemplate = await getPartnerTemplate(supabase, partnerId, 'welkomstmail')
  let emailContent: { subject: string; html: string }

  if (customTemplate && customTemplate.enabled) {
    emailContent = buildFromCustomTemplate({
      subject: customTemplate.subject,
      heading: customTemplate.heading,
      body: customTemplate.body,
      buttonText: customTemplate.button_text,
      buttonUrl: magicLinkUrl,
      customerName: customer.full_name || customer.email,
      customerEmail: customer.email,
      moduleName: moduleNames,
      partner: partnerData || undefined,
    })
  } else {
    emailContent = buildWelcomeEmail({
      customerName: customer.full_name || customer.email,
      customerEmail: customer.email,
      onboardingUrl: magicLinkUrl,
      moduleName: moduleNames,
      modules: modulesForEmail,
      partner: partnerData || undefined,
    })
  }

  const result = await sendEmail({
    to: customer.email,
    subject: emailContent.subject,
    html: emailContent.html,
    fromName: partnerData?.name,
    // Geen replyTo — welkomstmail wijst direct naar portaal-login.
  })

  await auditLog(event, 'email.welcome_resent', 'customer', customer.id, {
    to: customer.email,
    success: result.success,
    actor: user.id,
  })

  if (!result.success) {
    throw createError({ statusCode: 500, message: 'E-mail versturen mislukt: ' + (result.reason || 'onbekende fout') })
  }

  return {
    sent: true,
    to: customer.email,
    expires_in_days: 30,
  }
})
