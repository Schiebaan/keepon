import { u as usePartner, _ as _sfc_main$5, f as useSupabaseClient } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, computed, unref, withCtx, createVNode, createTextVNode, toDisplayString, resolveDynamicComponent, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderStyle, ssrRenderClass, ssrRenderVNode } from 'vue/server-renderer';
import { g as getModuleTheme } from './module-theme-8XLQDN8U.mjs';
import { u as useCustomers } from './useCustomers-B2wkzFun.mjs';
import { u as useLiveRefresh, a as useRelativeTime } from './useLiveRefresh-CD064e2y.mjs';
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
    const { query: queryCustomers } = useCustomers({ autoLoad: false });
    const customerCount = ref(0);
    const customersLoading = ref(true);
    async function loadCustomerCount() {
      try {
        const r = await queryCustomers({ limit: 1 });
        customerCount.value = r.total;
      } catch {
      } finally {
        customersLoading.value = false;
      }
    }
    const stats = computed(() => [
      {
        label: "Klanten",
        value: customerCount.value,
        change: "",
        changePositive: true,
        icon: "users",
        color: "#1a56db"
      },
      {
        label: "Actieve modules",
        value: totalActiveModules.value,
        change: "",
        changePositive: true,
        icon: "puzzle",
        color: "#059669"
      },
      {
        label: "Maandomzet",
        value: "\u2014",
        change: "Binnenkort beschikbaar",
        changePositive: true,
        icon: "euro",
        color: "#7c3aed"
      },
      {
        label: "Openstaand",
        value: "\u2014",
        change: "",
        changePositive: true,
        icon: "clock",
        color: "#dc2626"
      }
    ]);
    const recentActivity = ref([]);
    const activityLoading = ref(true);
    async function loadActivity() {
      try {
        const supabase = useSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!(session == null ? void 0 : session.access_token)) return;
        recentActivity.value = await $fetch("/api/partners/activity", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } catch {
        if (activityLoading.value) recentActivity.value = [];
      } finally {
        activityLoading.value = false;
      }
    }
    function timeAgo(iso) {
      const ms = Date.now() - new Date(iso).getTime();
      const min = Math.round(ms / 6e4);
      if (min < 1) return "zojuist";
      if (min < 60) return `${min} min geleden`;
      const h = Math.round(min / 60);
      if (h < 24) return `${h} uur geleden`;
      const d = Math.round(h / 24);
      if (d < 7) return `${d} dag${d === 1 ? "" : "en"} geleden`;
      return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    }
    function activityIconBg(type) {
      switch (type) {
        case "customer":
          return "bg-blue-50 text-blue-600";
        case "ticket":
          return "bg-amber-50 text-amber-600";
        case "installation":
          return "bg-green-50 text-green-600";
        case "email":
          return "bg-indigo-50 text-indigo-600";
        default:
          return "bg-gray-100 text-gray-500";
      }
    }
    const systemAlerts = ref([]);
    async function loadAlerts() {
      try {
        const supabase = useSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!(session == null ? void 0 : session.access_token)) return;
        systemAlerts.value = await $fetch("/api/partners/alerts", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } catch {
      }
    }
    const ALERT_LABELS = {
      error: "Storing",
      unreachable: "Niet bereikbaar",
      stale: "Geen data",
      integration_down: "Koppeling stuk"
    };
    const moduleStats = ref({
      solar_panel: { total: 0, monitored: 0 },
      heat_pump: { total: 0, monitored: 0 },
      ev_charger: { total: 0, monitored: 0 },
      battery: { total: 0, monitored: 0 }
    });
    async function loadModuleStats() {
      try {
        const supabase = useSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!(session == null ? void 0 : session.access_token)) return;
        moduleStats.value = await $fetch("/api/partners/module-stats", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
      } catch {
      }
    }
    const { lastRefreshed } = useLiveRefresh(
      () => Promise.all([loadActivity(), loadModuleStats(), loadCustomerCount(), loadAlerts()]),
      { intervalMs: 6e4 }
    );
    const bijgewerkt = useRelativeTime(lastRefreshed);
    const moduleBreakdown = computed(() => [
      {
        name: "Zonnepanelen",
        type: "solar",
        dbKey: "solar_panel",
        count: moduleStats.value.solar_panel.total,
        monitored: moduleStats.value.solar_panel.monitored,
        theme: getModuleTheme("solar")
      },
      {
        name: "Warmtepomp",
        type: "heat_pump",
        dbKey: "heat_pump",
        count: moduleStats.value.heat_pump.total,
        monitored: moduleStats.value.heat_pump.monitored,
        theme: getModuleTheme("heat_pump")
      },
      {
        name: "Laadpaal",
        type: "ev_charger",
        dbKey: "ev_charger",
        count: moduleStats.value.ev_charger.total,
        monitored: moduleStats.value.ev_charger.monitored,
        theme: getModuleTheme("ev_charger")
      }
    ]);
    const totalActiveModules = computed(
      () => Object.values(moduleStats.value).reduce((s, m) => s + m.total, 0)
    );
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">Dashboard</h1><p class="mt-1 text-sm text-gray-500"> Overzicht van ${ssrInterpolate(unref(partner).name)} `);
      if (unref(bijgewerkt)) {
        _push(`<span class="text-gray-400"> \xB7 bijgewerkt ${ssrInterpolate(unref(bijgewerkt))}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</p></div>`);
      if (!unref(customersLoading) && unref(customerCount) === 0) {
        _push(`<div class="mb-6 rounded-2xl border-2 border-dashed border-gray-200 bg-white p-8 text-center"><div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "users",
          size: 28,
          class: "text-gray-400"
        }, null, _parent));
        _push(`</div><h2 class="text-lg font-semibold text-gray-900 mb-2">Welkom bij ${ssrInterpolate(unref(partner).name)}!</h2><p class="text-sm text-gray-500 max-w-md mx-auto mb-6"> Je portaal is klaar. Begin met het toevoegen van je eerste klant, of pas je instellingen aan. </p><div class="flex items-center justify-center gap-3">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/admin/customers",
          class: "inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-colors",
          style: { backgroundColor: unref(partner).primary_color }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "plus",
                size: 16
              }, null, _parent2, _scopeId));
              _push2(` Eerste klant toevoegen `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "plus",
                  size: 16
                }),
                createTextVNode(" Eerste klant toevoegen ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/admin/settings",
          class: "inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "settings",
                size: 16
              }, null, _parent2, _scopeId));
              _push2(` Instellingen `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "settings",
                  size: 16
                }),
                createTextVNode(" Instellingen ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><!--[-->`);
      ssrRenderList(unref(stats), (stat) => {
        _push(`<div class="stat-card" style="${ssrRenderStyle({ "--stat-color": stat.color })}"><div class="flex items-center justify-between"><p class="text-sm font-medium text-gray-500">${ssrInterpolate(stat.label)}</p><div class="flex h-9 w-9 items-center justify-center rounded-lg" style="${ssrRenderStyle({ backgroundColor: stat.color + "10", color: stat.color })}">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: stat.icon,
          size: 18
        }, null, _parent));
        _push(`</div></div><p class="mt-2 text-2xl font-bold text-gray-900">${ssrInterpolate(stat.value)}</p><p class="${ssrRenderClass([stat.changePositive ? "text-green-600" : "text-red-500", "mt-1 text-xs font-medium"])}">${ssrInterpolate(stat.change)}</p></div>`);
      });
      _push(`<!--]--></div>`);
      if (unref(systemAlerts).length > 0) {
        _push(`<div class="mb-6"><div class="flex items-center gap-2 mb-3">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "warning",
          size: 18,
          class: "text-red-500"
        }, null, _parent));
        _push(`<h2 class="text-base font-semibold text-gray-900">Aandacht vereist</h2><span class="badge badge--red">${ssrInterpolate(unref(systemAlerts).length)}</span></div><div class="space-y-2"><!--[-->`);
        ssrRenderList(unref(systemAlerts), (alert) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: alert.id,
            to: `/admin/customers/${alert.customerId}`,
            class: ["flex items-center gap-4 rounded-xl border p-4 transition-all hover:shadow-sm no-underline", alert.kind === "stale" ? "border-amber-200 bg-amber-50/50" : "border-red-200 bg-red-50/50"]
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([alert.kind === "stale" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600", "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"])}"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: alert.kind === "stale" ? "clock" : "warning",
                  size: 20
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="flex-1 min-w-0"${_scopeId}><div class="flex items-center gap-2 flex-wrap"${_scopeId}><p class="text-sm font-medium text-gray-900"${_scopeId}>${ssrInterpolate(alert.customerName)}</p><span class="${ssrRenderClass([alert.kind === "stale" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700", "rounded-full px-2 py-0.5 text-[10px] font-medium"])}"${_scopeId}>${ssrInterpolate(ALERT_LABELS[alert.kind] || alert.kind)}</span><span class="text-[11px] text-gray-500"${_scopeId}>${ssrInterpolate(alert.productName)}</span></div><p class="text-xs text-gray-600 mt-0.5"${_scopeId}>${ssrInterpolate(alert.detail)}</p><p class="text-[11px] text-gray-400 mt-0.5"${_scopeId}>Gesignaleerd ${ssrInterpolate(timeAgo(alert.since))}</p></div>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 16,
                  class: "text-gray-300 shrink-0"
                }, null, _parent2, _scopeId));
              } else {
                return [
                  createVNode("div", {
                    class: ["flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", alert.kind === "stale" ? "bg-amber-100 text-amber-600" : "bg-red-100 text-red-600"]
                  }, [
                    createVNode(_component_AppIcon, {
                      name: alert.kind === "stale" ? "clock" : "warning",
                      size: 20
                    }, null, 8, ["name"])
                  ], 2),
                  createVNode("div", { class: "flex-1 min-w-0" }, [
                    createVNode("div", { class: "flex items-center gap-2 flex-wrap" }, [
                      createVNode("p", { class: "text-sm font-medium text-gray-900" }, toDisplayString(alert.customerName), 1),
                      createVNode("span", {
                        class: ["rounded-full px-2 py-0.5 text-[10px] font-medium", alert.kind === "stale" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"]
                      }, toDisplayString(ALERT_LABELS[alert.kind] || alert.kind), 3),
                      createVNode("span", { class: "text-[11px] text-gray-500" }, toDisplayString(alert.productName), 1)
                    ]),
                    createVNode("p", { class: "text-xs text-gray-600 mt-0.5" }, toDisplayString(alert.detail), 1),
                    createVNode("p", { class: "text-[11px] text-gray-400 mt-0.5" }, "Gesignaleerd " + toDisplayString(timeAgo(alert.since)), 1)
                  ]),
                  createVNode(_component_AppIcon, {
                    name: "chevron-right",
                    size: 16,
                    class: "text-gray-300 shrink-0"
                  })
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid gap-6 lg:grid-cols-3"><div class="lg:col-span-2"><div class="section"><div class="mb-5 flex items-center justify-between"><h2 class="text-base font-semibold text-gray-900">Recente activiteit</h2>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/customers",
        class: "text-xs font-medium text-gray-400 hover:text-gray-600"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Alle klanten \u2192 `);
          } else {
            return [
              createTextVNode(" Alle klanten \u2192 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (unref(activityLoading)) {
        _push(`<div class="py-8 text-center"><div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500"></div></div>`);
      } else if (unref(recentActivity).length === 0) {
        _push(`<div class="py-8 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "activity",
          size: 24,
          class: "mx-auto text-gray-300 mb-2"
        }, null, _parent));
        _push(`<p class="text-sm text-gray-400">Activiteit verschijnt hier zodra klanten worden toegevoegd of service-meldingen binnenkomen.</p></div>`);
      } else {
        _push(`<div class="space-y-1"><!--[-->`);
        ssrRenderList(unref(recentActivity), (item) => {
          ssrRenderVNode(_push, createVNode(resolveDynamicComponent(item.link ? "NuxtLink" : "div"), {
            key: item.id,
            to: item.link || void 0,
            class: ["flex items-start gap-3 rounded-lg px-2 py-2 -mx-2 transition-colors", item.link ? "hover:bg-gray-50 cursor-pointer no-underline" : ""]
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([activityIconBg(item.type), "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"])}"${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: item.icon,
                  size: 15
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="flex-1 min-w-0"${_scopeId}><p class="text-sm text-gray-700 truncate"${_scopeId}>${ssrInterpolate(item.text)}</p><p class="mt-0.5 text-xs text-gray-400"${_scopeId}>${ssrInterpolate(timeAgo(item.at))}</p></div>`);
                if (item.link) {
                  _push2(ssrRenderComponent(_component_AppIcon, {
                    name: "chevron-right",
                    size: 14,
                    class: "text-gray-300 mt-2 shrink-0"
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  createVNode("div", {
                    class: ["mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", activityIconBg(item.type)]
                  }, [
                    createVNode(_component_AppIcon, {
                      name: item.icon,
                      size: 15
                    }, null, 8, ["name"])
                  ], 2),
                  createVNode("div", { class: "flex-1 min-w-0" }, [
                    createVNode("p", { class: "text-sm text-gray-700 truncate" }, toDisplayString(item.text), 1),
                    createVNode("p", { class: "mt-0.5 text-xs text-gray-400" }, toDisplayString(timeAgo(item.at)), 1)
                  ]),
                  item.link ? (openBlock(), createBlock(_component_AppIcon, {
                    key: 0,
                    name: "chevron-right",
                    size: 14,
                    class: "text-gray-300 mt-2 shrink-0"
                  })) : createCommentVNode("", true)
                ];
              }
            }),
            _: 2
          }), _parent);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div><div><div class="section"><div class="mb-5 flex items-center justify-between"><h2 class="text-base font-semibold text-gray-900">Modules</h2>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/modules",
        class: "text-xs font-medium text-gray-400 hover:text-gray-600"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Beheren \u2192 `);
          } else {
            return [
              createTextVNode(" Beheren \u2192 ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="space-y-3"><!--[-->`);
      ssrRenderList(unref(moduleBreakdown), (mod) => {
        _push(`<div class="${ssrRenderClass([mod.theme.bg, "flex items-center justify-between rounded-xl p-3"])}"><div class="flex items-center gap-3"><div class="${ssrRenderClass([[mod.theme.bg, mod.theme.text], "flex h-8 w-8 items-center justify-center rounded-lg"])}">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: mod.theme.icon,
          size: 16
        }, null, _parent));
        _push(`</div><div><p class="${ssrRenderClass([mod.theme.text, "text-sm font-medium"])}">${ssrInterpolate(mod.name)}</p>`);
        if (mod.monitored > 0 && mod.monitored < mod.count) {
          _push(`<p class="${ssrRenderClass([mod.theme.text, "text-[11px] opacity-70"])}">${ssrInterpolate(mod.monitored)} met monitoring </p>`);
        } else if (mod.monitored > 0 && mod.monitored === mod.count) {
          _push(`<p class="${ssrRenderClass([mod.theme.text, "text-[11px] opacity-70"])}"> Alle gekoppeld </p>`);
        } else if (mod.count > 0) {
          _push(`<p class="${ssrRenderClass([mod.theme.text, "text-[11px] opacity-70"])}"> Nog niet gekoppeld </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><span class="${ssrRenderClass([mod.theme.bg + " " + mod.theme.text, "badge"])}">${ssrInterpolate(mod.count)}</span></div>`);
      });
      _push(`<!--]--></div><div class="mt-5 border-t border-gray-100 pt-4">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/payments",
        class: "inline-flex items-center gap-1 text-xs font-medium text-gray-400 hover:text-gray-600"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "credit-card",
              size: 12
            }, null, _parent2, _scopeId));
            _push2(` Betalingen bekijken `);
          } else {
            return [
              createVNode(_component_AppIcon, {
                name: "credit-card",
                size: 12
              }),
              createTextVNode(" Betalingen bekijken ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-GRsi0H0D.mjs.map
