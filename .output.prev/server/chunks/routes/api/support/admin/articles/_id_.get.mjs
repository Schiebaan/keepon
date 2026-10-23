import { d as defineEventHandler, g as getServiceRoleClient, h as getRouterParam, c as createError } from '../../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../../_/auth-guard.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  await requireRole(event, "platform_admin");
  const supabase = getServiceRoleClient();
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "id ontbreekt" });
  const { data, error } = await supabase.from("support_articles").select("*").eq("id", id).single();
  if (error) {
    if (error.code === "PGRST116") throw createError({ statusCode: 404, message: "Artikel niet gevonden" });
    throw createError({ statusCode: 500, message: error.message });
  }
  return data;
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
