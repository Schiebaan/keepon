import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
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

const products_get = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", user.id).single();
  if (!customer) return [];
  const { data: products } = await supabase.from("customer_products").select("id, category, name, brand, model, serial_number, notes, installation_date").eq("customer_id", customer.id).order("category");
  return (products || []).map((p) => {
    const s = typeof p.serial_number === "string" ? p.serial_number : "";
    let integration = null;
    let externalId = null;
    if (p.category === "solar_panel" && s.startsWith("sundata:")) {
      integration = "sundata";
      externalId = s.slice("sundata:".length);
    } else if (p.category === "ev_charger" && s.startsWith("easee:")) {
      integration = "easee";
      externalId = s.slice("easee:".length);
    } else if (p.category === "heat_pump" && s.startsWith("weheat:")) {
      integration = "weheat";
      externalId = s.slice("weheat:".length);
    }
    return {
      id: p.id,
      category: p.category,
      name: p.name,
      brand: p.brand,
      model: p.model,
      notes: p.notes,
      installation_date: p.installation_date,
      linked: !!integration,
      integration,
      external_id: externalId
    };
  });
});

export { products_get as default };
//# sourceMappingURL=products.get.mjs.map
