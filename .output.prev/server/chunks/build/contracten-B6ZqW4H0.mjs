import { u as usePartner, _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, computed, unref, withCtx, createTextVNode, createVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderClass, ssrRenderList } from 'vue/server-renderer';
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
  __name: "contracten",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const loading = ref(true);
    const error = ref("");
    const data = ref(null);
    function euros(cents) {
      return "\u20AC " + (cents / 100).toFixed(2).replace(".", ",");
    }
    function fmtDate(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
      } catch {
        return "";
      }
    }
    function iconFor(line) {
      switch (line.module_type) {
        case "solar_panel":
          return "solar";
        case "heat_pump":
          return "heat-pump";
        case "ev_charger":
          return "ev-charger";
        case "battery":
          return "battery";
        default:
          return "puzzle";
      }
    }
    const intervalLabel = computed(() => {
      if (!data.value) return "";
      if (data.value.billing_interval === "yearly") {
        const m = data.value.yearly_discount_months;
        return m > 0 ? `Per jaar (${m === 1 ? "1 maand" : `${m} maanden`} korting)` : "Per jaar";
      }
      return "Per maand";
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">Contracten</h1><p class="mt-1 text-sm text-gray-500">Je servicecontract met ${ssrInterpolate(unref(partner).name)} en de status van je automatische incasso.</p></div>`);
      if (unref(loading)) {
        _push(`<div class="py-12 text-center"><div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="card border-red-200 bg-red-50 text-sm text-red-800" role="alert">${ssrInterpolate(unref(error))}</div>`);
      } else if (unref(data)) {
        _push(`<!--[-->`);
        if ((_a = unref(data).trial) == null ? void 0 : _a.active) {
          _push(`<div class="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5"><div class="flex items-start gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check-circle",
            size: 20
          }, null, _parent));
          _push(`</div><div><p class="text-base font-semibold text-emerald-900"> Je zit in een gratis proefperiode`);
          if (unref(data).trial.months) {
            _push(`<!--[--> van ${ssrInterpolate(unref(data).trial.months)} ${ssrInterpolate(unref(data).trial.months === 1 ? "maand" : "maanden")}<!--]-->`);
          } else {
            _push(`<!---->`);
          }
          _push(`</p><p class="mt-0.5 text-sm text-emerald-800/80"> Eerste afschrijving op <strong>${ssrInterpolate(fmtDate(unref(data).trial.ends_at))}</strong>. Tot dan betaal je niets. </p></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(data).mandate) {
          _push(`<div class="${ssrRenderClass([{
            "border-green-200 bg-green-50/60": unref(data).mandate.state === "mandate_active",
            "border-amber-200 bg-amber-50/60": unref(data).mandate.state === "mandate_pending",
            "border-red-200 bg-red-50/60": unref(data).mandate.state === "mandate_not_set" || unref(data).mandate.state === "mandate_skipped"
          }, "mb-6 rounded-2xl border p-5"])}"><div class="flex items-start gap-3"><div class="${ssrRenderClass([{
            "bg-green-100 text-green-700": unref(data).mandate.state === "mandate_active",
            "bg-amber-100 text-amber-700": unref(data).mandate.state === "mandate_pending",
            "bg-red-100 text-red-700": unref(data).mandate.state === "mandate_not_set" || unref(data).mandate.state === "mandate_skipped"
          }, "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"])}">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: unref(data).mandate.state === "mandate_active" ? "check-circle" : unref(data).mandate.state === "mandate_pending" ? "clock" : "warning",
            size: 20
          }, null, _parent));
          _push(`</div><div class="min-w-0 flex-1">`);
          if (unref(data).mandate.state === "mandate_active") {
            _push(`<!--[--><p class="text-base font-semibold text-green-900">Automatische incasso is actief</p><p class="mt-0.5 text-sm text-green-800/80"> Je ${ssrInterpolate(unref(data).billing_interval === "yearly" ? "jaarbedrag" : "maandbedrag")} wordt automatisch ge\xEFncasseerd. Bekijk losse afschrijvingen op je `);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/klant/facturen",
              class: "underline hover:text-green-900"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`facturen-pagina`);
                } else {
                  return [
                    createTextVNode("facturen-pagina")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`. </p><!--]-->`);
          } else if (unref(data).mandate.state === "mandate_pending") {
            _push(`<!--[--><p class="text-base font-semibold text-amber-900">Mandaat wordt bevestigd</p><p class="mt-0.5 text-sm text-amber-800/80"> Je IBAN is ingediend op ${ssrInterpolate(fmtDate(unref(data).mandate.mandate_at))}. We wachten op bevestiging van je bank \u2014 meestal binnen een paar minuten. </p><!--]-->`);
          } else if (unref(data).mandate.state === "mandate_skipped") {
            _push(`<!--[--><p class="text-base font-semibold text-red-900">Incasso staat nog niet aan</p><p class="mt-0.5 mb-3 text-sm text-red-800/80"> Je hebt eerder gekozen om dit later te regelen. Stel je IBAN in zodat je ${ssrInterpolate(unref(partner).name)}-servicekosten automatisch worden afgeschreven. </p>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/welkom/incasso",
              class: "inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppIcon, {
                    name: "credit-card",
                    size: 14
                  }, null, _parent2, _scopeId));
                  _push2(` Incasso instellen `);
                } else {
                  return [
                    createVNode(_component_AppIcon, {
                      name: "credit-card",
                      size: 14
                    }),
                    createTextVNode(" Incasso instellen ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`<!--]-->`);
          } else {
            _push(`<!--[--><p class="text-base font-semibold text-red-900">Incasso nog instellen</p><p class="mt-0.5 mb-3 text-sm text-red-800/80"> Je hebt akkoord gegeven op ${ssrInterpolate(unref(data).accepted_at ? `het servicecontract op ${fmtDate(unref(data).accepted_at)}` : "het servicecontract")}, maar je IBAN is nog niet ingesteld. Doe dit nu zodat ${ssrInterpolate(unref(partner).name)} de maandkosten automatisch kan afschrijven. </p>`);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/welkom/incasso",
              class: "inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(ssrRenderComponent(_component_AppIcon, {
                    name: "credit-card",
                    size: 14
                  }, null, _parent2, _scopeId));
                  _push2(` Incasso instellen `);
                } else {
                  return [
                    createVNode(_component_AppIcon, {
                      name: "credit-card",
                      size: 14
                    }),
                    createTextVNode(" Incasso instellen ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`<!--]-->`);
          }
          _push(`</div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(data).lines.length) {
          _push(`<section class="mb-6"><div class="mb-3 flex items-center justify-between"><h2 class="text-sm font-semibold text-gray-900"> Je contract <span class="ml-1 text-gray-400 font-normal">(${ssrInterpolate(unref(data).lines.length)} ${ssrInterpolate(unref(data).lines.length === 1 ? "module" : "modules")})</span></h2><span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "clock",
            size: 11
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(intervalLabel))}</span></div><div class="rounded-2xl border border-gray-100 bg-white overflow-hidden"><!--[-->`);
          ssrRenderList(unref(data).lines, (line, i) => {
            _push(`<div class="${ssrRenderClass([i > 0 ? "border-t border-gray-100" : "", "flex items-center gap-3 px-5 py-4"])}"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50 text-gray-600">`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: iconFor(line),
              size: 18
            }, null, _parent));
            _push(`</div><div class="min-w-0 flex-1"><div class="flex items-center gap-2"><p class="text-sm font-medium text-gray-900">${ssrInterpolate(line.name)}</p>`);
            if (line.is_custom_price) {
              _push(`<span class="rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700"> Persoonlijk tarief </span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><p class="text-xs text-gray-500">Servicecontract via ${ssrInterpolate(unref(partner).name)}</p></div><p class="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">${ssrInterpolate(euros(line.price_monthly_cents))}<span class="text-xs font-normal text-gray-400">/mnd</span></p></div>`);
          });
          _push(`<!--]--><div class="bg-gray-50 px-5 py-3 text-sm">`);
          if (unref(data).billing_interval === "yearly") {
            _push(`<!--[--><div class="flex items-center justify-between"><span class="font-medium text-gray-700">Totaal per jaar</span><span class="text-base font-bold text-gray-900 tabular-nums">${ssrInterpolate(euros(unref(data).total_yearly_cents))}</span></div>`);
            if (unref(data).yearly_discount_months > 0) {
              _push(`<p class="mt-1 text-[11px] text-gray-500"> Bespaart je ${ssrInterpolate(unref(data).yearly_discount_months === 1 ? "1 maand" : `${unref(data).yearly_discount_months} maanden`)} t.o.v. maandelijks betalen. </p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          } else {
            _push(`<div class="flex items-center justify-between"><span class="font-medium text-gray-700">Totaal per maand</span><span class="text-base font-bold text-gray-900 tabular-nums">${ssrInterpolate(euros(unref(data).total_monthly_cents))}</span></div>`);
          }
          _push(`</div></div></section>`);
        } else {
          _push(`<div class="section py-12 text-center">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "puzzle",
            size: 40,
            class: "mx-auto text-gray-300 mb-4"
          }, null, _parent));
          _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen contractregels</h2><p class="text-sm text-gray-500 max-w-sm mx-auto"> Zodra je akkoord geeft op een service van ${ssrInterpolate(unref(partner).name)}, verschijnen je contractregels hier. </p></div>`);
        }
        _push(`<div class="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/facturen",
          class: "flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:bg-gray-50 transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "file-text",
                size: 18
              }, null, _parent2, _scopeId));
              _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><p class="text-sm font-medium text-gray-900"${_scopeId}>Facturen bekijken</p><p class="text-xs text-gray-500"${_scopeId}>Alle afschrijvingen en de status per maand.</p></div>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 14,
                class: "text-gray-300"
              }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600" }, [
                  createVNode(_component_AppIcon, {
                    name: "file-text",
                    size: 18
                  })
                ]),
                createVNode("div", { class: "min-w-0 flex-1" }, [
                  createVNode("p", { class: "text-sm font-medium text-gray-900" }, "Facturen bekijken"),
                  createVNode("p", { class: "text-xs text-gray-500" }, "Alle afschrijvingen en de status per maand.")
                ]),
                createVNode(_component_AppIcon, {
                  name: "chevron-right",
                  size: 14,
                  class: "text-gray-300"
                })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/service",
          class: "flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4 hover:bg-gray-50 transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "tool",
                size: 18
              }, null, _parent2, _scopeId));
              _push2(`</div><div class="min-w-0 flex-1"${_scopeId}><p class="text-sm font-medium text-gray-900"${_scopeId}>Service of vraag</p><p class="text-xs text-gray-500"${_scopeId}>Direct contact met ${ssrInterpolate(unref(partner).name)}.</p></div>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 14,
                class: "text-gray-300"
              }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode("div", { class: "flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600" }, [
                  createVNode(_component_AppIcon, {
                    name: "tool",
                    size: 18
                  })
                ]),
                createVNode("div", { class: "min-w-0 flex-1" }, [
                  createVNode("p", { class: "text-sm font-medium text-gray-900" }, "Service of vraag"),
                  createVNode("p", { class: "text-xs text-gray-500" }, "Direct contact met " + toDisplayString(unref(partner).name) + ".", 1)
                ]),
                createVNode(_component_AppIcon, {
                  name: "chevron-right",
                  size: 14,
                  class: "text-gray-300"
                })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><!--]-->`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/contracten.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=contracten-B6ZqW4H0.mjs.map
