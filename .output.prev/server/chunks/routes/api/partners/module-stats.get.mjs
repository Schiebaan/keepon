import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
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

const moduleStats_get = defineEventHandler(async (event) => {
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
  const empty = { solar_panel: { total: 0, monitored: 0 }, heat_pump: { total: 0, monitored: 0 }, ev_charger: { total: 0, monitored: 0 }, battery: { total: 0, monitored: 0 } };
  if (!partnerId) return empty;
  const { data: products } = await supabase.from("customer_products").select("category, serial_number").eq("partner_id", partnerId);
  const stats = {
    solar_panel: { total: 0, monitored: 0 },
    heat_pump: { total: 0, monitored: 0 },
    ev_charger: { total: 0, monitored: 0 },
    battery: { total: 0, monitored: 0 }
  };
  for (const p of products || []) {
    const cat = p.category;
    if (!stats[cat]) continue;
    stats[cat].total += 1;
    if (p.serial_number && typeof p.serial_number === "string" && p.serial_number.startsWith("sundata:")) {
      stats[cat].monitored += 1;
    }
  }
  return stats;
});

export { moduleStats_get as default };
//# sourceMappingURL=module-stats.get.mjs.map
