import { d as defineEventHandler, g as getServiceRoleClient, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../_/audit.mjs';
import { r as resolveSundataPartnerId, s as sundataSession, f as findExistingPlantByName, S as SUNDATA_BASE_URL, p as parseSundataError } from '../../../_/sundata.mjs';
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
import '../../../_/connectors.mjs';

const createPlant_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const supabase = getServiceRoleClient();
  const body = await readBody(event);
  const { customer_id, plant_name } = body;
  if (!customer_id || !plant_name) {
    throw createError({ statusCode: 400, message: "customer_id en plant_name zijn verplicht" });
  }
  const partnerId = await resolveSundataPartnerId(event, user.id);
  const { headers, companyId } = await sundataSession(event, partnerId);
  const { data: customer } = await supabase.from("customers").select("street, house_number, postal_code, city").eq("id", customer_id).single();
  if (!(customer == null ? void 0 : customer.street) || !(customer == null ? void 0 : customer.house_number) || !(customer == null ? void 0 : customer.postal_code) || !(customer == null ? void 0 : customer.city)) {
    throw createError({
      statusCode: 400,
      message: "Adres van de klant is niet compleet. Vul straat, huisnummer, postcode en woonplaats in bij de klantgegevens.",
      data: {
        code: "INCOMPLETE_ADDRESS",
        missing: {
          street: !(customer == null ? void 0 : customer.street),
          house_number: !(customer == null ? void 0 : customer.house_number),
          postal_code: !(customer == null ? void 0 : customer.postal_code),
          city: !(customer == null ? void 0 : customer.city)
        },
        current: {
          street: (customer == null ? void 0 : customer.street) || "",
          house_number: (customer == null ? void 0 : customer.house_number) || "",
          postal_code: (customer == null ? void 0 : customer.postal_code) || "",
          city: (customer == null ? void 0 : customer.city) || ""
        }
      }
    });
  }
  const existing = await findExistingPlantByName(headers, companyId, plant_name);
  if (existing == null ? void 0 : existing.id) {
    return {
      success: true,
      reused: true,
      plant_id: existing.id,
      company_id: companyId
    };
  }
  try {
    const plant = await $fetch(`${SUNDATA_BASE_URL}/companies/${companyId}/plants`, {
      method: "POST",
      headers,
      body: {
        name: plant_name,
        time_zone: "Europe/Amsterdam",
        address: {
          street: customer.street,
          street_number: customer.house_number,
          city: customer.city,
          postal_code: customer.postal_code.replace(/\s/g, ""),
          country: "NL"
        }
      }
    });
    await auditLog(event, "sundata.plant_created", "customer", customer_id, {
      plant_id: plant.id,
      plant_name,
      company_id: companyId
    });
    return {
      success: true,
      reused: false,
      plant_id: plant.id,
      company_id: companyId
    };
  } catch (err) {
    throw createError({ statusCode: 400, message: parseSundataError(err, "Plant aanmaken mislukt") });
  }
});

export { createPlant_post as default };
//# sourceMappingURL=create-plant.post.mjs.map
