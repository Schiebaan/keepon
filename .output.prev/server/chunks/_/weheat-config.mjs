const WEHEAT_REALM = "https://auth.weheat.nl/realms/Weheat/protocol/openid-connect";
const WEHEAT_TOKEN_URL = `${WEHEAT_REALM}/token`;
const WEHEAT_CLIENT_ID = process.env.WEHEAT_CLIENT_ID || "weheat-third-party-debugger";
const WEHEAT_CLIENT_SECRET = process.env.WEHEAT_CLIENT_SECRET || "";
const WEHEAT_REDIRECT_URI = process.env.WEHEAT_REDIRECT_URI || "https://api.weheat.nl/third_party/api/debugger";
const WEHEAT_API_URL = (process.env.WEHEAT_API_URL || "https://api.weheat.nl/third_party/api/v1").replace(/\/$/, "");
function weheatClientParams() {
  const p = { client_id: WEHEAT_CLIENT_ID };
  if (WEHEAT_CLIENT_SECRET) p.client_secret = WEHEAT_CLIENT_SECRET;
  return p;
}
class WeheatAccessBlockedError extends Error {
  constructor() {
    super("Weheat blokkeert deze toegang voor externe koppelingen. Opnieuw verbinden helpt niet: UPsol heeft een eigen, geregistreerde API-toegang bij Weheat nodig.");
    this.name = "WeheatAccessBlockedError";
  }
}
function isWeheatBlocked(e) {
  var _a, _b, _c, _d, _e, _f;
  const msg = ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message) || ((_c = (_b = e == null ? void 0 : e.response) == null ? void 0 : _b._data) == null ? void 0 : _c.message) || "";
  if (/not available for third-party API clients/i.test(String(msg))) return true;
  const status = (_f = (_d = e == null ? void 0 : e.status) != null ? _d : e == null ? void 0 : e.statusCode) != null ? _f : (_e = e == null ? void 0 : e.response) == null ? void 0 : _e.status;
  return status === 403;
}

export { WEHEAT_API_URL as W, WeheatAccessBlockedError as a, WEHEAT_CLIENT_SECRET as b, WEHEAT_TOKEN_URL as c, WEHEAT_REALM as d, WEHEAT_REDIRECT_URI as e, WEHEAT_CLIENT_ID as f, isWeheatBlocked as i, weheatClientParams as w };
//# sourceMappingURL=weheat-config.mjs.map
