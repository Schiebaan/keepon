import { _ as _sfc_main$5, f as useSupabaseClient } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, watch, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrIncludeBooleanAttr, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrRenderAttr } from 'vue/server-renderer';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@supabase/functions-js';
import '@supabase/postgrest-js';
import '@supabase/realtime-js';
import '@supabase/storage-js';
import '@supabase/auth-js';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'devalue';
import '@unhead/ssr';
import 'unhead';
import '@unhead/shared';
import 'vue-router';
import '@supabase/ssr';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "payments",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(true);
    const error = ref("");
    const rows = ref([]);
    const total = ref(0);
    const totals = ref({ paid_cents: 0, open_cents: 0, failed_cents: 0, count: 0 });
    const statusFilter = ref("all");
    const search = ref("");
    async function loadPayments() {
      var _a;
      loading.value = true;
      error.value = "";
      try {
        const supabase = useSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!(session == null ? void 0 : session.access_token)) throw new Error("Niet ingelogd");
        const params = new URLSearchParams();
        params.set("limit", "200");
        if (statusFilter.value !== "all") params.set("status", statusFilter.value);
        if (search.value.trim()) params.set("q", search.value.trim());
        const res = await $fetch(`/api/payments?${params.toString()}`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        rows.value = res.rows;
        total.value = res.total;
        totals.value = res.totals;
      } catch (e) {
        error.value = ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message) || (e == null ? void 0 : e.message) || "Betalingen ophalen mislukt";
      } finally {
        loading.value = false;
      }
    }
    let searchTimer = null;
    watch(search, () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(loadPayments, 250);
    });
    watch(statusFilter, () => loadPayments());
    function euros(cents) {
      return "\u20AC " + (cents / 100).toFixed(2).replace(".", ",");
    }
    function fmtDate(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
      } catch {
        return "";
      }
    }
    function fmtDateTime(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
      } catch {
        return "";
      }
    }
    function statusBadge(status) {
      switch (status) {
        case "paid":
          return { label: "Betaald", cls: "bg-green-50 text-green-700 border-green-200" };
        case "open":
          return { label: "Open", cls: "bg-amber-50 text-amber-700 border-amber-200" };
        case "pending":
          return { label: "Onderweg", cls: "bg-blue-50 text-blue-700 border-blue-200" };
        case "authorized":
          return { label: "Geautoriseerd", cls: "bg-blue-50 text-blue-700 border-blue-200" };
        case "failed":
          return { label: "Mislukt", cls: "bg-red-50 text-red-700 border-red-200" };
        case "expired":
          return { label: "Verlopen", cls: "bg-gray-100 text-gray-700 border-gray-200" };
        case "canceled":
          return { label: "Geannuleerd", cls: "bg-gray-100 text-gray-700 border-gray-200" };
        case "chargeback":
          return { label: "Storno", cls: "bg-red-50 text-red-800 border-red-200" };
        default:
          return { label: status, cls: "bg-gray-100 text-gray-700 border-gray-200" };
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6 flex items-start justify-between gap-4 flex-wrap"><div><h1 class="text-2xl font-bold text-gray-900">Betalingen</h1><p class="mt-1 text-sm text-gray-500">Overzicht van alle incasso&#39;s en handmatige betalingen via Mollie.</p></div><button class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"${ssrIncludeBooleanAttr(unref(loading)) ? " disabled" : ""}>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "refresh",
        size: 14
      }, null, _parent));
      _push(` Verversen </button></div><div class="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3"><div class="card flex items-start gap-3"><div class="rounded-lg bg-green-50 p-2">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "check-circle",
        size: 20,
        class: "text-green-600"
      }, null, _parent));
      _push(`</div><div><p class="text-xs text-gray-500">Betaald</p><p class="text-lg font-bold text-gray-900">${ssrInterpolate(euros(unref(totals).paid_cents))}</p></div></div><div class="card flex items-start gap-3"><div class="rounded-lg bg-amber-50 p-2">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "clock",
        size: 20,
        class: "text-amber-600"
      }, null, _parent));
      _push(`</div><div><p class="text-xs text-gray-500">Onderweg / open</p><p class="text-lg font-bold text-gray-900">${ssrInterpolate(euros(unref(totals).open_cents))}</p></div></div><div class="card flex items-start gap-3"><div class="rounded-lg bg-red-50 p-2">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "x-circle",
        size: 20,
        class: "text-red-600"
      }, null, _parent));
      _push(`</div><div><p class="text-xs text-gray-500">Mislukt / verlopen</p><p class="text-lg font-bold text-gray-900">${ssrInterpolate(euros(unref(totals).failed_cents))}</p></div></div></div><div class="card mb-4"><div class="flex flex-wrap items-center gap-3"><div class="flex gap-1 rounded-lg bg-gray-100 p-1"><!--[-->`);
      ssrRenderList([
        { v: "all", label: "Alle" },
        { v: "paid", label: "Betaald" },
        { v: "open", label: "Open" },
        { v: "failed", label: "Mislukt" }
      ], (opt) => {
        _push(`<button class="${ssrRenderClass([unref(statusFilter) === opt.v ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "px-3 py-1.5 text-xs font-medium rounded-md transition-colors"])}">${ssrInterpolate(opt.label)}</button>`);
      });
      _push(`<!--]--></div><div class="flex-1 min-w-[200px] relative">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "search",
        size: 14,
        class: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(search))} type="text" placeholder="Zoek op Mollie-ID of omschrijving..." class="input pl-9 w-full text-sm"></div></div></div>`);
      if (unref(loading)) {
        _push(`<div class="py-12 text-center"><div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="card border-red-200 bg-red-50 text-sm text-red-800" role="alert">${ssrInterpolate(unref(error))}</div>`);
      } else if (unref(rows).length === 0) {
        _push(`<div class="card py-16 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "credit-card",
          size: 40,
          class: "mx-auto text-gray-300 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen betalingen</h2><p class="text-sm text-gray-500 max-w-md mx-auto"> Open een klantkaart en gebruik <span class="font-medium">&quot;Stuur factuur&quot;</span> om de eerste incasso te versturen. Mandaat-bevestigingen verschijnen hier ook automatisch. </p></div>`);
      } else {
        _push(`<div class="card overflow-hidden p-0"><div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200 text-sm"><thead class="bg-gray-50"><tr class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider"><th class="px-4 py-2.5">Klant</th><th class="px-4 py-2.5">Omschrijving</th><th class="px-4 py-2.5">Bedrag</th><th class="px-4 py-2.5">Status</th><th class="px-4 py-2.5">Periode</th><th class="px-4 py-2.5">Aangemaakt</th><th class="px-4 py-2.5">Mollie-ID</th></tr></thead><tbody class="divide-y divide-gray-100"><!--[-->`);
        ssrRenderList(unref(rows), (row) => {
          _push(`<tr class="hover:bg-gray-50"><td class="px-4 py-2.5">`);
          if (row.customer) {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: `/admin/customers/${row.customer_id}`,
              class: "text-gray-900 font-medium hover:underline"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`${ssrInterpolate(row.customer.full_name || row.customer.email)}`);
                } else {
                  return [
                    createTextVNode(toDisplayString(row.customer.full_name || row.customer.email), 1)
                  ];
                }
              }),
              _: 2
            }, _parent));
          } else {
            _push(`<span class="text-gray-400">\u2014 verwijderd \u2014</span>`);
          }
          _push(`</td><td class="px-4 py-2.5 text-gray-700 max-w-[260px] truncate">${ssrInterpolate(row.description || "\u2014")}</td><td class="px-4 py-2.5 font-medium text-gray-900 whitespace-nowrap">${ssrInterpolate(euros(row.amount_cents))}</td><td class="px-4 py-2.5"><span class="${ssrRenderClass([statusBadge(row.status).cls, "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"])}">${ssrInterpolate(statusBadge(row.status).label)}</span></td><td class="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">`);
          if (row.period_start || row.period_end) {
            _push(`<!--[-->${ssrInterpolate(fmtDate(row.period_start))}`);
            if (row.period_end) {
              _push(`<span> \u2013 ${ssrInterpolate(fmtDate(row.period_end))}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          } else {
            _push(`<span class="text-gray-300">\u2014</span>`);
          }
          _push(`</td><td class="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">${ssrInterpolate(fmtDateTime(row.created_at))}</td><td class="px-4 py-2.5 text-xs text-gray-400 font-mono whitespace-nowrap">${ssrInterpolate(row.mollie_payment_id)}</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
        if (unref(total) > unref(rows).length) {
          _push(`<div class="px-4 py-2.5 text-xs text-gray-500 border-t border-gray-100"> Toon ${ssrInterpolate(unref(rows).length)} van ${ssrInterpolate(unref(total))} betalingen. </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/payments.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=payments-Bl3Nwetc.mjs.map
