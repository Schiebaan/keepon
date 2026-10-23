import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
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

function slugify(input) {
  return input.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "artikel";
}
const articles_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "platform_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event).catch(() => ({}));
  const title = String((body == null ? void 0 : body.title) || "").trim().slice(0, 200);
  if (!title) throw createError({ statusCode: 400, message: "Titel ontbreekt" });
  const body_md = String((body == null ? void 0 : body.body_md) || "").trim();
  if (!body_md) throw createError({ statusCode: 400, message: "Inhoud ontbreekt" });
  const excerpt = typeof (body == null ? void 0 : body.excerpt) === "string" ? body.excerpt.trim().slice(0, 400) : null;
  const category = typeof (body == null ? void 0 : body.category) === "string" ? body.category.trim().slice(0, 60) || null : null;
  const requestedSlug = typeof (body == null ? void 0 : body.slug) === "string" && body.slug.trim() ? slugify(body.slug) : slugify(title);
  let slug = requestedSlug;
  let n = 2;
  while (true) {
    const { data: existing } = await supabase.from("support_articles").select("id").eq("slug", slug).maybeSingle();
    if (!existing) break;
    slug = `${requestedSlug}-${n++}`;
    if (n > 100) throw createError({ statusCode: 500, message: "Kon geen unieke slug maken" });
  }
  const publish = (body == null ? void 0 : body.publish) === true;
  const { data, error } = await supabase.from("support_articles").insert({
    slug,
    title,
    excerpt,
    body_md,
    category,
    sort_order: Number(body == null ? void 0 : body.sort_order) || 100,
    published_at: publish ? (/* @__PURE__ */ new Date()).toISOString() : null,
    author_id: user.id
  }).select("id, slug, title, excerpt, category, sort_order, published_at, updated_at").single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "support_article.created", "support_article", data.id, {
    slug,
    title,
    published: publish
  });
  return data;
});

export { articles_post as default };
//# sourceMappingURL=articles.post.mjs.map
