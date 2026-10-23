function parseMessages(raw) {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) {
        return arr.filter((m) => m && typeof m.text === "string").map((m, i) => ({
          id: m.id || `legacy-${i}`,
          role: m.role === "customer" ? "customer" : "installer",
          text: String(m.text),
          at: m.at || (/* @__PURE__ */ new Date()).toISOString(),
          author_name: m.author_name || null
        }));
      }
    } catch {
    }
  }
  return [{
    id: "legacy-0",
    role: "installer",
    text: trimmed,
    at: (/* @__PURE__ */ new Date()).toISOString(),
    author_name: null
  }];
}
function appendMessage(existingRaw, msg) {
  const messages = parseMessages(existingRaw);
  const added = {
    id: msg.id || `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    role: msg.role,
    text: msg.text,
    at: msg.at || (/* @__PURE__ */ new Date()).toISOString(),
    author_name: msg.author_name || null
  };
  messages.push(added);
  return { raw: JSON.stringify(messages), messages, added };
}
function latestMessage(raw) {
  const msgs = parseMessages(raw);
  return msgs.length ? msgs[msgs.length - 1] : null;
}
function messageCount(raw) {
  return parseMessages(raw).length;
}

export { appendMessage as a, latestMessage as l, messageCount as m, parseMessages as p };
//# sourceMappingURL=ticket-messages.mjs.map
