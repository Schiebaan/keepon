import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
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

const testCredentials_post = defineEventHandler(async (event) => {
  var _a, _b, _c, _d, _e, _f, _g;
  await requireRole(event, "partner_admin");
  const body = await readBody(event);
  const { type, credentials } = body;
  if (!type || !credentials) {
    throw createError({ statusCode: 400, message: "type and credentials are required" });
  }
  if (type === "sundata") {
    try {
      const response = await $fetch("https://api.sundata.nl/api/v0/sign-in", {
        method: "POST",
        body: {
          email: credentials.email,
          password: credentials.password
        }
      });
      if (!response.access_token) {
        return { success: false, error: "Geen access token ontvangen" };
      }
      const companies = await $fetch("https://api.sundata.nl/api/v0/users/me/companies", {
        headers: { Authorization: `Bearer ${response.access_token}` }
      });
      let totalPlants = 0;
      for (const company of companies) {
        try {
          const plants = await $fetch(`https://api.sundata.nl/api/v0/companies/${company.id}/plants`, {
            headers: { Authorization: `Bearer ${response.access_token}` }
          });
          totalPlants += plants.length;
        } catch {
        }
      }
      return {
        success: true,
        details: {
          companies: companies.length,
          plants: totalPlants,
          email: credentials.email
        }
      };
    } catch (err) {
      const message = ((_a = err == null ? void 0 : err.data) == null ? void 0 : _a.message) || (err == null ? void 0 : err.message) || "Verbinding mislukt";
      return {
        success: false,
        error: message.includes("401") || message.includes("Unauthorized") ? "Ongeldige inloggegevens. Controleer je e-mail en wachtwoord." : `Verbinding mislukt: ${message}`
      };
    }
  }
  if (type === "weheat") {
    try {
      if (!credentials.refresh_token) {
        return { success: false, error: 'Nog niet verbonden. Klik op "Verbinden via Weheat" om in te loggen.' };
      }
      const tokenResp = await $fetch("https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "refresh_token",
          client_id: "weheat-backend",
          refresh_token: credentials.refresh_token
        }).toString()
      });
      if (!tokenResp.access_token) return { success: false, error: "Geen access token ontvangen" };
      const heatPumps = await $fetch(`${WEHEAT_API_URL}/heat-pumps`, {
        headers: { Authorization: `Bearer ${tokenResp.access_token}` }
      });
      return { success: true, details: { heatPumps: heatPumps.length } };
    } catch (err) {
      const code = (_b = err == null ? void 0 : err.data) == null ? void 0 : _b.error;
      const desc = ((_c = err == null ? void 0 : err.data) == null ? void 0 : _c.error_description) || ((_d = err == null ? void 0 : err.data) == null ? void 0 : _d.message) || (err == null ? void 0 : err.message) || "";
      const status = (err == null ? void 0 : err.statusCode) || ((_e = err == null ? void 0 : err.response) == null ? void 0 : _e.status);
      let nice = `Verbinding mislukt: ${desc}`;
      if (code === "invalid_grant") nice = 'Refresh token verlopen. Klik op "Verbinden via Weheat" om opnieuw in te loggen.';
      else if (status === 403) nice = "Weheat weigert de API-toegang. Neem contact op met Weheat support.";
      return { success: false, error: nice };
    }
  }
  if (type === "easee") {
    try {
      const userName = (credentials.username || credentials.email || "").trim();
      const password = (credentials.password || "").trim();
      const body2 = new URLSearchParams({
        grant_type: "password",
        client_id: "easee",
        username: userName,
        password,
        scope: "email offline_access"
      });
      const tokenResp = await $fetch("https://auth.easee.com/realms/easee/protocol/openid-connect/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body2.toString()
      });
      if (!tokenResp.access_token) return { success: false, error: "Geen access token ontvangen" };
      const chargers = await $fetch("https://api.easee.com/api/chargers", {
        headers: { Authorization: `Bearer ${tokenResp.access_token}` }
      });
      return {
        success: true,
        details: { chargers: chargers.length },
        // Hand the refresh token back so the credentials-save endpoint can persist it
        refresh_token: tokenResp.refresh_token
      };
    } catch (err) {
      const code = (_f = err == null ? void 0 : err.data) == null ? void 0 : _f.error;
      const desc = ((_g = err == null ? void 0 : err.data) == null ? void 0 : _g.error_description) || (err == null ? void 0 : err.message) || "";
      let nice = `Verbinding mislukt: ${desc}`;
      if (code === "invalid_grant") {
        nice = "Wachtwoord of gebruikersnaam onjuist. Probeer het account waarmee je in de Easee app inlogt.";
      } else if (code === "unauthorized_client") {
        nice = "Auth-fout (interne configuratie). Probeer opnieuw \u2014 of neem contact op met support.";
      } else if (desc.toLowerCase().includes("account is not fully set up")) {
        nice = "Account heeft een verplichte actie open (bv. wachtwoord wijzigen). Log in op portal.easee.com en handel die af.";
      }
      return { success: false, error: nice };
    }
  }
  return { success: false, error: `Integratie type "${type}" wordt nog niet ondersteund` };
});

export { testCredentials_post as default };
//# sourceMappingURL=test-credentials.post.mjs.map
