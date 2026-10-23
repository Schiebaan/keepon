import { d as defineEventHandler, g as getServiceRoleClient, e as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
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

const ticketLabels_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const tenant = event.context.tenant;
  let partnerId = tenant == null ? void 0 : tenant.id;
  if (!partnerId) {
    const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", user.id).single();
    partnerId = role == null ? void 0 : role.partner_id;
    if ((role == null ? void 0 : role.role) === "platform_admin" && !partnerId) {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).single();
      partnerId = fp == null ? void 0 : fp.id;
    }
  }
  if (!partnerId) return [];
  const q = getQuery(event);
  let query = supabase.from("ticket_labels").select("id, name, color, sort_order, is_active").eq("partner_id", partnerId).order("sort_order", { ascending: true });
  if (q.include_inactive !== "1") query = query.eq("is_active", true);
  const { data, error } = await query;
  if (error) throw createError({ statusCode: 500, message: error.message });
  return data || [];
});

export { ticketLabels_get as default };
//# sourceMappingURL=ticket-labels.get.mjs.map
