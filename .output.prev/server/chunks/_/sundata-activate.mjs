import { s as sundataSession, S as SUNDATA_BASE_URL } from './sundata.mjs';
import { g as getServiceRoleClient } from '../nitro/nitro.mjs';
import './connectors.mjs';
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

async function activateSundataPlant(event, partnerId, plantId, akkoordDatum, companyId = 7) {
  var _a, _b, _c, _d, _e;
  try {
    const { headers } = await sundataSession(event, partnerId);
    const base = `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}`;
    const plant = await $fetch(`${base}?with=address,tags`, { headers });
    if (plant == null ? void 0 : plant.monitored_since) {
      return { plantId, status: "already_active", monitoredSince: plant.monitored_since };
    }
    const a = plant.address || {};
    await $fetch(base, {
      method: "PUT",
      headers,
      body: {
        name: plant.name,
        amount_in_cents_per_kwh: plant.amount_in_cents_per_kwh,
        tag_ids: (plant.tags || []).map((t) => t.id),
        address: {
          id: a.id,
          street: a.street,
          street_number: a.street_number,
          city: a.city,
          postal_code: a.postal_code,
          latitude: a.latitude,
          longitude: a.longitude
        },
        monitored_since: akkoordDatum
      }
    });
    const na = await $fetch(`${base}?with=address,tags`, { headers });
    if (!(na == null ? void 0 : na.monitored_since)) {
      return { plantId, status: "failed", error: "Sundata gaf 200 maar monitored_since bleef leeg" };
    }
    if (((_a = na.address) == null ? void 0 : _a.postal_code) !== a.postal_code || ((_b = na.address) == null ? void 0 : _b.street) !== a.street) {
      console.error(`[sundata] LET OP: adres van plant ${plantId} is gewijzigd door de activering`);
    }
    return { plantId, status: "activated", monitoredSince: na.monitored_since };
  } catch (e) {
    const msg = ((_d = (_c = e == null ? void 0 : e.data) == null ? void 0 : _c.error) == null ? void 0 : _d.messages) ? Object.values(e.data.error.messages).join("; ") : ((_e = e == null ? void 0 : e.data) == null ? void 0 : _e.message) || (e == null ? void 0 : e.message) || "onbekende fout";
    return { plantId, status: "failed", error: String(msg) };
  }
}
async function activatePlantsForCustomer(event, partnerId, customer, akkoordDatum) {
  var _a, _b, _c;
  const supabase = getServiceRoleClient();
  const { data: links } = await supabase.from("sundata_plant_links").select("id, sundata_company_id, sundata_plant_id, sundata_meter_id, activated_at").eq("partner_id", partnerId).ilike("email", customer.email);
  if (!(links == null ? void 0 : links.length)) return [];
  const resultaten = [];
  for (const link of links) {
    const r = await activateSundataPlant(
      event,
      partnerId,
      link.sundata_plant_id,
      akkoordDatum,
      (_a = link.sundata_company_id) != null ? _a : 7
    );
    resultaten.push(r);
    if (r.status === "failed") continue;
    await supabase.from("sundata_plant_links").update({ activated_at: link.activated_at || (/* @__PURE__ */ new Date()).toISOString(), customer_id: customer.id }).eq("id", link.id);
    const marker = `sundata:${(_b = link.sundata_company_id) != null ? _b : 7}/${link.sundata_plant_id}/${(_c = link.sundata_meter_id) != null ? _c : ""}`;
    const { data: bestaand } = await supabase.from("customer_products").select("id, serial_number").eq("customer_id", customer.id).eq("category", "solar_panel").order("updated_at", { ascending: false }).limit(1).maybeSingle();
    const velden = {
      integration_type: "sundata",
      external_id: String(link.sundata_plant_id),
      serial_number: marker,
      linked_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (bestaand) {
      await supabase.from("customer_products").update(velden).eq("id", bestaand.id);
    } else {
      await supabase.from("customer_products").insert({
        customer_id: customer.id,
        partner_id: partnerId,
        category: "solar_panel",
        name: "Zonnepanelen",
        ...velden
      });
    }
  }
  return resultaten;
}

export { activatePlantsForCustomer, activateSundataPlant };
//# sourceMappingURL=sundata-activate.mjs.map
