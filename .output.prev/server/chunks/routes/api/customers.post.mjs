import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { r as requireRole } from '../../_/auth-guard.mjs';
import { a as auditLog } from '../../_/audit.mjs';
import { l as logIndividualInvitation } from '../../_/mailing-batch-log.mjs';
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

const customers_post = defineEventHandler(async (event) => {
  var _a, _b;
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const { email, full_name, phone, street, house_number, postal_code, city, modules } = body;
  const sendInvite = (body == null ? void 0 : body.send_invite) !== false;
  const serials = (body == null ? void 0 : body.serials) && typeof body.serials === "object" ? body.serials : {};
  const billing_interval = (body == null ? void 0 : body.billing_interval) === "yearly" ? "yearly" : "monthly";
  const yearly_discount_months = Math.max(0, Math.min(60, Number(body == null ? void 0 : body.yearly_discount_months) || 0));
  const trial_months = Math.max(0, Math.min(60, Number(body == null ? void 0 : body.trial_months) || 0));
  const moduleOverrides = Array.isArray(body == null ? void 0 : body.module_price_overrides) ? body.module_price_overrides : [];
  if (!email || !full_name) {
    throw createError({ statusCode: 400, message: "email and full_name are required" });
  }
  const modulesForValidation = Array.isArray(body == null ? void 0 : body.modules) ? body.modules : [];
  if (!modulesForValidation.length) {
    throw createError({
      statusCode: 400,
      message: "Kies ten minste \xE9\xE9n module (zonnepanelen, warmtepomp of laadpaal). Zonder module heeft de klant niks te activeren in het portaal."
    });
  }
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const tenant = event.context.tenant;
    if (tenant == null ? void 0 : tenant.id) partnerId = tenant.id;
    else {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const { data: existing } = await supabase.from("customers").select("id").eq("email", email).eq("partner_id", partnerId).single();
  if (existing) {
    throw createError({ statusCode: 409, message: "Een klant met dit e-mailadres bestaat al" });
  }
  const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true
  });
  if (authError) {
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingAuth = (_b = existingUsers == null ? void 0 : existingUsers.users) == null ? void 0 : _b.find((u) => u.email === email);
    if (!existingAuth) {
      throw createError({ statusCode: 500, message: `Auth error: ${authError.message}` });
    }
    var authUserId = existingAuth.id;
  } else {
    var authUserId = authUser.user.id;
  }
  const { data: customer, error: custError } = await supabase.from("customers").insert({
    auth_user_id: authUserId,
    partner_id: partnerId,
    email,
    full_name,
    phone: phone || null,
    street: street || null,
    house_number: house_number || null,
    postal_code: postal_code || null,
    city: city || null,
    billing_interval,
    yearly_discount_months,
    trial_months
  }).select().single();
  if (custError) throw createError({ statusCode: 500, message: custError.message });
  await supabase.from("user_roles").upsert({
    user_id: authUserId,
    partner_id: partnerId,
    role: "customer",
    customer_id: customer.id
  }, { onConflict: "user_id" });
  const MODULE_INFO = {
    solar: { category: "solar_panel", name: "Zonnepanelen", brand: null, model: null },
    heat_pump: { category: "heat_pump", name: "Warmtepomp", brand: "Weheat", model: "ATLAS" },
    ev_charger: { category: "ev_charger", name: "Laadpaal", brand: "Easee", model: "Home" },
    battery: { category: "battery", name: "Thuisbatterij", brand: null, model: null }
  };
  const selectedModules = Array.isArray(body.modules) ? body.modules : [];
  const productRows = selectedModules.filter((m) => MODULE_INFO[m]).map((m) => {
    const info = MODULE_INFO[m];
    const serial = typeof serials[m] === "string" ? serials[m].trim() : "";
    return {
      customer_id: customer.id,
      partner_id: partnerId,
      category: info.category,
      name: info.name,
      brand: info.brand,
      model: info.model,
      // Alleen het kale serienummer. Een gekoppeld apparaat krijgt later
      // 'weheat:<id>' via link-weheat; een waarde zonder dubbele punt telt
      // overal als "nog niet gekoppeld".
      serial_number: serial && !serial.includes(":") ? serial : null
    };
  });
  if (productRows.length) {
    const { error: insertErr } = await supabase.from("customer_products").insert(productRows);
    if (insertErr) console.error("[customers] product insert failed:", insertErr.message);
  }
  const TYPE_MAP = {
    solar: "solar_panel",
    heat_pump: "heat_pump",
    ev_charger: "ev_charger",
    battery: "battery"
  };
  const overrideRows = moduleOverrides.map((o) => {
    const mod_type = TYPE_MAP[o.module_type] || o.module_type;
    if (!selectedModules.some((sel) => TYPE_MAP[sel] === mod_type || sel === o.module_type)) return null;
    const price = Math.max(0, Math.floor(Number(o.price_monthly_cents) || 0));
    if (!price) return null;
    return {
      customer_id: customer.id,
      module_type: mod_type,
      price_monthly_cents: price,
      reason: typeof o.reason === "string" ? o.reason.trim().slice(0, 200) || null : null
    };
  }).filter(Boolean);
  if (overrideRows.length) {
    const { error: ovErr } = await supabase.from("customer_module_prices").insert(overrideRows);
    if (ovErr) console.error("[customers] price override insert failed:", ovErr.message);
  }
  await supabase.auth.admin.updateUserById(authUserId, {
    user_metadata: {
      onboarding: {
        step: "hero",
        accepted_at: null,
        mandate_at: null,
        mandate_skipped: false
      }
    }
  }).catch(() => {
  });
  await auditLog(event, "customer.created", "customer", customer.id, { email, full_name, partner_id: partnerId, modules: selectedModules });
  if (!sendInvite) {
    await supabase.from("customers").update({ invite_sent_at: null }).eq("id", customer.id);
    await auditLog(event, "customer.invite_prepared", "customer", customer.id, {
      email,
      partner_id: partnerId,
      customer_id: customer.id
    });
    return { ...customer, invite_sent_at: null };
  }
  try {
    const { sendEmail, buildWelcomeEmail, buildFromCustomTemplate, getPartnerTemplate } = await import('../../_/email.mjs');
    const { data: partnerData } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email, support_phone").eq("id", partnerId).single();
    const baseUrl = `https://${(partnerData == null ? void 0 : partnerData.slug) ? partnerData.slug + "." : ""}upsol.nl`;
    const { createWelcomeToken } = await import('../../_/welcome-token.mjs');
    const welcomeToken = createWelcomeToken(customer.id, 30);
    const magicLinkUrl = `${baseUrl}/api/welkom/start?token=${welcomeToken}`;
    const moduleLabels = {
      solar: "Zonnepanelen",
      heat_pump: "Warmtepomp",
      ev_charger: "Laadpaal",
      battery: "Thuisbatterij"
    };
    const modulesForEmail = Array.isArray(modules) ? modules : [];
    const moduleNames = modulesForEmail.map((m) => moduleLabels[m] || m).join(" & ") || "installatie";
    const customTemplate = await getPartnerTemplate(supabase, partnerId, "welkomstmail");
    let emailContent;
    if (customTemplate && customTemplate.enabled) {
      emailContent = buildFromCustomTemplate({
        subject: customTemplate.subject,
        heading: customTemplate.heading,
        body: customTemplate.body,
        buttonText: customTemplate.button_text,
        buttonUrl: magicLinkUrl,
        customerName: full_name,
        customerEmail: email,
        moduleName: moduleNames,
        partner: partnerData || void 0
      });
    } else {
      emailContent = buildWelcomeEmail({
        customerName: full_name,
        customerEmail: email,
        onboardingUrl: magicLinkUrl,
        moduleName: moduleNames,
        modules: modulesForEmail,
        partner: partnerData || void 0
      });
    }
    const mailRes = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      fromName: partnerData == null ? void 0 : partnerData.name
      // Geen replyTo — klant-replies worden niet in de partner-inbox verwacht.
      // De mail-CTA wijst rechtstreeks naar het portaal.
    });
    await auditLog(event, "email.welcome_sent", "customer", customer.id, {
      to: email,
      success: mailRes.success,
      subject: emailContent.subject
    });
    if (mailRes.success) {
      await supabase.from("customers").update({ invite_sent_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", customer.id);
      await logIndividualInvitation({
        supabase,
        partnerId,
        customerId: customer.id,
        customerLabel: full_name || email,
        actorUserId: user.id
      });
    }
  } catch (e) {
    console.error("[email] Failed to send welcome email:", e);
  }
  return customer;
});

export { customers_post as default };
//# sourceMappingURL=customers.post.mjs.map
