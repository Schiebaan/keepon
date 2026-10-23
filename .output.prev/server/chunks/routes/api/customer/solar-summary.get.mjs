import { d as defineEventHandler, g as getServiceRoleClient, e as getQuery } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { s as sundataSession, p as parseSundataError, S as SUNDATA_BASE_URL } from '../../../_/sundata.mjs';
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

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function pickBucket(days) {
  return days > 62 ? "month" : "day";
}
function computeChartRange(period, today, monitoredSince, customStart, customEnd) {
  const todayStr = fmtDate(today);
  if (period === "week") {
    const s2 = new Date(today);
    s2.setDate(s2.getDate() - 6);
    return { start: fmtDate(s2), end: todayStr, bucket: "day" };
  }
  if (period === "year") {
    return { start: `${today.getFullYear()}-01-01`, end: todayStr, bucket: "month" };
  }
  if (period === "since_start" && monitoredSince) {
    const ms = new Date(monitoredSince);
    const days = Math.round((today.getTime() - ms.getTime()) / (24 * 60 * 60 * 1e3));
    return { start: monitoredSince.slice(0, 10), end: todayStr, bucket: pickBucket(days) };
  }
  if (period === "custom" && customStart && customEnd) {
    const s2 = new Date(customStart), e = new Date(customEnd);
    const days = Math.round((e.getTime() - s2.getTime()) / (24 * 60 * 60 * 1e3));
    return { start: customStart, end: customEnd, bucket: pickBucket(days) };
  }
  const s = new Date(today);
  s.setDate(s.getDate() - 29);
  return { start: fmtDate(s), end: todayStr, bucket: "day" };
}
const solarSummary_get = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const query = getQuery(event);
  const chartPeriod = query.chart_period || "month";
  const customStart = query.start_date;
  const customEnd = query.end_date;
  const { data: customer } = await supabase.from("customers").select("id, partner_id, full_name").eq("auth_user_id", user.id).single();
  if (!customer) {
    return { connected: false, reason: "no_customer_record" };
  }
  const { data: products } = await supabase.from("customer_products").select("id, name, brand, model, serial_number, notes, installation_date").eq("customer_id", customer.id).eq("category", "solar_panel").order("created_at", { ascending: false });
  const solar = (products || []).find((p) => (p.serial_number || "").startsWith("sundata:"));
  if (!solar) {
    return { connected: false, reason: "no_sundata_link" };
  }
  const [companyIdStr, plantIdStr, meterIdStr] = solar.serial_number.slice("sundata:".length).split("/");
  const companyId = Number(companyIdStr);
  const plantId = Number(plantIdStr);
  const meterId = Number(meterIdStr);
  if (!companyId || !plantId || !meterId) {
    return { connected: false, reason: "invalid_link", link: solar.serial_number };
  }
  let headers;
  try {
    const session = await sundataSession(event, customer.partner_id);
    headers = session.headers;
  } catch (err) {
    return { connected: false, reason: "sundata_auth_failed", error: parseSundataError(err) };
  }
  const [plant, meter] = await Promise.all([
    $fetch(`${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}`, { headers }).catch(() => null),
    $fetch(`${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/meters/${meterId}`, { headers }).catch(() => null)
  ]);
  const now = /* @__PURE__ */ new Date();
  const today = fmtDate(now);
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const yearStart = `${now.getFullYear()}-01-01`;
  const chartRange = computeChartRange(chartPeriod, now, plant == null ? void 0 : plant.monitored_since, customStart, customEnd);
  async function fetchYield(from, to, period, type) {
    try {
      const res = await $fetch(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/yield?start_date=${from}&end_date=${to}&period_type=${period}&yield_type=${type}`,
        { headers }
      );
      return (res == null ? void 0 : res.data) || [];
    } catch {
      return [];
    }
  }
  const [chartData, monthActual, yearActual, monthPredicted] = await Promise.all([
    fetchYield(chartRange.start, chartRange.end, chartRange.bucket, "actual-yield"),
    fetchYield(monthStart, today, "day", "actual-yield"),
    fetchYield(yearStart, today, "month", "actual-yield"),
    fetchYield(monthStart, today, "month", "predicted-yield")
  ]);
  const sum = (arr) => arr.reduce((s, d) => s + (d.yield_in_wh || 0), 0);
  const todayEntry = monthActual.find((d) => (d.time || "").startsWith(today));
  const hasAnyRecentData = monthActual.some((d) => (d.yield_in_wh || 0) > 0);
  return {
    connected: true,
    product: {
      id: solar.id,
      name: solar.name || `${solar.brand || ""} ${solar.model || ""}`.trim() || "Zonnepanelen",
      brand: solar.brand,
      model: solar.model,
      notes: solar.notes,
      installation_date: solar.installation_date
    },
    plant: plant && {
      id: plant.id,
      name: plant.name,
      plant_code: plant.plant_code,
      monitored_since: plant.monitored_since,
      address: plant.address ? {
        street: `${plant.address.street || ""} ${plant.address.street_number || ""}`.trim(),
        postal_code: plant.address.postal_code,
        city: plant.address.city
      } : null
    },
    meter: meter && {
      id: meter.id,
      peak_in_watt: meter.peak_in_watt,
      orientation_in_degrees: meter.orientation_in_degrees,
      angle_in_degrees: meter.angle_in_degrees,
      operational_since: meter.operational_since
    },
    yield: {
      today_wh: (todayEntry == null ? void 0 : todayEntry.yield_in_wh) || 0,
      today_reported: !!todayEntry,
      // true when Sundata has a row for today (even if 0 Wh)
      has_any_recent_data: hasAnyRecentData,
      month_wh: sum(monthActual),
      year_wh: sum(yearActual),
      month_predicted_wh: sum(monthPredicted),
      // Back-compat: keep history_daily as last 30 days
      history_daily: chartRange.bucket === "day" ? chartData.map((d) => ({ date: (d.time || "").slice(0, 10), wh: d.yield_in_wh || 0 })) : []
    },
    chart: {
      period: chartPeriod,
      start: chartRange.start,
      end: chartRange.end,
      bucket: chartRange.bucket,
      data: chartData.map((d) => ({ date: (d.time || "").slice(0, 10), wh: d.yield_in_wh || 0 }))
    }
  };
});

export { solarSummary_get as default };
//# sourceMappingURL=solar-summary.get.mjs.map
