import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { u as usePartner, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, computed, ref, withCtx, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderStyle } from 'vue/server-renderer';
import { u as useSolarSummary } from './useSolarSummary-DIHH6MR8.mjs';
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
  __name: "zonnepanelen",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const { summary: solar, isLoading, currentPeriod } = useSolarSummary();
    const ORIENTATION_LABEL = {
      0: "Noord",
      45: "Noordoost",
      90: "Oost",
      135: "Zuidoost",
      180: "Zuid",
      225: "Zuidwest",
      270: "West",
      315: "Noordwest"
    };
    function formatKwh(wh, decimals = 1) {
      const v = (wh || 0) / 1e3;
      if (v >= 1e3) return `${(v / 1e3).toFixed(decimals)} MWh`;
      return `${v.toFixed(decimals)} kWh`;
    }
    function formatDate(s) {
      if (!s) return "\u2014";
      return new Date(s).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
    }
    const todayDisplay = computed(() => {
      var _a;
      const y = (_a = solar.value) == null ? void 0 : _a.yield;
      if (!y) return { text: "\u2014", isPending: false };
      if (y.today_wh && y.today_wh > 0) {
        return { text: formatKwh(y.today_wh), isPending: false };
      }
      if (y.has_any_recent_data) {
        return { text: "Komt vanavond binnen", isPending: true };
      }
      return { text: "Nog geen data", isPending: true };
    });
    const chartMax = computed(() => {
      var _a, _b;
      const vals = (((_b = (_a = solar.value) == null ? void 0 : _a.chart) == null ? void 0 : _b.data) || []).map((d) => d.wh || 0);
      return Math.max(1, ...vals);
    });
    const chartData = computed(() => {
      var _a, _b;
      return ((_b = (_a = solar.value) == null ? void 0 : _a.chart) == null ? void 0 : _b.data) || [];
    });
    function chartLabel(date, bucket) {
      const d = new Date(date);
      if (bucket === "month") {
        return d.toLocaleDateString("nl-NL", { month: "short" });
      }
      return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    }
    function bucketTooltip(date, wh, bucket) {
      const d = new Date(date);
      const label = bucket === "month" ? d.toLocaleDateString("nl-NL", { month: "long", year: "numeric" }) : d.toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
      return `${label}: ${formatKwh(wh)}`;
    }
    const periodOptions = [
      { key: "week", label: "Week" },
      { key: "month", label: "Maand" },
      { key: "year", label: "Jaar" },
      { key: "since_start", label: "Sinds start" },
      { key: "custom", label: "Aangepast" }
    ];
    const showCustomRange = ref(false);
    const customStart = ref("");
    const customEnd = ref("");
    const periodTotalWh = computed(() => {
      var _a, _b;
      const data = ((_b = (_a = solar.value) == null ? void 0 : _a.chart) == null ? void 0 : _b.data) || [];
      return data.reduce((s, d) => s + (d.wh || 0), 0);
    });
    const periodAverageWh = computed(() => {
      var _a, _b;
      const data = ((_b = (_a = solar.value) == null ? void 0 : _a.chart) == null ? void 0 : _b.data) || [];
      if (!data.length) return 0;
      const nonzero = data.filter((d) => (d.wh || 0) > 0);
      if (!nonzero.length) return 0;
      return Math.round(periodTotalWh.value / nonzero.length);
    });
    const chartRangeLabel = computed(() => {
      var _a;
      const c = (_a = solar.value) == null ? void 0 : _a.chart;
      if (!c) return "";
      const s = new Date(c.start), e = new Date(c.end);
      const sameYear = s.getFullYear() === e.getFullYear();
      const sFmt = sameYear ? s.toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) : s.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
      const eFmt = e.toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
      return `${sFmt} \u2013 ${eFmt}`;
    });
    const bucketLabel = computed(() => {
      var _a, _b;
      return ((_b = (_a = solar.value) == null ? void 0 : _a.chart) == null ? void 0 : _b.bucket) === "month" ? "per maand" : "per dag";
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a2;
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o;
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
      _push(`<div class="flex items-center gap-3 mb-6"><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "solar",
        size: 22
      }, null, _parent));
      _push(`</div><h1 class="text-2xl font-bold text-gray-900">Zonnepanelen</h1></div>`);
      if (unref(isLoading) && !unref(solar)) {
        _push(`<div class="py-16 text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (!((_a = unref(solar)) == null ? void 0 : _a.connected)) {
        _push(`<div class="section py-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "solar",
          size: 40,
          class: "mx-auto text-gray-300 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Nog niet gekoppeld</h2><p class="text-sm text-gray-500 max-w-sm mx-auto">${ssrInterpolate(unref(partner).name)} koppelt je zonnepanelen aan het monitoringplatform. Zodra dit klaar is, zie je hier je opbrengst en statistieken. </p></div>`);
      } else {
        _push(`<!--[--><div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6"><div class="rounded-2xl bg-white border border-gray-100 p-5"><p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Vandaag</p><p class="${ssrRenderClass([unref(todayDisplay).isPending ? "text-gray-400" : "text-gray-900", "mt-2 text-2xl font-semibold"])}">${ssrInterpolate(unref(todayDisplay).text)}</p><p class="mt-1 text-xs text-gray-400">`);
        if (unref(todayDisplay).isPending) {
          _push(`<!--[--> Je omvormer rapporteert meestal &#39;s avonds. <!--]-->`);
        } else {
          _push(`<!--[--> Opbrengst op ${ssrInterpolate((/* @__PURE__ */ new Date()).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }))}<!--]-->`);
        }
        _push(`</p></div><div class="rounded-2xl bg-white border border-gray-100 p-5"><p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Deze maand</p><p class="mt-2 text-2xl font-semibold text-gray-900">${ssrInterpolate(formatKwh((_b = unref(solar).yield) == null ? void 0 : _b.month_wh))}</p>`);
        if ((_c = unref(solar).yield) == null ? void 0 : _c.month_predicted_wh) {
          _push(`<p class="mt-1 text-xs text-gray-400"> Verwacht: ${ssrInterpolate(formatKwh(unref(solar).yield.month_predicted_wh, 0))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="rounded-2xl bg-white border border-gray-100 p-5"><p class="text-xs font-medium text-gray-500 uppercase tracking-wider">Dit jaar</p><p class="mt-2 text-2xl font-semibold text-gray-900">${ssrInterpolate(formatKwh((_d = unref(solar).yield) == null ? void 0 : _d.year_wh, 0))}</p></div></div>`);
        if (unref(solar).yield && !unref(solar).yield.has_any_recent_data) {
          _push(`<div class="mb-6 rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-800"><div class="flex items-start gap-2">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "info",
            size: 18,
            class: "shrink-0 mt-0.5 text-amber-600"
          }, null, _parent));
          _push(`<div><p class="font-medium">Wachten op eerste meetgegevens</p><p class="mt-0.5 text-xs text-amber-700"> Je installatie is succesvol gekoppeld aan Sundata. Zodra je omvormer data deelt, zie je hier de opbrengst. Dit kan tot 24 uur duren. </p></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="rounded-2xl bg-white border border-gray-100 p-5 mb-6"><div class="flex items-start justify-between gap-4 mb-4 flex-wrap"><div><h2 class="text-sm font-semibold text-gray-900">Opbrengstgrafiek</h2><p class="text-xs text-gray-400 mt-0.5">${ssrInterpolate(unref(chartRangeLabel))} \xB7 ${ssrInterpolate(unref(bucketLabel))} `);
        if (unref(periodTotalWh) > 0) {
          _push(`<span class="ml-1"> \xB7 totaal <strong class="text-gray-700">${ssrInterpolate(formatKwh(unref(periodTotalWh), 0))}</strong>`);
          if (unref(periodAverageWh) > 0) {
            _push(`<span class="text-gray-400"> \xB7 gem. ${ssrInterpolate(formatKwh(unref(periodAverageWh)))} ${ssrInterpolate(unref(bucketLabel))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</p></div></div><div class="mb-4 flex gap-1 rounded-xl bg-gray-100 p-1 overflow-x-auto"><!--[-->`);
        ssrRenderList(periodOptions, (opt) => {
          _push(`<button class="${ssrRenderClass([unref(currentPeriod) === opt.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"])}">${ssrInterpolate(opt.label)}</button>`);
        });
        _push(`<!--]--></div>`);
        if (unref(showCustomRange)) {
          _push(`<div class="mb-4 flex flex-wrap items-center gap-2"><div class="flex items-center gap-2"><label class="text-xs text-gray-500">Van</label><input${ssrRenderAttr("value", unref(customStart))} type="date" class="input !py-1 text-sm"></div><div class="flex items-center gap-2"><label class="text-xs text-gray-500">Tot</label><input${ssrRenderAttr("value", unref(customEnd))} type="date" class="input !py-1 text-sm"></div><button class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-40"${ssrIncludeBooleanAttr(!unref(customStart) || !unref(customEnd)) ? " disabled" : ""}> Toepassen </button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="${ssrRenderClass([{ "opacity-40": unref(isLoading) }, "flex items-end gap-0.5 h-32 relative"])}">`);
        if (unref(chartData).length) {
          _push(`<!--[-->`);
          ssrRenderList(unref(chartData), (d) => {
            var _a22;
            _push(`<div class="flex-1 rounded-sm bg-amber-200/60 hover:bg-amber-400 transition-colors relative group" style="${ssrRenderStyle({ height: `${Math.max(2, d.wh / unref(chartMax) * 100)}%` })}"${ssrRenderAttr("title", bucketTooltip(d.date, d.wh, ((_a22 = unref(solar).chart) == null ? void 0 : _a22.bucket) || "day"))}></div>`);
          });
          _push(`<!--]-->`);
        } else if (!unref(isLoading)) {
          _push(`<div class="flex-1 text-center text-xs text-gray-400 self-center"> Nog geen data in deze periode </div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(chartData).length) {
          _push(`<div class="mt-2 flex justify-between text-[10px] text-gray-400"><span>${ssrInterpolate(chartLabel(unref(chartData)[0].date, ((_e = unref(solar).chart) == null ? void 0 : _e.bucket) || "day"))}</span><span>${ssrInterpolate(chartLabel(unref(chartData)[unref(chartData).length - 1].date, ((_f = unref(solar).chart) == null ? void 0 : _f.bucket) || "day"))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="rounded-2xl bg-white border border-gray-100 p-5"><h2 class="text-sm font-semibold text-gray-900 mb-4">Installatie</h2><dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm"><div><dt class="text-xs text-gray-400 uppercase tracking-wider">Vermogen</dt><dd class="mt-0.5 text-gray-900">${ssrInterpolate(((_g = unref(solar).meter) == null ? void 0 : _g.peak_in_watt) ? (unref(solar).meter.peak_in_watt / 1e3).toFixed(2) + " kWp" : "\u2014")}</dd></div><div><dt class="text-xs text-gray-400 uppercase tracking-wider">Ori\xEBntatie</dt><dd class="mt-0.5 text-gray-900">${ssrInterpolate(((_h = unref(solar).meter) == null ? void 0 : _h.orientation_in_degrees) !== null && ((_i = unref(solar).meter) == null ? void 0 : _i.orientation_in_degrees) !== void 0 ? ORIENTATION_LABEL[unref(solar).meter.orientation_in_degrees] || `${unref(solar).meter.orientation_in_degrees}\xB0` : "\u2014")}</dd></div><div><dt class="text-xs text-gray-400 uppercase tracking-wider">Helling</dt><dd class="mt-0.5 text-gray-900">${ssrInterpolate((_a2 = (_j = unref(solar).meter) == null ? void 0 : _j.angle_in_degrees) != null ? _a2 : "\u2014")}\xB0</dd></div>`);
        if (((_k = unref(solar).product) == null ? void 0 : _k.brand) || ((_l = unref(solar).product) == null ? void 0 : _l.model)) {
          _push(`<div><dt class="text-xs text-gray-400 uppercase tracking-wider">Panelen</dt><dd class="mt-0.5 text-gray-900">${ssrInterpolate([unref(solar).product.brand, unref(solar).product.model].filter(Boolean).join(" "))}</dd></div>`);
        } else {
          _push(`<!---->`);
        }
        if ((_m = unref(solar).product) == null ? void 0 : _m.installation_date) {
          _push(`<div><dt class="text-xs text-gray-400 uppercase tracking-wider">Installatiedatum</dt><dd class="mt-0.5 text-gray-900">${ssrInterpolate(formatDate(unref(solar).product.installation_date))}</dd></div>`);
        } else {
          _push(`<!---->`);
        }
        if ((_n = unref(solar).plant) == null ? void 0 : _n.monitored_since) {
          _push(`<div><dt class="text-xs text-gray-400 uppercase tracking-wider">Gemonitord sinds</dt><dd class="mt-0.5 text-gray-900">${ssrInterpolate(formatDate(unref(solar).plant.monitored_since))}</dd></div>`);
        } else {
          _push(`<!---->`);
        }
        if ((_o = unref(solar).plant) == null ? void 0 : _o.address) {
          _push(`<div class="sm:col-span-2"><dt class="text-xs text-gray-400 uppercase tracking-wider">Adres</dt><dd class="mt-0.5 text-gray-900">${ssrInterpolate(unref(solar).plant.address.street)}, ${ssrInterpolate(unref(solar).plant.address.postal_code)} ${ssrInterpolate(unref(solar).plant.address.city)}</dd></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</dl></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/zonnepanelen.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=zonnepanelen-BilCT30g.mjs.map
