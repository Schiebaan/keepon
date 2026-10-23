import { d as defineEventHandler, g as getServiceRoleClient, h as getRouterParam, c as createError, r as readBody } from '../../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../../_/audit.mjs';
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

const _id__put = defineEventHandler(async (event) => {
  await requireRole(event, "platform_admin");
  const supabase = getServiceRoleClient();
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "id ontbreekt" });
  const body = await readBody(event).catch(() => ({}));
  const updates = {};
  if (typeof (body == null ? void 0 : body.title) === "string") updates.title = body.title.trim().slice(0, 200);
  if (typeof (body == null ? void 0 : body.excerpt) === "string") updates.excerpt = body.excerpt.trim().slice(0, 400) || null;
  if (typeof (body == null ? void 0 : body.body_md) === "string") updates.body_md = body.body_md;
  if (typeof (body == null ? void 0 : body.category) === "string") updates.category = body.category.trim().slice(0, 60) || null;
  if (typeof (body == null ? void 0 : body.slug) === "string" && body.slug.trim()) updates.slug = body.slug.trim().slice(0, 80);
  if ((body == null ? void 0 : body.sort_order) !== void 0) updates.sort_order = Number(body.sort_order) || 100;
  if ((body == null ? void 0 : body.publish) === true) updates.published_at = (/* @__PURE__ */ new Date()).toISOString();
  if ((body == null ? void 0 : body.publish) === false) updates.published_at = null;
  if (!Object.keys(updates).length) throw createError({ statusCode: 400, message: "Geen wijzigingen meegegeven" });
  const { data, error } = await supabase.from("support_articles").update(updates).eq("id", id).select("id, slug, title, excerpt, category, sort_order, published_at, updated_at").single();
  if (error) {
    if (error.code === "23505") throw createError({ statusCode: 409, message: "Deze slug bestaat al" });
    throw createError({ statusCode: 500, message: error.message });
  }
  await auditLog(event, "support_article.updated", "support_article", id, { updates });
  return data;
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
