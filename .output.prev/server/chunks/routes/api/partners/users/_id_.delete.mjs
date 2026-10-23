import { d as defineEventHandler, h as getRouterParam, c as createError, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
import { r as resolvePartnerId } from '../../../../_/partner-scope.mjs';
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
  const { user } = await requireRole(event, "partner_admin");
  const userId = getRouterParam(event, "id");
  if (!userId) throw createError({ statusCode: 400, message: "Gebruiker-id ontbreekt" });
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  if (userId === user.id) {
    throw createError({ statusCode: 400, message: "Je kunt je eigen toegang niet verwijderen. Vraag een collega dit te doen." });
  }
  const { data: doelwit } = await supabase.from("user_roles").select("user_id, full_name, role").eq("user_id", userId).eq("partner_id", partnerId).eq("role", "partner_admin").maybeSingle();
  if (!doelwit) throw createError({ statusCode: 404, message: "Teamlid niet gevonden" });
  const { count } = await supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("partner_id", partnerId).eq("role", "partner_admin");
  if ((count || 0) <= 1) {
    throw createError({ statusCode: 409, message: "Dit is de laatste beheerder. Voeg eerst een collega toe voordat je deze verwijdert." });
  }
  const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("partner_id", partnerId).eq("role", "partner_admin");
  if (error) throw createError({ statusCode: 500, message: error.message });
  await auditLog(event, "partner_user.removed", "user_role", userId, {
    partner_id: partnerId,
    removed_name: doelwit.full_name || null
  });
  return { success: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
