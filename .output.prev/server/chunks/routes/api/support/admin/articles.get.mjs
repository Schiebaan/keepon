import { d as defineEventHandler, g as getServiceRoleClient, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
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
  await requireRole(event, "platform_admin");
  const supabase = getServiceRoleClient();
  const { data, error } = await supabase.from("support_articles").select("id, slug, title, excerpt, category, sort_order, published_at, updated_at").order("published_at", { ascending: false, nullsFirst: true }).order("sort_order", { ascending: true }).limit(500);
  if (error) throw createError({ statusCode: 500, message: error.message });
  return data || [];
});

export { articles_get as default };
//# sourceMappingURL=articles.get.mjs.map
