import { d as defineEventHandler, g as getServiceRoleClient, c as createError, e as getQuery } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { g as getWeheatAccessToken } from '../../../_/weheat.mjs';
import { m as memoryCache } from '../../../_/cache.mjs';
import { W as WEHEAT_API_URL } from '../../../_/weheat-config.mjs';
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

const API_URL = WEHEAT_API_URL;
const heatpumpMetaCache = memoryCache(5 * 60 * 1e3);
const heatpumpLogCache = memoryCache(60 * 1e3);
const heatpumpTotalCache = memoryCache(2 * 60 * 1e3);
function deriveState(log) {
  if (!log || log.isOnline === false) {
    return { key: "offline", label: "Niet bereikbaar", hint: "Geen verbinding met internet of stroom.", tone: "error" };
  }
  const rpm = Number(log.rpm) || 0;
  const powerOut = Number(log.cmMassPowerOut) || 0;
  if (rpm > 50 || powerOut > 0) {
    return { key: "heating", label: "Aan het verwarmen", hint: "Stroom wordt nu omgezet in warmte.", tone: "heating" };
  }
  return { key: "standby", label: "Stand-by", hint: "Online en klaar voor warmtevraag.", tone: "standby" };
}
const warmtepompData_get = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e;
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, partner_id").eq("auth_user_id", user.id).single();
  if (!customer) throw createError({ statusCode: 404, message: "Geen klantaccount" });
  const { data: product } = await supabase.from("customer_products").select("id, category, serial_number, brand, model, name").eq("customer_id", customer.id).eq("category", "heat_pump").order("updated_at", { ascending: false }).limit(1).single();
  const s = (product == null ? void 0 : product.serial_number) || "";
  if (!s.startsWith("weheat:")) {
    return { linked: false };
  }
  const heatpumpId = s.slice("weheat:".length);
  const { data: creds } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", customer.partner_id).eq("integration_type", "weheat").eq("is_active", true).single();
  if (!((_a = creds == null ? void 0 : creds.credentials) == null ? void 0 : _a.refresh_token)) {
    return { linked: true, heatpump_id: heatpumpId, error: "Weheat is nog niet verbonden voor deze partner." };
  }
  let token;
  try {
    token = await getWeheatAccessToken(creds.credentials, event, customer.partner_id);
  } catch {
    return { linked: true, heatpump_id: heatpumpId, error: "Inloggen bij Weheat mislukt. Verbind opnieuw via Settings." };
  }
  const headers = { Authorization: `Bearer ${token}` };
  const fresh = getQuery(event).fresh === "1";
  async function fetchMeta() {
    return await $fetch(`${API_URL}/heat-pumps/${heatpumpId}`, { headers });
  }
  async function fetchLog() {
    return await $fetch(`${API_URL}/heat-pumps/${heatpumpId}/logs/latest`, { headers });
  }
  async function fetchTotal() {
    return await $fetch(`${API_URL}/energy-logs/${heatpumpId}/total`, { headers });
  }
  if (fresh) {
    heatpumpMetaCache.invalidate(heatpumpId);
    heatpumpLogCache.invalidate(heatpumpId);
    heatpumpTotalCache.invalidate(heatpumpId);
  }
  const [metaRes, logRes, totalRes] = await Promise.allSettled([
    heatpumpMetaCache.getOrLoad(heatpumpId, fetchMeta),
    heatpumpLogCache.getOrLoad(heatpumpId, fetchLog),
    heatpumpTotalCache.getOrLoad(heatpumpId, fetchTotal)
  ]);
  if (metaRes.status === "rejected" && logRes.status === "rejected" && totalRes.status === "rejected") {
    console.error("[warmtepomp-data] geen enkele Weheat-aanroep gelukt:", ((_c = (_b = logRes.reason) == null ? void 0 : _b.data) == null ? void 0 : _c.message) || ((_d = logRes.reason) == null ? void 0 : _d.message));
    return {
      linked: true,
      heatpump_id: heatpumpId,
      error: "De meetgegevens van je warmtepomp zijn tijdelijk niet beschikbaar. Je installateur is hiervan op de hoogte."
    };
  }
  const meta = metaRes.status === "fulfilled" ? metaRes.value : null;
  const log = logRes.status === "fulfilled" ? logRes.value : null;
  const total = totalRes.status === "fulfilled" ? totalRes.value : null;
  const state = deriveState(log);
  const eIn = total ? (total.totalEInHeating || 0) + (total.totalEInStandby || 0) + (total.totalEInDhw || 0) + (total.totalEInHeatingDefrost || 0) + (total.totalEInDhwDefrost || 0) + (total.totalEInCooling || 0) : 0;
  const eOut = total ? (total.totalEOutHeating || 0) + (total.totalEOutDhw || 0) + (total.totalEOutHeatingDefrost || 0) + (total.totalEOutDhwDefrost || 0) + (total.totalEOutCooling || 0) : 0;
  const scop = eIn > 0 ? Math.round(eOut / eIn * 10) / 10 : 0;
  const r1 = (v) => v == null ? null : Math.round(Number(v) * 10) / 10;
  const r0 = (v) => v == null ? null : Math.round(Number(v));
  let weekKwhIn = 0, weekKwhOut = 0, monthKwhIn = 0, monthKwhOut = 0;
  let hasWeekData = false, hasMonthData = false;
  if (total) {
    try {
      const { data: lastSnap } = await supabase.from("weheat_snapshots").select("taken_at").eq("heatpump_id", heatpumpId).order("taken_at", { ascending: false }).limit(1).maybeSingle();
      const lastAge = lastSnap ? Date.now() - new Date(lastSnap.taken_at).getTime() : Infinity;
      if (lastAge > 12 * 60 * 60 * 1e3) {
        await supabase.from("weheat_snapshots").insert({
          partner_id: customer.partner_id,
          heatpump_id: heatpumpId,
          e_in_total: eIn,
          e_out_total: eOut,
          e_in_heating: total.totalEInHeating || 0,
          e_in_standby: total.totalEInStandby || 0,
          e_in_dhw: total.totalEInDhw || 0,
          e_in_defrost: (total.totalEInHeatingDefrost || 0) + (total.totalEInDhwDefrost || 0),
          e_in_cooling: total.totalEInCooling || 0,
          e_out_heating: total.totalEOutHeating || 0,
          e_out_dhw: total.totalEOutDhw || 0,
          e_out_defrost: (total.totalEOutHeatingDefrost || 0) + (total.totalEOutDhwDefrost || 0),
          e_out_cooling: total.totalEOutCooling || 0
        });
      }
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1e3).toISOString();
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1e3).toISOString();
      const { data: weekRef } = await supabase.from("weheat_snapshots").select("e_in_total, e_out_total, taken_at").eq("heatpump_id", heatpumpId).lte("taken_at", weekAgo).order("taken_at", { ascending: false }).limit(1).maybeSingle();
      if (weekRef) {
        weekKwhIn = eIn - Number(weekRef.e_in_total || 0);
        weekKwhOut = eOut - Number(weekRef.e_out_total || 0);
        hasWeekData = weekKwhIn >= 0 && weekKwhOut >= 0;
      }
      const { data: monthRef } = await supabase.from("weheat_snapshots").select("e_in_total, e_out_total, taken_at").eq("heatpump_id", heatpumpId).lte("taken_at", monthAgo).order("taken_at", { ascending: false }).limit(1).maybeSingle();
      if (monthRef) {
        monthKwhIn = eIn - Number(monthRef.e_in_total || 0);
        monthKwhOut = eOut - Number(monthRef.e_out_total || 0);
        hasMonthData = monthKwhIn >= 0 && monthKwhOut >= 0;
      }
    } catch {
    }
  }
  let daysActive = null;
  if (meta == null ? void 0 : meta.commissionedAt) {
    const ms = Date.now() - new Date(meta.commissionedAt).getTime();
    daysActive = Math.max(1, Math.floor(ms / (1e3 * 60 * 60 * 24)));
  }
  const avgKwhOutPerDay = daysActive && eOut > 0 ? Math.round(eOut / daysActive * 10) / 10 : null;
  const avgKwhInPerDay = daysActive && eIn > 0 ? Math.round(eIn / daysActive * 10) / 10 : null;
  const GAS_PRICE_PER_M3 = 1.45;
  const ELEC_PRICE_PER_KWH = 0.3;
  const M3_PER_KWH_HEAT_GAS = 0.108;
  const gasM3Avoided = eOut > 0 ? Math.round(eOut * M3_PER_KWH_HEAT_GAS) : 0;
  const gasCostAvoided = Math.round(gasM3Avoided * GAS_PRICE_PER_M3);
  const electricityCost = Math.round(eIn * ELEC_PRICE_PER_KWH);
  const netSavings = Math.max(0, gasCostAvoided - electricityCost);
  return {
    linked: true,
    heatpump_id: heatpumpId,
    serial_number: (meta == null ? void 0 : meta.serialNumber) || null,
    model: (meta == null ? void 0 : meta.model) || null,
    part_number: (meta == null ? void 0 : meta.partNumber) || null,
    commissioned_at: (meta == null ? void 0 : meta.commissionedAt) || null,
    // State
    state: state.key,
    state_label: state.label,
    state_hint: state.hint,
    state_tone: state.tone,
    online: (log == null ? void 0 : log.isOnline) !== false,
    last_update: (log == null ? void 0 : log.timestamp) || null,
    // Live snapshot
    rpm: r0(log == null ? void 0 : log.rpm),
    air_in_c: r1(log == null ? void 0 : log.tAirIn),
    water_out_c: r1(log == null ? void 0 : log.tWaterOut),
    // aanvoer (naar huis)
    water_return_c: r1(log == null ? void 0 : log.tWaterIn),
    // retour (terug uit huis)
    water_house_in_c: r1(log == null ? void 0 : log.tWaterHouseIn),
    room_c: r1(log == null ? void 0 : log.tRoom),
    room_target_c: r1(log == null ? void 0 : log.tRoomTarget),
    compressor_in_c: r1(log == null ? void 0 : log.tCompressorIn),
    compressor_out_c: r1(log == null ? void 0 : log.tCompressorOut),
    signal_strength: (_e = log == null ? void 0 : log.signalStrength) != null ? _e : null,
    // Lifetime totals
    lifetime_kwh_in: Math.round(eIn * 10) / 10,
    lifetime_kwh_out: Math.round(eOut * 10) / 10,
    scop,
    // How long has the heat pump been working?
    days_active: daysActive,
    avg_kwh_out_per_day: avgKwhOutPerDay,
    avg_kwh_in_per_day: avgKwhInPerDay,
    // Period totals (from our own snapshots — empty arrays until we have history)
    week: hasWeekData ? {
      kwh_in: Math.round(weekKwhIn * 10) / 10,
      kwh_out: Math.round(weekKwhOut * 10) / 10
    } : null,
    month: hasMonthData ? {
      kwh_in: Math.round(monthKwhIn * 10) / 10,
      kwh_out: Math.round(monthKwhOut * 10) / 10
    } : null,
    // Cost / gas comparison
    savings: {
      gas_m3_avoided: gasM3Avoided,
      gas_cost_avoided_eur: gasCostAvoided,
      electricity_cost_eur: electricityCost,
      net_savings_eur: netSavings
    },
    // Breakdown of where the lifetime energy went (kWh in by category)
    breakdown_in: total ? {
      heating: Math.round((total.totalEInHeating || 0) * 10) / 10,
      standby: Math.round((total.totalEInStandby || 0) * 10) / 10,
      dhw: Math.round((total.totalEInDhw || 0) * 10) / 10,
      defrost: Math.round(((total.totalEInHeatingDefrost || 0) + (total.totalEInDhwDefrost || 0)) * 10) / 10,
      cooling: Math.round((total.totalEInCooling || 0) * 10) / 10
    } : null
  };
});

export { warmtepompData_get as default };
//# sourceMappingURL=warmtepomp-data.get.mjs.map
