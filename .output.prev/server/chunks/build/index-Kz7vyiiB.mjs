import { u as usePartner, _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, computed, unref, withCtx, createVNode, createTextVNode, toDisplayString, openBlock, createBlock, createCommentVNode, Fragment, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderStyle, ssrRenderAttr } from 'vue/server-renderer';
import { u as useCurrentCustomer } from './useCurrentCustomer-Dbh6BR3o.mjs';
import { u as useSolarSummary } from './useSolarSummary-DIHH6MR8.mjs';
import { u as useCustomerProducts } from './useCustomerProducts-iW33pc1P.mjs';
import { u as useLaadpaalData } from './useLaadpaalData-B0lcg6fn.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const { customer, isLoading } = useCurrentCustomer();
    const { summary: solar } = useSolarSummary();
    const { evCharger, heatPump } = useCustomerProducts();
    const { data: laadpaal } = useLaadpaalData();
    const { data: warmtepomp } = useWarmtepompData();
    const tickets = ref([]);
    const openTickets = computed(() => tickets.value.filter((t) => t.status !== "opgelost" && t.status !== "gesloten"));
    const latestTicket = computed(() => tickets.value[0]);
    function fmtKwhShort(kwh) {
      if (kwh >= 1e3) return `${(kwh / 1e3).toFixed(1)} MWh`;
      if (kwh >= 10) return `${kwh.toFixed(0)} kWh`;
      return `${kwh.toFixed(1)} kWh`;
    }
    function fmtEuro(v) {
      return v.toFixed(2).replace(".", ",");
    }
    const greeting = computed(() => {
      const hour = (/* @__PURE__ */ new Date()).getHours();
      if (hour < 12) return "Goedemorgen";
      if (hour < 18) return "Goedemiddag";
      return "Goedenavond";
    });
    const firstName = computed(() => {
      var _a, _b;
      return ((_b = (_a = customer.value) == null ? void 0 : _a.full_name) == null ? void 0 : _b.split(" ")[0]) || "daar";
    });
    function formatKwh(wh) {
      const v = (wh || 0) / 1e3;
      if (v >= 1e3) return `${(v / 1e3).toFixed(1)} MWh`;
      if (v >= 10) return `${v.toFixed(0)} kWh`;
      return `${v.toFixed(1)} kWh`;
    }
    const mandateState = computed(() => {
      const c = customer.value;
      if (!c) return null;
      if (c.mollie_mandate_id) return "active";
      if (c.mandate_at) return "pending";
      if (c.mandate_skipped) return "skipped";
      if (c.accepted_at) return "not_set";
      return null;
    });
    function todayText() {
      var _a;
      const y = (_a = solar.value) == null ? void 0 : _a.yield;
      if (!y) return { text: "\u2014", pending: false };
      if (y.today_wh && y.today_wh > 0) return { text: formatKwh(y.today_wh), pending: false };
      if (y.has_any_recent_data) return { text: "Komt vanavond", pending: true };
      return { text: "Nog geen data", pending: true };
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f;
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      if (unref(isLoading)) {
        _push(`<div class="py-16 text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else {
        _push(`<!--[--><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">${ssrInterpolate(unref(greeting))}, ${ssrInterpolate(unref(firstName))}</h1><p class="mt-1 text-sm text-gray-500">Welkom bij je persoonlijke portaal.</p></div>`);
        if (unref(mandateState) && unref(mandateState) !== "active") {
          _push(`<div class="${ssrRenderClass([{
            "border-amber-200 bg-amber-50/70": unref(mandateState) === "pending",
            "border-red-200 bg-red-50/70": unref(mandateState) === "skipped" || unref(mandateState) === "not_set"
          }, "mb-6 rounded-2xl border p-4 flex items-start gap-3"])}"><div class="${ssrRenderClass([{
            "bg-amber-100 text-amber-700": unref(mandateState) === "pending",
            "bg-red-100 text-red-700": unref(mandateState) === "skipped" || unref(mandateState) === "not_set"
          }, "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"])}">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: unref(mandateState) === "pending" ? "clock" : "warning",
            size: 18
          }, null, _parent));
          _push(`</div><div class="min-w-0 flex-1">`);
          if (unref(mandateState) === "pending") {
            _push(`<!--[--><p class="text-sm font-semibold text-amber-900">Mandaat wordt bevestigd</p><p class="mt-0.5 text-xs text-amber-800/80"> We wachten op bevestiging van je bank. Doorgaans binnen een paar minuten. </p><!--]-->`);
          } else {
            _push(`<!--[--><p class="text-sm font-semibold text-red-900">Incasso nog instellen</p><p class="mt-0.5 text-xs text-red-800/80"> Zet je IBAN in zodat ${ssrInterpolate(unref(partner).name)} de servicekosten automatisch kan afschrijven. </p><!--]-->`);
          }
          _push(`</div>`);
          if (unref(mandateState) !== "pending") {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/welkom/incasso",
              class: "shrink-0 inline-flex items-center gap-1 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 whitespace-nowrap"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppIcon, {
                    name: "credit-card",
                    size: 12
                  }, null, _parent2, _scopeId));
                  _push2(` Instellen `);
                } else {
                  return [
                    createVNode(_component_AppIcon, {
                      name: "credit-card",
                      size: 12
                    }),
                    createTextVNode(" Instellen ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          } else {
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/klant/contracten",
              class: "shrink-0 text-xs font-semibold text-amber-900 hover:underline whitespace-nowrap"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(` Bekijken `);
                } else {
                  return [
                    createTextVNode(" Bekijken ")
                  ];
                }
              }),
              _: 1
            }, _parent));
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="section mb-6"><div class="flex items-center gap-4"><div class="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}">${ssrInterpolate(((_b = (_a = unref(customer)) == null ? void 0 : _a.full_name) == null ? void 0 : _b.charAt(0)) || "?")}</div><div><p class="font-medium text-gray-900">${ssrInterpolate((_c = unref(customer)) == null ? void 0 : _c.full_name)}</p><p class="text-sm text-gray-500">${ssrInterpolate((_d = unref(customer)) == null ? void 0 : _d.email)}</p></div></div></div>`);
        if ((_e = unref(solar)) == null ? void 0 : _e.connected) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/zonnepanelen",
            class: "mb-6 block rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-5 transition-shadow hover:shadow-sm no-underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a2, _b2, _c2, _d2, _e2, _f2, _g, _h, _i, _j;
              if (_push2) {
                _push2(`<div class="flex items-start justify-between"${_scopeId}><div class="flex items-start gap-3"${_scopeId}><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "solar",
                  size: 22
                }, null, _parent2, _scopeId));
                _push2(`</div><div${_scopeId}><p class="text-xs font-medium text-amber-700 uppercase tracking-wider"${_scopeId}>Zonnepanelen</p><p class="text-lg font-semibold text-gray-900"${_scopeId}>${ssrInterpolate((_a2 = unref(solar).product) == null ? void 0 : _a2.name)}</p>`);
                if ((_b2 = unref(solar).meter) == null ? void 0 : _b2.peak_in_watt) {
                  _push2(`<p class="text-xs text-gray-500"${_scopeId}>${ssrInterpolate((unref(solar).meter.peak_in_watt / 1e3).toFixed(1))} kWp `);
                  if ((_c2 = unref(solar).plant) == null ? void 0 : _c2.monitored_since) {
                    _push2(`<span${_scopeId}>\xB7 gemonitord sinds ${ssrInterpolate(new Date(unref(solar).plant.monitored_since).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" }))}</span>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 18,
                  class: "text-gray-400 mt-1"
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="mt-4 grid grid-cols-3 gap-3"${_scopeId}><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>Vandaag</p><p class="${ssrRenderClass([todayText().pending ? "text-gray-400" : "text-gray-900", "mt-1 text-base font-semibold"])}"${_scopeId}>${ssrInterpolate(todayText().text)}</p></div><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>Deze maand</p><p class="mt-1 text-base font-semibold text-gray-900"${_scopeId}>${ssrInterpolate(formatKwh((_d2 = unref(solar).yield) == null ? void 0 : _d2.month_wh))}</p></div><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>Dit jaar</p><p class="mt-1 text-base font-semibold text-gray-900"${_scopeId}>${ssrInterpolate(formatKwh((_e2 = unref(solar).yield) == null ? void 0 : _e2.year_wh))}</p></div></div>`);
                if (unref(solar).yield && !unref(solar).yield.has_any_recent_data) {
                  _push2(`<div class="mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-amber-700"${_scopeId}> Je installatie is gekoppeld. De eerste meetgegevens kunnen tot 24 uur duren. </div>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  createVNode("div", { class: "flex items-start justify-between" }, [
                    createVNode("div", { class: "flex items-start gap-3" }, [
                      createVNode("div", { class: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600" }, [
                        createVNode(_component_AppIcon, {
                          name: "solar",
                          size: 22
                        })
                      ]),
                      createVNode("div", null, [
                        createVNode("p", { class: "text-xs font-medium text-amber-700 uppercase tracking-wider" }, "Zonnepanelen"),
                        createVNode("p", { class: "text-lg font-semibold text-gray-900" }, toDisplayString((_f2 = unref(solar).product) == null ? void 0 : _f2.name), 1),
                        ((_g = unref(solar).meter) == null ? void 0 : _g.peak_in_watt) ? (openBlock(), createBlock("p", {
                          key: 0,
                          class: "text-xs text-gray-500"
                        }, [
                          createTextVNode(toDisplayString((unref(solar).meter.peak_in_watt / 1e3).toFixed(1)) + " kWp ", 1),
                          ((_h = unref(solar).plant) == null ? void 0 : _h.monitored_since) ? (openBlock(), createBlock("span", { key: 0 }, "\xB7 gemonitord sinds " + toDisplayString(new Date(unref(solar).plant.monitored_since).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" })), 1)) : createCommentVNode("", true)
                        ])) : createCommentVNode("", true)
                      ])
                    ]),
                    createVNode(_component_AppIcon, {
                      name: "chevron-right",
                      size: 18,
                      class: "text-gray-400 mt-1"
                    })
                  ]),
                  createVNode("div", { class: "mt-4 grid grid-cols-3 gap-3" }, [
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "Vandaag"),
                      createVNode("p", {
                        class: ["mt-1 text-base font-semibold", todayText().pending ? "text-gray-400" : "text-gray-900"]
                      }, toDisplayString(todayText().text), 3)
                    ]),
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "Deze maand"),
                      createVNode("p", { class: "mt-1 text-base font-semibold text-gray-900" }, toDisplayString(formatKwh((_i = unref(solar).yield) == null ? void 0 : _i.month_wh)), 1)
                    ]),
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "Dit jaar"),
                      createVNode("p", { class: "mt-1 text-base font-semibold text-gray-900" }, toDisplayString(formatKwh((_j = unref(solar).yield) == null ? void 0 : _j.year_wh)), 1)
                    ])
                  ]),
                  unref(solar).yield && !unref(solar).yield.has_any_recent_data ? (openBlock(), createBlock("div", {
                    key: 0,
                    class: "mt-3 rounded-lg bg-white/60 px-3 py-2 text-xs text-amber-700"
                  }, " Je installatie is gekoppeld. De eerste meetgegevens kunnen tot 24 uur duren. ")) : createCommentVNode("", true)
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(evCharger) && unref(evCharger).linked) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/laadpaal",
            class: "mb-6 block rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-cyan-50 p-5 transition-shadow hover:shadow-sm no-underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a2, _b2, _c2, _d2, _e2, _f2, _g, _h;
              if (_push2) {
                _push2(`<div class="flex items-start justify-between"${_scopeId}><div class="flex items-start gap-3"${_scopeId}><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "ev-charger",
                  size: 22
                }, null, _parent2, _scopeId));
                _push2(`</div><div${_scopeId}><p class="text-xs font-medium text-sky-700 uppercase tracking-wider"${_scopeId}>Laadpaal</p><p class="text-lg font-semibold text-gray-900"${_scopeId}>${ssrInterpolate(unref(evCharger).name || (unref(evCharger).brand && unref(evCharger).model ? `${unref(evCharger).brand} ${unref(evCharger).model}` : "Laadpaal"))}</p><p class="text-xs text-gray-500"${_scopeId}>`);
                if ((_a2 = unref(laadpaal)) == null ? void 0 : _a2.online) {
                  _push2(`<span class="inline-flex items-center gap-1 text-green-700"${_scopeId}><span class="h-1.5 w-1.5 rounded-full bg-green-500"${_scopeId}></span> Online </span>`);
                } else if (unref(laadpaal) && unref(laadpaal).online === false) {
                  _push2(`<span class="inline-flex items-center gap-1 text-red-700"${_scopeId}><span class="h-1.5 w-1.5 rounded-full bg-red-500"${_scopeId}></span> Offline </span>`);
                } else {
                  _push2(`<span${_scopeId}>Gekoppeld met Easee</span>`);
                }
                if (((_b2 = unref(laadpaal)) == null ? void 0 : _b2.op_mode_label) && unref(laadpaal).op_mode_label !== "Onbekend") {
                  _push2(`<span${_scopeId}> \xB7 ${ssrInterpolate(unref(laadpaal).op_mode_label)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</p></div></div>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 18,
                  class: "text-gray-400 mt-1"
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="mt-4 grid grid-cols-3 gap-3"${_scopeId}><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>Deze maand</p><p class="mt-1 text-base font-semibold text-gray-900 tabular-nums"${_scopeId}>${ssrInterpolate(unref(laadpaal) ? fmtKwhShort(((_c2 = unref(laadpaal).current_month) == null ? void 0 : _c2.kwh) || 0) : "\u2026")}</p></div><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>Kosten</p><p class="mt-1 text-base font-semibold text-gray-900 tabular-nums"${_scopeId}> \u20AC ${ssrInterpolate(unref(laadpaal) ? fmtEuro(((_d2 = unref(laadpaal).current_month) == null ? void 0 : _d2.cost_eur) || 0) : "\u2026")}</p></div><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>Sinds installatie</p><p class="mt-1 text-base font-semibold text-gray-900 tabular-nums"${_scopeId}>${ssrInterpolate(unref(laadpaal) ? fmtKwhShort(unref(laadpaal).lifetime_kwh || 0) : "\u2026")}</p></div></div>`);
              } else {
                return [
                  createVNode("div", { class: "flex items-start justify-between" }, [
                    createVNode("div", { class: "flex items-start gap-3" }, [
                      createVNode("div", { class: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600" }, [
                        createVNode(_component_AppIcon, {
                          name: "ev-charger",
                          size: 22
                        })
                      ]),
                      createVNode("div", null, [
                        createVNode("p", { class: "text-xs font-medium text-sky-700 uppercase tracking-wider" }, "Laadpaal"),
                        createVNode("p", { class: "text-lg font-semibold text-gray-900" }, toDisplayString(unref(evCharger).name || (unref(evCharger).brand && unref(evCharger).model ? `${unref(evCharger).brand} ${unref(evCharger).model}` : "Laadpaal")), 1),
                        createVNode("p", { class: "text-xs text-gray-500" }, [
                          ((_e2 = unref(laadpaal)) == null ? void 0 : _e2.online) ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "inline-flex items-center gap-1 text-green-700"
                          }, [
                            createVNode("span", { class: "h-1.5 w-1.5 rounded-full bg-green-500" }),
                            createTextVNode(" Online ")
                          ])) : unref(laadpaal) && unref(laadpaal).online === false ? (openBlock(), createBlock("span", {
                            key: 1,
                            class: "inline-flex items-center gap-1 text-red-700"
                          }, [
                            createVNode("span", { class: "h-1.5 w-1.5 rounded-full bg-red-500" }),
                            createTextVNode(" Offline ")
                          ])) : (openBlock(), createBlock("span", { key: 2 }, "Gekoppeld met Easee")),
                          ((_f2 = unref(laadpaal)) == null ? void 0 : _f2.op_mode_label) && unref(laadpaal).op_mode_label !== "Onbekend" ? (openBlock(), createBlock("span", { key: 3 }, " \xB7 " + toDisplayString(unref(laadpaal).op_mode_label), 1)) : createCommentVNode("", true)
                        ])
                      ])
                    ]),
                    createVNode(_component_AppIcon, {
                      name: "chevron-right",
                      size: 18,
                      class: "text-gray-400 mt-1"
                    })
                  ]),
                  createVNode("div", { class: "mt-4 grid grid-cols-3 gap-3" }, [
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "Deze maand"),
                      createVNode("p", { class: "mt-1 text-base font-semibold text-gray-900 tabular-nums" }, toDisplayString(unref(laadpaal) ? fmtKwhShort(((_g = unref(laadpaal).current_month) == null ? void 0 : _g.kwh) || 0) : "\u2026"), 1)
                    ]),
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "Kosten"),
                      createVNode("p", { class: "mt-1 text-base font-semibold text-gray-900 tabular-nums" }, " \u20AC " + toDisplayString(unref(laadpaal) ? fmtEuro(((_h = unref(laadpaal).current_month) == null ? void 0 : _h.cost_eur) || 0) : "\u2026"), 1)
                    ]),
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "Sinds installatie"),
                      createVNode("p", { class: "mt-1 text-base font-semibold text-gray-900 tabular-nums" }, toDisplayString(unref(laadpaal) ? fmtKwhShort(unref(laadpaal).lifetime_kwh || 0) : "\u2026"), 1)
                    ])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(heatPump) && unref(heatPump).linked) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/warmtepomp",
            class: "mb-6 block rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-orange-50 p-5 transition-shadow hover:shadow-sm no-underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a2, _b2, _c2, _d2, _e2, _f2, _g, _h;
              if (_push2) {
                _push2(`<div class="flex items-start justify-between"${_scopeId}><div class="flex items-start gap-3"${_scopeId}><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "heat-pump",
                  size: 22
                }, null, _parent2, _scopeId));
                _push2(`</div><div${_scopeId}><p class="text-xs font-medium text-orange-700 uppercase tracking-wider"${_scopeId}>Warmtepomp</p><p class="text-lg font-semibold text-gray-900"${_scopeId}>${ssrInterpolate(unref(heatPump).name || (unref(heatPump).brand && unref(heatPump).model ? `${unref(heatPump).brand} ${unref(heatPump).model}` : "Warmtepomp"))}</p><p class="text-xs text-gray-500"${_scopeId}>`);
                if ((_a2 = unref(warmtepomp)) == null ? void 0 : _a2.state_label) {
                  _push2(`<span class="inline-flex items-center gap-1 text-orange-700"${_scopeId}><span class="h-1.5 w-1.5 rounded-full bg-orange-500"${_scopeId}></span> ${ssrInterpolate(unref(warmtepomp).state_label)}</span>`);
                } else {
                  _push2(`<span${_scopeId}>Gekoppeld met Weheat</span>`);
                }
                _push2(`</p></div></div>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 18,
                  class: "text-gray-400 mt-1"
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="mt-4 grid grid-cols-3 gap-3"${_scopeId}><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>Binnen</p><p class="mt-1 text-base font-semibold text-gray-900 tabular-nums"${_scopeId}>${ssrInterpolate(((_b2 = unref(warmtepomp)) == null ? void 0 : _b2.room_c) != null ? `${unref(warmtepomp).room_c.toFixed(1)} \xB0C` : "\u2026")}</p></div><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>Aanvoer</p><p class="mt-1 text-base font-semibold text-gray-900 tabular-nums"${_scopeId}>${ssrInterpolate(((_c2 = unref(warmtepomp)) == null ? void 0 : _c2.water_out_c) != null ? `${unref(warmtepomp).water_out_c.toFixed(1)} \xB0C` : "\u2026")}</p></div><div class="rounded-xl bg-white/60 p-3"${_scopeId}><p class="text-[11px] font-medium text-gray-500 uppercase tracking-wider"${_scopeId}>SCOP</p><p class="mt-1 text-base font-semibold text-gray-900 tabular-nums"${_scopeId}>${ssrInterpolate(((_d2 = unref(warmtepomp)) == null ? void 0 : _d2.scop) ? unref(warmtepomp).scop.toFixed(1) : "\u2026")}</p></div></div>`);
              } else {
                return [
                  createVNode("div", { class: "flex items-start justify-between" }, [
                    createVNode("div", { class: "flex items-start gap-3" }, [
                      createVNode("div", { class: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600" }, [
                        createVNode(_component_AppIcon, {
                          name: "heat-pump",
                          size: 22
                        })
                      ]),
                      createVNode("div", null, [
                        createVNode("p", { class: "text-xs font-medium text-orange-700 uppercase tracking-wider" }, "Warmtepomp"),
                        createVNode("p", { class: "text-lg font-semibold text-gray-900" }, toDisplayString(unref(heatPump).name || (unref(heatPump).brand && unref(heatPump).model ? `${unref(heatPump).brand} ${unref(heatPump).model}` : "Warmtepomp")), 1),
                        createVNode("p", { class: "text-xs text-gray-500" }, [
                          ((_e2 = unref(warmtepomp)) == null ? void 0 : _e2.state_label) ? (openBlock(), createBlock("span", {
                            key: 0,
                            class: "inline-flex items-center gap-1 text-orange-700"
                          }, [
                            createVNode("span", { class: "h-1.5 w-1.5 rounded-full bg-orange-500" }),
                            createTextVNode(" " + toDisplayString(unref(warmtepomp).state_label), 1)
                          ])) : (openBlock(), createBlock("span", { key: 1 }, "Gekoppeld met Weheat"))
                        ])
                      ])
                    ]),
                    createVNode(_component_AppIcon, {
                      name: "chevron-right",
                      size: 18,
                      class: "text-gray-400 mt-1"
                    })
                  ]),
                  createVNode("div", { class: "mt-4 grid grid-cols-3 gap-3" }, [
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "Binnen"),
                      createVNode("p", { class: "mt-1 text-base font-semibold text-gray-900 tabular-nums" }, toDisplayString(((_f2 = unref(warmtepomp)) == null ? void 0 : _f2.room_c) != null ? `${unref(warmtepomp).room_c.toFixed(1)} \xB0C` : "\u2026"), 1)
                    ]),
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "Aanvoer"),
                      createVNode("p", { class: "mt-1 text-base font-semibold text-gray-900 tabular-nums" }, toDisplayString(((_g = unref(warmtepomp)) == null ? void 0 : _g.water_out_c) != null ? `${unref(warmtepomp).water_out_c.toFixed(1)} \xB0C` : "\u2026"), 1)
                    ]),
                    createVNode("div", { class: "rounded-xl bg-white/60 p-3" }, [
                      createVNode("p", { class: "text-[11px] font-medium text-gray-500 uppercase tracking-wider" }, "SCOP"),
                      createVNode("p", { class: "mt-1 text-base font-semibold text-gray-900 tabular-nums" }, toDisplayString(((_h = unref(warmtepomp)) == null ? void 0 : _h.scop) ? unref(warmtepomp).scop.toFixed(1) : "\u2026"), 1)
                    ])
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/service",
          class: "mb-6 block rounded-2xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-sm no-underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="flex items-start justify-between gap-3"${_scopeId}><div class="flex items-start gap-3"${_scopeId}><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "tool",
                size: 22
              }, null, _parent2, _scopeId));
              _push2(`</div><div${_scopeId}><p class="text-xs font-medium text-indigo-700 uppercase tracking-wider"${_scopeId}>Service</p><p class="text-lg font-semibold text-gray-900"${_scopeId}>`);
              if (unref(openTickets).length) {
                _push2(`<!--[-->${ssrInterpolate(unref(openTickets).length)} openstaande melding${ssrInterpolate(unref(openTickets).length === 1 ? "" : "en")}<!--]-->`);
              } else if (unref(tickets).length) {
                _push2(`<!--[--> Alle meldingen afgehandeld <!--]-->`);
              } else {
                _push2(`<!--[--> Hulp nodig? <!--]-->`);
              }
              _push2(`</p><p class="text-xs text-gray-500 mt-0.5"${_scopeId}>`);
              if (unref(openTickets).length) {
                _push2(`<!--[--> Laatst bijgewerkt: ${ssrInterpolate(new Date(unref(latestTicket).updated_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }))}<!--]-->`);
              } else {
                _push2(`<!--[--> Maak een melding aan of neem contact op met ${ssrInterpolate(unref(partner).name)}<!--]-->`);
              }
              _push2(`</p></div></div>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 18,
                class: "text-gray-400 mt-1"
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            } else {
              return [
                createVNode("div", { class: "flex items-start justify-between gap-3" }, [
                  createVNode("div", { class: "flex items-start gap-3" }, [
                    createVNode("div", { class: "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600" }, [
                      createVNode(_component_AppIcon, {
                        name: "tool",
                        size: 22
                      })
                    ]),
                    createVNode("div", null, [
                      createVNode("p", { class: "text-xs font-medium text-indigo-700 uppercase tracking-wider" }, "Service"),
                      createVNode("p", { class: "text-lg font-semibold text-gray-900" }, [
                        unref(openTickets).length ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                          createTextVNode(toDisplayString(unref(openTickets).length) + " openstaande melding" + toDisplayString(unref(openTickets).length === 1 ? "" : "en"), 1)
                        ], 64)) : unref(tickets).length ? (openBlock(), createBlock(Fragment, { key: 1 }, [
                          createTextVNode(" Alle meldingen afgehandeld ")
                        ], 64)) : (openBlock(), createBlock(Fragment, { key: 2 }, [
                          createTextVNode(" Hulp nodig? ")
                        ], 64))
                      ]),
                      createVNode("p", { class: "text-xs text-gray-500 mt-0.5" }, [
                        unref(openTickets).length ? (openBlock(), createBlock(Fragment, { key: 0 }, [
                          createTextVNode(" Laatst bijgewerkt: " + toDisplayString(new Date(unref(latestTicket).updated_at).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })), 1)
                        ], 64)) : (openBlock(), createBlock(Fragment, { key: 1 }, [
                          createTextVNode(" Maak een melding aan of neem contact op met " + toDisplayString(unref(partner).name), 1)
                        ], 64))
                      ])
                    ])
                  ]),
                  createVNode(_component_AppIcon, {
                    name: "chevron-right",
                    size: 18,
                    class: "text-gray-400 mt-1"
                  })
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
        if (!((_f = unref(solar)) == null ? void 0 : _f.connected) && !(unref(evCharger) && unref(evCharger).linked) && !(unref(heatPump) && unref(heatPump).linked)) {
          _push(`<div class="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center mb-6"><div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "home",
            size: 28,
            class: "text-gray-400"
          }, null, _parent));
          _push(`</div><h2 class="text-lg font-semibold text-gray-900 mb-2">Je portaal wordt ingericht</h2><p class="text-sm text-gray-500 max-w-md mx-auto"> Je installateur is bezig met het koppelen van je systeem. Zodra dit klaar is, zie je hier je energiegegevens, monitoring en meer. </p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="section"><h3 class="text-sm font-semibold text-gray-900 mb-3">Contact met ${ssrInterpolate(unref(partner).name)}</h3><div class="flex flex-wrap gap-4 text-sm text-gray-600">`);
        if (unref(partner).support_email) {
          _push(`<span class="flex items-center gap-1.5">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "mail",
            size: 14,
            class: "text-gray-400"
          }, null, _parent));
          _push(`<a${ssrRenderAttr("href", "mailto:" + unref(partner).support_email)} class="hover:underline">${ssrInterpolate(unref(partner).support_email)}</a></span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(partner).support_phone) {
          _push(`<span class="flex items-center gap-1.5">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "phone",
            size: 14,
            class: "text-gray-400"
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(partner).support_phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Kz7vyiiB.mjs.map
