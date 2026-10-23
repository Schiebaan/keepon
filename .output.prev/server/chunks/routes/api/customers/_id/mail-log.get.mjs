import { d as defineEventHandler, g as getServiceRoleClient, h as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
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

const ACTION_LABELS = {
  "email.welcome_sent": "Welkomstmail (nieuwe klant)",
  "email.welcome_resent": "Welkomstmail opnieuw",
  "email.welcome_resent_public": "Welkomstmail opnieuw (via publieke link)",
  "email.installation_connected_sent": "Installatie gekoppeld",
  "email.ticket_reply_sent": "Reactie op ticket",
  "email.ticket_customer_reply_sent": "Klant heeft ticket beantwoord",
  "email.mandate_confirm_sent": "Incasso-bevestiging",
  "email.mandate_day3_sent": "Incasso-herinnering (dag 3)",
  "email.mandate_day10_sent": "Incasso-laatste-herinnering (dag 10)",
  "email.password_changed_sent": "Wachtwoord gewijzigd"
};
const mailLog_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const customerId = getRouterParam(event, "id");
  if (!customerId) throw createError({ statusCode: 400, message: "customer id ontbreekt" });
  const tenant = event.context.tenant;
  let partnerId = tenant == null ? void 0 : tenant.id;
  if (!partnerId) {
    const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
    partnerId = role == null ? void 0 : role.partner_id;
    if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const { data: customer } = await supabase.from("customers").select("id, email").eq("id", customerId).eq("partner_id", partnerId).single();
  if (!customer) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  const { data, error } = await supabase.from("audit_log").select("id, action, meta, created_at").eq("entity_type", "customer").eq("entity_id", customerId).ilike("action", "email.%").order("created_at", { ascending: false }).limit(200);
  if (error) throw createError({ statusCode: 500, message: error.message });
  return {
    customer_email: customer.email,
    events: (data || []).map((r) => {
      var _a, _b, _c;
      return {
        id: r.id,
        at: r.created_at,
        action: r.action,
        label: ACTION_LABELS[r.action] || r.action,
        to: ((_a = r.meta) == null ? void 0 : _a.to) || null,
        // Legacy audit-entries missen soms de success-vlag → dan tonen we 'success'
        // omdat er destijds alleen op succes ge-audit werd.
        success: ((_b = r.meta) == null ? void 0 : _b.success) !== false,
        subject: ((_c = r.meta) == null ? void 0 : _c.subject) || null
      };
    })
  };
});

export { mailLog_get as default };
//# sourceMappingURL=mail-log.get.mjs.map
