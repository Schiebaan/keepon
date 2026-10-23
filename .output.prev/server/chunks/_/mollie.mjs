import { c as createError } from '../nitro/nitro.mjs';
import { createMollieClient } from '@mollie/api-client';
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

let _client = null;
function getMollie() {
  if (!_client) {
    const key = process.env.MOLLIE_API_KEY;
    if (!key) {
      throw createError({ statusCode: 500, message: "MOLLIE_API_KEY ontbreekt op de server." });
    }
    _client = createMollieClient({ apiKey: key });
  }
  return _client;
}
function isMollieTestMode() {
  return (process.env.MOLLIE_API_KEY || "").startsWith("test_");
}
function formatMollieAmount(cents) {
  return (cents / 100).toFixed(2);
}
let _ddCache = null;
const DD_CACHE_MS = 15 * 60 * 1e3;
async function isDirectDebitEnabled() {
  if (_ddCache && Date.now() - _ddCache.at < DD_CACHE_MS) return _ddCache.value;
  let enabled = false;
  try {
    const res = await fetch("https://api.mollie.com/v2/methods/directdebit", {
      headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` }
    });
    enabled = res.ok;
  } catch (e) {
    console.error("[mollie] directdebit-check mislukt:", e == null ? void 0 : e.message);
    return true;
  }
  _ddCache = { value: enabled, at: Date.now() };
  return enabled;
}
const REDACTED_DETAIL_FIELDS = /* @__PURE__ */ new Set([
  // SEPA direct debit
  "consumerAccount",
  "consumerName",
  "consumerBic",
  // Creditcard (toekomstige uitbreiding — Mollie levert hier de naam op kaart)
  "cardHolder",
  // PayPal (e-mail van de betaler — verlate koppeling met onze customers.email)
  "billingEmail"
]);
function redactMollieResponse(payment) {
  if (!payment || typeof payment !== "object") return payment;
  let cloned;
  try {
    cloned = JSON.parse(JSON.stringify(payment));
  } catch {
    return {};
  }
  const details = cloned.details;
  if (details && typeof details === "object") {
    for (const k of Object.keys(details)) {
      if (REDACTED_DETAIL_FIELDS.has(k)) delete details[k];
    }
  }
  return cloned;
}

export { formatMollieAmount, getMollie, isDirectDebitEnabled, isMollieTestMode, redactMollieResponse };
//# sourceMappingURL=mollie.mjs.map
