import { Resend } from 'resend'

let resendClient: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!resendClient) {
    resendClient = new Resend(key)
  }
  return resendClient
}

// Default sender - update when domain is verified in Resend
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'UPsol <onboarding@resend.dev>'

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions) {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email to:', options.to)
    return { success: false, reason: 'no_api_key' }
  }

  const { data, error } = await resend.emails.send({
    from: options.from || DEFAULT_FROM,
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo,
  })

  if (error) {
    console.error('[email] Failed to send:', error)
    return { success: false, reason: error.message }
  }

  console.log('[email] Sent to:', options.to, 'id:', data?.id)
  return { success: true, id: data?.id }
}

// ============================================================
// Email Templates - Nederlands, partner-branded
// ============================================================

function baseLayout(content: string, partner?: { name: string; primary_color: string; logo_url?: string }) {
  const brandColor = partner?.primary_color || '#2563eb'
  const brandName = partner?.name || 'UPsol'

  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; color: #1f2937; }
    .container { max-width: 560px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 16px; padding: 40px 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo img { height: 40px; }
    .logo-text { display: inline-block; padding: 8px 16px; border-radius: 10px; color: #fff; font-size: 18px; font-weight: 700; background-color: ${brandColor}; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 8px; color: #111827; }
    p { font-size: 15px; line-height: 1.6; color: #4b5563; margin: 0 0 16px; }
    .btn { display: inline-block; padding: 14px 28px; background-color: ${brandColor}; color: #ffffff !important; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 10px; }
    .btn:hover { opacity: 0.9; }
    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #9ca3af; }
    .divider { border: none; border-top: 1px solid #f3f4f6; margin: 24px 0; }
    .highlight { background-color: #f9fafb; border-radius: 10px; padding: 16px 20px; margin: 16px 0; }
    .highlight-label { font-size: 12px; color: #9ca3af; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 0.5px; }
    .highlight-value { font-size: 15px; font-weight: 600; color: #111827; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        ${partner?.logo_url
          ? `<img src="https://${(partner as any)?.slug ? (partner as any).slug + '.' : ''}upsol.nl/api/partners/${(partner as any)?.slug || 'default'}/logo" alt="${brandName}" style="height:40px;">`
          : `<span class="logo-text">${brandName}</span>`
        }
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} ${brandName}. Alle rechten voorbehouden.</p>
    </div>
  </div>
</body>
</html>`
}

// ---- Welcome Email ----
interface WelcomeEmailData {
  customerName: string
  customerEmail: string
  onboardingUrl: string
  moduleName: string
  partner?: { name: string; primary_color: string; logo_url?: string; support_email?: string }
}

export function buildWelcomeEmail(data: WelcomeEmailData) {
  const firstName = data.customerName.split(' ')[0]
  const partnerName = data.partner?.name || 'je installateur'

  const content = `
    <h1>Welkom, ${firstName}!</h1>
    <p>
      ${partnerName} heeft een account voor je aangemaakt.
      Via je persoonlijke portaal kun je de status van je systeem volgen.
    </p>

    <div class="highlight">
      <p class="highlight-label">Jouw systeem</p>
      <p class="highlight-value">${data.moduleName}</p>
    </div>

    <p>
      Klik op de knop hieronder om direct in te loggen. Na het inloggen kun je een eigen wachtwoord instellen.
    </p>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.onboardingUrl}" class="btn">Direct inloggen</a>
    </p>

    <p style="font-size:13px; color:#6b7280;">
      Deze link is 24 uur geldig. Daarna kun je inloggen via de "Magic link" optie op de loginpagina.
    </p>

    <hr class="divider">

    <p style="font-size:13px; color:#9ca3af;">
      Als je deze email niet verwacht, kun je hem negeren.
      ${data.partner?.support_email ? `Vragen? Mail naar <a href="mailto:${data.partner.support_email}" style="color:${data.partner?.primary_color || '#2563eb'}">${data.partner.support_email}</a>` : ''}
    </p>`

  return {
    subject: `Welkom bij ${partnerName} — je portaal staat klaar`,
    html: baseLayout(content, data.partner),
  }
}

// ---- Password Reset Email (custom, to supplement Supabase) ----
interface ResetEmailData {
  customerName: string
  resetUrl: string
  partner?: { name: string; primary_color: string; logo_url?: string }
}

export function buildPasswordResetEmail(data: ResetEmailData) {
  const firstName = data.customerName.split(' ')[0]

  const content = `
    <h1>Wachtwoord herstellen</h1>
    <p>
      Hallo ${firstName}, we hebben een verzoek ontvangen om je wachtwoord te wijzigen.
      Klik op de knop hieronder om een nieuw wachtwoord in te stellen.
    </p>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.resetUrl}" class="btn">Nieuw wachtwoord instellen</a>
    </p>

    <hr class="divider">

    <p style="font-size:13px; color:#9ca3af;">
      Als je dit verzoek niet hebt gedaan, kun je deze email negeren.
      Je wachtwoord wordt niet gewijzigd.
    </p>
    <p style="font-size:13px; color:#9ca3af;">
      Deze link is 1 uur geldig.
    </p>`

  return {
    subject: 'Wachtwoord herstellen',
    html: baseLayout(content, data.partner),
  }
}

// ---- Account Activated Confirmation ----
interface ActivationEmailData {
  customerName: string
  loginUrl: string
  moduleName: string
  partner?: { name: string; primary_color: string; logo_url?: string; support_email?: string }
}

export function buildActivationConfirmEmail(data: ActivationEmailData) {
  const firstName = data.customerName.split(' ')[0]
  const partnerName = data.partner?.name || 'UPsol'

  const content = `
    <h1>Je account is actief!</h1>
    <p>
      Hallo ${firstName}, je account bij ${partnerName} is succesvol geactiveerd.
      Je kunt nu inloggen op je persoonlijke dashboard.
    </p>

    <div class="highlight">
      <p class="highlight-label">Actieve module</p>
      <p class="highlight-value">${data.moduleName}</p>
    </div>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.loginUrl}" class="btn">Naar mijn dashboard</a>
    </p>

    <hr class="divider">

    <p style="font-size:13px; color:#9ca3af;">
      ${data.partner?.support_email ? `Hulp nodig? Neem contact op via <a href="mailto:${data.partner.support_email}" style="color:${data.partner?.primary_color || '#2563eb'}">${data.partner.support_email}</a>` : ''}
    </p>`

  return {
    subject: `Je account bij ${partnerName} is actief`,
    html: baseLayout(content, data.partner),
  }
}

// ---- Module type to Dutch label ----
export function moduleTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    solar: 'Zonnepanelen monitoring',
    heat_pump: 'Warmtepomp monitoring',
    ev_charger: 'Laadpaal monitoring',
  }
  return labels[type] || type
}

// ---- Generic template builder using partner-customized templates ----
interface CustomTemplateData {
  heading: string
  body: string
  buttonText: string
  buttonUrl: string
  subject: string
  // Placeholder values
  customerName: string
  customerEmail?: string
  moduleName?: string
  partner?: { name: string; primary_color: string; logo_url?: string; support_email?: string }
}

function replacePlaceholders(text: string, data: CustomTemplateData): string {
  const firstName = data.customerName.split(' ')[0]
  const partnerName = data.partner?.name || 'UPsol'
  return text
    .replace(/\{\{voornaam\}\}/g, firstName)
    .replace(/\{\{naam\}\}/g, data.customerName)
    .replace(/\{\{email\}\}/g, data.customerEmail || '')
    .replace(/\{\{bedrijfsnaam\}\}/g, partnerName)
    .replace(/\{\{module\}\}/g, data.moduleName || '')
}

export function buildFromCustomTemplate(data: CustomTemplateData) {
  const heading = replacePlaceholders(data.heading, data)
  const body = replacePlaceholders(data.body, data)
  const buttonText = replacePlaceholders(data.buttonText, data)
  const subject = replacePlaceholders(data.subject, data)
  const supportHtml = data.partner?.support_email
    ? `<p style="font-size:13px; color:#9ca3af;">Vragen? Mail naar <a href="mailto:${data.partner.support_email}" style="color:${data.partner?.primary_color || '#2563eb'}">${data.partner.support_email}</a></p>`
    : ''

  const content = `
    <h1>${heading}</h1>
    <p>${body}</p>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.buttonUrl}" class="btn">${buttonText}</a>
    </p>

    <hr class="divider">
    ${supportHtml}`

  return {
    subject,
    html: baseLayout(content, data.partner),
  }
}

// ---- Fetch custom template from Supabase, fall back to defaults ----
export async function getPartnerTemplate(
  supabase: any,
  partnerId: string,
  templateType: string
): Promise<{ subject: string; heading: string; body: string; button_text: string; enabled: boolean } | null> {
  const { data } = await supabase
    .from('email_templates')
    .select('subject, heading, body, button_text, enabled')
    .eq('partner_id', partnerId)
    .eq('type', templateType)
    .single()

  return data || null
}
