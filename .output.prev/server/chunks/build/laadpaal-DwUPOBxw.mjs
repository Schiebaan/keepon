import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { u as usePartner, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, computed, withCtx, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrRenderStyle } from 'vue/server-renderer';
import { u as useCustomerProducts } from './useCustomerProducts-iW33pc1P.mjs';
import { u as useLaadpaalData } from './useLaadpaalData-B0lcg6fn.mjs';
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
  __name: "laadpaal",
  __ssrInlineRender: true,
  setup(__props) {
    const { evCharger, isLoading: productsLoading } = useCustomerProducts();
    const { data, isLoading: dataLoading, error: dataError } = useLaadpaalData();
    const { partner } = usePartner();
    const chargerLabel = computed(() => {
      const e = evCharger.value;
      if (!e) return "Laadpaal";
      if (e.name) return e.name;
      if (e.brand && e.model) return `${e.brand} ${e.model}`;
      return "Laadpaal";
    });
    const monthLabels = ["", "jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
    function monthLabel(year, month) {
      const now = /* @__PURE__ */ new Date();
      if (year === now.getFullYear()) return monthLabels[month] || String(month);
      return `${monthLabels[month] || month} '${String(year).slice(-2)}`;
    }
    const recentMonths = computed(() => {
      var _a;
      if (!((_a = data.value) == null ? void 0 : _a.monthly_history)) return [];
      return data.value.monthly_history.slice(-12);
    });
    const maxMonthKwh = computed(() => {
      return Math.max(1, ...recentMonths.value.map((m) => m.kwh));
    });
    function fmtEuro(v) {
      return v.toFixed(2).replace(".", ",");
    }
    function fmtKwh(v) {
      if (v >= 1e3) return `${(v / 1e3).toFixed(1)} MWh`;
      return `${v.toFixed(1)} kWh`;
    }
    const toneColors = {
      idle: { dot: "bg-gray-400", text: "text-gray-700", bg: "bg-gray-100" },
      ready: { dot: "bg-blue-500", text: "text-blue-700", bg: "bg-blue-50" },
      charging: { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
      done: { dot: "bg-green-500", text: "text-green-700", bg: "bg-green-50" },
      error: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" }
    };
    function toneStyle(tone) {
      return toneColors[tone || "idle"];
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/klant",
        class: "mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "chevron-right",
              size: 14,
              class: "rotate-180"
            }, null, _parent2, _scopeId));
            _push2(` Terug naar overzicht `);
          } else {
            return [
              createVNode(_component_AppIcon, {
                name: "chevron-right",
                size: 14,
                class: "rotate-180"
              }),
              createTextVNode(" Terug naar overzicht ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="flex items-center justify-between gap-3 mb-6"><div class="flex items-center gap-3"><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "ev-charger",
        size: 22
      }, null, _parent));
      _push(`</div><h1 class="text-2xl font-bold text-gray-900">Laadpaal</h1></div><button class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(dataLoading)) ? " disabled" : ""} title="Vernieuwen">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "refresh",
        size: 14,
        class: unref(dataLoading) ? "animate-spin" : ""
      }, null, _parent));
      _push(`</button></div>`);
      if (unref(productsLoading) || unref(dataLoading) && !unref(data)) {
        _push(`<div class="section py-12 text-center"><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500"></div></div>`);
      } else if (((_a = unref(evCharger)) == null ? void 0 : _a.linked) && ((_b = unref(data)) == null ? void 0 : _b.linked) && !unref(dataError)) {
        _push(`<!--[--><div class="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 mb-6"><div class="flex items-start justify-between gap-3"><div class="flex items-start gap-3 flex-1 min-w-0"><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sky-600">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "ev-charger",
          size: 22
        }, null, _parent));
        _push(`</div><div class="min-w-0"><p class="text-xs font-medium text-sky-700 uppercase tracking-wider">Jouw laadpaal</p><p class="text-lg font-semibold text-gray-900">${ssrInterpolate(unref(chargerLabel))}</p><p class="text-xs text-gray-500 mt-0.5"><span class="font-mono text-gray-400">${ssrInterpolate(unref(data).charger_id)}</span><span class="mx-1">\xB7</span><span class="${ssrRenderClass(unref(data).online ? "text-green-600" : "text-red-600")}"><span class="${ssrRenderClass([unref(data).online ? "bg-green-500" : "bg-red-500", "inline-block h-1.5 w-1.5 rounded-full"])}"></span> ${ssrInterpolate(unref(data).online ? "Online" : "Offline")}</span></p></div></div><div class="shrink-0 text-right"><span class="${ssrRenderClass([[toneStyle(unref(data).op_mode_tone).bg, toneStyle(unref(data).op_mode_tone).text], "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"])}"><span class="${ssrRenderClass([toneStyle(unref(data).op_mode_tone).dot, "h-1.5 w-1.5 rounded-full"])}"></span> ${ssrInterpolate(unref(data).op_mode_label)}</span>`);
        if (unref(data).op_mode_hint) {
          _push(`<p class="mt-1 text-[11px] text-gray-500 max-w-[180px]">${ssrInterpolate(unref(data).op_mode_hint)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
        if (unref(data).op_mode_tone === "charging" && unref(data).current_power_w >= 100) {
          _push(`<div class="mt-4 rounded-xl bg-white/70 px-4 py-3"><div class="flex items-baseline justify-between"><span class="text-xs text-gray-500">Nu aan het laden</span><span class="text-lg font-semibold text-green-700 tabular-nums">${ssrInterpolate((unref(data).current_power_w / 1e3).toFixed(1))} kW</span></div>`);
          if (unref(data).current_session_kwh) {
            _push(`<p class="mt-0.5 text-xs text-gray-500"> Deze sessie: ${ssrInterpolate(unref(data).current_session_kwh)} kWh </p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6"><div class="rounded-xl border border-gray-100 bg-white p-4"><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Geladen deze maand</p><p class="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtKwh(((_c = unref(data).current_month) == null ? void 0 : _c.kwh) || 0))}</p><p class="mt-0.5 text-xs text-gray-500 tabular-nums">\u20AC ${ssrInterpolate(fmtEuro(((_d = unref(data).current_month) == null ? void 0 : _d.cost_eur) || 0))} geschatte kosten</p></div><div class="rounded-xl border border-gray-100 bg-white p-4"><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Totaal sinds installatie</p><p class="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtKwh(unref(data).lifetime_kwh || 0))}</p><p class="mt-0.5 text-xs text-gray-500">Lifetime energieverbruik</p></div><div class="rounded-xl border border-gray-100 bg-white p-4"><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Netspanning</p><p class="mt-1 text-2xl font-semibold text-gray-900 tabular-nums">${ssrInterpolate(unref(data).voltage ? unref(data).voltage.toFixed(0) : "\u2014")}<span class="text-base font-normal text-gray-500"> V</span></p><p class="mt-0.5 text-xs text-gray-500">Live gemeten</p></div></div>`);
        if (unref(recentMonths).length) {
          _push(`<div class="rounded-2xl border border-gray-100 bg-white p-5 mb-6"><div class="mb-3 flex items-baseline justify-between"><h2 class="text-sm font-semibold text-gray-900">Verbruik per maand</h2><p class="text-[11px] text-gray-400">Laatste ${ssrInterpolate(unref(recentMonths).length)} maanden</p></div><div class="flex items-end gap-1.5 h-32"><!--[-->`);
          ssrRenderList(unref(recentMonths), (m) => {
            _push(`<div class="flex-1 h-full relative flex items-end group"${ssrRenderAttr("title", `${monthLabel(m.year, m.month)}: ${m.kwh} kWh \xB7 \u20AC ${fmtEuro(m.cost_eur)}`)}><div class="w-full rounded-t-md bg-sky-200 group-hover:bg-sky-400 transition-colors" style="${ssrRenderStyle({ height: `${Math.max(3, m.kwh / unref(maxMonthKwh) * 100)}%` })}"></div><div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-0.5 whitespace-nowrap rounded-md bg-gray-900 px-1.5 py-0.5 text-[10px] font-semibold text-white opacity-0 group-hover:opacity-100 transition-opacity tabular-nums shadow">${ssrInterpolate(m.kwh)} kWh </div></div>`);
          });
          _push(`<!--]--></div><div class="mt-1.5 flex gap-1.5"><!--[-->`);
          ssrRenderList(unref(recentMonths), (m) => {
            _push(`<p class="flex-1 text-center text-[10px] text-gray-500 tabular-nums">${ssrInterpolate(monthLabel(m.year, m.month))}</p>`);
          });
          _push(`<!--]--></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else if (((_e = unref(evCharger)) == null ? void 0 : _e.linked) && (unref(dataError) || ((_f = unref(data)) == null ? void 0 : _f.error))) {
        _push(`<div class="section py-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "alert-circle",
          size: 40,
          class: "mx-auto text-amber-400 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Live data niet beschikbaar</h2><p class="text-sm text-gray-500 max-w-sm mx-auto">${ssrInterpolate(unref(dataError) || ((_g = unref(data)) == null ? void 0 : _g.error))}</p><button class="mt-4 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"> Probeer opnieuw </button></div>`);
      } else {
        _push(`<div class="section py-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "ev-charger",
          size: 40,
          class: "mx-auto text-gray-300 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Nog niet gekoppeld</h2><p class="text-sm text-gray-500 max-w-sm mx-auto"> Je installateur koppelt je laadpaal aan het monitoringplatform. Zodra dit klaar is, zie je hier je laadsessies en verbruik. </p></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/laadpaal.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=laadpaal-DwUPOBxw.mjs.map
