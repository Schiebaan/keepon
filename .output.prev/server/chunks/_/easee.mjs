import { r as registerConnector } from './connectors.mjs';

const API_URL = "https://api.easee.com/api";
const TOKEN_URL = "https://auth.easee.com/realms/easee/protocol/openid-connect/token";
const KEYCLOAK_CLIENT = "easee";
async function getToken(credentials) {
  var _a, _b;
  const username = (credentials.username || credentials.email || "").trim();
  const password = (credentials.password || "").trim();
  if (credentials.refresh_token) {
    try {
      return await refreshToken(credentials.refresh_token);
    } catch {
    }
  }
  if (!username || !password) {
    throw new Error("Easee: gebruikersnaam en wachtwoord zijn verplicht");
  }
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: KEYCLOAK_CLIENT,
    username,
    password,
    scope: "email offline_access"
  });
  try {
    const resp = await $fetch(TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
    return resp.access_token;
  } catch (err) {
    const code = (_a = err == null ? void 0 : err.data) == null ? void 0 : _a.error;
    const desc = ((_b = err == null ? void 0 : err.data) == null ? void 0 : _b.error_description) || (err == null ? void 0 : err.message);
    let nice = "Inloggen bij Easee mislukt.";
    if (code === "invalid_grant") nice = "Wachtwoord of gebruikersnaam onjuist. Gebruik het account waarmee je in de Easee app inlogt.";
    else if (code === "unauthorized_client") nice = "Easee weigert deze auth-client. Neem contact op met support.";
    else if (desc) nice = `Easee: ${desc}`;
    const e = new Error(nice);
    e.cause = err;
    e.easeeCode = code;
    throw e;
  }
}
async function refreshToken(refresh_token) {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: KEYCLOAK_CLIENT,
    refresh_token
  });
  const resp = await $fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString()
  });
  return resp.access_token;
}
async function listEaseeSites(credentials) {
  var _a;
  const token = await getToken(credentials);
  const alles = [];
  const PAGINA = 100;
  for (let offset = 0; offset < 5e3; offset += PAGINA) {
    const batch = await $fetch(`${API_URL}/sites?offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!Array.isArray(batch) || !batch.length) break;
    for (const s of batch) {
      alles.push({
        id: s.id,
        name: s.name || `Site ${s.id}`,
        address: formatAddress(s.address),
        installerAlias: s.installerAlias || null,
        levelOfAccess: (_a = s.levelOfAccess) != null ? _a : null
      });
    }
    if (batch.length < PAGINA) break;
  }
  return alles;
}
async function listEaseeSiteChargers(credentials, siteId) {
  const token = await getToken(credentials);
  const site = await $fetch(`${API_URL}/sites/${siteId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const palen = ((site == null ? void 0 : site.circuits) || []).flatMap((c) => c.chargers || []);
  return palen.map((p) => ({
    id: p.id,
    // Easee laat de naam vaak leeg of op "1" staan; dan is het id herkenbaarder.
    name: p.name && String(p.name).length > 2 ? p.name : `Laadpaal ${p.id}`
  }));
}
function formatAddress(a) {
  if (!a) return null;
  if (typeof a === "string") return a;
  const delen = [a.street, a.buildingNumber, a.postCode, a.city].filter(Boolean);
  return delen.length ? delen.join(" ") : null;
}
async function getEaseeSignal(credentials, chargerId) {
  var _a, _b;
  const token = await getToken(credentials);
  const H = { Authorization: `Bearer ${token}` };
  let state = null;
  let stateAvailable = true;
  try {
    const s = await $fetch(`${API_URL}/chargers/${chargerId}/state`, { headers: H });
    state = (_b = (_a = s == null ? void 0 : s.chargerOpMode) == null ? void 0 : _a.toString()) != null ? _b : null;
  } catch (e) {
    if ((e == null ? void 0 : e.status) === 404 || (e == null ? void 0 : e.statusCode) === 404 || /404/.test(String(e == null ? void 0 : e.message))) {
      stateAvailable = false;
    } else {
      throw e;
    }
  }
  let lastSessionEnd = null;
  try {
    const sess = await $fetch(`${API_URL}/chargers/${chargerId}/sessions/latest`, { headers: H });
    lastSessionEnd = (sess == null ? void 0 : sess.sessionEnd) || (sess == null ? void 0 : sess.sessionStart) || null;
  } catch {
  }
  return { state, lastSessionEnd, stateAvailable };
}
const easeeConnector = {
  type: "easee",
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
    const chargers = await $fetch(`${API_URL}/chargers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return chargers.map((c) => ({
      id: c.id,
      name: c.name || `Laadpaal ${c.serialNumber}`,
      serial: c.serialNumber,
      type: "easee"
    }));
  },
  async linkDevice(credentials, deviceId) {
    const token = await getToken(credentials);
    await $fetch(`${API_URL}/chargers/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return { success: true, device_id: deviceId };
  },
  async getDeviceStatus(credentials, deviceId) {
    var _a;
    const token = await getToken(credentials);
    const state = await $fetch(`${API_URL}/chargers/${deviceId}/state`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return {
      state: ((_a = state.chargerOpMode) == null ? void 0 : _a.toString()) || "unknown",
      metrics: {
        power: state.totalPower || 0,
        energy_session: state.sessionEnergy || 0,
        voltage: state.voltage || 0
      }
    };
  },
  async getDeviceData(credentials, deviceId, from, to) {
    const token = await getToken(credentials);
    const sessions = await $fetch(
      `${API_URL}/chargers/${deviceId}/sessions?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return (sessions || []).map((s) => ({
      timestamp: s.startTime,
      value: s.energyUsed || 0,
      unit: "kWh",
      duration: s.duration
    }));
  }
};
registerConnector(easeeConnector);

export { listEaseeSites as a, easeeConnector as e, getEaseeSignal as g, listEaseeSiteChargers as l };
//# sourceMappingURL=easee.mjs.map
