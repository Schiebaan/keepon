import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError, f as getRequestHeaders } from '../../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { s as sendMandateReminder } from '../../../../_/mandate-reminders.mjs';
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
import '../../../../_/email.mjs';
import '../../../../_/aanhef.mjs';
import 'resend';

const accept_post = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const body = await readBody(event).catch(() => ({}));
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name, email").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  const VALID_MODULES = /* @__PURE__ */ new Set(["solar", "heat_pump", "ev_charger", "battery"]);
  const accepted_modules = Array.isArray(body == null ? void 0 : body.accepted_modules) ? body.accepted_modules.filter((m) => VALID_MODULES.has(m)) : [];
  if (!accepted_modules.length) {
    throw createError({
      statusCode: 400,
      message: "Kies ten minste \xE9\xE9n onderdeel om te activeren."
    });
  }
  const billing_interval = (body == null ? void 0 : body.billing_interval) === "yearly" ? "yearly" : "monthly";
  const meta = user.user_metadata || {};
  const current = meta.onboarding || {};
  if (current.accepted_at) {
    return {
      ok: true,
      already_accepted: true,
      accepted_at: current.accepted_at,
      accepted_modules: current.accepted_modules || [],
      next: current.step === "done" ? "done" : "incasso"
    };
  }
  const acceptedAt = (/* @__PURE__ */ new Date()).toISOString();
  await Promise.all([
    supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...meta,
        onboarding: {
          ...current,
          step: "incasso",
          accepted_at: acceptedAt,
          accepted_modules: accepted_modules.length ? accepted_modules : null
        }
      }
    }),
    supabase.from("customers").update({
      onboarding_step: "incasso",
      accepted_at: acceptedAt,
      accepted_modules: accepted_modules.length ? accepted_modules : null,
      billing_interval
    }).eq("id", customer.id)
  ]);
  const headers = getRequestHeaders(event);
  const userAgent = headers["user-agent"] || null;
  const ip = (headers["x-forwarded-for"] || "").toString().split(",")[0].trim() || null;
  await auditLog(event, "onboarding.accepted", "customer", customer.id, {
    accepted_at: acceptedAt,
    accepted_modules,
    billing_interval,
    user_agent: userAgent,
    ip
  });
  if (accepted_modules.includes("solar")) {
    try {
      const { activatePlantsForCustomer } = await import('../../../../_/sundata-activate.mjs');
      const resultaten = await activatePlantsForCustomer(
        event,
        customer.partner_id,
        { id: customer.id, email: customer.email },
        acceptedAt.slice(0, 10)
      );
      if (resultaten.length) {
        await auditLog(event, "sundata.monitoring_activated", "customer", customer.id, {
          partner_id: customer.partner_id,
          customer_id: customer.id,
          plants: resultaten.map((r) => ({ plant: r.plantId, status: r.status, error: r.error }))
        });
        const mislukt = resultaten.filter((r) => r.status === "failed");
        if (mislukt.length) {
          console.error(
            "[accept] Sundata-activering mislukt voor",
            customer.email,
            mislukt.map((r) => `${r.plantId}: ${r.error}`).join(" | ")
          );
        }
      }
    } catch (e) {
      console.error("[accept] Sundata-activering overgeslagen:", e == null ? void 0 : e.message);
    }
  }
  sendMandateReminder(supabase, customer.id, "confirm").then(async (res) => {
    if (res.sent) {
      await auditLog(event, "email.mandate_confirm_sent", "customer", customer.id, {});
    } else if (res.reason === "send_failed") {
      console.error("[onboarding/accept] mandate confirm send failed:", res.error);
    }
  }).catch((e) => console.error("[onboarding/accept] mandate confirm unexpected:", (e == null ? void 0 : e.message) || e));
  return { ok: true, accepted_at: acceptedAt, accepted_modules, billing_interval, next: "incasso" };
});

export { accept_post as default };
//# sourceMappingURL=accept.post.mjs.map
