function memoryCache(defaultTtlMs) {
  const store = /* @__PURE__ */ new Map();
  function get(key) {
    const e = store.get(key);
    if (!e) return void 0;
    if (e.expiresAt < Date.now()) {
      store.delete(key);
      return void 0;
    }
    return e.value;
  }
  function set(key, value, ttlMs) {
    store.set(key, { value, expiresAt: Date.now() + (ttlMs != null ? ttlMs : defaultTtlMs) });
    if (store.size > 5e3) {
      const now = Date.now();
      for (const [k, v] of store) {
        if (v.expiresAt < now) store.delete(k);
      }
    }
  }
  function invalidate(key) {
    store.delete(key);
  }
  const inflight = /* @__PURE__ */ new Map();
  async function getOrLoad(key, loader, ttlMs) {
    const cached = get(key);
    if (cached !== void 0) return cached;
    const existing = inflight.get(key);
    if (existing) return existing;
    const p = loader().then((v) => {
      set(key, v, ttlMs);
      return v;
    }).finally(() => {
      inflight.delete(key);
    });
    inflight.set(key, p);
    return p;
  }
  return { get, set, invalidate, getOrLoad };
}

export { memoryCache as m };
//# sourceMappingURL=cache.mjs.map
