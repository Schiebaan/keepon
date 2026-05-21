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
 * Public welcome-mail resend endpoint. Called from /welkom/verlopen when the
 * customer's original link expired or got lost. Re-issues the same partner-
 * branded mail as the original onboarding mail, with a fresh 30-day token.
 *
 * Important: we deliberately do NOT reveal whether the address exists. The
 * response is always the same so the endpoint cannot be used to enumerate
 * customer accounts.
 */
export default defineEventHandler(async (event) => {
  const body = await readBody(event).catch(() => ({}))
  const email = (body?.email || '').toString().trim().toLowerCase()

  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'Vul een geldig e-mailadres in' })
  }

  const supabase = getServiceRoleClient(event)

  // Tenant context: prefer the slug we're being called from (volt4u.upsol.nl)
  // so we resend in the right partner's branding. Fall back to a per-email
  // lookup if there's no tenant header (e.g. apex domain).
  const tenant = (event.context as any).tenant
  let customer: any = null

  if (tenant?.id) {
    const { data } = await supabase
      .from('customers')
      .select('id, email, partner_id, full_name')
      .eq('email', email)
      .eq('partner_id', tenant.id)
      .single()
    customer = data
  } else {
    const { data } = await supabase
      .from('customers')
      .select('id, email, partner_id, full_name')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    customer = data
  }

  // No customer found → opaque success so we don't leak account existence
  if (!customer) {
    return { sent: true }
  }

  const { data: partnerData } = await supabase
    .from('partners')
    .select('name, slug, primary_color, logo_url, support_email, support_phone')
    .eq('id', customer.partner_id)
    .single()

  // Re-derive modules from the customer's products
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

  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
  const baseUrl = `https://${partnerData?.slug ? partnerData.slug + '.' : ''}${baseDomain}`
  const welcomeToken = createWelcomeToken(customer.id, 30)
  const magicLinkUrl = `${baseUrl}/api/welkom/start?token=${welcomeToken}`

  const customTemplate = await getPartnerTemplate(supabase, customer.partner_id, 'welkomstmail')
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
    // Geen replyTo — welkomstmail-CTA voert direct naar het portaal.
  })

  // Audit even on opaque path so we can spot abuse later
  try {
    await auditLog(event, 'email.welcome_resent_public', 'customer', customer.id, {
      to: customer.email,
      success: result.success,
    })
  } catch { /* non-fatal */ }

  return { sent: true }
})
