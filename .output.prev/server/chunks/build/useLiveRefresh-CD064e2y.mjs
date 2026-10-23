import { ref, computed } from 'vue';

function useLiveRefresh(fn, options = {}) {
  const { intervalMs = 45e3, paused } = options;
  const lastRefreshed = ref(null);
  let running = false;
  async function tick() {
    if (running || (paused == null ? void 0 : paused.value)) return;
    running = true;
    try {
      await fn();
      lastRefreshed.value = /* @__PURE__ */ new Date();
    } catch {
    } finally {
      running = false;
    }
  }
  return { lastRefreshed, refreshNow: tick };
}
function useRelativeTime(at) {
  const now = ref(Date.now());
  return computed(() => {
    if (!at.value) return "";
    const sec = Math.floor((now.value - at.value.getTime()) / 1e3);
    if (sec < 45) return "zojuist";
    const min = Math.round(sec / 60);
    if (min < 60) return `${min} min geleden`;
    const uur = Math.round(min / 60);
    return `${uur} uur geleden`;
  });
}

export { useRelativeTime as a, useLiveRefresh as u };
//# sourceMappingURL=useLiveRefresh-CD064e2y.mjs.map
