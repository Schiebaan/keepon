/**
 * Tiny in-memory TTL cache. Module-scoped (one per Node.js process) so each
 * PM2 worker keeps its own copy — fine for the demo and absorbs >50% of repeat
 * traffic across rapid page-reloads.
 *
 * Use cases:
 *   - Wrap the Weheat /heat-pumps/<id>/{logs/latest,total} calls (60s TTL)
 *   - Wrap the Easee /chargers/<id>/state + /sessions/charger/<id>/monthly
 *
 * Not appropriate for things that:
 *   - Need cross-worker consistency (use Redis for that)
 *   - Have user-visible state changes you need to see immediately
 */

interface Entry<T> {
  value: T
  expiresAt: number
}

export function memoryCache<T>(defaultTtlMs: number) {
  const store = new Map<string, Entry<T>>()

  function get(key: string): T | undefined {
    const e = store.get(key)
    if (!e) return undefined
    if (e.expiresAt < Date.now()) {
      store.delete(key)
      return undefined
    }
    return e.value
  }

  function set(key: string, value: T, ttlMs?: number): void {
    store.set(key, { value, expiresAt: Date.now() + (ttlMs ?? defaultTtlMs) })
    // Light eviction — keep memory bounded under burst
    if (store.size > 5000) {
      const now = Date.now()
      for (const [k, v] of store) {
        if (v.expiresAt < now) store.delete(k)
      }
    }
  }

  function invalidate(key: string): void {
    store.delete(key)
  }

  /**
   * Lazy-fetch helper: returns cached value if fresh, otherwise calls `loader`
   * and caches its result. Concurrent calls for the same key share the same
   * in-flight promise (dedup) so we don't fire N parallel external requests
   * when the cache expires under load.
   */
  const inflight = new Map<string, Promise<T>>()
  async function getOrLoad(key: string, loader: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = get(key)
    if (cached !== undefined) return cached
    const existing = inflight.get(key)
    if (existing) return existing
    const p = loader()
      .then((v) => { set(key, v, ttlMs); return v })
      .finally(() => { inflight.delete(key) })
    inflight.set(key, p)
    return p
  }

  return { get, set, invalidate, getOrLoad }
}
