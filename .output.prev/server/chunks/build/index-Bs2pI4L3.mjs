import { _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, unref, withCtx, createTextVNode, openBlock, createBlock, toDisplayString, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderAttr, ssrRenderClass } from 'vue/server-renderer';
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
    const partners = ref([]);
    const isLoading = ref(true);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-8"><h1 class="text-2xl font-bold text-gray-900">Platform Dashboard</h1><p class="mt-1 text-sm text-gray-500">Overzicht van alle partners</p></div><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"><div class="stat-card" style="${ssrRenderStyle({ "--stat-color": "#1a56db" })}"><div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-500">Partners</span>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "building",
        size: 20,
        class: "text-gray-400"
      }, null, _parent));
      _push(`</div><p class="mt-2 text-2xl font-bold text-gray-900">${ssrInterpolate(unref(partners).length)}</p></div><div class="stat-card" style="${ssrRenderStyle({ "--stat-color": "#059669" })}"><div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-500">Actieve partners</span>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "check-circle",
        size: 20,
        class: "text-gray-400"
      }, null, _parent));
      _push(`</div><p class="mt-2 text-2xl font-bold text-gray-900">${ssrInterpolate(unref(partners).filter((p) => p.is_active).length)}</p></div></div><div class="mt-8 section"><div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-semibold text-gray-900">Partners</h2>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/platform/partners",
        class: "text-sm font-medium text-blue-600 hover:text-blue-700"
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
      _push(`</div>`);
      if (unref(isLoading)) {
        _push(`<div class="py-8 text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (unref(partners).length === 0) {
        _push(`<div class="py-8 text-center text-sm text-gray-400"> Geen partners gevonden. </div>`);
      } else {
        _push(`<div class="divide-y divide-gray-100"><!--[-->`);
        ssrRenderList(unref(partners), (p) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: p.id,
            to: `/platform/partners/${p.slug}`,
            class: "flex items-center gap-4 py-4 transition-colors hover:bg-gray-50 -mx-4 px-4 rounded-lg"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a, _b;
              if (_push2) {
                if (p.logo_url) {
                  _push2(`<img${ssrRenderAttr("src", p.logo_url)}${ssrRenderAttr("alt", p.name)} class="h-10 w-10 rounded-xl object-contain"${_scopeId}>`);
                } else {
                  _push2(`<div class="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white" style="${ssrRenderStyle({ backgroundColor: p.primary_color })}"${_scopeId}>${ssrInterpolate((_a = p.name) == null ? void 0 : _a.charAt(0))}</div>`);
                }
                _push2(`<div class="min-w-0 flex-1"${_scopeId}><p class="font-medium text-gray-900"${_scopeId}>${ssrInterpolate(p.name)}</p><p class="text-xs text-gray-500"${_scopeId}>${ssrInterpolate(p.slug)}.upsol.nl</p></div><div class="flex items-center gap-2"${_scopeId}><div class="h-3 w-3 rounded-full" style="${ssrRenderStyle({ backgroundColor: p.primary_color })}"${_scopeId}></div><span class="${ssrRenderClass([p.is_active ? "badge--green" : "badge--gray", "badge"])}"${_scopeId}>${ssrInterpolate(p.is_active ? "Actief" : "Inactief")}</span></div>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 16,
                  class: "text-gray-300"
                }, null, _parent2, _scopeId));
              } else {
                return [
                  p.logo_url ? (openBlock(), createBlock("img", {
                    key: 0,
                    src: p.logo_url,
                    alt: p.name,
                    class: "h-10 w-10 rounded-xl object-contain"
                  }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("div", {
                    key: 1,
                    class: "flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white",
                    style: { backgroundColor: p.primary_color }
                  }, toDisplayString((_b = p.name) == null ? void 0 : _b.charAt(0)), 5)),
                  createVNode("div", { class: "min-w-0 flex-1" }, [
                    createVNode("p", { class: "font-medium text-gray-900" }, toDisplayString(p.name), 1),
                    createVNode("p", { class: "text-xs text-gray-500" }, toDisplayString(p.slug) + ".upsol.nl", 1)
                  ]),
                  createVNode("div", { class: "flex items-center gap-2" }, [
                    createVNode("div", {
                      class: "h-3 w-3 rounded-full",
                      style: { backgroundColor: p.primary_color }
                    }, null, 4),
                    createVNode("span", {
                      class: ["badge", p.is_active ? "badge--green" : "badge--gray"]
                    }, toDisplayString(p.is_active ? "Actief" : "Inactief"), 3)
                  ]),
                  createVNode(_component_AppIcon, {
                    name: "chevron-right",
                    size: 16,
                    class: "text-gray-300"
                  })
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/platform/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-Bs2pI4L3.mjs.map
