import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, withAsyncContext, mergeProps, withCtx, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { c as _export_sfc, d as useRoute, m as useHead } from './server.mjs';
import { u as useFetch } from './fetch-C069USNx.mjs';
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
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = route.params.slug;
    const { data: article, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(`/api/support/articles/${slug}`, {
      key: `support-article-${slug}`
    }, "$hXXywHjJNZ")), __temp = await __temp, __restore(), __temp);
    useHead(() => {
      var _a;
      return {
        title: article.value ? `${article.value.title} \xB7 UPsol Support` : "Support \xB7 UPsol",
        meta: ((_a = article.value) == null ? void 0 : _a.excerpt) ? [{ name: "description", content: article.value.excerpt }] : []
      };
    });
    function fmtDate(iso) {
      try {
        return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
      } catch {
        return "";
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))} data-v-728990bb><header class="border-b border-gray-100 bg-white" data-v-728990bb><div class="mx-auto flex h-16 max-w-3xl items-center justify-between px-4" data-v-728990bb>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/support",
        class: "text-sm font-semibold text-gray-900 no-underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u2190 Support`);
          } else {
            return [
              createTextVNode("\u2190 Support")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "text-sm text-gray-500 no-underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`UPsol`);
          } else {
            return [
              createTextVNode("UPsol")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></header><main class="mx-auto max-w-3xl px-4 py-10" data-v-728990bb>`);
      if (unref(error)) {
        _push(`<div class="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800" data-v-728990bb> Artikel niet gevonden of niet gepubliceerd. `);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/support",
          class: "underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Terug naar overzicht`);
            } else {
              return [
                createTextVNode("Terug naar overzicht")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (unref(article)) {
        _push(`<article class="rounded-2xl border border-gray-100 bg-white p-8" data-v-728990bb>`);
        if (unref(article).category) {
          _push(`<p class="text-xs font-semibold uppercase tracking-wider text-gray-400" data-v-728990bb>${ssrInterpolate(unref(article).category)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<h1 class="mt-1 text-3xl font-bold tracking-tight text-gray-900" data-v-728990bb>${ssrInterpolate(unref(article).title)}</h1>`);
        if (unref(article).excerpt) {
          _push(`<p class="mt-2 text-base text-gray-500" data-v-728990bb>${ssrInterpolate(unref(article).excerpt)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="mt-3 text-xs text-gray-400" data-v-728990bb>Bijgewerkt op ${ssrInterpolate(fmtDate(unref(article).updated_at))}</p><div class="prose prose-sm mt-8 max-w-none" data-v-728990bb>${(_a = unref(article).body_html) != null ? _a : ""}</div></article>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="mt-8 text-center" data-v-728990bb>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/support",
        class: "text-sm text-gray-500 hover:text-gray-800"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u2190 Bekijk alle artikelen`);
          } else {
            return [
              createTextVNode("\u2190 Bekijk alle artikelen")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/support/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-728990bb"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-DrMkKZb6.mjs.map
