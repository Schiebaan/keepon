async function resolveAdminDisplayName(supabase, authUserId) {
  var _a, _b;
  const { data: role } = await supabase.from("user_roles").select("full_name").eq("user_id", authUserId).not("full_name", "is", null).limit(1).maybeSingle();
  if ((role == null ? void 0 : role.full_name) && typeof role.full_name === "string" && role.full_name.trim()) {
    return role.full_name.trim();
  }
  try {
    const { data } = await supabase.auth.admin.getUserById(authUserId);
    const meta = ((_a = data == null ? void 0 : data.user) == null ? void 0 : _a.user_metadata) || {};
    const metaName = meta.full_name || meta.name;
    if (typeof metaName === "string" && metaName.trim()) return metaName.trim();
    const email = ((_b = data == null ? void 0 : data.user) == null ? void 0 : _b.email) || "";
    return deriveNameFromEmail(email);
  } catch {
    return "Team";
  }
}
function deriveNameFromEmail(email) {
  if (!email || typeof email !== "string") return "Team";
  const local = email.split("@")[0] || "";
  const generic = /* @__PURE__ */ new Set(["info", "support", "contact", "service", "helpdesk", "admin", "office"]);
  if (generic.has(local.toLowerCase())) return "Team";
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (!parts.length) return "Team";
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join(" ");
}

export { deriveNameFromEmail, resolveAdminDisplayName };
//# sourceMappingURL=admin-name.mjs.map
