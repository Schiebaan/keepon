import { c as createError } from '../nitro/nitro.mjs';

async function resolvePartnerId(event, supabase, userId) {
  const tenant = event.context.tenant;
  let partnerId = tenant == null ? void 0 : tenant.id;
  if (!partnerId) {
    const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", userId).limit(1).maybeSingle();
    partnerId = (role == null ? void 0 : role.partner_id) || void 0;
    if (!partnerId && (role == null ? void 0 : role.role) === "platform_admin") {
      const { data: fp } = await supabase.from("partners").select("id").limit(1).maybeSingle();
      partnerId = (fp == null ? void 0 : fp.id) || void 0;
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: "Geen partner context" });
  return partnerId;
}
async function assertCustomerInPartner(supabase, customerId, partnerId) {
  const { data } = await supabase.from("customers").select("id, partner_id").eq("id", customerId).eq("partner_id", partnerId).maybeSingle();
  if (!data) throw createError({ statusCode: 404, message: "Klant niet gevonden" });
  return data;
}
async function assertSmartMeterAccess(event, supabase, meterId, userId) {
  const { data: meter } = await supabase.from("smart_meters").select("id, customer_id, partner_id").eq("id", meterId).maybeSingle();
  if (!meter) throw createError({ statusCode: 404, message: "Meter niet gevonden" });
  const { data: customer } = await supabase.from("customers").select("id").eq("auth_user_id", userId).maybeSingle();
  if (customer && meter.customer_id === customer.id) return meter;
  const { data: role } = await supabase.from("user_roles").select("partner_id, role").eq("user_id", userId).limit(1).maybeSingle();
  const beheert = role && ["partner_admin", "platform_admin"].includes(role.role);
  if (beheert && meter.partner_id && meter.partner_id === role.partner_id) return meter;
  throw createError({ statusCode: 404, message: "Meter niet gevonden" });
}

export { assertCustomerInPartner as a, assertSmartMeterAccess as b, resolvePartnerId as r };
//# sourceMappingURL=partner-scope.mjs.map
