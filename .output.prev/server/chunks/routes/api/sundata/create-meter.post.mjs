import { d as defineEventHandler, r as readBody, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { r as resolveSundataPartnerId, s as sundataSession, S as SUNDATA_BASE_URL, p as parseSundataError } from '../../../_/sundata.mjs';
import { buildInstallationConnectedEmail, sendEmail } from '../../../_/email.mjs';
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
import '../../../_/aanhef.mjs';
import 'resend';

const ORIENTATION_DEGREES = {
  "north": 0,
  "north-east": 45,
  "east": 90,
  "south-east": 135,
  "south": 180,
  "south-west": 225,
  "west": 270,
  "north-west": 315
};
const createMeter_post = defineEventHandler(async (event) => {
  var _a;
  const { user } = await requireRole(event, "partner_admin");
  const body = await readBody(event);
  const {
    customer_id,
    plant_id,
    driver_id,
    // Sundata driver_name, e.g. "solaredge"
    composition_alias,
    // e.g. "solaredge_default"
    driver_credentials,
    // { siteId: "...", apiKey: "..." }
    capacity_kwp,
    orientation,
    tilt
  } = body;
  if (!plant_id || !driver_id || !composition_alias || !driver_credentials) {
    throw createError2({
      statusCode: 400,
      message: "plant_id, driver_id, composition_alias en driver_credentials zijn verplicht"
    });
  }
  const partnerId = await resolveSundataPartnerId(event, user.id);
  const { headers, companyId } = await sundataSession(event, partnerId);
  const driverAccounts = await $fetch(`${SUNDATA_BASE_URL}/companies/${companyId}/driver-accounts`, { headers });
  const driverAccount = driverAccounts.find((d) => d.driver_name === driver_id);
  if (!driverAccount) {
    throw createError2({ statusCode: 400, message: `Merk "${driver_id}" is niet actief in jullie Sundata account` });
  }
  const peak_in_watt = capacity_kwp ? Math.round(capacity_kwp * 1e3) : void 0;
  const orientation_deg = orientation ? (_a = ORIENTATION_DEGREES[orientation]) != null ? _a : void 0 : void 0;
  const angle_deg = tilt ? parseFloat(String(tilt)) : void 0;
  const meterBody = {
    driver_name: driver_id,
    driver_account_name: driverAccount.name,
    credential_composition_alias: composition_alias,
    credential_fields: driver_credentials,
    peak_in_watt,
    orientation_in_degrees: orientation_deg,
    angle_in_degrees: angle_deg
  };
  async function ensurePanelGroup(meterId) {
    if (!peak_in_watt && orientation_deg === void 0 && angle_deg === void 0) return;
    try {
      const meterDetail = await $fetch(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plant_id}/meters/${meterId}`,
        { headers }
      );
      if (((meterDetail == null ? void 0 : meterDetail.panel_groups) || []).length > 0) return;
      await $fetch(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plant_id}/meters/${meterId}/panel-groups`,
        {
          method: "POST",
          headers,
          body: {
            panel_groups: [{
              peak_in_watt,
              azimuth_in_degrees: orientation_deg,
              tilt_in_degrees: angle_deg
            }]
          }
        }
      );
    } catch {
    }
  }
  const checkExistingMeter = async () => {
    try {
      const existing = await $fetch(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plant_id}/meters`,
        { headers }
      );
      const list = Array.isArray(existing) ? existing : (existing == null ? void 0 : existing.data) || [];
      return list.find((m) => m.driver_account_id === driverAccount.id && !m.retired_on) || null;
    } catch {
      return null;
    }
  };
  const existingBeforeCreate = await checkExistingMeter();
  if (existingBeforeCreate) {
    await ensurePanelGroup(existingBeforeCreate.id);
    return {
      success: true,
      reused: true,
      plant_id,
      meter_id: existingBeforeCreate.id,
      company_id: companyId,
      device_id: `${companyId}:${plant_id}`,
      status: "pending"
    };
  }
  let meter = null;
  let createError2 = null;
  try {
    meter = await $fetch(
      `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plant_id}/meters`,
      { method: "POST", headers, body: meterBody }
    );
  } catch (err) {
    createError2 = err;
  }
  if (!meter) {
    const afterFailure = await checkExistingMeter();
    if (afterFailure) {
      meter = afterFailure;
    }
  }
  if (!meter) {
    return {
      success: false,
      step: "meter",
      plant_id,
      company_id: companyId,
      error: parseSundataError(createError2, "Meter koppelen mislukt")
    };
  }
  await ensurePanelGroup(meter.id);
  let isFirstLink = false;
  if (customer_id) {
    try {
      const supabase = getServiceRoleClient(event);
      const { data: solarProducts } = await supabase.from("customer_products").select("id, serial_number, integration_type").eq("customer_id", customer_id).eq("category", "solar_panel").order("created_at", { ascending: false }).limit(1);
      const solar = solarProducts == null ? void 0 : solarProducts[0];
      if (solar) {
        const externalId = `${companyId}/${plant_id}/${meter.id}`;
        const linkId = `sundata:${externalId}`;
        isFirstLink = !solar.integration_type && !(solar.serial_number || "").startsWith("sundata:");
        if (solar.serial_number !== linkId || solar.integration_type !== "sundata") {
          await supabase.from("customer_products").update({
            integration_type: "sundata",
            external_id: externalId,
            linked_at: (/* @__PURE__ */ new Date()).toISOString(),
            serial_number: linkId
            // legacy field, kept for backwards compat
          }).eq("id", solar.id);
        }
      }
    } catch {
    }
    await auditLog(event, "sundata.meter_created", "customer", customer_id, {
      plant_id,
      meter_id: meter.id,
      driver_id,
      composition_alias,
      company_id: companyId,
      recovered_from_500: !!createError2,
      first_link: isFirstLink
    });
    if (isFirstLink) {
      try {
        const supabase = getServiceRoleClient(event);
        const { data: customer } = await supabase.from("customers").select("email, full_name, partner_id").eq("id", customer_id).single();
        if (customer == null ? void 0 : customer.email) {
          const { data: partner } = await supabase.from("partners").select("name, slug, primary_color, logo_url, support_email").eq("id", customer.partner_id).single();
          const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || "upsol.nl";
          const dashboardUrl = `https://${(partner == null ? void 0 : partner.slug) || "www"}.${baseDomain}/klant/zonnepanelen`;
          const label = capacity_kwp ? `Zonnepanelen \u2014 ${Number(capacity_kwp).toFixed(1).replace(".", ",")} kWp` : "Zonnepanelen";
          const email = buildInstallationConnectedEmail({
            customerName: customer.full_name || customer.email,
            installationLabel: label,
            dashboardUrl,
            partner: partner ? {
              name: partner.name,
              primary_color: partner.primary_color,
              logo_url: partner.logo_url,
              support_email: partner.support_email
            } : void 0
          });
          await sendEmail({
            to: customer.email,
            subject: email.subject,
            html: email.html
            // Geen replyTo — replies horen niet in de partner-inbox.
          });
          await auditLog(event, "email.installation_connected_sent", "customer", customer_id, {
            to: customer.email,
            module: "solar"
          });
        }
      } catch (e) {
        console.error("[sundata] Failed to send installation-connected email:", (e == null ? void 0 : e.message) || e);
      }
    }
  }
  return {
    success: true,
    plant_id,
    meter_id: meter.id,
    company_id: companyId,
    device_id: `${companyId}:${plant_id}`,
    status: "pending",
    recovered_from_500: !!createError2
  };
});

export { createMeter_post as default };
//# sourceMappingURL=create-meter.post.mjs.map
