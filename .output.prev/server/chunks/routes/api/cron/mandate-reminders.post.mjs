import { d as defineEventHandler, b as getRequestHeader, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { s as sendMandateReminder } from '../../../_/mandate-reminders.mjs';
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
import '../../../_/email.mjs';
import '../../../_/aanhef.mjs';
import 'resend';

const mandateReminders_post = defineEventHandler(async (event) => {
  const expected = process.env.CRON_SECRET;
  const got = getRequestHeader(event, "x-cron-secret") || "";
  if (!expected || got !== expected) {
    throw createError({ statusCode: 401, message: "Niet geautoriseerd" });
  }
  const supabase = getServiceRoleClient();
  const { data: candidates, error } = await supabase.from("customers").select("id, accepted_at, mollie_mandate_id, mandate_at, mandate_reminders_sent, email").not("accepted_at", "is", null).is("mollie_mandate_id", null).not("email", "is", null);
  if (error) {
    return { ok: false, error: error.message };
  }
  const now = Date.now();
  const stats = { checked: 0, day3_sent: 0, day10_sent: 0, skipped: 0, failed: 0 };
  const { isDirectDebitEnabled } = await import('../../../_/mollie.mjs');
  if (!await isDirectDebitEnabled()) {
    return { skipped: true, reason: "Direct Debit nog niet actief bij Mollie", sent: 0 };
  }
  for (const c of candidates || []) {
    stats.checked += 1;
    const acceptedAt = c.accepted_at ? new Date(c.accepted_at).getTime() : null;
    if (!acceptedAt) {
      stats.skipped += 1;
      continue;
    }
    const daysSince = Math.floor((now - acceptedAt) / 864e5);
    let kind = null;
    if (daysSince >= 10) kind = "day10";
    else if (daysSince >= 3) kind = "day3";
    if (!kind) {
      stats.skipped += 1;
      continue;
    }
    const res = await sendMandateReminder(supabase, c.id, kind);
    if (res.sent) {
      if (kind === "day3") stats.day3_sent += 1;
      else stats.day10_sent += 1;
      await auditLog(event, `email.mandate_${kind}_sent`, "customer", c.id, {});
    } else if (res.reason === "send_failed") {
      stats.failed += 1;
      console.error("[cron/mandate-reminders] send_failed for", c.id, res.error);
    } else {
      stats.skipped += 1;
    }
  }
  return { ok: true, stats };
});

export { mandateReminders_post as default };
//# sourceMappingURL=mandate-reminders.post.mjs.map
