import { _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, computed, unref, withCtx, createVNode, openBlock, createBlock, toDisplayString, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrRenderList, ssrRenderStyle, ssrRenderClass } from 'vue/server-renderer';
import { a as formatDate } from './formatters-BMgUYP7c.mjs';
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
    const search = ref("");
    const filteredPartners = computed(() => {
      if (!search.value) return partners.value;
      const q = search.value.toLowerCase();
      return partners.value.filter(
        (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
      );
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-8 flex items-center justify-between"><div><h1 class="text-2xl font-bold text-gray-900">Partners</h1><p class="mt-1 text-sm text-gray-500">${ssrInterpolate(unref(partners).length)} partners op het platform</p></div></div><div class="mb-6"><div class="relative max-w-md">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "search",
        size: 16,
        class: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(search))} type="text" placeholder="Zoek partner..." class="input pl-10"></div></div>`);
      if (unref(isLoading)) {
        _push(`<div class="py-12 text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else {
        _push(`<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3"><!--[-->`);
        ssrRenderList(unref(filteredPartners), (p) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: p.id,
            to: `/platform/partners/${p.slug}`,
            class: "section group cursor-pointer transition-all hover:shadow-md hover:border-gray-300"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a, _b;
              if (_push2) {
                _push2(`<div class="flex items-start gap-4"${_scopeId}>`);
                if (p.logo_url) {
                  _push2(`<img${ssrRenderAttr("src", p.logo_url)}${ssrRenderAttr("alt", p.name)} class="h-12 w-12 rounded-xl object-contain"${_scopeId}>`);
                } else {
                  _push2(`<div class="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white" style="${ssrRenderStyle({ backgroundColor: p.primary_color })}"${_scopeId}>${ssrInterpolate((_a = p.name) == null ? void 0 : _a.charAt(0))}</div>`);
                }
                _push2(`<div class="flex-1 min-w-0"${_scopeId}><div class="flex items-center gap-2"${_scopeId}><h3 class="font-semibold text-gray-900"${_scopeId}>${ssrInterpolate(p.name)}</h3><span class="${ssrRenderClass([p.is_active ? "badge--green" : "badge--gray", "badge"])}"${_scopeId}>${ssrInterpolate(p.is_active ? "Actief" : "Inactief")}</span></div><p class="mt-0.5 text-sm text-gray-500"${_scopeId}>${ssrInterpolate(p.slug)}.upsol.nl</p><p class="mt-0.5 text-xs text-gray-400"${_scopeId}>Sinds ${ssrInterpolate(unref(formatDate)(p.created_at))}</p></div>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 16,
                  class: "mt-1 text-gray-300 transition-colors group-hover:text-gray-500"
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3"${_scopeId}><div class="h-4 w-4 rounded" style="${ssrRenderStyle({ backgroundColor: p.primary_color })}"${_scopeId}></div><span class="font-mono text-xs text-gray-400"${_scopeId}>${ssrInterpolate(p.primary_color)}</span>`);
                if (p.support_email) {
                  _push2(`<span class="ml-auto text-xs text-gray-400"${_scopeId}>${ssrInterpolate(p.support_email)}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
              } else {
                return [
                  createVNode("div", { class: "flex items-start gap-4" }, [
                    p.logo_url ? (openBlock(), createBlock("img", {
                      key: 0,
                      src: p.logo_url,
                      alt: p.name,
                      class: "h-12 w-12 rounded-xl object-contain"
                    }, null, 8, ["src", "alt"])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white",
                      style: { backgroundColor: p.primary_color }
                    }, toDisplayString((_b = p.name) == null ? void 0 : _b.charAt(0)), 5)),
                    createVNode("div", { class: "flex-1 min-w-0" }, [
                      createVNode("div", { class: "flex items-center gap-2" }, [
                        createVNode("h3", { class: "font-semibold text-gray-900" }, toDisplayString(p.name), 1),
                        createVNode("span", {
                          class: ["badge", p.is_active ? "badge--green" : "badge--gray"]
                        }, toDisplayString(p.is_active ? "Actief" : "Inactief"), 3)
                      ]),
                      createVNode("p", { class: "mt-0.5 text-sm text-gray-500" }, toDisplayString(p.slug) + ".upsol.nl", 1),
                      createVNode("p", { class: "mt-0.5 text-xs text-gray-400" }, "Sinds " + toDisplayString(unref(formatDate)(p.created_at)), 1)
                    ]),
                    createVNode(_component_AppIcon, {
                      name: "chevron-right",
                      size: 16,
                      class: "mt-1 text-gray-300 transition-colors group-hover:text-gray-500"
                    })
                  ]),
                  createVNode("div", { class: "mt-4 flex items-center gap-2 border-t border-gray-100 pt-3" }, [
                    createVNode("div", {
                      class: "h-4 w-4 rounded",
                      style: { backgroundColor: p.primary_color }
                    }, null, 4),
                    createVNode("span", { class: "font-mono text-xs text-gray-400" }, toDisplayString(p.primary_color), 1),
                    p.support_email ? (openBlock(), createBlock("span", {
                      key: 0,
                      class: "ml-auto text-xs text-gray-400"
                    }, toDisplayString(p.support_email), 1)) : createCommentVNode("", true)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/platform/partners/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CIyCQKRi.mjs.map
