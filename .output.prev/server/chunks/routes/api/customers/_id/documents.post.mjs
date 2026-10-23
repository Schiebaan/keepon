import { d as defineEventHandler, h as getRouterParam, c as createError, i as readMultipartFormData, g as getServiceRoleClient } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { r as resolvePartnerId, a as assertCustomerInPartner } from '../../../../_/partner-scope.mjs';
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

const documents_post = defineEventHandler(async (event) => {
  const { user } = await requireRole(event, "partner_admin");
  const customerId = getRouterParam(event, "id");
  if (!customerId) {
    throw createError({ statusCode: 400, message: "Customer ID is required" });
  }
  const formData = await readMultipartFormData(event);
  if (!formData) {
    throw createError({ statusCode: 400, message: "No form data received" });
  }
  let name = "";
  let category = "overig";
  let notes = "";
  let partnerId = "";
  let file = null;
  for (const part of formData) {
    if (part.name === "name") name = part.data.toString();
    else if (part.name === "category") category = part.data.toString();
    else if (part.name === "notes") notes = part.data.toString();
    else if (part.name === "file" && part.filename) {
      file = { filename: part.filename, data: part.data, type: part.type || "application/octet-stream" };
    }
  }
  if (!name) {
    throw createError({ statusCode: 400, message: "Document name is required" });
  }
  const supabase = getServiceRoleClient();
  partnerId = await resolvePartnerId(event, supabase, user.id);
  await assertCustomerInPartner(supabase, customerId, partnerId);
  let filePath = "";
  let fileSize = 0;
  let mimeType = "";
  if (file) {
    const safeName = file.filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    filePath = `${partnerId}/${customerId}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("customer-documents").upload(filePath, file.data, {
      contentType: file.type,
      upsert: false
    });
    if (uploadError) {
      throw createError({ statusCode: 500, message: `Upload failed: ${uploadError.message}` });
    }
    fileSize = file.data.length;
    mimeType = file.type;
  }
  const { data, error } = await supabase.from("customer_documents").insert({
    customer_id: customerId,
    partner_id: partnerId,
    name,
    category,
    file_path: filePath,
    file_size_bytes: fileSize,
    mime_type: mimeType,
    notes: notes || null
  }).select().single();
  if (error) {
    throw createError({ statusCode: 500, message: `Database error: ${error.message}` });
  }
  return data;
});

export { documents_post as default };
//# sourceMappingURL=documents.post.mjs.map
