import { g as getServiceRoleClient, d as defineEventHandler, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { r as resolvePartnerId } from '../../../_/partner-scope.mjs';
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

const SYNC_INTERVAL_MS = 6e4;
const LOOKBACK_MS = 14 * 24 * 60 * 60 * 1e3;
const MAX_PAGES = 10;
let lastSync = 0;
let inFlight = null;
function syncResendStatus(event) {
  if (inFlight) return inFlight;
  if (Date.now() - lastSync < SYNC_INTERVAL_MS) return Promise.resolve();
  inFlight = doSync().catch((e) => console.error("[resend-status] sync mislukt:", e == null ? void 0 : e.message)).finally(() => {
    lastSync = Date.now();
    inFlight = null;
  });
  return inFlight;
}
async function doSync(event) {
  var _a;
  const key = process.env.RESEND_API_KEY;
  if (!key) return;
  const supabase = getServiceRoleClient();
  const cutoff = Date.now() - LOOKBACK_MS;
  let after = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const url = "https://api.resend.com/emails?limit=100" + (after ? `&after=${after}` : "");
    const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    if (!res.ok) throw new Error(`Resend ${res.status}`);
    const json = await res.json();
    const mails = json.data || [];
    const rows = mails.filter((m) => Array.isArray(m.to) && m.to[0]).map((m) => ({
      resend_id: m.id,
      to_email: String(m.to[0]).toLowerCase(),
      subject: m.subject || null,
      last_event: m.last_event || null,
      sent_at: new Date(m.created_at.replace(" ", "T").replace(/\+00$/, "Z")).toISOString(),
      synced_at: (/* @__PURE__ */ new Date()).toISOString()
    }));
    if (rows.length) {
      const { error } = await supabase.from("email_status").upsert(rows, { onConflict: "resend_id" });
      if (error) throw new Error(error.message);
    }
    const oldest = (_a = rows.at(-1)) == null ? void 0 : _a.sent_at;
    if (!json.has_more || !mails.length || oldest && new Date(oldest).getTime() < cutoff) break;
    after = mails.at(-1).id;
  }
}

const emailStatus_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  if (!partnerId) return {};
  await syncResendStatus();
  const { data: klanten, error: kErr } = await supabase.from("customers").select("email").eq("partner_id", partnerId).not("email", "is", null);
  if (kErr) throw createError({ statusCode: 500, message: kErr.message });
  const adressen = [...new Set((klanten || []).map((k) => String(k.email).toLowerCase()))];
  const result = {};
  for (let i = 0; i < adressen.length; i += 150) {
    const stuk = adressen.slice(i, i + 150);
    const { data, error } = await supabase.from("email_status").select("to_email, last_event, sent_at, subject").in("to_email", stuk).order("sent_at", { ascending: false });
    if (error) throw createError({ statusCode: 500, message: error.message });
    for (const r of data || []) {
      if (!result[r.to_email]) result[r.to_email] = { last_event: r.last_event, sent_at: r.sent_at, subject: r.subject };
    }
  }
  return result;
});

export { emailStatus_get as default };
//# sourceMappingURL=email-status.get.mjs.map
