import { g as useState } from './server.mjs';

function useWarmtepompData() {
  const data = useState("warmtepompData", () => null);
  const isLoading = useState("warmtepompLoading", () => false);
  const error = useState("warmtepompError", () => "");
  const _loaded = useState("warmtepompLoaded", () => false);
  async function load(force = false) {
    if (_loaded.value && !force) return data.value;
    return null;
  }
  return { data, isLoading, error, load };
}

export { useWarmtepompData as u };
//# sourceMappingURL=useWarmtepompData-DnFA4S6e.mjs.map
