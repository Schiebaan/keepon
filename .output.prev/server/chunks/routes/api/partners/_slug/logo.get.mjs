import { d as defineEventHandler, h as getRouterParam, g as getServiceRoleClient, c as createError, s as setHeader, l as sendRedirect } from '../../../../nitro/nitro.mjs';
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

const logo_get = defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  const supabase = getServiceRoleClient();
  const { data } = await supabase.from("partners").select("logo_url").eq("slug", slug).single();
  if (!(data == null ? void 0 : data.logo_url)) {
    throw createError({ statusCode: 404, message: "No logo" });
  }
  const match = data.logo_url.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    const mimeType = match[1];
    const buffer = Buffer.from(match[2], "base64");
    setHeader(event, "content-type", mimeType);
    setHeader(event, "cache-control", "public, max-age=3600");
    return buffer;
  }
  return sendRedirect(event, data.logo_url);
});

export { logo_get as default };
//# sourceMappingURL=logo.get.mjs.map
