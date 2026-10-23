import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { r as resolvePartnerId } from '../../../_/partner-scope.mjs';
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

const alerts_get = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const partnerId = await resolvePartnerId(event, supabase, user.id);
  const { data, error } = await supabase.from("device_alerts").select("id, kind, detail, first_seen_at, last_seen_at, customer_id, customer_product_id, customers(full_name, email), customer_products(name, category)").eq("partner_id", partnerId).is("resolved_at", null).order("first_seen_at", { ascending: false }).limit(25);
  if (error) {
    console.error("[alerts] kon storingen niet laden:", error.message);
    return [];
  }
  return (data || []).map((a) => {
    var _a, _b, _c, _d, _e;
    return {
      id: a.id,
      kind: a.kind,
      detail: a.detail,
      since: a.first_seen_at,
      customerId: a.customer_id,
      customerName: ((_a = a.customers) == null ? void 0 : _a.full_name) || ((_b = a.customers) == null ? void 0 : _b.email) || "Klant",
      productName: ((_c = a.customer_products) == null ? void 0 : _c.name) || ((_d = a.customer_products) == null ? void 0 : _d.category) || "Installatie",
      category: ((_e = a.customer_products) == null ? void 0 : _e.category) || null
    };
  });
});

export { alerts_get as default };
//# sourceMappingURL=alerts.get.mjs.map
