import { g as useState } from './server.mjs';

function useSolarSummary() {
  const summary = useState("solarSummary", () => null);
  const isLoading = useState("solarSummaryLoading", () => false);
  useState("solarSummaryLoaded", () => false);
  const currentPeriod = useState("solarSummaryPeriod", () => "month");
  async function load(opts = {}) {
    return;
  }
  return {
    summary,
    isLoading,
    currentPeriod,
    load,
    refresh: () => load({}),
    setPeriod: (period, startDate, endDate) => load({})
  };
}

export { useSolarSummary as u };
//# sourceMappingURL=useSolarSummary-DIHH6MR8.mjs.map
