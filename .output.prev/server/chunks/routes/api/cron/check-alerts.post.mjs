import { d as defineEventHandler, b as getRequestHeader, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { w as weheatConnector } from '../../../_/weheat.mjs';
import { g as getEaseeSignal } from '../../../_/easee.mjs';
import { s as sundataSession, S as SUNDATA_BASE_URL } from '../../../_/sundata.mjs';
import { buildDeviceAlertDigestEmail, sendEmail } from '../../../_/email.mjs';
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
import '../../../_/connectors.mjs';
import '../../../_/weheat-config.mjs';
import '../../../_/aanhef.mjs';
import 'resend';

function easeeFault(signal) {
  if (!signal.stateAvailable || signal.state === null) return null;
  const mode = Number(signal.state);
  if (mode === 0) {
    return { kind: "unreachable", detail: "Laadpaal is niet bereikbaar \u2014 geen stroom of geen internet.", raw: signal.state };
  }
  if (mode === 5) {
    return { kind: "error", detail: "Laadpaal meldt een storing en kan niet laden.", raw: signal.state };
  }
  return null;
}
const WEHEAT_UREN_DREMPEL = 24;
function weheatFault(state, measuredAt) {
  if (!measuredAt) {
    return { kind: "unreachable", detail: "Warmtepomp geeft geen meetgegevens door.", raw: String(state) };
  }
  const uren = (Date.now() - new Date(measuredAt).getTime()) / 36e5;
  if (!Number.isFinite(uren)) return null;
  if (uren >= WEHEAT_UREN_DREMPEL) {
    const dagen = Math.floor(uren / 24);
    return {
      kind: "stale",
      detail: dagen >= 1 ? `Warmtepomp rapporteert al ${dagen} ${dagen === 1 ? "dag" : "dagen"} niets meer.` : `Warmtepomp rapporteert al ${Math.floor(uren)} uur niets meer.`,
      raw: `last_log:${measuredAt}`
    };
  }
  return null;
}
const ZONNE_DAGEN_DREMPEL = 3;
async function sundataFault(event, partnerId, link) {
  const [companyId, plantId] = link.slice("sundata:".length).split("/").map(Number);
  if (!companyId || !plantId) return null;
  const { headers } = await sundataSession(event, partnerId);
  const nu = /* @__PURE__ */ new Date();
  const eind = nu.toISOString().slice(0, 10);
  const start = new Date(nu.getTime() - 21 * 24 * 3600 * 1e3).toISOString().slice(0, 10);
  const res = await $fetch(
    `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/yield?start_date=${start}&end_date=${eind}&period_type=day&yield_type=actual-yield`,
    { headers }
  ).catch(() => null);
  const dagen = (res == null ? void 0 : res.data) || [];
  const metOpbrengst = dagen.filter((d) => (d.yield_in_wh || 0) > 0);
  if (!metOpbrengst.length) return null;
  const laatste = metOpbrengst[metOpbrengst.length - 1];
  const laatsteDatum = new Date(String(laatste.time).slice(0, 10));
  const dagenGeleden = Math.floor((nu.getTime() - laatsteDatum.getTime()) / 864e5);
  if (dagenGeleden >= ZONNE_DAGEN_DREMPEL) {
    return {
      kind: "stale",
      detail: `Geen opbrengst sinds ${String(laatste.time).slice(0, 10)} (${dagenGeleden} dagen).`,
      raw: `last_yield:${String(laatste.time).slice(0, 10)}`
    };
  }
  return null;
}

const checkAlerts_post = defineEventHandler(async (event) => {
  var _a, _b;
  const expected = process.env.CRON_SECRET;
  const got = getRequestHeader(event, "x-cron-secret") || "";
  if (!expected || got !== expected) {
    throw createError({ statusCode: 401, message: "Ongeldig cron-geheim" });
  }
  const supabase = getServiceRoleClient();
  const nu = (/* @__PURE__ */ new Date()).toISOString();
  const { data: producten } = await supabase.from("customer_products").select("id, customer_id, partner_id, category, name, integration_type, external_id, serial_number, customers(full_name, email)").or("integration_type.not.is.null,serial_number.like.%:%");
  const gekoppeld = (producten || []).filter((p) => p.integration_type || (p.serial_number || "").includes(":"));
  const credCache = /* @__PURE__ */ new Map();
  async function creds(partnerId, type) {
    const key = `${partnerId}:${type}`;
    if (credCache.has(key)) return credCache.get(key);
    const { data } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", partnerId).eq("integration_type", type).eq("is_active", true).maybeSingle();
    credCache.set(key, (data == null ? void 0 : data.credentials) || null);
    return (data == null ? void 0 : data.credentials) || null;
  }
  let gecontroleerd = 0;
  let nieuw = 0;
  let hersteld = 0;
  const perPartner = /* @__PURE__ */ new Map();
  const perKoppeling = /* @__PURE__ */ new Map();
  function tel(partnerId, type, gelukt, bericht = "") {
    const k = `${partnerId}|${type}`;
    const v = perKoppeling.get(k) || { ok: 0, fout: 0, laatsteFout: "" };
    if (gelukt) v.ok++;
    else {
      v.fout++;
      v.laatsteFout = bericht;
    }
    perKoppeling.set(k, v);
  }
  for (const p of gekoppeld) {
    const type = p.integration_type || (p.serial_number || "").split(":")[0];
    const extern = p.external_id || (p.serial_number || "").split(":").slice(1).join(":");
    if (!type || !extern) continue;
    let fout = null;
    try {
      const c = await creds(p.partner_id, type);
      if (!c) continue;
      if (type === "easee") {
        fout = easeeFault(await getEaseeSignal(c, extern));
      } else if (type === "weheat") {
        const s = await weheatConnector.getDeviceStatus(c, extern);
        fout = weheatFault(s.state, s.measured_at);
      } else if (type === "sundata") {
        fout = await sundataFault(event, p.partner_id, p.serial_number || "");
      } else {
        continue;
      }
      gecontroleerd++;
      tel(p.partner_id, type, true);
    } catch (e) {
      tel(p.partner_id, type, false, (e == null ? void 0 : e.message) || "onbekende fout");
      console.error(`[check-alerts] ${type}/${extern} niet op te halen:`, e == null ? void 0 : e.message);
      continue;
    }
    const { data: open } = await supabase.from("device_alerts").select("id, kind, notified_at").eq("customer_product_id", p.id).is("resolved_at", null).maybeSingle();
    if (fout) {
      if (open) {
        await supabase.from("device_alerts").update({ last_seen_at: nu, kind: fout.kind, detail: fout.detail, raw_state: fout.raw }).eq("id", open.id);
      } else {
        const { data: rij } = await supabase.from("device_alerts").insert({
          partner_id: p.partner_id,
          customer_id: p.customer_id,
          customer_product_id: p.id,
          kind: fout.kind,
          detail: fout.detail,
          raw_state: fout.raw,
          first_seen_at: nu,
          last_seen_at: nu
        }).select("id").single();
        nieuw++;
        const lijst = perPartner.get(p.partner_id) || [];
        lijst.push({
          alertId: rij == null ? void 0 : rij.id,
          customerName: ((_a = p.customers) == null ? void 0 : _a.full_name) || ((_b = p.customers) == null ? void 0 : _b.email) || "Klant",
          productName: p.name || p.category,
          detail: fout.detail,
          kind: fout.kind
        });
        perPartner.set(p.partner_id, lijst);
      }
    } else if (open) {
      await supabase.from("device_alerts").update({ resolved_at: nu }).eq("id", open.id);
      hersteld++;
    }
  }
  for (const [sleutel, v] of perKoppeling) {
    const [partnerId, type] = sleutel.split("|");
    const stuk = v.ok === 0 && v.fout > 0;
    const { data: open } = await supabase.from("device_alerts").select("id").eq("partner_id", partnerId).eq("integration_type", type).is("customer_product_id", null).is("resolved_at", null).maybeSingle();
    if (stuk) {
      const geblokkeerd = /blokkeert deze toegang/.test(v.laatsteFout);
      const detail = geblokkeerd ? `${v.laatsteFout} Dit treft ${v.fout} gekoppelde ${v.fout === 1 ? "installatie" : "installaties"}.` : `De koppeling met ${type} werkt niet meer: geen van de ${v.fout} gekoppelde installaties is uit te lezen. Ga naar Instellingen \u2192 Monitoring integraties om opnieuw te verbinden. (${v.laatsteFout})`;
      if (open) {
        await supabase.from("device_alerts").update({ last_seen_at: nu, detail }).eq("id", open.id);
      } else {
        const { data: rij } = await supabase.from("device_alerts").insert({
          partner_id: partnerId,
          integration_type: type,
          kind: "integration_down",
          detail,
          raw_state: v.laatsteFout.slice(0, 200),
          first_seen_at: nu,
          last_seen_at: nu
        }).select("id").single();
        nieuw++;
        const lijst = perPartner.get(partnerId) || [];
        lijst.push({
          alertId: rij == null ? void 0 : rij.id,
          customerName: "Koppeling",
          productName: type,
          detail,
          kind: "integration_down"
        });
        perPartner.set(partnerId, lijst);
      }
    } else if (open) {
      await supabase.from("device_alerts").update({ resolved_at: nu }).eq("id", open.id);
      hersteld++;
    }
  }
  let mails = 0;
  for (const [partnerId, items] of perPartner) {
    try {
      const { data: partner } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("id", partnerId).single();
      if (!(partner == null ? void 0 : partner.support_email)) continue;
      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
      const mail = buildDeviceAlertDigestEmail({
        alerts: items,
        dashboardUrl: `https://${partner.slug || "www"}.${baseDomain}/admin`,
        partner: { name: partner.name, primary_color: partner.primary_color, logo_url: partner.logo_url }
      });
      await sendEmail({ to: partner.support_email, subject: mail.subject, html: mail.html });
      await supabase.from("device_alerts").update({ notified_at: nu }).in("id", items.map((i) => i.alertId).filter(Boolean));
      mails++;
    } catch (e) {
      console.error("[check-alerts] digest mislukt voor partner", partnerId, e == null ? void 0 : e.message);
    }
  }
  return { checked: gecontroleerd, new_alerts: nieuw, resolved: hersteld, digests_sent: mails };
});

export { checkAlerts_post as default };
//# sourceMappingURL=check-alerts.post.mjs.map
