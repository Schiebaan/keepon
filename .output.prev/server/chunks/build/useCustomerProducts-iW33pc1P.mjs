import { g as useState } from './server.mjs';
import { computed } from 'vue';

function useCustomerProducts() {
  const products = useState("customerProducts", () => []);
  const isLoading = useState("customerProductsLoading", () => true);
  const _loaded = useState("customerProductsLoaded", () => false);
  async function load(force = false) {
    if (_loaded.value && !force) return products.value;
    return products.value;
  }
  const evCharger = computed(() => products.value.find((p) => p.category === "ev_charger"));
  const heatPump = computed(() => products.value.find((p) => p.category === "heat_pump"));
  const solar = computed(() => products.value.find((p) => p.category === "solar_panel"));
  const battery = computed(() => products.value.find((p) => p.category === "battery"));
  return { products, isLoading, load, evCharger, heatPump, solar, battery };
}

export { useCustomerProducts as u };
//# sourceMappingURL=useCustomerProducts-iW33pc1P.mjs.map
