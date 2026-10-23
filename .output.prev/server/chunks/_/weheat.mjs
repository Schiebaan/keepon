import { r as registerConnector } from './connectors.mjs';
import { g as getServiceRoleClient } from '../nitro/nitro.mjs';
import { W as WEHEAT_API_URL, i as isWeheatBlocked, a as WeheatAccessBlockedError, b as WEHEAT_CLIENT_SECRET, c as WEHEAT_TOKEN_URL, w as weheatClientParams } from './weheat-config.mjs';

const API_URL = WEHEAT_API_URL;
const tokenCache = /* @__PURE__ */ new Map();
const inFlight = /* @__PURE__ */ new Map();
const MARGE_MS = 6e4;
function cacheKey(c) {
  var _a;
  return c.username || ((_a = c.refresh_token) == null ? void 0 : _a.slice(-24)) || "weheat";
}
async function exchangeRefreshToken(refreshToken) {
  return await $fetch(WEHEAT_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      ...weheatClientParams(),
      refresh_token: refreshToken
    }).toString()
  });
}
async function persistCreds(event, partnerId, next) {
  try {
    const supabase = getServiceRoleClient(event);
    let q = supabase.from("integration_credentials").update({ credentials: next }).eq("integration_type", "weheat");
    if (partnerId) q = q.eq("partner_id", partnerId);
    else if (next.username) q = q.eq("credentials->>username", next.username);
    else return;
    const { error } = await q;
    if (error) console.error("[weheat] tokens opslaan mislukt:", error.message);
  } catch (e) {
    console.error("[weheat] tokens opslaan mislukt:", e == null ? void 0 : e.message);
  }
}
function toCreds(base, t) {
  return {
    ...base,
    access_token: t.access_token,
    access_token_expires_at: new Date(t.access_expires_at).toISOString(),
    refresh_token: t.refresh_token,
    refresh_token_expires_at: t.refresh_expires_at ? new Date(t.refresh_expires_at).toISOString() : void 0
  };
}
async function vernieuw(credentials, event, partnerId) {
  var _a;
  const key = cacheKey(credentials);
  const bekend = tokenCache.get(key);
  const refresh = (bekend == null ? void 0 : bekend.refresh_token) || credentials.refresh_token;
  const refreshExp = (_a = bekend == null ? void 0 : bekend.refresh_expires_at) != null ? _a : credentials.refresh_token_expires_at ? new Date(credentials.refresh_token_expires_at).getTime() : void 0;
  if (refresh && (!refreshExp || refreshExp > Date.now() + MARGE_MS)) {
    try {
      const r = await exchangeRefreshToken(refresh);
      const t = {
        access_token: r.access_token,
        refresh_token: r.refresh_token || refresh,
        access_expires_at: Date.now() + (r.expires_in || 300) * 1e3,
        refresh_expires_at: r.refresh_expires_in ? Date.now() + r.refresh_expires_in * 1e3 : refreshExp
      };
      tokenCache.set(key, t);
      await persistCreds(event, partnerId, toCreds(credentials, t));
      return t.access_token;
    } catch {
      tokenCache.delete(key);
    }
  }
  if (WEHEAT_CLIENT_SECRET && credentials.username && credentials.password) {
    const r = await $fetch(WEHEAT_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "password",
        ...weheatClientParams(),
        username: credentials.username,
        password: credentials.password
      }).toString()
    });
    const t = {
      access_token: r.access_token,
      refresh_token: r.refresh_token,
      access_expires_at: Date.now() + (r.expires_in || 300) * 1e3,
      refresh_expires_at: r.refresh_expires_in ? Date.now() + r.refresh_expires_in * 1e3 : void 0
    };
    tokenCache.set(key, t);
    await persistCreds(event, partnerId, toCreds(credentials, t));
    console.log("[weheat] ingelogd met eigen client");
    return t.access_token;
  }
  if (credentials.username && credentials.password) {
    const { loginWeheatHeadless } = await import('./weheat-headless.mjs');
    const r = await loginWeheatHeadless(credentials.username, credentials.password);
    const t = {
      access_token: r.access_token,
      refresh_token: r.refresh_token,
      access_expires_at: Date.now() + (r.expires_in || 300) * 1e3,
      refresh_expires_at: r.refresh_expires_in ? Date.now() + r.refresh_expires_in * 1e3 : void 0
    };
    tokenCache.set(key, t);
    await persistCreds(event, partnerId, toCreds(credentials, t));
    console.log("[weheat] nieuwe login uitgevoerd");
    return t.access_token;
  }
  throw new Error('Weheat-verbinding verlopen. Klik in /admin/settings op "Verbinden via Weheat" om opnieuw in te loggen.');
}
async function getAccessToken(credentials, event, partnerId) {
  if (!credentials.refresh_token && !(credentials.username && credentials.password)) {
    throw new Error('Weheat is nog niet verbonden. Klik in /admin/settings op "Verbinden via Weheat".');
  }
  const key = cacheKey(credentials);
  const bekend = tokenCache.get(key);
  if (bekend && bekend.access_expires_at > Date.now() + MARGE_MS) return bekend.access_token;
  const opgeslagenExp = credentials.access_token_expires_at ? new Date(credentials.access_token_expires_at).getTime() : 0;
  if (credentials.access_token && opgeslagenExp > Date.now() + MARGE_MS) return credentials.access_token;
  const lopend = inFlight.get(key);
  if (lopend) return lopend;
  const p = vernieuw(credentials, event, partnerId).finally(() => inFlight.delete(key));
  inFlight.set(key, p);
  return p;
}
async function weheatGet(path, token) {
  try {
    return await $fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  } catch (e) {
    if (isWeheatBlocked(e)) throw new WeheatAccessBlockedError();
    throw e;
  }
}
const weheatConnector = {
  type: "weheat",
  async verifyCredentials(credentials) {
    try {
      const token = await getAccessToken(credentials);
      const res = await weheatGet(`/heat-pumps`, token);
      return Array.isArray(res);
    } catch {
      return false;
    }
  },
  async listDevices(credentials) {
    var _a, _b;
    const token = await getAccessToken(credentials);
    const all = [];
    let page = 1;
    let totalPages = 1;
    do {
      const resp = await weheatGet(`/heat-pumps?page=${page}&pageSize=50`, token);
      const list = Array.isArray(resp) ? resp : (resp == null ? void 0 : resp.data) || [];
      for (const hp of list) all.push(hp);
      totalPages = (_b = (_a = resp == null ? void 0 : resp.metadata) == null ? void 0 : _a.totalPages) != null ? _b : 1;
      page++;
    } while (page <= totalPages && page < 20);
    return all.map((hp) => {
      var _a2;
      const serial = hp.serialNumber || hp.serial_number || hp.id;
      return {
        id: hp.id,
        name: ((_a2 = hp.name) == null ? void 0 : _a2.trim()) || `Warmtepomp ${serial}`,
        serial,
        // Extra fields used by the WeheatWizard. Not part of the standard
        // IntegrationConnector contract but harmless to include.
        model: hp.model,
        partNumber: hp.partNumber || hp.part_number,
        commissionedAt: hp.commissionedAt || hp.commissioned_at,
        type: "weheat"
      };
    });
  },
  async linkDevice(credentials, deviceId) {
    const token = await getAccessToken(credentials);
    await weheatGet(`/heat-pumps/${deviceId}`, token);
    return { success: true, device_id: deviceId };
  },
  /**
   * Er bestaat geen /status-endpoint bij Weheat; de actuele toestand komt uit
   * de laatste logregel. De veldnamen hierboven (heat_pump_state, output_power,
   * cop, dhw_temperature) bestonden evenmin — die hadden stilzwijgend nullen
   * opgeleverd zodra de aanroep ooit wél was geslaagd.
   */
  async getDeviceStatus(credentials, deviceId) {
    var _a, _b, _c, _d, _e;
    const token = await getAccessToken(credentials);
    const log = await weheatGet(`/heat-pumps/${deviceId}/logs/latest`, token);
    return {
      state: (log == null ? void 0 : log.state) !== void 0 && (log == null ? void 0 : log.state) !== null ? String(log.state) : "unknown",
      metrics: {
        water_in: (_a = log == null ? void 0 : log.tWaterIn) != null ? _a : 0,
        water_out: (_b = log == null ? void 0 : log.tWaterOut) != null ? _b : 0,
        air_in: (_c = log == null ? void 0 : log.tAirIn) != null ? _c : 0,
        compressor_rpm: (_d = log == null ? void 0 : log.rpm) != null ? _d : 0,
        signal_strength: (_e = log == null ? void 0 : log.signalStrength) != null ? _e : 0
      },
      // Hoe oud is deze meting? Een pomp die offline gaat houdt zijn laatste
      // logregel; alleen de tijdstempel verraadt dat er niets meer binnenkomt.
      measured_at: (log == null ? void 0 : log.timestamp) || null
    };
  },
  async getDeviceData(credentials, deviceId, from, to) {
    const token = await getAccessToken(credentials);
    const data = await weheatGet(`/heat-pumps/${deviceId}/energy?from=${from}&to=${to}`, token);
    return (data || []).map((d) => ({
      timestamp: d.timestamp,
      value: d.energy_output || 0,
      unit: "kWh"
    }));
  }
};
async function getWeheatAccessToken(credentials, event, partnerId) {
  return getAccessToken(credentials, event, partnerId);
}
registerConnector(weheatConnector);

export { getWeheatAccessToken as g, weheatConnector as w };
//# sourceMappingURL=weheat.mjs.map
