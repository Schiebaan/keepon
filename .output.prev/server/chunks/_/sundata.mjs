import { r as registerConnector } from './connectors.mjs';
import { g as getServiceRoleClient, c as createError } from '../nitro/nitro.mjs';

const BASE_URL = "https://api.sundata.nl/api/v0";
const SUNDATA_BASE_URL = BASE_URL;
async function getToken(credentials) {
  const response = await $fetch(`${BASE_URL}/sign-in`, {
    method: "POST",
    body: {
      email: credentials.api_email,
      password: credentials.api_password
    }
  });
  return response.access_token;
}
const sundataConnector = {
  type: "sundata",
  async verifyCredentials(credentials) {
    try {
      await getToken(credentials);
      return true;
    } catch {
      return false;
    }
  },
  async listDevices(credentials) {
    const token = await getToken(credentials);
    const companies = await $fetch(`${BASE_URL}/users/me/companies`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const devices = [];
    for (const company of companies) {
      const plants = await $fetch(`${BASE_URL}/companies/${company.id}/plants`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      for (const plant of plants) {
        devices.push({
          id: `${company.id}:${plant.id}`,
          name: plant.name || `Plant ${plant.id}`,
          type: "sundata"
        });
      }
    }
    return devices;
  },
  async linkDevice(credentials, deviceId) {
    const token = await getToken(credentials);
    const [companyId, plantId] = deviceId.split(":");
    await $fetch(`${BASE_URL}/companies/${companyId}/plants/${plantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true, device_id: deviceId };
  },
  async getDeviceStatus(credentials, deviceId) {
    const token = await getToken(credentials);
    const [companyId, plantId] = deviceId.split(":");
    const plant = await $fetch(`${BASE_URL}/companies/${companyId}/plants/${plantId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return {
      state: "active",
      metrics: {
        name: plant.name,
        capacity: plant.capacity_kwp || 0
      }
    };
  },
  async getDeviceData(credentials, deviceId, from, to) {
    const token = await getToken(credentials);
    const [companyId, plantId] = deviceId.split(":");
    const meters = await $fetch(
      `${BASE_URL}/companies/${companyId}/plants/${plantId}/meters`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!meters.length) return [];
    const meterId = meters[0].id;
    const yieldData = await $fetch(
      `${BASE_URL}/companies/${companyId}/plants/${plantId}/meters/${meterId}/yield?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return (yieldData.data || []).map((d) => ({
      timestamp: d.date,
      value: d.yield_in_wh,
      unit: "Wh"
    }));
  }
};
registerConnector(sundataConnector);
async function resolveSundataPartnerId(event, userId) {
  const supabase = getServiceRoleClient();
  const tenant = event.context.tenant;
  if (tenant == null ? void 0 : tenant.id) return tenant.id;
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", userId).single();
  let partnerId = role == null ? void 0 : role.partner_id;
  if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
    const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
    partnerId = fp == null ? void 0 : fp.id;
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  return partnerId;
}
async function sundataSession(event, partnerId) {
  var _a;
  const supabase = getServiceRoleClient();
  const { data: cred } = await supabase.from("integration_credentials").select("credentials").eq("partner_id", partnerId).eq("integration_type", "sundata").eq("is_active", true).single();
  if (!((_a = cred == null ? void 0 : cred.credentials) == null ? void 0 : _a.email)) {
    throw createError({ statusCode: 400, message: "Sundata is niet gekoppeld" });
  }
  const signin = await $fetch(`${BASE_URL}/sign-in`, {
    method: "POST",
    body: { email: cred.credentials.email, password: cred.credentials.password }
  });
  const headers = { Authorization: `Bearer ${signin.access_token}` };
  const companies = await $fetch(`${BASE_URL}/users/me/companies`, { headers });
  if (!(companies == null ? void 0 : companies.length)) {
    throw createError({ statusCode: 400, message: "Geen bedrijf gevonden in Sundata" });
  }
  return { headers, companyId: companies[0].id };
}
function parseSundataError(err, prefix = "") {
  var _a, _b, _c;
  const msg = ((_b = (_a = err == null ? void 0 : err.data) == null ? void 0 : _a.error) == null ? void 0 : _b.messages) ? Object.entries(err.data.error.messages).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" \xB7 ") : ((_c = err == null ? void 0 : err.data) == null ? void 0 : _c.message) || (err == null ? void 0 : err.message) || "Onbekende fout";
  return prefix ? `${prefix}: ${msg}` : msg;
}
async function findExistingPlantByName(headers, companyId, plantName) {
  const target = plantName.trim().toLowerCase();
  let url = `${BASE_URL}/companies/${companyId}/plants?per_page=100`;
  for (let page = 0; page < 5 && url; page++) {
    try {
      const res = await $fetch(url, { headers });
      const items = res.data || (Array.isArray(res) ? res : []);
      const match = items.find((p) => (p.name || "").trim().toLowerCase() === target);
      if (match) return match;
      url = res.next_page_url || null;
    } catch {
      return null;
    }
  }
  return null;
}

export { SUNDATA_BASE_URL as S, findExistingPlantByName as f, parseSundataError as p, resolveSundataPartnerId as r, sundataSession as s };
//# sourceMappingURL=sundata.mjs.map
