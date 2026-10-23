import { d as defineEventHandler, g as getServiceRoleClient, c as createError, e as getQuery } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { m as memoryCache } from '../../../_/cache.mjs';
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

const EASEE_API = "https://api.easee.com/api";
const EASEE_TOKEN_URL = "https://auth.easee.com/realms/easee/protocol/openid-connect/token";
const chargerStateCache = memoryCache(60 * 1e3);
const chargerMonthlyCache = memoryCache(30 * 60 * 1e3);
const OP_MODE_LABELS = {
  0: { label: "Niet bereikbaar", hint: "Geen verbinding met internet of stroom.", tone: "error" },
  1: { label: "Wacht op auto", hint: "Sluit een auto aan om te beginnen met laden.", tone: "idle" },
  2: { label: "Auto aangesloten", hint: "Auto staat klaar, laden begint zo.", tone: "ready" },
  3: { label: "Aan het laden", hint: "Stroom gaat nu naar je auto.", tone: "charging" },
  4: { label: "Sessie klaar", hint: "Laden voltooid. Stekker kan eruit.", tone: "done" },
  5: { label: "Storing", hint: "Laadpaal kan niet laden. Neem contact op.", tone: "error" },
  6: { label: "Klaar om te laden", hint: "Klaar voor de volgende laadsessie.", tone: "ready" },
  7: { label: "Wacht op autorisatie", hint: "Houd je laadpas voor de paal of bevestig in de app.", tone: "ready" }
};
async function getEaseeToken(creds) {
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: "easee",
    username: (creds.username || creds.email || "").trim(),
    password: (creds.password || "").trim(),
    scope: "email offline_access"
  });
  const res = await $fetch(EASEE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  return res.access_token;
}
const laadpaalData_get = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, partner_id").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  const { data: product } = await supabase.from("customer_products").select("id, category, serial_number").eq("customer_id", customer.id).eq("category", "ev_charger").order("updated_at", { ascending: false }).limit(1).single();
  const s = (product == null ? void 0 : product.serial_number) || "";
  if (!s.startsWith("easee:")) {
    return { linked: false };
  }
  const chargerId = s.slice("easee:".length);
  const { data: creds } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", customer.partner_id).eq("integration_type", "easee").eq("is_active", true).single();
  if (!(creds == null ? void 0 : creds.credentials)) {
    return { linked: true, charger_id: chargerId, error: "Geen Easee-credentials voor deze partner" };
  }
  let token;
  try {
    token = await getEaseeToken(creds.credentials);
  } catch (e) {
    return { linked: true, charger_id: chargerId, error: "Inloggen bij Easee mislukt" };
  }
  const fromYear = /* @__PURE__ */ new Date();
  fromYear.setFullYear(fromYear.getFullYear() - 1);
  const from = fromYear.toISOString().slice(0, 19);
  const to = (/* @__PURE__ */ new Date()).toISOString().slice(0, 19);
  const fresh = getQuery(event).fresh === "1";
  if (fresh) {
    chargerStateCache.invalidate(chargerId);
    chargerMonthlyCache.invalidate(chargerId);
  }
  const headers = { Authorization: `Bearer ${token}` };
  const [stateRes, monthlyRes] = await Promise.allSettled([
    chargerStateCache.getOrLoad(
      chargerId,
      () => $fetch(`${EASEE_API}/chargers/${chargerId}/state`, { headers })
    ),
    chargerMonthlyCache.getOrLoad(
      chargerId,
      () => $fetch(`${EASEE_API}/sessions/charger/${chargerId}/monthly?from=${from}&to=${to}`, { headers })
    )
  ]);
  const state = stateRes.status === "fulfilled" ? stateRes.value : null;
  const monthly = monthlyRes.status === "fulfilled" ? monthlyRes.value || [] : [];
  const now = /* @__PURE__ */ new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;
  const current = monthly.find((m) => m.year === thisYear && m.month === thisMonth) || { totalEnergyUsage: 0, totalCost: 0};
  const monthlyHistory = monthly.map((m) => ({
    year: m.year,
    month: m.month,
    kwh: Math.round((m.totalEnergyUsage || 0) * 10) / 10,
    cost_eur: Math.round((m.totalCost || 0) * 100) / 100
  })).sort((a, b) => a.year - b.year || a.month - b.month);
  const opMode = state == null ? void 0 : state.chargerOpMode;
  const opModeInfo = typeof opMode === "number" ? OP_MODE_LABELS[opMode] : null;
  const currentPowerW = (state == null ? void 0 : state.totalPower) ? Math.round(state.totalPower) : 0;
  let displayLabel = (opModeInfo == null ? void 0 : opModeInfo.label) || "Onbekend";
  let displayHint = (opModeInfo == null ? void 0 : opModeInfo.hint) || null;
  let displayTone = (opModeInfo == null ? void 0 : opModeInfo.tone) || "idle";
  if (opMode === 3 && currentPowerW < 100) {
    if ((state == null ? void 0 : state.sessionEnergy) && state.sessionEnergy > 0) {
      displayLabel = "Sessie afgerond";
      displayHint = "Laden voltooid. Stekker kan eruit.";
      displayTone = "done";
    } else {
      displayLabel = "Aangesloten";
      displayHint = "Auto staat klaar, maar laadt nu niet.";
      displayTone = "ready";
    }
  }
  return {
    linked: true,
    charger_id: chargerId,
    online: !!(state == null ? void 0 : state.isOnline),
    op_mode: opMode != null ? opMode : null,
    op_mode_label: displayLabel,
    op_mode_hint: displayHint,
    op_mode_tone: displayTone,
    current_session_kwh: (state == null ? void 0 : state.sessionEnergy) ? Math.round(state.sessionEnergy * 100) / 100 : 0,
    current_power_w: currentPowerW,
    lifetime_kwh: (state == null ? void 0 : state.lifetimeEnergy) ? Math.round(state.lifetimeEnergy) : 0,
    voltage: (state == null ? void 0 : state.voltage) ? Math.round(state.voltage * 10) / 10 : 0,
    current_month: {
      kwh: Math.round((current.totalEnergyUsage || 0) * 10) / 10,
      cost_eur: Math.round((current.totalCost || 0) * 100) / 100
    },
    monthly_history: monthlyHistory
  };
});

export { laadpaalData_get as default };
//# sourceMappingURL=laadpaal-data.get.mjs.map
