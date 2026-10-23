import { g as groet, a as aanspreeknaam } from './aanhef.mjs';
import { Resend } from 'resend';

function normaliseer(s) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function personalSenderName(authorName, partnerName) {
  const author = (authorName || "").trim();
  if (!author) return null;
  const a = normaliseer(author);
  const p = normaliseer(partnerName || "");
  if (!a) return null;
  if (!p) return author;
  if (a === p || a.includes(p) || p.includes(a)) return null;
  const generiek = ["info", "support", "service", "admin", "contact", "helpdesk", "noreply", "team"];
  if (generiek.includes(a)) return null;
  return author;
}
function senderLabel(authorName, partnerName) {
  const partner = (partnerName || "").trim() || "je installateur";
  const person = personalSenderName(authorName, partnerName);
  return person ? `${person} van ${partner}` : partner;
}

let resendClient = null;
function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) {
    resendClient = new Resend(key);
  }
  return resendClient;
}
const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || "UPsol <onboarding@resend.dev>";
function getFromAddress() {
  const f = process.env.RESEND_FROM_EMAIL || "noreply@upsol.nl";
  const m = f.match(/<([^>]+)>/);
  return m ? m[1] : f;
}
async function sendEmail(options) {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not configured, skipping email to:", options.to);
    return { success: false, reason: "no_api_key" };
  }
  const from = options.from || (options.fromName ? `${sanitizeFromName(options.fromName)} <${getFromAddress()}>` : DEFAULT_FROM);
  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo
  });
  if (error) {
    console.error("[email] Failed to send:", error);
    return { success: false, reason: error.message };
  }
  console.log("[email] Sent to:", options.to, "id:", data == null ? void 0 : data.id);
  return { success: true, id: data == null ? void 0 : data.id };
}
function sanitizeFromName(name) {
  return (name || "").replace(/["<>]/g, "").trim() || "UPsol";
}
function baseLayout(content, partner) {
  const brandColor = (partner == null ? void 0 : partner.primary_color) || "#2563eb";
  const brandName = (partner == null ? void 0 : partner.name) || "UPsol";
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
        ${(partner == null ? void 0 : partner.logo_url) ? `<img src="https://${(partner == null ? void 0 : partner.slug) ? partner.slug + "." : ""}upsol.nl/api/partners/${(partner == null ? void 0 : partner.slug) || "default"}/logo" alt="${brandName}" style="height:40px;">` : `<span class="logo-text">${brandName}</span>`}
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} ${brandName}. Alle rechten voorbehouden.</p>
    </div>
  </div>
</body>
</html>`;
}
const MODULE_INVITE_LINE = {
  solar: "Direct inzicht in je opbrengst en een seintje bij storingen.",
  heat_pump: "We houden je warmtepomp in de gaten, zonder koude verrassingen.",
  ev_charger: "Overzicht van je laadsessies en kosten op \xE9\xE9n plek.",
  battery: "Inzicht in je laad- en ontlaadcycli en de gezondheid van je batterij."
};
const MODULE_LOWER = {
  solar: "zonnepanelen",
  heat_pump: "warmtepomp",
  ev_charger: "laadpaal",
  battery: "thuisbatterij"
};
function joinModulesNl(modules) {
  const parts = (modules || []).map((m) => MODULE_LOWER[m]).filter(Boolean);
  if (parts.length === 0) return "installatie";
  if (parts.length === 1) return parts[0];
  return parts.slice(0, -1).join(", ") + " en " + parts[parts.length - 1];
}
function buildWelcomeEmail(data) {
  var _a, _b, _c, _d, _e, _f, _g;
  (data.customerName || "").split(" ")[0] || "daar";
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "je installateur";
  const moduleBullets = (data.modules || []).map((m) => MODULE_INVITE_LINE[m]).filter(Boolean).map((line) => `<li style="padding:6px 0; font-size:14px; color:#374151;">${line}</li>`).join("");
  const bulletsBlock = moduleBullets ? `<ul style="list-style:none; padding:0; margin:16px 0 24px;">${moduleBullets}</ul>` : "";
  const content = `
    <h1>${escapeHtml(groet(data.customerName))},</h1>
    <p>
      ${partnerName} heeft een service-voorstel voor je klaargezet voor je
      ${data.moduleName ? data.moduleName.toLowerCase() : "installatie"}.
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
      Vragen? ${((_b = data.partner) == null ? void 0 : _b.support_phone) ? `Bel ${partnerName} op <a href="tel:${data.partner.support_phone}" style="color:${((_c = data.partner) == null ? void 0 : _c.primary_color) || "#2563eb"}">${data.partner.support_phone}</a>` : ""}${((_d = data.partner) == null ? void 0 : _d.support_phone) && ((_e = data.partner) == null ? void 0 : _e.support_email) ? " of " : ""}${((_f = data.partner) == null ? void 0 : _f.support_email) ? `mail <a href="mailto:${data.partner.support_email}" style="color:${((_g = data.partner) == null ? void 0 : _g.primary_color) || "#2563eb"}">${data.partner.support_email}</a>` : ""}.
      <br/>
      Niet verwacht? Negeer deze mail. Er gebeurt niets zonder jouw akkoord.
    </p>`;
  const subject = data.modules && data.modules.length > 0 ? `${partnerName}: zet de service voor je ${joinModulesNl(data.modules)} aan` : `${partnerName}: zet je service eenvoudig aan`;
  return {
    subject,
    html: baseLayout(content, data.partner)
  };
}
function buildPasswordResetEmail(data) {
  data.customerName.split(" ")[0];
  const content = `
    <h1>Wachtwoord herstellen</h1>
    <p>
      ${escapeHtml(groet(data.customerName, "Hallo"))}, we hebben een verzoek ontvangen om je wachtwoord te wijzigen.
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
    </p>`;
  return {
    subject: "Wachtwoord herstellen",
    html: baseLayout(content, data.partner)
  };
}
function buildActivationConfirmEmail(data) {
  var _a, _b, _c;
  data.customerName.split(" ")[0];
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "UPsol";
  const content = `
    <h1>Je account is actief!</h1>
    <p>
      ${escapeHtml(groet(data.customerName, "Hallo"))}, je account bij ${partnerName} is succesvol geactiveerd.
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
      ${((_b = data.partner) == null ? void 0 : _b.support_email) ? `Hulp nodig? Neem contact op via <a href="mailto:${data.partner.support_email}" style="color:${((_c = data.partner) == null ? void 0 : _c.primary_color) || "#2563eb"}">${data.partner.support_email}</a>` : ""}
    </p>`;
  return {
    subject: `Je account bij ${partnerName} is actief`,
    html: baseLayout(content, data.partner)
  };
}
function buildTicketReplyEmail(data) {
  var _a;
  (data.customerName || "").split(" ")[0] || "daar";
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "je installateur";
  const senderLabel$1 = senderLabel(data.authorName, partnerName);
  const excerpt = (data.replyExcerpt || "").trim().slice(0, 240);
  const refLine = data.ticketRef ? `<p class="highlight-label">Onderwerp \xB7 Ticket ${escapeHtml(data.ticketRef)}</p>` : `<p class="highlight-label">Onderwerp</p>`;
  const content = `
    <h1>${escapeHtml(senderLabel$1)} heeft gereageerd</h1>
    <p>${escapeHtml(groet(data.customerName))}, er is een nieuwe reactie op je servicemelding.</p>

    <div class="highlight">
      ${refLine}
      <p class="highlight-value">${escapeHtml(data.ticketSubject)}</p>
    </div>

    <p style="margin-bottom:24px;">
      <em style="color:#6b7280;">"${escapeHtml(excerpt)}${excerpt.length >= 240 ? "\u2026" : ""}"</em>
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
    </p>`;
  const subject = data.ticketRef ? `${senderLabel$1} heeft gereageerd op ticket ${data.ticketRef}: ${data.ticketSubject}` : `${senderLabel$1} heeft gereageerd op je melding`;
  return {
    subject,
    html: baseLayout(content, data.partner)
  };
}
function buildTicketResolvedEmail(data) {
  var _a;
  (data.customerName || "").split(" ")[0] || "daar";
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "je installateur";
  const senderLabel$1 = senderLabel(data.authorName, partnerName);
  const excerpt = (data.lastReply || "").trim().slice(0, 240);
  const refLine = data.ticketRef ? `<p class="highlight-label">Onderwerp \xB7 Ticket ${escapeHtml(data.ticketRef)}</p>` : `<p class="highlight-label">Onderwerp</p>`;
  const content = `
    <h1>Je melding is afgehandeld</h1>
    <p>${escapeHtml(groet(data.customerName))}, ${escapeHtml(senderLabel$1)} heeft je servicemelding afgerond.</p>

    <div class="highlight">
      ${refLine}
      <p class="highlight-value">${escapeHtml(data.ticketSubject)}</p>
    </div>

    ${excerpt ? `<p style="margin-bottom:24px;">
      <em style="color:#6b7280;">"${escapeHtml(excerpt)}${excerpt.length >= 240 ? "\u2026" : ""}"</em>
    </p>` : ""}

    <p><strong>Is het probleem er nog?</strong> Reageer dan gewoon op je melding
    in het portaal \u2014 hij gaat dan vanzelf weer open en komt bij
    ${escapeHtml(partnerName)} terug op de lijst. Je hoeft geen nieuwe melding
    aan te maken.</p>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.ticketUrl}" class="btn">Bekijk je melding</a>
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af; line-height:1.55;">
      Antwoorden op deze mail komen niet bij je melding terecht. Gebruik het
      portaal, dan ziet ${escapeHtml(partnerName)} meteen de hele geschiedenis.
    </p>`;
  const subject = data.ticketRef ? `Melding ${data.ticketRef} afgehandeld: ${data.ticketSubject}` : `Je melding is afgehandeld: ${data.ticketSubject}`;
  return { subject, html: baseLayout(content, data.partner) };
}
const ALERT_LABELS = {
  error: "Storing",
  unreachable: "Niet bereikbaar",
  stale: "Geen data",
  integration_down: "Koppeling stuk"
};
function buildDeviceAlertDigestEmail(data) {
  var _a;
  const n = data.alerts.length;
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "je installaties";
  const rijen = data.alerts.map((a) => `
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
    </tr>`).join("");
  const content = `
    <h1>${n} nieuwe ${n === 1 ? "storing" : "storingen"}</h1>
    <p>We hebben bij ${escapeHtml(partnerName)} ${n === 1 ? "een installatie" : n + " installaties"} gevonden die aandacht ${n === 1 ? "vraagt" : "vragen"}.</p>

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
    </p>`;
  return {
    subject: n === 1 ? `1 nieuwe storing gedetecteerd` : `${n} nieuwe storingen gedetecteerd`,
    html: baseLayout(content, data.partner)
  };
}
function buildNewTicketInstallerEmail(data) {
  var _a;
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "UPsol";
  const urgencyBadge = data.urgency === "hoog" ? '<span style="display:inline-block; padding:2px 8px; border-radius:10px; background:#fef2f2; color:#b91c1c; font-size:11px; font-weight:600; margin-left:6px;">URGENT</span>' : "";
  const description = data.ticketDescription ? `<div class="highlight"><p class="highlight-label">Toelichting</p><p style="margin:0; font-size:14px; white-space:pre-line; color:#374151;">${escapeHtml(data.ticketDescription)}</p></div>` : "";
  const content = `
    <h1>Nieuwe servicemelding ${urgencyBadge}</h1>
    <p>${escapeHtml(data.customerName)} heeft zojuist een melding ingediend in het klantportaal.</p>

    <div class="highlight">
      <p class="highlight-label">Van</p>
      <p class="highlight-value">${escapeHtml(data.customerName)} \xB7 ${escapeHtml(data.customerEmail)}</p>
    </div>
    <div class="highlight">
      <p class="highlight-label">Onderwerp${data.moduleLabel ? ` \xB7 ${escapeHtml(data.moduleLabel)}` : ""}</p>
      <p class="highlight-value">${escapeHtml(data.ticketSubject)}</p>
    </div>
    ${description}

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.ticketUrl}" class="btn">Open ticket</a>
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af;">
      Deze melding staat klaar in ${partnerName} \u2192 Service. Reageer vanuit het portaal zodat de klant je antwoord direct terugziet.
    </p>`;
  const subject = data.ticketRef ? `${data.urgency === "hoog" ? "[URGENT] " : ""}Ticket ${data.ticketRef}: ${data.ticketSubject}` : `${data.urgency === "hoog" ? "[URGENT] " : ""}Nieuwe servicemelding: ${data.ticketSubject}`;
  return {
    subject,
    html: baseLayout(content, data.partner)
  };
}
function buildInstallationConnectedEmail(data) {
  var _a, _b;
  (data.customerName || "").split(" ")[0] || "daar";
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "je installateur";
  const content = `
    <h1>Je installatie is gekoppeld! \u{1F389}</h1>
    <p>
      ${escapeHtml(groet(data.customerName))}, ${partnerName} heeft zojuist je ${escapeHtml(data.installationLabel)} gekoppeld
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
      ${((_b = data.partner) == null ? void 0 : _b.support_email) ? `Vragen over de koppeling? Mail ${data.partner.support_email}` : ""}
    </p>`;
  return {
    subject: `Je installatie bij ${partnerName} is live`,
    html: baseLayout(content, data.partner)
  };
}
function buildPasswordChangedEmail(data) {
  var _a, _b;
  (data.customerName || "").split(" ")[0] || "daar";
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "je installateur";
  const when = data.changedAt.toLocaleString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
  const content = `
    <h1>Je wachtwoord is gewijzigd</h1>
    <p>${escapeHtml(groet(data.customerName))}, we willen je laten weten dat je wachtwoord zojuist is aangepast op je ${partnerName}-account.</p>

    <div class="highlight">
      <p class="highlight-label">Tijdstip</p>
      <p class="highlight-value">${when}</p>
    </div>

    <p style="margin-top:20px; font-size:14px; color:#b91c1c;">
      <strong>Herken je dit niet?</strong> Neem direct contact op met ${partnerName}${((_b = data.partner) == null ? void 0 : _b.support_email) ? ` via <a href="mailto:${data.partner.support_email}" style="color:#b91c1c;">${data.partner.support_email}</a>` : ""}
      om je account te beveiligen.
    </p>

    <hr class="divider">
    <p style="font-size:13px; color:#9ca3af;">
      Dit is een automatische bevestiging om misbruik te voorkomen. Je hoeft niets te doen als je dit zelf hebt gedaan.
    </p>`;
  return {
    subject: `Je wachtwoord bij ${partnerName} is gewijzigd`,
    html: baseLayout(content, data.partner)
  };
}
function escapeHtml(s) {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function moduleTypeLabel(type) {
  const labels = {
    solar: "Zonnepanelen monitoring",
    heat_pump: "Warmtepomp monitoring",
    ev_charger: "Laadpaal monitoring"
  };
  return labels[type] || type;
}
function replacePlaceholders(text, data) {
  var _a;
  data.customerName.split(" ")[0];
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "UPsol";
  return text.replace(/\{\{voornaam\}\}/g, escapeHtml(aanspreeknaam(data.customerName) || "daar")).replace(/\{\{naam\}\}/g, escapeHtml(data.customerName)).replace(/\{\{email\}\}/g, escapeHtml(data.customerEmail || "")).replace(/\{\{bedrijfsnaam\}\}/g, escapeHtml(partnerName)).replace(/\{\{module\}\}/g, escapeHtml(data.moduleName || ""));
}
function buildFromCustomTemplate(data) {
  var _a, _b;
  const heading = replacePlaceholders(data.heading, data);
  const body = replacePlaceholders(data.body, data);
  const buttonText = replacePlaceholders(data.buttonText, data);
  const subject = replacePlaceholders(data.subject, data);
  const supportHtml = ((_a = data.partner) == null ? void 0 : _a.support_email) ? `<p style="font-size:13px; color:#9ca3af;">Vragen? Mail naar <a href="mailto:${data.partner.support_email}" style="color:${((_b = data.partner) == null ? void 0 : _b.primary_color) || "#2563eb"}">${data.partner.support_email}</a></p>` : "";
  const content = `
    <h1>${heading}</h1>
    <p>${body}</p>

    <p style="text-align:center; margin: 28px 0;">
      <a href="${data.buttonUrl}" class="btn">${buttonText}</a>
    </p>

    <hr class="divider">
    ${supportHtml}`;
  return {
    subject,
    html: baseLayout(content, data.partner)
  };
}
async function getPartnerTemplate(supabase, partnerId, templateType) {
  const { data } = await supabase.from("email_templates").select("subject, heading, body, button_text, enabled").eq("partner_id", partnerId).eq("type", templateType).single();
  return data || null;
}
function buildMandateMail(data) {
  var _a, _b, _c;
  (data.customerName || "").split(" ")[0] || "daar";
  const partnerName = ((_a = data.partner) == null ? void 0 : _a.name) || "je installateur";
  const modulesLine = data.acceptedModuleLabels.length ? data.acceptedModuleLabels.join(" + ") : "je servicecontract";
  let h1;
  let intro;
  let body;
  let ctaLabel;
  let subject;
  let postscript;
  if (data.kind === "confirm") {
    h1 = "Bedankt voor je akkoord!";
    intro = `${escapeHtml(groet(data.customerName))}, fijn dat je hebt gekozen voor ${partnerName}. Je servicecontract is bevestigd.`;
    body = `
      <p>E\xE9n stap te gaan: zet de automatische incasso aan. Dat is een korte stap waarin we
      via je IBAN het maandelijkse servicebedrag${data.totalMonthlyEuros ? ` van \u20AC ${escapeHtml(data.totalMonthlyEuros)}` : ""}
      veilig kunnen afschrijven.</p>`;
    ctaLabel = "Incasso instellen";
    subject = `Akkoord bevestigd \u2014 regel nog je incasso bij ${partnerName}`;
    postscript = `Eenmaal afgegeven hoef je hier niets meer aan te doen. Bedankt!`;
  } else if (data.kind === "day3") {
    h1 = "Vergeet je incasso niet";
    intro = `${escapeHtml(groet(data.customerName))}, klein duwtje: je incasso voor ${partnerName} is nog niet afgegeven.`;
    body = `
      <p>Zonder automatische incasso kunnen we je servicecontract voor ${escapeHtml(modulesLine)}
      nog niet volledig activeren. Het duurt ongeveer een halve minuut:
      je IBAN en de tenaamstelling \u2014 dat is alles.</p>`;
    ctaLabel = "Nu incasso instellen";
    subject = `Reminder: zet je incasso bij ${partnerName} aan`;
    postscript = `Heb je dit per ongeluk al gedaan? Negeer deze mail dan.`;
  } else {
    h1 = "Laatste herinnering \u2014 incasso nog niet afgegeven";
    intro = `${escapeHtml(groet(data.customerName))}, je servicecontract bij ${partnerName} loopt al ruim een week, maar er is nog steeds geen incasso ingesteld.`;
    body = `
      <p><strong>Let op:</strong> zonder een actieve automatische incasso kunnen wij geen
      service leveren op ${escapeHtml(modulesLine)}. Geef nu je IBAN af zodat we je
      installatie kunnen blijven monitoren en je bij storingen direct kunnen helpen.</p>
      <p>Heb je vragen of komt het ergens niet uit? Reageer op deze mail of neem contact op
      met ${partnerName}.</p>`;
    ctaLabel = "Incasso direct instellen";
    subject = `Laatste herinnering: incasso bij ${partnerName} nog niet aan`;
    postscript = `Dit is onze laatste automatische herinnering. Reageer alsjeblieft binnen een paar dagen.`;
  }
  const summary = data.acceptedModuleLabels.length ? `
      <div class="highlight">
        <p class="highlight-label">Servicecontract</p>
        <p class="highlight-value">${escapeHtml(modulesLine)}</p>
        ${data.totalMonthlyEuros ? `<p style="margin:4px 0 0; font-size:13px; color:#6b7280;">\u20AC ${escapeHtml(data.totalMonthlyEuros)} per maand</p>` : ""}
      </div>` : "";
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
      ${postscript}${((_b = data.partner) == null ? void 0 : _b.support_email) ? ` Vragen? Mail <a href="mailto:${data.partner.support_email}" style="color:${((_c = data.partner) == null ? void 0 : _c.primary_color) || "#2563eb"}">${data.partner.support_email}</a>.` : ""}
    </p>`;
  return {
    subject,
    html: baseLayout(content, data.partner)
  };
}

export { buildActivationConfirmEmail, buildDeviceAlertDigestEmail, buildFromCustomTemplate, buildInstallationConnectedEmail, buildMandateMail, buildNewTicketInstallerEmail, buildPasswordChangedEmail, buildPasswordResetEmail, buildTicketReplyEmail, buildTicketResolvedEmail, buildWelcomeEmail, getPartnerTemplate, moduleTypeLabel, sendEmail };
//# sourceMappingURL=email.mjs.map
