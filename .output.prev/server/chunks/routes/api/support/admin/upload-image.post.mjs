import { d as defineEventHandler, g as getServiceRoleClient, i as readMultipartFormData, c as createError } from '../../../../nitro/nitro.mjs';
import { r as requireRole } from '../../../../_/auth-guard.mjs';
import { a as auditLog } from '../../../../_/audit.mjs';
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

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = /* @__PURE__ */ new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml"]);
function extForType(type) {
  switch (type) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "image/svg+xml":
      return "svg";
    default:
      return "bin";
  }
}
function randomName() {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `${stamp}-${rand}`;
}
const uploadImage_post = defineEventHandler(async (event) => {
  await requireRole(event, "platform_admin");
  const supabase = getServiceRoleClient();
  const form = await readMultipartFormData(event);
  const file = form == null ? void 0 : form.find((p) => p.name === "file");
  if (!file || !file.data) throw createError({ statusCode: 400, message: "Geen bestand ontvangen" });
  if (file.data.length > MAX_BYTES) throw createError({ statusCode: 413, message: "Bestand is groter dan 5MB" });
  const type = (file.type || "").toLowerCase();
  if (!ALLOWED_TYPES.has(type)) {
    throw createError({ statusCode: 400, message: "Alleen PNG, JPG, WEBP, GIF of SVG toegestaan" });
  }
  const ext = extForType(type);
  const path = `${(/* @__PURE__ */ new Date()).getFullYear()}/${randomName()}.${ext}`;
  const { error } = await supabase.storage.from("support-images").upload(path, file.data, {
    contentType: type,
    cacheControl: "31536000",
    // 1 jaar — bestanden zijn immutable (unieke naam)
    upsert: false
  });
  if (error) throw createError({ statusCode: 500, message: "Upload mislukt: " + error.message });
  const { data: publicUrlData } = supabase.storage.from("support-images").getPublicUrl(path);
  await auditLog(event, "support_image.uploaded", "support_image", null, {
    path,
    size: file.data.length,
    type
  });
  return { url: publicUrlData.publicUrl, path };
});

export { uploadImage_post as default };
//# sourceMappingURL=upload-image.post.mjs.map
