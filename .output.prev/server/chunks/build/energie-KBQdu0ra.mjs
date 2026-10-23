import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { u as usePartner, _ as _sfc_main$5, b as useMockData, a as useConfirm } from './server.mjs';
import { defineComponent, computed, ref, withCtx, createVNode, createTextVNode, unref, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrInterpolate, ssrRenderStyle, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { u as useCurrentCustomer } from './useCurrentCustomer-Dbh6BR3o.mjs';
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

function useSmartMeter(customerId) {
  const mock = useMockData();
  return {
    meter: computed(() => mock.getCustomerMeter(customerId)),
    getReadings: (meterId) => mock.getMeterReadings(meterId),
    async linkMeter(partnerId, postcode, meterId) {
      return mock.linkSmartMeter(customerId, partnerId, postcode, meterId);
    },
    unlinkMeter() {
      mock.unlinkSmartMeter(customerId);
    }
  };
}
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "SmartMeterSetup",
  __ssrInlineRender: true,
  setup(__props) {
    var _a;
    const { partner } = usePartner();
    const { customer } = useCurrentCustomer();
    const customerId = computed(() => {
      var _a2;
      return ((_a2 = customer.value) == null ? void 0 : _a2.id) || "";
    });
    const { meter } = useSmartMeter(customerId.value);
    const postcode = ref("");
    const meterId = ref("");
    const isLinking = ref(false);
    const showSetup = ref(false);
    const errorMessage = ref("");
    if ((_a = customer.value) == null ? void 0 : _a.postal_code) {
      postcode.value = customer.value.postal_code;
    }
    useConfirm();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "rounded-xl border border-gray-100 bg-white p-5" }, _attrs))}>`);
      if (unref(meter) && unref(meter).status === "active") {
        _push(`<div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "zap",
          size: 20
        }, null, _parent));
        _push(`</div><div><p class="text-sm font-medium text-gray-900">Slimme meter gekoppeld</p><p class="text-xs text-gray-500"> Postcode ${ssrInterpolate(unref(meter).postcode)} \xB7 Meter ${ssrInterpolate(unref(meter).meter_id)}</p></div></div><div class="flex items-center gap-2"><span class="badge badge--green"><span class="status-dot status-dot--active"></span> Actief </span><button class="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="Ontkoppelen">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "x",
          size: 16
        }, null, _parent));
        _push(`</button></div></div>`);
      } else if (unref(meter) && unref(meter).status === "pending") {
        _push(`<div class="flex items-center gap-3"><div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-50 text-yellow-600"><svg class="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div><div><p class="text-sm font-medium text-gray-900">Slimme meter wordt gekoppeld...</p><p class="text-xs text-gray-500">Dit kan enkele momenten duren</p></div></div>`);
      } else if (!unref(showSetup)) {
        _push(`<div class="text-center py-4"><div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400 mx-auto mb-3">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "zap",
          size: 24
        }, null, _parent));
        _push(`</div><h3 class="text-sm font-semibold text-gray-900 mb-1">Slimme meter koppelen</h3><p class="text-xs text-gray-500 mb-4 max-w-xs mx-auto"> Koppel je slimme meter voor inzicht in je energieverbruik, teruglevering en gasverbruik. </p><button class="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "plus",
          size: 16
        }, null, _parent));
        _push(` Meter koppelen </button></div>`);
      } else {
        _push(`<!--[--><h3 class="text-sm font-semibold text-gray-900 mb-1">Slimme meter koppelen</h3><p class="text-xs text-gray-500 mb-4"> Vul je postcode en de laatste 6 cijfers van je slimme meter in. Deze vind je op de meter zelf of op je energierekening. </p><form class="space-y-3"><div class="grid grid-cols-2 gap-3"><div><label class="label">Postcode</label><input${ssrRenderAttr("value", unref(postcode))} type="text" class="input" placeholder="1234 AB" required maxlength="7"></div><div><label class="label">Laatste 6 cijfers meter</label><input${ssrRenderAttr("value", unref(meterId))} type="text" class="input font-mono" placeholder="123456" required maxlength="6" pattern="\\d{6}" inputmode="numeric"></div></div>`);
        if (unref(errorMessage)) {
          _push(`<p class="text-xs text-red-500">${ssrInterpolate(unref(errorMessage))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="flex items-center gap-2 pt-1"><button type="submit" class="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}"${ssrIncludeBooleanAttr(unref(isLinking) || !unref(postcode) || !unref(meterId)) ? " disabled" : ""}>`);
        if (unref(isLinking)) {
          _push(`<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>`);
        } else {
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "zap",
            size: 16
          }, null, _parent));
        }
        _push(` ${ssrInterpolate(unref(isLinking) ? "Koppelen..." : "Koppelen via Sundata")}</button><button type="button" class="rounded-xl px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"> Annuleren </button></div></form><div class="mt-4 rounded-lg bg-blue-50 px-3 py-2"><p class="text-xs text-blue-700"><strong>Tip:</strong> De 6 cijfers vind je op je slimme meter na de schuine streep (/). Staat vaak op het display of achter het klepje. </p></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/meter/SmartMeterSetup.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "energie",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const { customer } = useCurrentCustomer();
    const customerId = computed(() => {
      var _a;
      return ((_a = customer.value) == null ? void 0 : _a.id) || "";
    });
    const { meter, getReadings } = useSmartMeter(customerId.value);
    const readings = computed(() => meter.value ? getReadings(meter.value.id) : []);
    const period = ref("week");
    const filteredReadings = computed(() => {
      const now = /* @__PURE__ */ new Date();
      let since;
      if (period.value === "dag") {
        since = new Date(now);
        since.setHours(0, 0, 0, 0);
      } else if (period.value === "week") {
        since = new Date(now);
        since.setDate(since.getDate() - 7);
      } else {
        since = new Date(now);
        since.setMonth(since.getMonth() - 1);
      }
      return readings.value.filter((r) => new Date(r.timestamp) >= since);
    });
    const stats = computed(() => {
      const data = filteredReadings.value;
      if (!data.length) return { consumption: 0, production: 0, net: 0, gas: 0, selfConsumption: 0 };
      const consumption = data.reduce((sum, r) => sum + r.consumption_wh, 0);
      const production = data.reduce((sum, r) => sum + r.production_wh, 0);
      const gas = data.reduce((sum, r) => sum + (r.gas_m3 || 0), 0);
      const net = consumption - production;
      const selfConsumption = production > 0 ? Math.min(100, Math.round(Math.min(consumption, production) / production * 100)) : 0;
      return {
        consumption: Math.round(consumption / 1e3) / 1,
        // kWh
        production: Math.round(production / 1e3) / 1,
        net: Math.round(net / 1e3) / 1,
        gas: Math.round(gas * 10) / 10,
        selfConsumption
      };
    });
    const dailyData = computed(() => {
      const days = /* @__PURE__ */ new Map();
      for (const r of filteredReadings.value) {
        const day = r.timestamp.slice(0, 10);
        const existing = days.get(day) || { consumption: 0, production: 0, gas: 0 };
        existing.consumption += r.consumption_wh / 1e3;
        existing.production += r.production_wh / 1e3;
        existing.gas += r.gas_m3 || 0;
        days.set(day, existing);
      }
      return Array.from(days.entries()).map(([date, data]) => ({
        date,
        label: new Date(date).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" }),
        consumption: Math.round(data.consumption * 10) / 10,
        production: Math.round(data.production * 10) / 10,
        gas: Math.round(data.gas * 10) / 10
      }));
    });
    const maxKwh = computed(() => {
      let max = 1;
      for (const d of dailyData.value) {
        max = Math.max(max, d.consumption, d.production);
      }
      return max;
    });
    function formatKwh(v) {
      return v.toFixed(1).replace(".", ",");
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      const _component_SmartMeterSetup = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6">`);
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
      _push(`<div class="flex items-center justify-between"><div class="flex items-center gap-3"><div class="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "zap",
        size: 22
      }, null, _parent));
      _push(`</div><h1 class="text-2xl font-bold text-gray-900">Energie-inzichten</h1></div><div class="flex gap-2"><a href="/api/reports/energy?period=month" target="_blank" class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "download",
        size: 14
      }, null, _parent));
      _push(` Maandrapport </a><a href="/api/reports/energy?period=year" target="_blank" class="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "download",
        size: 14
      }, null, _parent));
      _push(` Jaaroverzicht </a></div></div></div><div class="mb-6">`);
      _push(ssrRenderComponent(_component_SmartMeterSetup, null, null, _parent));
      _push(`</div>`);
      if (!unref(meter) || unref(meter).status !== "active") {
        _push(`<div class="card py-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "activity",
          size: 40,
          class: "mx-auto text-gray-300 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen energiedata</h2><p class="text-sm text-gray-500">Koppel je slimme meter hierboven om je verbruik te bekijken.</p></div>`);
      } else {
        _push(`<!--[--><div class="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6"><!--[-->`);
        ssrRenderList(["dag", "week", "maand"], (p) => {
          _push(`<button class="${ssrRenderClass([unref(period) === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors capitalize"])}">${ssrInterpolate(p === "dag" ? "Vandaag" : p === "week" ? "Week" : "Maand")}</button>`);
        });
        _push(`<!--]--></div><div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6"><div class="card !p-4 text-center"><p class="text-xs text-gray-500 mb-1">Verbruik</p><p class="text-xl font-bold text-gray-900">${ssrInterpolate(formatKwh(unref(stats).consumption))}</p><p class="text-xs text-gray-400">kWh</p></div><div class="card !p-4 text-center"><p class="text-xs text-gray-500 mb-1">Opwek</p><p class="text-xl font-bold text-amber-600">${ssrInterpolate(formatKwh(unref(stats).production))}</p><p class="text-xs text-gray-400">kWh</p></div><div class="card !p-4 text-center"><p class="text-xs text-gray-500 mb-1">${ssrInterpolate(unref(stats).net > 0 ? "Netto afname" : "Netto levering")}</p><p class="${ssrRenderClass([unref(stats).net > 0 ? "text-red-500" : "text-green-600", "text-xl font-bold"])}">${ssrInterpolate(formatKwh(Math.abs(unref(stats).net)))}</p><p class="text-xs text-gray-400">kWh</p></div><div class="card !p-4 text-center"><p class="text-xs text-gray-500 mb-1">Gas</p><p class="text-xl font-bold text-blue-600">${ssrInterpolate(unref(stats).gas.toFixed(1).replace(".", ","))}</p><p class="text-xs text-gray-400">m\xB3</p></div></div>`);
        if (unref(stats).production > 0) {
          _push(`<div class="card !p-4 mb-6"><div class="flex items-center justify-between mb-2"><p class="text-sm font-medium text-gray-900">Eigen verbruik</p><p class="text-sm font-bold" style="${ssrRenderStyle({ color: unref(partner).primary_color })}">${ssrInterpolate(unref(stats).selfConsumption)}%</p></div><div class="h-2 rounded-full bg-gray-100 overflow-hidden"><div class="h-full rounded-full transition-all duration-500" style="${ssrRenderStyle({ width: unref(stats).selfConsumption + "%", backgroundColor: unref(partner).primary_color })}"></div></div><p class="text-xs text-gray-400 mt-1.5"> Van de ${ssrInterpolate(formatKwh(unref(stats).production))} kWh opgewekte energie gebruik je ${ssrInterpolate(unref(stats).selfConsumption)}% zelf </p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="card"><h3 class="text-sm font-semibold text-gray-900 mb-4">${ssrInterpolate(unref(period) === "dag" ? "Per uur" : "Per dag")}</h3>`);
        if (unref(dailyData).length === 0) {
          _push(`<div class="py-8 text-center text-sm text-gray-400"> Geen data beschikbaar </div>`);
        } else {
          _push(`<div class="space-y-3"><!--[-->`);
          ssrRenderList(unref(dailyData), (day) => {
            _push(`<div class="flex items-center gap-3"><span class="w-16 shrink-0 text-xs text-gray-500 text-right">${ssrInterpolate(day.label)}</span><div class="flex-1 space-y-1"><div class="flex items-center gap-2"><div class="h-3 rounded-full bg-gray-200 transition-all duration-300" style="${ssrRenderStyle({ width: day.consumption / unref(maxKwh) * 100 + "%", minWidth: "4px" })}"></div><span class="text-[11px] text-gray-500 shrink-0">${ssrInterpolate(formatKwh(day.consumption))}</span></div><div class="flex items-center gap-2"><div class="h-3 rounded-full bg-amber-400 transition-all duration-300" style="${ssrRenderStyle({ width: day.production / unref(maxKwh) * 100 + "%", minWidth: "4px" })}"></div><span class="text-[11px] text-amber-600 shrink-0">${ssrInterpolate(formatKwh(day.production))}</span></div></div></div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`<div class="mt-4 pt-3 border-t border-gray-100 flex items-center gap-4"><div class="flex items-center gap-1.5"><div class="h-2.5 w-2.5 rounded-full bg-gray-200"></div><span class="text-xs text-gray-500">Verbruik (kWh)</span></div><div class="flex items-center gap-1.5"><div class="h-2.5 w-2.5 rounded-full bg-amber-400"></div><span class="text-xs text-gray-500">Opwek (kWh)</span></div></div></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/energie.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=energie-KBQdu0ra.mjs.map
