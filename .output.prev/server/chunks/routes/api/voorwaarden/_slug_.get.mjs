import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
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

const _slug__get = defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, message: "Slug ontbreekt" });
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("partners").select("id, name, slug, logo_url, primary_color, terms_content, terms_placeholders, support_email, support_phone").eq("slug", slug).eq("is_active", true).single();
  if (error || !data) {
    throw createError({ statusCode: 404, message: "Voorwaardenpagina niet gevonden" });
  }
  return data;
});

export { _slug__get as default };
//# sourceMappingURL=_slug_.get.mjs.map
