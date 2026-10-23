import { g as useState } from './server.mjs';

function useLaadpaalData() {
  const data = useState("laadpaalData", () => null);
  const isLoading = useState("laadpaalLoading", () => false);
  const error = useState("laadpaalError", () => "");
  const _loaded = useState("laadpaalLoaded", () => false);
  async function load(force = false) {
    if (_loaded.value && !force) return data.value;
    return null;
  }
  return { data, isLoading, error, load };
}

export { useLaadpaalData as u };
//# sourceMappingURL=useLaadpaalData-B0lcg6fn.mjs.map
