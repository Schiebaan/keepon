import { d as defineEventHandler, g as getServiceRoleClient, h as getRouterParam, c as createError } from '../../../../../nitro/nitro.mjs';
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

const _id__delete = defineEventHandler(async (event) => {
  await requireRole(event, "platform_admin");
  const supabase = getServiceRoleClient();
  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, message: "id ontbreekt" });
  const { error } = await supabase.from("support_articles").delete().eq("id", id);
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "support_article.deleted", "support_article", id, {});
  return { ok: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
