import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@supabase/functions-js';
import '@supabase/postgrest-js';
import '@supabase/realtime-js';
import '@supabase/storage-js';
import '@supabase/auth-js';

const users_post = defineEventHandler(async (event) => {
  var _a, _b;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const { email, partner_id } = body;
  if (!email) throw createError({ statusCode: 400, message: "E-mailadres is verplicht" });
  const fullName = typeof body.full_name === "string" ? body.full_name.trim().slice(0, 80) : "";
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = partner_id || (role == null ? void 0 : role.partner_id);
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && partner_id) {
    partnerId = partner_id;
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const tempPassword = "Welkom" + Math.random().toString(36).slice(2, 8) + "!";
  let authUserId;
  const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true
  });
  if (authError) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = (_b = existingUsers == null ? void 0 : existingUsers.users) == null ? void 0 : _b.find((u) => u.email === email);
    if (!existing) {
      throw createError({ statusCode: 500, message: `Fout: ${authError.message}` });
    }
    authUserId = existing.id;
    const { data: existingRole } = await supabase.from("user_roles").select("id").eq("user_id", authUserId).eq("partner_id", partnerId).eq("role", "partner_admin").single();
    if (existingRole) {
      throw createError({ statusCode: 409, message: "Deze gebruiker is al een beheerder van deze partner" });
    }
  } else {
    authUserId = newUser.user.id;
  }
  const { error: roleError } = await supabase.from("user_roles").upsert({
    user_id: authUserId,
    partner_id: partnerId,
    role: "partner_admin",
    full_name: fullName || null
  }, { onConflict: "user_id" });
  if (roleError) throw createError({ statusCode: 500, message: roleError.message });
  await auditLog(event, "partner_user.created", "user_role", authUserId, { email, partner_id: partnerId });
  const { data: partnerData } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("id", partnerId).single();
  if (partnerData) {
    const { sendEmail, buildFromCustomTemplate } = await import('../../../_/email.mjs');
    const loginUrl = `https://${partnerData.slug}.upsol.nl/login`;
    const { subject, html } = buildFromCustomTemplate({
      subject: `Je hebt toegang tot het ${partnerData.name} portaal`,
      heading: "Welkom als beheerder!",
      body: `Je hebt een account gekregen voor het ${partnerData.name} beheerportaal. Je ontvangt je tijdelijke wachtwoord in een aparte mail. Wijzig je wachtwoord na het eerste inloggen via Instellingen.`,
      buttonText: "Inloggen",
      buttonUrl: loginUrl,
      customerName: email.split("@")[0],
      customerEmail: email,
      partner: partnerData || void 0
    });
    await sendEmail({ to: email, subject, html }).catch(() => {
    });
    const { subject: pwSubject, html: pwHtml } = buildFromCustomTemplate({
      subject: `Je tijdelijke wachtwoord voor ${partnerData.name}`,
      heading: "Je tijdelijke wachtwoord",
      body: `Gebruik onderstaand wachtwoord om in te loggen. Wijzig het daarna via Instellingen \u2192 Wachtwoord wijzigen.

Wachtwoord: ${tempPassword}`,
      buttonText: "Inloggen",
      buttonUrl: loginUrl,
      customerName: email.split("@")[0],
      customerEmail: email,
      partner: partnerData || void 0
    });
    await sendEmail({ to: email, subject: pwSubject, html: pwHtml }).catch(() => {
    });
  }
  return {
    id: authUserId,
    email,
    temporary_password: tempPassword,
    message: `Gebruiker ${email} is aangemaakt als partner beheerder`
  };
});

export { users_post as default };
//# sourceMappingURL=users.post.mjs.map
