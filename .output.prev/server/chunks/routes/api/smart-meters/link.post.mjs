import { d as defineEventHandler, r as readBody, c as createError, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
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

const link_post = defineEventHandler(async (event) => {
  await requireAuth(event);
  const body = await readBody(event);
  const { postcode, meter_id, customer_id, partner_id } = body;
  if (!postcode || !meter_id || !customer_id) {
    throw createError({ statusCode: 400, message: "postcode, meter_id, and customer_id are required" });
  }
  if (!/^\d{6}$/.test(meter_id)) {
    throw createError({ statusCode: 400, message: "meter_id must be exactly 6 digits" });
  }
  const supabase = getServiceRoleClient();
  const { data: existing } = await supabase.from("smart_meters").select("id").eq("customer_id", customer_id).single();
  if (existing) {
    const { data: data2, error: error2 } = await supabase.from("smart_meters").update({
      postcode,
      meter_id,
      status: "pending",
      error_message: null
    }).eq("customer_id", customer_id).select().single();
    if (error2) throw createError({ statusCode: 500, message: error2.message });
    setTimeout(async () => {
      await supabase.from("smart_meters").update({ status: "active", linked_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("customer_id", customer_id);
    }, 3e3);
    return data2;
  }
  const { data, error } = await supabase.from("smart_meters").insert({
    customer_id,
    partner_id: partner_id || null,
    postcode,
    meter_id,
    status: "pending"
  }).select().single();
  if (error) throw createError({ statusCode: 500, message: error.message });
  setTimeout(async () => {
    await supabase.from("smart_meters").update({ status: "active", linked_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", data.id);
  }, 3e3);
  return data;
});

export { link_post as default };
//# sourceMappingURL=link.post.mjs.map
