import { d as defineEventHandler, g as getServiceRoleClient } from '../../../nitro/nitro.mjs';
import { a as requireAuth } from '../../../_/auth-guard.mjs';
import { m as messageCount, l as latestMessage, p as parseMessages } from '../../../_/ticket-messages.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const user = await requireAuth(event);
  const supabase = getServiceRoleClient();
  const { data: customer } = await supabase.from("customers").select("id, partner_id").eq("auth_user_id", user.id).single();
  if (!customer) return [];
  const { data } = await supabase.from("service_tickets").select("id, subject, description, status, urgency, module_type, response, helped_by_name, created_at, updated_at").eq("customer_id", customer.id).eq("partner_id", customer.partner_id).order("updated_at", { ascending: false });
  return (data || []).map((t) => ({
    ...t,
    messages: parseMessages(t.response),
    latest_message: latestMessage(t.response),
    message_count: messageCount(t.response)
  }));
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
