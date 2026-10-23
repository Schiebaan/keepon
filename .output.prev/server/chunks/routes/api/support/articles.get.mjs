import { d as defineEventHandler, g as getServiceRoleClient, e as getQuery, c as createError } from '../../../nitro/nitro.mjs';
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

const articles_get = defineEventHandler(async (event) => {
  var _a;
  const supabase = getServiceRoleClient();
  const q = getQuery(event);
  const search = String(q.q || "").trim();
  const category = String(q.category || "").trim();
  function bouwQuery(metAudience) {
    let query = supabase.from("support_articles").select("id, slug, title, excerpt, category, tags, sort_order, published_at, updated_at").not("published_at", "is", null).order("sort_order", { ascending: true }).order("title", { ascending: true });
    if (metAudience) query = query.eq("audience", "partner");
    if (category) query = query.eq("category", category);
    if (search) {
      const s = search.replace(/[,()%\\]/g, "").slice(0, 80);
      query = query.or(
        `title.ilike.%${s}%,excerpt.ilike.%${s}%,body_md.ilike.%${s}%`
      );
    }
    return query.limit(200);
  }
  let { data, error } = await bouwQuery(true);
  if ((_a = error == null ? void 0 : error.message) == null ? void 0 : _a.includes("audience")) {
    console.warn("[support] audience-kolom ontbreekt \u2014 migratie 031 nog niet gedraaid");
    ({ data, error } = await bouwQuery(false));
  }
  if (error) throw createError({ statusCode: 500, message: error.message });
  const articles = data || [];
  const byCategory = /* @__PURE__ */ new Map();
  for (const a of articles) {
    const key = a.category || "Overig";
    const arr = byCategory.get(key) || [];
    arr.push(a);
    byCategory.set(key, arr);
  }
  const categories = Array.from(byCategory.entries()).map(([name, items]) => ({ name, items }));
  return {
    articles,
    // Platte lijst (voor search-view)
    categories,
    // Gegroepeerd (voor default index-view)
    total: articles.length,
    query: search || null
  };
});

export { articles_get as default };
//# sourceMappingURL=articles.get.mjs.map
