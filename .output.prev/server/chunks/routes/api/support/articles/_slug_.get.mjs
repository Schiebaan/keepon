import { d as defineEventHandler, g as getServiceRoleClient, h as getRouterParam, c as createError } from '../../../../nitro/nitro.mjs';
import { marked } from 'marked';
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
  var _a;
  const supabase = getServiceRoleClient();
  const slug = getRouterParam(event, "slug");
  if (!slug) throw createError({ statusCode: 400, message: "slug ontbreekt" });
  const kolommen = "id, slug, title, excerpt, body_md, category, tags, published_at, updated_at";
  function bouwQuery(metAudience) {
    let q = supabase.from("support_articles").select(kolommen).eq("slug", slug).not("published_at", "is", null);
    if (metAudience) q = q.eq("audience", "partner");
    return q.single();
  }
  let { data, error } = await bouwQuery(true);
  if ((_a = error == null ? void 0 : error.message) == null ? void 0 : _a.includes("audience")) {
    console.warn("[support] audience-kolom ontbreekt \u2014 migratie 031 nog niet gedraaid");
    ({ data, error } = await bouwQuery(false));
  }
  if (error || !data) {
    if ((error == null ? void 0 : error.code) === "PGRST116") throw createError({ statusCode: 404, message: "Artikel niet gevonden" });
    throw createError({ statusCode: 500, message: (error == null ? void 0 : error.message) || "Kon artikel niet laden" });
  }
  const html = marked.parse(data.body_md || "", { gfm: true, breaks: false, async: false });
  return {
    ...data,
    body_html: html
  };
});

export { _slug__get as default };
//# sourceMappingURL=_slug_.get.mjs.map
