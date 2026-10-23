import { g as getServiceRoleClient, a as getHeader } from '../nitro/nitro.mjs';

async function auditLog(event, action, entityType, entityId, meta = {}) {
  try {
    const supabase = getServiceRoleClient(event);
    let actorId = null;
    const authHeader = getHeader(event, "authorization");
    if (authHeader == null ? void 0 : authHeader.startsWith("Bearer ")) {
      const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7));
      actorId = (user == null ? void 0 : user.id) || null;
    }
    const tenant = event.context.tenant;
    let partnerId = (tenant == null ? void 0 : tenant.id) || null;
    if (!partnerId && (meta == null ? void 0 : meta.partner_id)) {
      partnerId = meta.partner_id;
    }
    if (!partnerId && (meta == null ? void 0 : meta.customer_id)) {
      const { data: c } = await supabase.from("customers").select("partner_id").eq("id", meta.customer_id).single();
      partnerId = (c == null ? void 0 : c.partner_id) || null;
    }
    await supabase.from("audit_log").insert({
      actor_id: actorId,
      partner_id: partnerId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      meta
    });
  } catch (e) {
    console.error("[audit] Failed to log:", action, entityType, entityId, e);
  }
}

export { auditLog as a };
//# sourceMappingURL=audit.mjs.map
