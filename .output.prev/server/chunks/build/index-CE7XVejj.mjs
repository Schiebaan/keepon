import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { m as useHead, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, watch, mergeProps, withCtx, createTextVNode, unref, openBlock, createBlock, toDisplayString, createCommentVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
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
    const searchInput = ref("");
    const data = ref(null);
    const loading = ref(true);
    const error = ref("");
    async function load(q = "") {
      var _a;
      loading.value = true;
      error.value = "";
      try {
        const url = q ? `/api/support/articles?q=${encodeURIComponent(q)}` : "/api/support/articles";
        data.value = await $fetch(url);
      } catch (e) {
        error.value = ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message) || "Kon artikelen niet laden";
      } finally {
        loading.value = false;
      }
    }
    let searchTimer = null;
    watch(searchInput, (v) => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => load(v.trim()), 250);
    });
    useHead({
      title: "Support \xB7 UPsol",
      meta: [{ name: "description", content: "Handleiding en kennisartikelen voor installateurs die met UPsol werken." }]
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))}><header class="border-b border-gray-100 bg-white"><div class="mx-auto flex h-16 max-w-4xl items-center justify-between px-4">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "text-sm font-semibold text-gray-900 no-underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u2190 Terug naar UPsol`);
          } else {
            return [
              createTextVNode("\u2190 Terug naar UPsol")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/support",
        class: "text-sm font-semibold text-gray-500 no-underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Support`);
          } else {
            return [
              createTextVNode("Support")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></header><div class="mx-auto max-w-4xl px-4 py-10"><h1 class="text-3xl font-bold tracking-tight text-gray-900">Hoe kunnen we helpen?</h1><p class="mt-2 text-sm text-gray-500">Handleidingen, uitleg en veel-gestelde vragen over UPsol.</p><div class="mt-6 relative">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "search",
        size: 18,
        class: "absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(searchInput))} type="search" class="input pl-11 text-base py-3" placeholder="Zoek een artikel..." autofocus></div></div><main class="mx-auto max-w-4xl px-4 pb-16">`);
      if (unref(loading)) {
        _push(`<div class="py-12 text-center"><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">${ssrInterpolate(unref(error))}</div>`);
      } else if ((_a = unref(data)) == null ? void 0 : _a.query) {
        _push(`<div class="space-y-3"><p class="text-xs text-gray-500 uppercase tracking-wider">${ssrInterpolate(unref(data).total)} ${ssrInterpolate(unref(data).total === 1 ? "resultaat" : "resultaten")} voor &quot;${ssrInterpolate(unref(data).query)}&quot; </p><!--[-->`);
        ssrRenderList(unref(data).articles, (a) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: a.id,
            to: `/support/${a.slug}`,
            class: "block rounded-2xl border border-gray-100 bg-white p-5 hover:border-gray-200 hover:shadow-sm transition-all no-underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                if (a.category) {
                  _push2(`<p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400"${_scopeId}>${ssrInterpolate(a.category)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<h3 class="mt-1 text-base font-semibold text-gray-900"${_scopeId}>${ssrInterpolate(a.title)}</h3>`);
                if (a.excerpt) {
                  _push2(`<p class="mt-1 text-sm text-gray-500"${_scopeId}>${ssrInterpolate(a.excerpt)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
              } else {
                return [
                  a.category ? (openBlock(), createBlock("p", {
                    key: 0,
                    class: "text-[11px] font-semibold uppercase tracking-wider text-gray-400"
                  }, toDisplayString(a.category), 1)) : createCommentVNode("", true),
                  createVNode("h3", { class: "mt-1 text-base font-semibold text-gray-900" }, toDisplayString(a.title), 1),
                  a.excerpt ? (openBlock(), createBlock("p", {
                    key: 1,
                    class: "mt-1 text-sm text-gray-500"
                  }, toDisplayString(a.excerpt), 1)) : createCommentVNode("", true)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]-->`);
        if (!unref(data).articles.length) {
          _push(`<div class="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center"><p class="text-sm text-gray-500">Niets gevonden. Probeer andere zoektermen.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="space-y-8"><!--[-->`);
        ssrRenderList((_b = unref(data)) == null ? void 0 : _b.categories, (cat) => {
          _push(`<div><h2 class="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">${ssrInterpolate(cat.name)}</h2><div class="space-y-2"><!--[-->`);
          ssrRenderList(cat.items, (a) => {
            _push(ssrRenderComponent(_component_NuxtLink, {
              key: a.id,
              to: `/support/${a.slug}`,
              class: "block rounded-2xl border border-gray-100 bg-white p-5 hover:border-gray-200 hover:shadow-sm transition-all no-underline"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<h3 class="text-base font-semibold text-gray-900"${_scopeId}>${ssrInterpolate(a.title)}</h3>`);
                  if (a.excerpt) {
                    _push2(`<p class="mt-1 text-sm text-gray-500"${_scopeId}>${ssrInterpolate(a.excerpt)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`<div class="mt-2 flex items-center gap-1.5 text-xs text-gray-400"${_scopeId}>`);
                  _push2(ssrRenderComponent(_component_AppIcon, {
                    name: "chevron-right",
                    size: 12
                  }, null, _parent2, _scopeId));
                  _push2(` Lees artikel </div>`);
                } else {
                  return [
                    createVNode("h3", { class: "text-base font-semibold text-gray-900" }, toDisplayString(a.title), 1),
                    a.excerpt ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "mt-1 text-sm text-gray-500"
                    }, toDisplayString(a.excerpt), 1)) : createCommentVNode("", true),
                    createVNode("div", { class: "mt-2 flex items-center gap-1.5 text-xs text-gray-400" }, [
                      createVNode(_component_AppIcon, {
                        name: "chevron-right",
                        size: 12
                      }),
                      createTextVNode(" Lees artikel ")
                    ])
                  ];
                }
              }),
              _: 2
            }, _parent));
          });
          _push(`<!--]--></div></div>`);
        });
        _push(`<!--]-->`);
        if (!((_c = unref(data)) == null ? void 0 : _c.categories.length)) {
          _push(`<div class="rounded-2xl border-2 border-dashed border-gray-200 p-10 text-center"><p class="text-sm text-gray-500">Er zijn nog geen artikelen gepubliceerd.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      }
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/support/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-CE7XVejj.mjs.map
