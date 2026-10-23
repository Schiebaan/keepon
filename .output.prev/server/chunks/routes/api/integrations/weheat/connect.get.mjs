import { d as defineEventHandler, g as getServiceRoleClient, c as createError, b as getRequestHeader, e as getQuery, m as setCookie } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { g as generatePkce, r as randomNonce, s as signState } from '../../../../_/oauth-state.mjs';
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
import 'crypto';

const AUTH_URL = "https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/auth";
const CLIENT_ID = "weheat-backend";
const SCOPE = "profile email";
const connect_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const tenant = event.context.tenant;
  let partnerId = tenant == null ? void 0 : tenant.id;
  if (!partnerId) {
    const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
    partnerId = role == null ? void 0 : role.partner_id;
    if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  const host = getRequestHeader(event, "host");
  if (!host) throw createError({ statusCode: 400, message: "Geen host header" });
  const proto = (getRequestHeader(event, "x-forwarded-proto") || "https").toString().split(",")[0].trim();
  const redirectUri = `${proto}://${host}/api/integrations/weheat/callback`;
  const { verifier, challenge } = generatePkce();
  const state = randomNonce();
  const returnTo = getQuery(event).return_to || "/admin/settings";
  const signed = signState({
    verifier,
    state,
    partner_id: partnerId,
    redirect_uri: redirectUri,
    return_to: returnTo,
    ts: Date.now()
  });
  setCookie(event, "_weheat_oauth", signed, {
    httpOnly: true,
    secure: proto === "https",
    sameSite: "lax",
    // must be lax so the cookie survives the cross-site redirect back
    path: "/",
    maxAge: 10 * 60
  });
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: SCOPE,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state
  });
  return { redirect_url: `${AUTH_URL}?${params.toString()}` };
});

export { connect_get as default };
//# sourceMappingURL=connect.get.mjs.map
