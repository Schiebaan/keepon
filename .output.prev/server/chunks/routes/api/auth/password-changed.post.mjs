import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { buildPasswordChangedEmail, sendEmail } from '../../../_/email.mjs';
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
import '../../../_/aanhef.mjs';
import 'resend';

const passwordChanged_post = defineEventHandler(async (event) => {
  var _a;
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const since = new Date(Date.now() - 60 * 1e3).toISOString();
  const { data: recent } = await supabase.from("audit_log").select("id").eq("action", "email.password_changed_sent").eq("entity_id", user.id).gte("created_at", since).limit(1);
  if (recent && recent.length > 0) {
    return { sent: false, reason: "deduped" };
  }
  const { data: customer } = await supabase.from("customers").select("full_name, email, partner_id").eq("auth_user_id", user.id).single();
  const email = (customer == null ? void 0 : customer.email) || user.email;
  const fullName = (customer == null ? void 0 : customer.full_name) || (user.email ? user.email.split("@")[0] : "gebruiker");
  if (!email) {
    return { sent: false, reason: "no_email" };
  }
  let partnerId = customer == null ? void 0 : customer.partner_id;
  const subdomeinPartner = (_a = event.context.tenant) == null ? void 0 : _a.id;
  if (subdomeinPartner) partnerId = subdomeinPartner;
  if (!partnerId) {
    const { data: role } = await supabase.from("user_roles").select("partner_id").eq("user_id", user.id).not("partner_id", "is", null).limit(1).single();
    partnerId = role == null ? void 0 : role.partner_id;
  }
  let partner = null;
  if (partnerId) {
    const { data } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("id", partnerId).single();
    partner = data;
  }
  try {
    const mail = buildPasswordChangedEmail({
      customerName: fullName,
      changedAt: /* @__PURE__ */ new Date(),
      partner: partner ? {
        name: partner.name,
        primary_color: partner.primary_color,
        logo_url: partner.logo_url,
        support_email: partner.support_email
      } : void 0
    });
    const result = await sendEmail({
      to: email,
      subject: mail.subject,
      html: mail.html
      // Geen replyTo — security-mail, geen reply verwacht.
    });
    await auditLog(event, "email.password_changed_sent", "auth_user", user.id, {
      to: email,
      success: result.success
    });
    return { sent: result.success };
  } catch (e) {
    console.error("[auth] Failed to send password-changed email:", (e == null ? void 0 : e.message) || e);
    return { sent: false, reason: "send_error" };
  }
});

export { passwordChanged_post as default };
//# sourceMappingURL=password-changed.post.mjs.map
