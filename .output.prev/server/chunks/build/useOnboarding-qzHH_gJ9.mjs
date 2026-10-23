import { g as useState, f as useSupabaseClient } from './server.mjs';

function useOnboarding() {
  const state = useState("onboardingState", () => null);
  const isLoading = useState("onboardingLoading", () => false);
  async function authHeaders() {
    const supabase = useSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return (session == null ? void 0 : session.access_token) ? { Authorization: `Bearer ${session.access_token}` } : {};
  }
  async function load(force = false) {
    if (state.value && !force) return state.value;
    return null;
  }
  async function setStep(step) {
    const headers = await authHeaders();
    await $fetch("/api/customer/onboarding/step", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: { step }
    });
    if (state.value) state.value.step = step;
  }
  async function refreshSupabaseSession() {
    try {
      const supabase = useSupabaseClient();
      await supabase.auth.refreshSession();
    } catch {
    }
  }
  async function acceptProposal(acceptedModules, billingInterval) {
    const headers = await authHeaders();
    const res = await $fetch("/api/customer/onboarding/accept", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: {
        accepted_modules: acceptedModules || [],
        billing_interval: billingInterval || "monthly"
      }
    });
    if (state.value) {
      state.value.step = "incasso";
      state.value.accepted_at = res.accepted_at;
      state.value.accepted_modules = res.accepted_modules;
      if (state.value.proposal && res.billing_interval) {
        state.value.proposal.billing_interval = res.billing_interval;
      }
    }
    await refreshSupabaseSession();
    return res;
  }
  async function submitMandate(payload) {
    const headers = await authHeaders();
    const res = await $fetch("/api/customer/onboarding/mandate", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: payload
    });
    if (state.value) {
      state.value.step = "done";
      state.value.mandate_at = res.mandate_at;
      state.value.mandate_skipped = res.mandate_skipped;
    }
    await refreshSupabaseSession();
    return res;
  }
  function targetRouteForStep(step) {
    switch (step) {
      case "hero":
        return "/welkom";
      case "voorstel":
        return "/welkom/voorstel";
      case "incasso":
        return "/welkom/incasso";
      case "done":
        return "/welkom/klaar";
      default:
        return "/welkom";
    }
  }
  function formatPrice(cents) {
    if (!cents) return "0,00";
    const euros = cents / 100;
    return euros.toFixed(2).replace(".", ",");
  }
  return {
    state,
    isLoading,
    load,
    setStep,
    acceptProposal,
    submitMandate,
    targetRouteForStep,
    formatPrice
  };
}

export { useOnboarding as u };
//# sourceMappingURL=useOnboarding-qzHH_gJ9.mjs.map
