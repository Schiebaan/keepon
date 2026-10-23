import { b as useMockData, g as useState, j as useRuntimeConfig, f as useSupabaseClient } from './server.mjs';
import { ref } from 'vue';

function useCustomers(options = {}) {
  var _a;
  const config = useRuntimeConfig();
  if (config.public.demoMode) {
    const mock = useMockData();
    const customers2 = ref(mock.customers);
    return {
      customers: customers2,
      total: ref(customers2.value.length),
      hasMore: ref(false),
      isLoading: ref(false),
      refresh: async () => {
      },
      loadMore: async () => {
      },
      query: async (params = {}) => {
        let rows = mock.customers;
        if (params.q) {
          const q = String(params.q).toLowerCase();
          rows = rows.filter((c) => (c.full_name || "").toLowerCase().includes(q) || (c.email || "").toLowerCase().includes(q));
        }
        return { rows, total: rows.length, limit: 100, offset: 0, has_more: false };
      },
      createCustomer: async (data) => mock.onboardCustomer(data),
      updateCustomer: async (id, data) => {
        const c = mock.allCustomers.find((x) => x.id === id);
        if (c) Object.assign(c, data);
        return c;
      },
      deleteCustomer: async (id) => {
        const idx = mock.allCustomers.findIndex((x) => x.id === id);
        if (idx !== -1) mock.allCustomers.splice(idx, 1);
        const lidx = customers2.value.findIndex((c) => c.id === id);
        if (lidx !== -1) customers2.value.splice(lidx, 1);
      }
    };
  }
  const customers = useState("adminCustomers", () => []);
  const total = useState("adminCustomersTotal", () => 0);
  const hasMore = useState("adminCustomersHasMore", () => false);
  const _loaded = useState("customersLoaded", () => false);
  const isLoading = useState("customersLoading", () => !_loaded.value);
  const _seq = useState("customersSeq", () => 0);
  async function getAuthHeaders() {
    const supabase = useSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return (session == null ? void 0 : session.access_token) ? { Authorization: `Bearer ${session.access_token}` } : {};
  }
  async function refresh(params = {}) {
    const mySeq = ++_seq.value;
    isLoading.value = true;
    try {
      const headers = await getAuthHeaders();
      const data = await $fetch("/api/customers", { headers, query: params });
      if (mySeq !== _seq.value) return;
      customers.value = (data == null ? void 0 : data.rows) || [];
      total.value = (data == null ? void 0 : data.total) || 0;
      hasMore.value = !!(data == null ? void 0 : data.has_more);
    } catch (e) {
      if (mySeq === _seq.value) console.error("Failed to load customers:", e);
    } finally {
      if (mySeq === _seq.value) isLoading.value = false;
    }
  }
  async function loadMore(params = {}) {
    if (!hasMore.value || isLoading.value) return;
    isLoading.value = true;
    try {
      const headers = await getAuthHeaders();
      const data = await $fetch("/api/customers", {
        headers,
        query: { ...params, offset: customers.value.length }
      });
      customers.value = customers.value.concat((data == null ? void 0 : data.rows) || []);
      total.value = (data == null ? void 0 : data.total) || total.value;
      hasMore.value = !!(data == null ? void 0 : data.has_more);
    } finally {
      isLoading.value = false;
    }
  }
  async function query(params = {}) {
    const headers = await getAuthHeaders();
    return await $fetch("/api/customers", { headers, query: params });
  }
  const autoLoad = (_a = options.autoLoad) != null ? _a : true;
  if (autoLoad !== false && !_loaded.value && false) ;
  async function createCustomer(data) {
    const headers = await getAuthHeaders();
    const customer = await $fetch("/api/customers", {
      method: "POST",
      headers,
      body: data
    });
    customers.value.unshift(customer);
    return customer;
  }
  async function updateCustomer(id, data) {
    const headers = await getAuthHeaders();
    const updated = await $fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers,
      body: data
    });
    const idx = customers.value.findIndex((c) => c.id === id);
    if (idx !== -1) customers.value[idx] = updated;
    return updated;
  }
  async function deleteCustomer(id) {
    const headers = await getAuthHeaders();
    await $fetch(`/api/customers/${id}`, { method: "DELETE", headers });
    const idx = customers.value.findIndex((c) => c.id === id);
    if (idx !== -1) customers.value.splice(idx, 1);
  }
  return {
    customers,
    total,
    hasMore,
    isLoading,
    refresh,
    loadMore,
    query,
    createCustomer,
    updateCustomer,
    deleteCustomer
  };
}

export { useCustomers as u };
//# sourceMappingURL=useCustomers-B2wkzFun.mjs.map
