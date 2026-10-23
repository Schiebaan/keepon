import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { e as useRouter, a as useConfirm, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, withCtx, createTextVNode, unref, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderClass, ssrRenderAttr } from 'vue/server-renderer';
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
    const articles = ref([]);
    const loading = ref(true);
    useRouter();
    useConfirm();
    function fmtDate(iso) {
      if (!iso) return "\u2014";
      try {
        return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
      } catch {
        return "";
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6 flex items-start justify-between gap-4"><div><h1 class="text-2xl font-bold text-gray-900">Support-kennisbank</h1><p class="mt-1 text-sm text-gray-500"> Artikelen die je op `);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/support",
        class: "text-blue-600 hover:underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`upsol.nl/support`);
          } else {
            return [
              createTextVNode("upsol.nl/support")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(` publiceert. Alleen platform-admins kunnen deze bewerken \u2014 partners niet. </p></div><button class="btn-primary">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "plus",
        size: 16
      }, null, _parent));
      _push(` Nieuw artikel </button></div>`);
      if (unref(loading)) {
        _push(`<div class="py-12 text-center"><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (!unref(articles).length) {
        _push(`<div class="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "file-text",
          size: 40,
          class: "mx-auto text-gray-300 mb-3"
        }, null, _parent));
        _push(`<p class="text-sm text-gray-500">Nog geen artikelen. Klik &quot;Nieuw artikel&quot; om te beginnen.</p></div>`);
      } else {
        _push(`<div class="section overflow-hidden p-0"><table class="w-full text-sm"><thead class="border-b border-gray-100 bg-gray-50"><tr class="text-left text-xs font-medium uppercase tracking-wider text-gray-500"><th class="px-4 py-3">Titel</th><th class="px-4 py-3">Categorie</th><th class="px-4 py-3">Status</th><th class="px-4 py-3">Bijgewerkt</th><th class="px-4 py-3"></th></tr></thead><tbody class="divide-y divide-gray-100"><!--[-->`);
        ssrRenderList(unref(articles), (a) => {
          _push(`<tr class="hover:bg-gray-50"><td class="px-4 py-3">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/platform/support/${a.id}`,
            class: "text-gray-900 font-medium hover:underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(a.title)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(a.title), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
          if (a.excerpt) {
            _push(`<p class="mt-0.5 text-xs text-gray-500 truncate max-w-md">${ssrInterpolate(a.excerpt)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td><td class="px-4 py-3 text-xs text-gray-600">${ssrInterpolate(a.category || "\u2014")}</td><td class="px-4 py-3"><button class="${ssrRenderClass([a.published_at ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-amber-50 text-amber-700 hover:bg-amber-100", "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"])}"${ssrRenderAttr("title", a.published_at ? "Klik om te depubliceren" : "Klik om te publiceren")}><span class="${ssrRenderClass([a.published_at ? "bg-green-500" : "bg-amber-500", "h-1.5 w-1.5 rounded-full"])}"></span> ${ssrInterpolate(a.published_at ? "Gepubliceerd" : "Concept")}</button></td><td class="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">${ssrInterpolate(fmtDate(a.updated_at))}</td><td class="px-4 py-3 text-right"><button class="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500" title="Verwijderen">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "trash",
            size: 14
          }, null, _parent));
          _push(`</button></td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/platform/support/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-BFhvt3r5.mjs.map
