import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { u as usePartner, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, computed, withCtx, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrIncludeBooleanAttr, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
import { u as useCustomerProducts } from './useCustomerProducts-iW33pc1P.mjs';
import { u as useWarmtepompData } from './useWarmtepompData-DnFA4S6e.mjs';
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
  __name: "warmtepomp",
  __ssrInlineRender: true,
  setup(__props) {
    const { heatPump, isLoading: productsLoading } = useCustomerProducts();
    const { data, isLoading: dataLoading, error: dataError } = useWarmtepompData();
    const { partner } = usePartner();
    const heatPumpLabel = computed(() => {
      const h = heatPump.value;
      if (h == null ? void 0 : h.name) return h.name;
      if ((h == null ? void 0 : h.brand) && (h == null ? void 0 : h.model)) return `${h.brand} ${h.model}`;
      if (h == null ? void 0 : h.brand) return h.brand;
      return "Warmtepomp";
    });
    function fmtKwh(v, digits = 0) {
      if (v == null) return "\u2014";
      if (v >= 1e4) return `${(v / 1e3).toFixed(1)} MWh`;
      return `${v.toFixed(digits)} kWh`;
    }
    function fmtTemp(v) {
      return v == null ? "\u2014" : `${v.toFixed(1)} \xB0C`;
    }
    function fmtEuro(v) {
      if (v == null) return "\u20AC \u2014";
      return `\u20AC ${Math.round(v).toLocaleString("nl-NL")}`;
    }
    function relativeTime(iso) {
      if (!iso) return "";
      const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1e3);
      if (sec < 60) return "zojuist";
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min} min geleden`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr} u geleden`;
      return new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
    }
    function fmtDaysActive(d) {
      if (!d) return "";
      if (d < 60) return `${d} dagen`;
      if (d < 730) return `${Math.round(d / 30.4)} maanden`;
      return `${(d / 365).toFixed(1)} jaar`;
    }
    const toneColors = {
      idle: { dot: "bg-gray-400", text: "text-gray-700", bg: "bg-gray-100" },
      standby: { dot: "bg-blue-400", text: "text-blue-700", bg: "bg-blue-50" },
      heating: { dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50" },
      error: { dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" }
    };
    function toneStyle(tone) {
      return toneColors[tone || "idle"];
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f;
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
      _push(`<div class="flex items-center justify-between gap-3 mb-6"><div class="flex items-center gap-3"><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "heat-pump",
        size: 22
      }, null, _parent));
      _push(`</div><h1 class="text-2xl font-bold text-gray-900">Warmtepomp</h1></div>`);
      if ((_a = unref(heatPump)) == null ? void 0 : _a.linked) {
        _push(`<button class="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(dataLoading)) ? " disabled" : ""} title="Vernieuwen">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "refresh",
          size: 14,
          class: unref(dataLoading) ? "animate-spin" : ""
        }, null, _parent));
        _push(`</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (unref(productsLoading) || unref(dataLoading) && !unref(data)) {
        _push(`<div class="section py-12 text-center"><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500"></div></div>`);
      } else if (((_b = unref(heatPump)) == null ? void 0 : _b.linked) && ((_c = unref(data)) == null ? void 0 : _c.linked) && !unref(dataError)) {
        _push(`<!--[--><div class="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-orange-50 p-5 mb-5"><div class="flex items-start justify-between gap-3"><div><p class="text-lg font-semibold text-gray-900">${ssrInterpolate(unref(heatPumpLabel))}</p><p class="text-xs text-gray-500 mt-0.5">`);
        if (unref(data).last_update) {
          _push(`<span>bijgewerkt ${ssrInterpolate(relativeTime(unref(data).last_update))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p></div><span class="${ssrRenderClass([[toneStyle(unref(data).state_tone).bg, toneStyle(unref(data).state_tone).text], "shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"])}"><span class="${ssrRenderClass([[toneStyle(unref(data).state_tone).dot, unref(data).state_tone === "heating" ? "animate-pulse" : ""], "h-2 w-2 rounded-full"])}"></span> ${ssrInterpolate(unref(data).state_label)}</span></div></div><div class="rounded-2xl border border-gray-100 bg-white p-6 mb-5"><p class="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Hoe effici\xEBnt is je warmtepomp?</p><div class="flex items-center justify-between gap-4 mb-4"><div class="flex-1 text-center"><div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 text-yellow-600">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "zap",
          size: 22
        }, null, _parent));
        _push(`</div><p class="text-xs text-gray-500">Stroom</p><p class="text-base font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtKwh(unref(data).lifetime_kwh_in))}</p></div><div class="flex-1 max-w-[200px]"><div class="relative"><div class="h-1.5 rounded-full bg-gradient-to-r from-yellow-300 via-orange-300 to-orange-400"></div><div class="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap"><span class="rounded-full bg-white border border-orange-200 px-3 py-1 text-xs font-bold text-orange-700 shadow-sm tabular-nums"> \xD7 ${ssrInterpolate(unref(data).scop ? unref(data).scop.toFixed(1) : "\u2014")}</span></div></div><p class="mt-3 text-[11px] text-center text-gray-400">SCOP</p></div><div class="flex-1 text-center"><div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-orange-600">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "heat-pump",
          size: 22
        }, null, _parent));
        _push(`</div><p class="text-xs text-gray-500">Warmte</p><p class="text-base font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtKwh(unref(data).lifetime_kwh_out))}</p></div></div><p class="text-sm text-gray-600 text-center"> Voor elke <strong>1 kWh stroom</strong> die je warmtepomp gebruikt, haalt hij <strong class="text-orange-700 tabular-nums">${ssrInterpolate(unref(data).scop ? unref(data).scop.toFixed(1) : "\u2014")} kWh warmte</strong> uit de buitenlucht. </p></div>`);
        if (unref(data).savings && unref(data).savings.net_savings_eur > 0) {
          _push(`<div class="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-green-50 p-6 mb-5"><p class="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-3">Wat heb je bespaard?</p><div class="grid grid-cols-1 sm:grid-cols-3 gap-4"><div><p class="text-3xl font-bold text-emerald-900 tabular-nums">${ssrInterpolate(fmtEuro(unref(data).savings.net_savings_eur))}</p><p class="mt-0.5 text-xs text-emerald-700">minder uitgegeven dan met een gasketel</p></div><div><p class="text-3xl font-bold text-emerald-900 tabular-nums">${ssrInterpolate(unref(data).savings.gas_m3_avoided.toLocaleString("nl-NL"))} m\xB3</p><p class="mt-0.5 text-xs text-emerald-700">aardgas niet verstookt</p></div>`);
          if (unref(data).days_active) {
            _push(`<div><p class="text-3xl font-bold text-emerald-900 tabular-nums">${ssrInterpolate(fmtDaysActive(unref(data).days_active))}</p><p class="mt-0.5 text-xs text-emerald-700">je warmtepomp doet z&#39;n werk</p></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><p class="mt-3 text-[11px] text-emerald-700/70"> Vergeleken met een moderne cv-ketel (rendement 95%), bij \u20AC 1,45/m\xB3 gas en \u20AC 0,30/kWh stroom. </p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="rounded-2xl border border-gray-100 bg-white p-5 mb-5"><h2 class="text-sm font-semibold text-gray-900 mb-3">Verbruik over tijd</h2><div class="grid grid-cols-1 sm:grid-cols-3 gap-3"><div class="rounded-xl border border-gray-100 p-4"><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Deze week</p>`);
        if (unref(data).week) {
          _push(`<!--[--><p class="mt-1 text-xl font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtKwh(unref(data).week.kwh_out, 0))}</p><p class="text-[11px] text-gray-500">warmte geleverd</p><!--]-->`);
        } else {
          _push(`<!--[--><p class="mt-1 text-xl font-semibold text-gray-300 tabular-nums">\u2014</p><p class="text-[11px] text-gray-400">data komt vanaf volgende week</p><!--]-->`);
        }
        _push(`</div><div class="rounded-xl border border-gray-100 p-4"><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider">Laatste 30 dagen</p>`);
        if (unref(data).month) {
          _push(`<!--[--><p class="mt-1 text-xl font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtKwh(unref(data).month.kwh_out, 0))}</p><p class="text-[11px] text-gray-500">warmte geleverd</p><!--]-->`);
        } else {
          _push(`<!--[--><p class="mt-1 text-xl font-semibold text-gray-300 tabular-nums">\u2014</p><p class="text-[11px] text-gray-400">data wordt opgebouwd</p><!--]-->`);
        }
        _push(`</div><div class="rounded-xl border border-orange-100 bg-orange-50 p-4"><p class="text-[11px] font-medium text-orange-700 uppercase tracking-wider">Gemiddeld per dag</p><p class="mt-1 text-xl font-semibold text-orange-900 tabular-nums">${ssrInterpolate(fmtKwh(unref(data).avg_kwh_out_per_day, 0))}</p><p class="text-[11px] text-orange-700">sinds installatie</p></div></div><p class="mt-3 text-[11px] text-gray-400 italic"> We slaan dagelijks een meting op om je verbruik per week en maand te tonen. De eerste week ben je nog data aan het verzamelen. </p></div><div class="rounded-2xl border border-gray-100 bg-white p-5 mb-5"><h2 class="text-sm font-semibold text-gray-900 mb-3">Op dit moment in huis</h2><div class="grid grid-cols-2 sm:grid-cols-4 gap-3"><div class="rounded-xl bg-gray-50 p-3 text-center"><div class="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-sky-600">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "cloud",
          size: 14
        }, null, _parent));
        _push(`</div><p class="text-[10px] text-gray-500 uppercase tracking-wider">Buiten</p><p class="text-base font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtTemp(unref(data).air_in_c))}</p></div><div class="rounded-xl bg-gray-50 p-3 text-center"><div class="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 text-amber-600">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "home",
          size: 14
        }, null, _parent));
        _push(`</div><p class="text-[10px] text-gray-500 uppercase tracking-wider">Binnen</p><p class="text-base font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtTemp(unref(data).room_c))}</p>`);
        if (unref(data).room_target_c != null) {
          _push(`<p class="text-[10px] text-gray-400">doel ${ssrInterpolate(unref(data).room_target_c.toFixed(0))} \xB0C</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="rounded-xl bg-gray-50 p-3 text-center"><div class="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "zap",
          size: 14
        }, null, _parent));
        _push(`</div><p class="text-[10px] text-gray-500 uppercase tracking-wider">Aanvoer</p><p class="text-base font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtTemp(unref(data).water_out_c))}</p><p class="text-[10px] text-gray-400">naar verwarming</p></div><div class="rounded-xl bg-gray-50 p-3 text-center"><div class="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "chevron-right",
          size: 14,
          class: "rotate-180"
        }, null, _parent));
        _push(`</div><p class="text-[10px] text-gray-500 uppercase tracking-wider">Retour</p><p class="text-base font-semibold text-gray-900 tabular-nums">${ssrInterpolate(fmtTemp(unref(data).water_return_c))}</p><p class="text-[10px] text-gray-400">terug uit huis</p></div></div></div><!--]-->`);
      } else if (((_d = unref(heatPump)) == null ? void 0 : _d.linked) && (unref(dataError) || ((_e = unref(data)) == null ? void 0 : _e.error))) {
        _push(`<div class="section py-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "alert-circle",
          size: 40,
          class: "mx-auto text-amber-400 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Live data niet beschikbaar</h2><p class="text-sm text-gray-500 max-w-sm mx-auto">${ssrInterpolate(unref(dataError) || ((_f = unref(data)) == null ? void 0 : _f.error))}</p><button class="mt-4 rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"> Probeer opnieuw </button></div>`);
      } else {
        _push(`<div class="section py-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "heat-pump",
          size: 40,
          class: "mx-auto text-gray-300 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Nog niet gekoppeld</h2><p class="text-sm text-gray-500 max-w-sm mx-auto"> Je installateur koppelt je warmtepomp aan het monitoringplatform. Zodra dit klaar is, zie je hier je verbruik en status. </p></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/warmtepomp.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=warmtepomp-BL2StXpM.mjs.map
