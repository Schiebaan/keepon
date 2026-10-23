import { b as useMockData, g as useState, j as useRuntimeConfig } from './server.mjs';
import { ref } from 'vue';

function useCurrentCustomer() {
  const config = useRuntimeConfig();
  if (config.public.demoMode) {
    const { currentCustomer } = useMockData();
    return { customer: ref(currentCustomer), isLoading: ref(false) };
  }
  const customer = useState("currentCustomerData", () => null);
  const isLoading = useState("currentCustomerLoading", () => true);
  const _loaded = useState("currentCustomerLoaded", () => false);
  if (!_loaded.value && false) ;
  return { customer, isLoading };
}

export { useCurrentCustomer as u };
//# sourceMappingURL=useCurrentCustomer-Dbh6BR3o.mjs.map
