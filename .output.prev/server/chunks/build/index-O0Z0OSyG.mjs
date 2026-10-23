import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { c as _export_sfc, e as useRouter, a as useConfirm, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, computed, watch, unref, withCtx, createTextVNode, toDisplayString, createVNode, provide, createElementBlock, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrRenderList, ssrRenderStyle, ssrRenderClass, ssrRenderTeleport } from 'vue/server-renderer';
import { u as useCustomers } from './useCustomers-B2wkzFun.mjs';
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

defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = Symbol.for("nuxt:client-only");
const __nuxt_component_2 = defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  setup(_, { slots, attrs }) {
    const mounted = ref(false);
    provide(clientOnlySymbol, true);
    return (props) => {
      var _a;
      if (mounted.value) {
        return (_a = slots.default) == null ? void 0 : _a.call(slots);
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return slot();
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { customers, total: customersTotal, hasMore: customersHasMore, isLoading: customersLoading, refresh: refreshCustomers, loadMore: loadMoreCustomers, createCustomer, updateCustomer, deleteCustomer } = useCustomers({ autoLoad: false });
    useRouter();
    const searchQuery = ref("");
    let searchTimer;
    const currentFilters = computed(() => ({ q: searchQuery.value || void 0, accepted: "true" }));
    watch(searchQuery, () => {
      if (searchTimer) (void 0).clearTimeout(searchTimer);
      searchTimer = (void 0).setTimeout(() => {
        refreshCustomers(currentFilters.value);
      }, 250);
    });
    const TONE_STYLE = {
      linked: { bg: "#dcfce7", fg: "#166534", dot: "#16a34a" },
      pending: { bg: "#fef3c7", fg: "#92400e", dot: "#d97706" },
      overdue: { bg: "#fee2e2", fg: "#991b1b", dot: "#dc2626" },
      idle: { bg: "#f1f5f9", fg: "#475569", dot: "#94a3b8" }
    };
    const showLegend = ref(false);
    const MODULE_LEGEND = [
      { tone: "linked", label: "Groen", hint: "Monitoring is gekoppeld \u2014 de klant ziet live data in zijn portaal." },
      { tone: "pending", label: "Amber", hint: "Klant heeft akkoord gegeven, maar de monitoring moet nog gekoppeld worden." },
      { tone: "overdue", label: "Rood", hint: "Klant betaalt al, maar de monitoring is nog niet gekoppeld. Actie nodig." },
      { tone: "idle", label: "Grijs", hint: "Klant heeft nog geen akkoord gegeven \u2014 er valt nog niets te koppelen." }
    ];
    const STATUS_LEGEND = [
      { label: "Mail verstuurd", cls: "bg-gray-100 text-gray-600", hint: "Uitnodiging is de deur uit, klant heeft nog niets gedaan." },
      { label: "Wacht op akkoord", cls: "bg-amber-100 text-amber-800", hint: "Klant heeft het voorstel gezien maar nog niet geaccepteerd." },
      { label: "Akkoord, incasso open", cls: "bg-blue-50 text-blue-700", hint: "Contract staat, maar de klant heeft nog geen IBAN afgegeven. Je kunt nog niet incasseren." },
      { label: "Volledig actief", cls: "bg-green-100 text-green-800", hint: "Akkoord \xE9n incasso geregeld. Hier kun je factureren." },
      { label: "Akkoord zonder modules", cls: "bg-red-100 text-red-800", hint: "Zeldzaam: akkoord gegeven zonder onderdelen te kiezen. Er zijn geen contractregels, dus factureren lukt niet. Meld dit bij support." }
    ];
    const { query: queryCustomers } = useCustomers({ autoLoad: false });
    const pendingCount = ref(0);
    const acceptedCustomers = computed(() => customers.value);
    computed(() => acceptedCustomers.value);
    const onboardToast = ref("");
    const editModalOpen = ref(false);
    const editingCustomer = ref(null);
    const editForm = ref({ full_name: "", email: "", phone: "", street: "", house_number: "", postal_code: "", city: "" });
    const editSaved = ref(false);
    ref(false);
    ref("");
    useConfirm();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      const _component_ClientOnly = __nuxt_component_2;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-ee068f25><div class="mb-6 flex items-center justify-between" data-v-ee068f25><div data-v-ee068f25><h1 class="text-2xl font-bold text-gray-900" data-v-ee068f25>Klanten</h1><p class="mt-1 text-sm text-gray-500" data-v-ee068f25>`);
      if (unref(customersLoading)) {
        _push(`<!--[-->\xA0<!--]-->`);
      } else {
        _push(`<!--[-->${ssrInterpolate(unref(customersTotal) === 1 ? "1 actieve klant" : `${unref(customersTotal)} actieve klanten`)}`);
        if (unref(searchQuery)) {
          _push(`<span data-v-ee068f25> bij &quot;${ssrInterpolate(unref(searchQuery))}&quot;</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(pendingCount)) {
          _push(`<!--[--> \xB7 `);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/admin/uitnodigingen",
            class: "text-blue-600 hover:underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(unref(pendingCount))} ${ssrInterpolate(unref(pendingCount) === 1 ? "wacht" : "wachten")} op akkoord `);
              } else {
                return [
                  createTextVNode(toDisplayString(unref(pendingCount)) + " " + toDisplayString(unref(pendingCount) === 1 ? "wacht" : "wachten") + " op akkoord ", 1)
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      }
      _push(`</p></div>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/uitnodigingen",
        class: "btn-primary inline-flex items-center gap-1.5"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "plus",
              size: 16
            }, null, _parent2, _scopeId));
            _push2(` Klant uitnodigen `);
          } else {
            return [
              createVNode(_component_AppIcon, {
                name: "plus",
                size: 16
              }),
              createTextVNode(" Klant uitnodigen ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><div class="mb-4 flex flex-wrap items-center gap-3" data-v-ee068f25><div class="relative max-w-sm flex-1 min-w-[240px]" data-v-ee068f25>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "search",
        size: 16,
        class: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(searchQuery))} type="search" class="input pl-9" placeholder="Zoek op naam, e-mail of plaats..." data-v-ee068f25></div><button class="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"${ssrRenderAttr("aria-expanded", unref(showLegend))} data-v-ee068f25>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "help-circle",
        size: 14
      }, null, _parent));
      _push(` Wat betekenen de kleuren? `);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "chevron-down",
        size: 12,
        class: ["transition-transform", unref(showLegend) ? "rotate-180" : ""]
      }, null, _parent));
      _push(`</button></div>`);
      if (unref(showLegend)) {
        _push(`<div class="mb-4 grid gap-4 rounded-2xl border border-gray-200 bg-gray-50/70 p-4 sm:grid-cols-2" data-v-ee068f25><div data-v-ee068f25><p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500" data-v-ee068f25>Kolom &quot;Modules&quot;</p><p class="mb-2.5 text-[11px] text-gray-500" data-v-ee068f25> Toont per installatie of de monitoring gekoppeld is aan Sundata, Weheat of Easee. </p><ul class="space-y-1.5" data-v-ee068f25><!--[-->`);
        ssrRenderList(MODULE_LEGEND, (item) => {
          _push(`<li class="flex items-start gap-2" data-v-ee068f25><span class="mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" style="${ssrRenderStyle({ backgroundColor: TONE_STYLE[item.tone].bg, color: TONE_STYLE[item.tone].fg })}" data-v-ee068f25><span class="h-1.5 w-1.5 rounded-full" style="${ssrRenderStyle({ backgroundColor: TONE_STYLE[item.tone].dot })}" data-v-ee068f25></span> ${ssrInterpolate(item.label)}</span><span class="text-[11px] leading-relaxed text-gray-600" data-v-ee068f25>${ssrInterpolate(item.hint)}</span></li>`);
        });
        _push(`<!--]--></ul></div><div data-v-ee068f25><p class="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500" data-v-ee068f25>Kolom &quot;Status&quot;</p><p class="mb-2.5 text-[11px] text-gray-500" data-v-ee068f25> Hoe ver de klant is in de onboarding: van uitnodiging tot actieve incasso. </p><ul class="space-y-1.5" data-v-ee068f25><!--[-->`);
        ssrRenderList(STATUS_LEGEND, (item) => {
          _push(`<li class="flex items-start gap-2" data-v-ee068f25><span class="${ssrRenderClass([item.cls, "mt-0.5 inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium"])}" data-v-ee068f25>${ssrInterpolate(item.label)}</span><span class="text-[11px] leading-relaxed text-gray-600" data-v-ee068f25>${ssrInterpolate(item.hint)}</span></li>`);
        });
        _push(`<!--]--></ul></div><p class="text-[11px] text-gray-400 sm:col-span-2" data-v-ee068f25> Meer uitleg over de onboarding-flow staat in de <a href="/support/wat-ziet-je-klant" target="_blank" class="text-blue-600 hover:underline" data-v-ee068f25>handleiding</a>. </p></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_ClientOnly, null, {}, _parent));
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(onboardToast)) {
          _push2(`<div class="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white shadow-lg" data-v-ee068f25>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "check-circle",
            size: 16,
            class: "text-green-400"
          }, null, _parent));
          _push2(` ${ssrInterpolate(unref(onboardToast))}</div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      ssrRenderTeleport(_push, (_push2) => {
        var _a, _b;
        if (unref(editModalOpen) && unref(editingCustomer)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-ee068f25><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-ee068f25></div><div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden" data-v-ee068f25><div class="border-b border-gray-100 px-6 py-4" data-v-ee068f25><div class="flex items-center justify-between" data-v-ee068f25><div class="flex items-center gap-3" data-v-ee068f25><div class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium text-white" style="${ssrRenderStyle({ backgroundColor: `hsl(${(((_a = unref(editingCustomer).full_name) == null ? void 0 : _a.charCodeAt(0)) || 65) * 5}, 50%, 55%)` })}" data-v-ee068f25>${ssrInterpolate(((_b = unref(editingCustomer).full_name) == null ? void 0 : _b.charAt(0)) || "?")}</div><div data-v-ee068f25><h3 class="text-lg font-semibold text-gray-900" data-v-ee068f25>Klant bewerken</h3><p class="text-sm text-gray-500" data-v-ee068f25>${ssrInterpolate(unref(editingCustomer).full_name)}</p></div></div><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" data-v-ee068f25>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div></div><div class="px-6 py-5 space-y-4" data-v-ee068f25>`);
          if (unref(editSaved)) {
            _push2(`<div class="rounded-xl border border-green-200 bg-green-50 p-3 text-center" data-v-ee068f25><p class="text-sm font-medium text-green-700" data-v-ee068f25>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 16,
              class: "inline -mt-0.5"
            }, null, _parent));
            _push2(` Klantgegevens opgeslagen </p></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (!unref(editSaved)) {
            _push2(`<!--[--><div class="grid grid-cols-2 gap-3" data-v-ee068f25><div data-v-ee068f25><label class="label" data-v-ee068f25>Naam</label><input${ssrRenderAttr("value", unref(editForm).full_name)} type="text" class="input" data-v-ee068f25></div><div data-v-ee068f25><label class="label" data-v-ee068f25>E-mailadres</label><input${ssrRenderAttr("value", unref(editForm).email)} type="email" class="input" data-v-ee068f25></div></div><div data-v-ee068f25><label class="label" data-v-ee068f25>Telefoonnummer</label><input${ssrRenderAttr("value", unref(editForm).phone)} type="tel" class="input" data-v-ee068f25></div><div data-v-ee068f25><label class="label text-gray-400 text-xs uppercase tracking-wider" data-v-ee068f25>Adres</label></div><div class="grid grid-cols-3 gap-3" data-v-ee068f25><div class="col-span-2" data-v-ee068f25><label class="label" data-v-ee068f25>Straat</label><input${ssrRenderAttr("value", unref(editForm).street)} type="text" class="input" data-v-ee068f25></div><div data-v-ee068f25><label class="label" data-v-ee068f25>Huisnummer</label><input${ssrRenderAttr("value", unref(editForm).house_number)} type="text" class="input" data-v-ee068f25></div></div><div class="grid grid-cols-2 gap-3" data-v-ee068f25><div data-v-ee068f25><label class="label" data-v-ee068f25>Postcode</label><input${ssrRenderAttr("value", unref(editForm).postal_code)} type="text" class="input" data-v-ee068f25></div><div data-v-ee068f25><label class="label" data-v-ee068f25>Plaats</label><input${ssrRenderAttr("value", unref(editForm).city)} type="text" class="input" data-v-ee068f25></div></div><div class="rounded-xl border border-gray-100 bg-gray-50 p-3" data-v-ee068f25>`);
            _push2(ssrRenderComponent(_component_NuxtLink, {
              to: `/admin/customers/${unref(editingCustomer).id}`,
              class: "text-xs font-medium text-blue-600 hover:underline flex items-center gap-1",
              onClick: ($event) => editModalOpen.value = false
            }, {
              default: withCtx((_, _push3, _parent2, _scopeId) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_AppIcon, {
                    name: "folder",
                    size: 12
                  }, null, _parent2, _scopeId));
                  _push3(` Bekijk klantdossier voor modules en documenten `);
                } else {
                  return [
                    createVNode(_component_AppIcon, {
                      name: "folder",
                      size: 12
                    }),
                    createTextVNode(" Bekijk klantdossier voor modules en documenten ")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push2(`</div><!--]-->`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div>`);
          if (!unref(editSaved)) {
            _push2(`<div class="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3" data-v-ee068f25><button class="btn-secondary" data-v-ee068f25>Annuleren</button><button class="btn-primary" data-v-ee068f25>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check",
              size: 16
            }, null, _parent));
            _push2(` Opslaan </button></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/customers/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-ee068f25"]]);

export { index as default };
//# sourceMappingURL=index-O0Z0OSyG.mjs.map
