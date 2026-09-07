import { senderLabel as buildSenderLabel } from '~~/shared/utils/sender-name'
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

/** Extract just the bare email address from "Name <email@domain>" */
function getFromAddress(): string {
  const f = process.env.RESEND_FROM_EMAIL || 'noreply@upsol.nl'
  const m = f.match(/<([^>]+)>/)
  return m ? m[1] : f
}

interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
  fromName?: string  // Display name to show in inbox, e.g. "Volt4U" — uses verified Resend domain
  replyTo?: string
}

export async function sendEmail(options: SendEmailOptions) {
  const resend = getResend()
  if (!resend) {
    console.warn('[email] RESEND_API_KEY not configured, skipping email to:', options.to)
    return { success: false, reason: 'no_api_key' }
  }

  // Compose the From header. If a partner name is provided, the inbox will show
  // "Volt4U <noreply@upsol.nl>" — we keep the verified upsol.nl domain so Resend
  // accepts the send, but the human-visible sender becomes the partner.
  const from = options.from || (options.fromName
    ? `${sanitizeFromName(options.fromName)} <${getFromAddress()}>`
    : DEFAULT_FROM)

  const { data, error } = await resend.emails.send({
    from,
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

/** Strip characters that could break the From header (quotes, angle brackets) */
function sanitizeFromName(name: string): string {
  return (name || '').replace(/["<>]/g, '').trim() || 'UPsol'
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

// ---- Welcome Email — service proposal invite ----
interface WelcomeEmailData {
  customerName: string
  customerEmail: string
  onboardingUrl: string                 // magic link → /welkom (proposal flow)
  moduleName: string                    // "Zonnepanelen & Warmtepomp"
  modules?: string[]                    // ['solar', 'heat_pump'] — for tailored copy
  partner?: { name: string; primary_color: string; logo_url?: string; support_email?: string; support_phone?: string }
}

const MODULE_INVITE_LINE: Record<string, string> = {
  solar:      'Direct inzicht in je opbrengst en een seintje bij storingen.',
  heat_pump:  'We houden je warmtepomp in de gaten, zonder koude verrassingen.',
  ev_charger: 'Overzicht van je laadsessies en kosten op één plek.',
  battery:    'Inzicht in je laad- en ontlaadcycli en de gezondheid van je batterij.',
}

const MODULE_LOWER: Record<string, string> = {
  solar: 'zonnepanelen', heat_pump: 'warmtepomp', ev_charger: 'laadpaal', battery: 'thuisbatterij',
}

/** Join module labels Dutch-style: ["solar","ev_charger"] → "zonnepanelen en laadpaal" */
function joinModulesNl(modules: string[] | undefined): string {
  const parts = (modules || []).map(m => MODULE_LOWER[m]).filter(Boolean)
  if (parts.length === 0) return 'installatie'
  if (parts.length === 1) return parts[0]
  return parts.slice(0, -1).join(', ') + ' en ' + parts[parts.length - 1]
}

export function buildWelcomeEmail(data: WelcomeEmailData) {
  const firstName = (data.customerName || '').split(' ')[0] || 'daar'
  const partnerName = data.partner?.name || 'je installateur'

  // Build a "what's in the proposal" list — one bullet per active module
  const moduleBullets = (data.modules || [])
    .map(m => MODULE_INVITE_LINE[m])
    .filter(Boolean)
    .map(line => `<li style="padding:6px 0; font-size:14px; color:#374151;">${line}</li>`)
    .join('')

  const bulletsBlock = moduleBullets
    ? `<ul style="list-style:none; padding:0; margin:16px 0 24px;">${moduleBullets}</ul>`
    : ''

  const content = `
    <h1>Hoi ${firstName},</h1>
    <p>
      ${partnerName} heeft een service-voorstel voor je klaargezet voor je
      ${data.moduleName ? data.moduleName.toLowerCase() : 'installatie'}.
      Bekijk het op een rustig moment. Het kost je 2 minuten.
    </p>

    ${bulletsBlock}

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.onboardingUrl}" class="btn">Bekijk mijn voorstel</a>
    </p>

    <p style="font-size:13px; color:#6b7280; text-align:center;">
      Geen wachtwoord nodig. De knop logt je automatisch in.
    </p>

    <hr class="divider">

    <p style="font-size:13px; color:#9ca3af; line-height:1.6;">
      Vragen? ${data.partner?.support_phone ? `Bel ${partnerName} op <a href="tel:${data.partner.support_phone}" style="color:${data.partner?.primary_color || '#2563eb'}">${data.partner.support_phone}</a>` : ''}${data.partner?.support_phone && data.partner?.support_email ? ' of ' : ''}${data.partner?.support_email ? `mail <a href="mailto:${data.partner.support_email}" style="color:${data.partner?.primary_color || '#2563eb'}">${data.partner.support_email}</a>` : ''}.
      <br/>
      Niet verwacht? Negeer deze mail. Er gebeurt niets zonder jouw akkoord.
    </p>`

  const subject = data.modules && data.modules.length > 0
    ? `${partnerName}: zet de service voor je ${joinModulesNl(data.modules)} aan`
    : `${partnerName}: zet je service eenvoudig aan`

  return {
    subject,
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

// ---- Ticket reply notification (to customer) ----
interface TicketReplyEmailData {
  customerName: string
  ticketSubject: string
  ticketRef?: string            // human-friendly id like "T-007"
  replyExcerpt: string          // first ~200 chars of the reply
  ticketUrl: string             // deep link to /klant/service
  authorName?: string | null    // who at the partner replied — voornaam genoeg
  partner?: { name: string; primary_color: string; logo_url?: string; support_email?: string }
}

export function buildTicketReplyEmail(data: TicketReplyEmailData) {
  const firstName = (data.customerName || '').split(' ')[0] || 'daar'
  const partnerName = data.partner?.name || 'je installateur'
  // "Rik van Volt4U" vs "Volt4U". Werkt de installateur vanaf een gedeeld
  // account dat naar het bedrijf heet, dan laat de helper de persoonsnaam weg —
  // anders krijg je "Volt4u van Volt4U".
  const senderLabel = buildSenderLabel(data.authorName, partnerName)
  const excerpt = (data.replyExcerpt || '').trim().slice(0, 240)

  const refLine = data.ticketRef
    ? `<p class="highlight-label">Onderwerp · Ticket ${escapeHtml(data.ticketRef)}</p>`
    : `<p class="highlight-label">Onderwerp</p>`

  const content = `
    <h1>${escapeHtml(senderLabel)} heeft gereageerd</h1>
    <p>Hoi ${firstName}, er is een nieuwe reactie op je servicemelding.</p>

    <div class="highlight">
      ${refLine}
      <p class="highlight-value">${escapeHtml(data.ticketSubject)}</p>
    </div>

    <p style="margin-bottom:24px;">
      <em style="color:#6b7280;">"${escapeHtml(excerpt)}${excerpt.length >= 240 ? '…' : ''}"</em>
    </p>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.ticketUrl}" class="btn">Open je ticket en reageer</a>
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; line-height:1.55;">
      <strong style="color:#6b7280;">Reageer via het portaal</strong>, niet via deze mail.
      Daar zie je de volledige geschiedenis en komt je bericht direct bij
      ${escapeHtml(partnerName)} aan. Antwoorden op deze mail worden niet
      automatisch aan je ticket toegevoegd.
    </p>`

  const subject = data.ticketRef
    ? `${senderLabel} heeft gereageerd op ticket ${data.ticketRef}: ${data.ticketSubject}`
    : `${senderLabel} heeft gereageerd op je melding`

  return {
    subject,
    html: baseLayout(content, data.partner),
  }
}


// ---- Ticket afgehandeld (naar de klant) ----
interface TicketResolvedEmailData {
  customerName: string
  ticketSubject: string
  ticketRef?: string
  lastReply?: string | null     // laatste reactie van het team, als context
  authorName?: string | null
  ticketUrl: string             // /klant/service
  partner?: { name: string; primary_color: string; logo_url?: string }
}

/**
 * De installateur zet een melding op afgehandeld. Zonder deze mail hoorde de
 * klant daar niets over: hij zag het alleen als hij toevallig het portaal
 * opende, en bleef anders in de veronderstelling dat het nog liep.
 *
 * De kern van de boodschap is niet "hij is dicht" maar "hij gaat weer open als
 * het niet klopt". Zonder die zin voelt een afsluiting als een deur die
 * dichtgaat, en gaat de klant bellen in plaats van reageren.
 */
export function buildTicketResolvedEmail(data: TicketResolvedEmailData) {
  const firstName = (data.customerName || '').split(' ')[0] || 'daar'
  const partnerName = data.partner?.name || 'je installateur'
  const senderLabel = buildSenderLabel(data.authorName, partnerName)
  const excerpt = (data.lastReply || '').trim().slice(0, 240)

  const refLine = data.ticketRef
    ? `<p class="highlight-label">Onderwerp · Ticket ${escapeHtml(data.ticketRef)}</p>`
    : `<p class="highlight-label">Onderwerp</p>`

  const content = `
    <h1>Je melding is afgehandeld</h1>
    <p>Hoi ${firstName}, ${escapeHtml(senderLabel)} heeft je servicemelding afgerond.</p>

    <div class="highlight">
      ${refLine}
      <p class="highlight-value">${escapeHtml(data.ticketSubject)}</p>
    </div>

    ${excerpt ? `<p style="margin-bottom:24px;">
      <em style="color:#6b7280;">"${escapeHtml(excerpt)}${excerpt.length >= 240 ? '…' : ''}"</em>
    </p>` : ''}

    <p><strong>Is het probleem er nog?</strong> Reageer dan gewoon op je melding
    in het portaal — hij gaat dan vanzelf weer open en komt bij
    ${escapeHtml(partnerName)} terug op de lijst. Je hoeft geen nieuwe melding
    aan te maken.</p>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.ticketUrl}" class="btn">Bekijk je melding</a>
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; line-height:1.55;">
      Antwoorden op deze mail komen niet bij je melding terecht. Gebruik het
      portaal, dan ziet ${escapeHtml(partnerName)} meteen de hele geschiedenis.
    </p>`

  const subject = data.ticketRef
    ? `Melding ${data.ticketRef} afgehandeld: ${data.ticketSubject}`
    : `Je melding is afgehandeld: ${data.ticketSubject}`

  return { subject, html: baseLayout(content, data.partner) }
}


// ---- Storingsoverzicht (naar de installateur) ----
interface DeviceAlertDigestData {
  alerts: { customerName: string; productName: string; detail: string; kind: string }[]
  dashboardUrl: string
  partner?: { name: string; primary_color: string; logo_url?: string }
}

const ALERT_LABELS: Record<string, string> = {
  error: 'Storing',
  unreachable: 'Niet bereikbaar',
  stale: 'Geen data',
  integration_down: 'Koppeling stuk',
}

/**
 * Eén mail per dag met alleen de nieuw gedetecteerde storingen.
 *
 * Bewust geen mail per storing en geen herhaling van wat gisteren al gemeld
 * was: een dagelijkse mail die telkens dezelfde drie regels bevat wordt binnen
 * een week ongelezen weggeklikt, en dan mis je juist de nieuwe.
 */
export function buildDeviceAlertDigestEmail(data: DeviceAlertDigestData) {
  const n = data.alerts.length
  const partnerName = data.partner?.name || 'je installaties'

  const rijen = data.alerts.map(a => `
    <tr>
      <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6; vertical-align:top;">
        <strong style="color:#111827;">${escapeHtml(a.customerName)}</strong><br>
        <span style="color:#6b7280; font-size:13px;">${escapeHtml(a.productName)}</span>
      </td>
      <td style="padding:10px 12px; border-bottom:1px solid #f3f4f6; vertical-align:top; font-size:13px; color:#374151;">
        <span style="display:inline-block; background:#fef2f2; color:#b91c1c; border-radius:9999px; padding:2px 8px; font-size:11px; font-weight:600; margin-bottom:4px;">
          ${escapeHtml(ALERT_LABELS[a.kind] || a.kind)}
        </span><br>
        ${escapeHtml(a.detail)}
      </td>
    </tr>`).join('')

  const content = `
    <h1>${n} nieuwe ${n === 1 ? 'storing' : 'storingen'}</h1>
    <p>We hebben bij ${escapeHtml(partnerName)} ${n === 1 ? 'een installatie' : n + ' installaties'} gevonden die aandacht ${n === 1 ? 'vraagt' : 'vragen'}.</p>

    <table style="width:100%; border-collapse:collapse; margin:20px 0; border:1px solid #f3f4f6; border-radius:8px; overflow:hidden;">
      ${rijen}
    </table>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.dashboardUrl}" class="btn">Bekijk op je dashboard</a>
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; line-height:1.55;">
      Je krijgt deze mail alleen bij <strong style="color:#6b7280;">nieuwe</strong> storingen.
      Een melding die blijft staan komt niet elke dag opnieuw langs; die vind je
      op je dashboard. Herstelt een installatie zichzelf, dan verdwijnt de
      melding vanzelf.
    </p>`

  return {
    subject: n === 1
      ? `1 nieuwe storing gedetecteerd`
      : `${n} nieuwe storingen gedetecteerd`,
    html: baseLayout(content, data.partner),
  }
}

// ---- New ticket notification (to installer / partner support inbox) ----
interface NewTicketEmailData {
  customerName: string
  customerEmail: string
  ticketSubject: string
  ticketRef?: string
  ticketDescription: string | null
  urgency: string
  moduleLabel: string | null
  ticketUrl: string             // /admin/service/[id]
  partner?: { name: string; primary_color: string; logo_url?: string }
}

export function buildNewTicketInstallerEmail(data: NewTicketEmailData) {
  const partnerName = data.partner?.name || 'UPsol'
  const urgencyBadge = data.urgency === 'hoog'
    ? '<span style="display:inline-block; padding:2px 8px; border-radius:10px; background:#fef2f2; color:#b91c1c; font-size:11px; font-weight:600; margin-left:6px;">URGENT</span>'
    : ''

  const description = data.ticketDescription
    ? `<div class="highlight"><p class="highlight-label">Toelichting</p><p style="margin:0; font-size:14px; white-space:pre-line; color:#374151;">${escapeHtml(data.ticketDescription)}</p></div>`
    : ''

  const content = `
    <h1>Nieuwe servicemelding ${urgencyBadge}</h1>
    <p>${escapeHtml(data.customerName)} heeft zojuist een melding ingediend in het klantportaal.</p>

    <div class="highlight">
      <p class="highlight-label">Van</p>
      <p class="highlight-value">${escapeHtml(data.customerName)} · ${escapeHtml(data.customerEmail)}</p>
    </div>
    <div class="highlight">
      <p class="highlight-label">Onderwerp${data.moduleLabel ? ` · ${escapeHtml(data.moduleLabel)}` : ''}</p>
      <p class="highlight-value">${escapeHtml(data.ticketSubject)}</p>
    </div>
    ${description}

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.ticketUrl}" class="btn">Open ticket</a>
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af;">
      Deze melding staat klaar in ${partnerName} → Service. Reageer vanuit het portaal zodat de klant je antwoord direct terugziet.
    </p>`

  const subject = data.ticketRef
    ? `${data.urgency === 'hoog' ? '[URGENT] ' : ''}Ticket ${data.ticketRef}: ${data.ticketSubject}`
    : `${data.urgency === 'hoog' ? '[URGENT] ' : ''}Nieuwe servicemelding: ${data.ticketSubject}`

  return {
    subject,
    html: baseLayout(content, data.partner),
  }
}

// ---- Installation connected (one-shot) ----
interface InstallationConnectedEmailData {
  customerName: string
  installationLabel: string     // e.g. "Zonnepanelen" or "Zonnepanelen — 8,4 kWp"
  dashboardUrl: string          // link to /klant/zonnepanelen or /klant
  partner?: { name: string; primary_color: string; logo_url?: string; support_email?: string }
}

export function buildInstallationConnectedEmail(data: InstallationConnectedEmailData) {
  const firstName = (data.customerName || '').split(' ')[0] || 'daar'
  const partnerName = data.partner?.name || 'je installateur'

  const content = `
    <h1>Je installatie is gekoppeld! 🎉</h1>
    <p>
      Hoi ${firstName}, ${partnerName} heeft zojuist je ${escapeHtml(data.installationLabel)} gekoppeld
      aan het monitoringplatform. Je ziet live gegevens zodra de eerste data binnenkomt (meestal binnen 24 uur).
    </p>

    <div class="highlight">
      <p class="highlight-label">Gekoppeld</p>
      <p class="highlight-value">${escapeHtml(data.installationLabel)}</p>
    </div>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.dashboardUrl}" class="btn">Bekijk mijn dashboard</a>
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af;">
      ${data.partner?.support_email ? `Vragen over de koppeling? Mail ${data.partner.support_email}` : ''}
    </p>`

  return {
    subject: `Je installatie bij ${partnerName} is live`,
    html: baseLayout(content, data.partner),
  }
}

// ---- Password changed confirmation ----
interface PasswordChangedEmailData {
  customerName: string
  changedAt: Date
  partner?: { name: string; primary_color: string; logo_url?: string; support_email?: string }
}

export function buildPasswordChangedEmail(data: PasswordChangedEmailData) {
  const firstName = (data.customerName || '').split(' ')[0] || 'daar'
  const partnerName = data.partner?.name || 'je installateur'
  const when = data.changedAt.toLocaleString('nl-NL', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const content = `
    <h1>Je wachtwoord is gewijzigd</h1>
    <p>Hoi ${firstName}, we willen je laten weten dat je wachtwoord zojuist is aangepast op je ${partnerName}-account.</p>

    <div class="highlight">
      <p class="highlight-label">Tijdstip</p>
      <p class="highlight-value">${when}</p>
    </div>

    <p style="margin-top:20px; font-size:14px; color:#b91c1c;">
      <strong>Herken je dit niet?</strong> Neem direct contact op met ${partnerName}${data.partner?.support_email ? ` via <a href="mailto:${data.partner.support_email}" style="color:#b91c1c;">${data.partner.support_email}</a>` : ''}
      om je account te beveiligen.
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af;">
      Dit is een automatische bevestiging om misbruik te voorkomen. Je hoeft niets te doen als je dit zelf hebt gedaan.
    </p>`

  return {
    subject: `Je wachtwoord bij ${partnerName} is gewijzigd`,
    html: baseLayout(content, data.partner),
  }
}

// ---- HTML escape helper ----
function escapeHtml(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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
    .replace(/\{\{voornaam\}\}/g, escapeHtml(firstName))
    .replace(/\{\{naam\}\}/g, escapeHtml(data.customerName))
    .replace(/\{\{email\}\}/g, escapeHtml(data.customerEmail || ''))
    .replace(/\{\{bedrijfsnaam\}\}/g, escapeHtml(partnerName))
    .replace(/\{\{module\}\}/g, escapeHtml(data.moduleName || ''))
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

// ---- Mandate confirmation + reminder series ----
//
// Drie momenten in één bouwer omdat ze 90% layout delen en alleen verschillen
// in toon: de bevestiging direct na akkoord, een vriendelijke herinnering na
// 3 dagen, en een laatste waarschuwing na 10 dagen ("geen incasso = geen
// service"). De mandaat-CTA wijst altijd naar /welkom/incasso.

interface MandateMailData {
  kind: 'confirm' | 'day3' | 'day10'
  customerName: string
  acceptedModuleLabels: string[]   // bv. ['Zonnepanelen', 'Warmtepomp'] — gebruikt als korte recap
  totalMonthlyEuros?: string | null // bv. "47,50" — optioneel, alleen ter info
  incassoUrl: string               // deep link naar https://<slug>.upsol.nl/welkom/incasso
  partner?: { name: string; primary_color: string; logo_url?: string; support_email?: string }
}

export function buildMandateMail(data: MandateMailData) {
  const firstName = (data.customerName || '').split(' ')[0] || 'daar'
  const partnerName = data.partner?.name || 'je installateur'
  const modulesLine = data.acceptedModuleLabels.length
    ? data.acceptedModuleLabels.join(' + ')
    : 'je servicecontract'

  let h1: string
  let intro: string
  let body: string
  let ctaLabel: string
  let subject: string
  let postscript: string

  if (data.kind === 'confirm') {
    h1 = 'Bedankt voor je akkoord!'
    intro = `Hoi ${firstName}, fijn dat je hebt gekozen voor ${partnerName}. Je servicecontract is bevestigd.`
    body = `
      <p>Eén stap te gaan: zet de automatische incasso aan. Dat is een korte stap waarin we
      via je IBAN het maandelijkse servicebedrag${data.totalMonthlyEuros ? ` van € ${escapeHtml(data.totalMonthlyEuros)}` : ''}
      veilig kunnen afschrijven.</p>`
    ctaLabel = 'Incasso instellen'
    subject = `Akkoord bevestigd — regel nog je incasso bij ${partnerName}`
    postscript = `Eenmaal afgegeven hoef je hier niets meer aan te doen. Bedankt!`
  } else if (data.kind === 'day3') {
    h1 = 'Vergeet je incasso niet'
    intro = `Hoi ${firstName}, klein duwtje: je incasso voor ${partnerName} is nog niet afgegeven.`
    body = `
      <p>Zonder automatische incasso kunnen we je servicecontract voor ${escapeHtml(modulesLine)}
      nog niet volledig activeren. Het duurt ongeveer een halve minuut:
      je IBAN en de tenaamstelling — dat is alles.</p>`
    ctaLabel = 'Nu incasso instellen'
    subject = `Reminder: zet je incasso bij ${partnerName} aan`
    postscript = `Heb je dit per ongeluk al gedaan? Negeer deze mail dan.`
  } else {
    // day10
    h1 = 'Laatste herinnering — incasso nog niet afgegeven'
    intro = `Hoi ${firstName}, je servicecontract bij ${partnerName} loopt al ruim een week, maar er is nog steeds geen incasso ingesteld.`
    body = `
      <p><strong>Let op:</strong> zonder een actieve automatische incasso kunnen wij geen
      service leveren op ${escapeHtml(modulesLine)}. Geef nu je IBAN af zodat we je
      installatie kunnen blijven monitoren en je bij storingen direct kunnen helpen.</p>
      <p>Heb je vragen of komt het ergens niet uit? Reageer op deze mail of neem contact op
      met ${partnerName}.</p>`
    ctaLabel = 'Incasso direct instellen'
    subject = `Laatste herinnering: incasso bij ${partnerName} nog niet aan`
    postscript = `Dit is onze laatste automatische herinnering. Reageer alsjeblieft binnen een paar dagen.`
  }

  const summary = data.acceptedModuleLabels.length
    ? `
      <div class="highlight">
        <p class="highlight-label">Servicecontract</p>
        <p class="highlight-value">${escapeHtml(modulesLine)}</p>
        ${data.totalMonthlyEuros ? `<p style="margin:4px 0 0; font-size:13px; color:#6b7280;">€ ${escapeHtml(data.totalMonthlyEuros)} per maand</p>` : ''}
      </div>`
    : ''

  const content = `
    <h1>${h1}</h1>
    <p>${intro}</p>
    ${summary}
    ${body}
    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.incassoUrl}" class="btn">${ctaLabel}</a>
    </p>
    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af;">
      ${postscript}${data.partner?.support_email ? ` Vragen? Mail <a href="mailto:${data.partner.support_email}" style="color:${data.partner?.primary_color || '#2563eb'}">${data.partner.support_email}</a>.` : ''}
    </p>`

  return {
    subject,
    html: baseLayout(content, data.partner),
  }
}
