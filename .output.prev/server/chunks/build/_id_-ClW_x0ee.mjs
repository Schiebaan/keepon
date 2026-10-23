import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { c as _export_sfc, d as useRoute, e as useRouter, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, watch, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderClass, ssrRenderStyle } from 'vue/server-renderer';
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
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    useRouter();
    route.params.id;
    const article = ref(null);
    const loading = ref(true);
    const saving = ref(false);
    const saveMsg = ref("");
    const error = ref("");
    const preview = ref("");
    const showPreview = ref(false);
    async function togglePreview() {
      var _a;
      showPreview.value = !showPreview.value;
      if (!showPreview.value) return;
      if (!((_a = article.value) == null ? void 0 : _a.body_md)) {
        preview.value = "<em>Nog geen inhoud</em>";
        return;
      }
      const { marked } = await import('marked');
      preview.value = marked.parse(article.value.body_md, { gfm: true, breaks: false, async: false });
    }
    watch(() => {
      var _a;
      return (_a = article.value) == null ? void 0 : _a.body_md;
    }, () => {
      if (showPreview.value) togglePreview();
    });
    ref(null);
    ref(null);
    const uploading = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-3548569b>`);
      if (unref(loading)) {
        _push(`<div class="py-12 text-center" data-v-3548569b><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-3548569b></div></div>`);
      } else if (unref(article)) {
        _push(`<!--[--><div class="mb-4 flex items-start justify-between gap-4" data-v-3548569b><div data-v-3548569b>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/platform/support",
          class: "text-xs text-gray-500 hover:text-gray-800 no-underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`\u2190 Alle artikelen`);
            } else {
              return [
                createTextVNode("\u2190 Alle artikelen")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<h1 class="mt-1 text-xl font-bold text-gray-900" data-v-3548569b>Artikel bewerken</h1><p class="text-xs text-gray-500" data-v-3548569b> Publieke URL: <a${ssrRenderAttr("href", `/support/${unref(article).slug}`)} target="_blank" class="text-blue-600 hover:underline" data-v-3548569b>/support/${ssrInterpolate(unref(article).slug)}</a></p></div><div class="flex items-center gap-2" data-v-3548569b>`);
        if (unref(saveMsg)) {
          _push(`<span class="text-xs font-medium text-green-600" data-v-3548569b>${ssrInterpolate(unref(saveMsg))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="btn-secondary text-sm" data-v-3548569b>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(showPreview) ? "x" : "search",
          size: 14
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(showPreview) ? "Sluit preview" : "Preview")}</button>`);
        if (!unref(article).published_at) {
          _push(`<button class="rounded-lg border border-green-200 bg-white px-3 py-1.5 text-sm font-medium text-green-700 hover:bg-green-50"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""} data-v-3548569b> Publiceer </button>`);
        } else {
          _push(`<button class="rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""} data-v-3548569b> Depubliceer </button>`);
        }
        _push(`<button class="btn-primary text-sm"${ssrIncludeBooleanAttr(unref(saving)) ? " disabled" : ""} data-v-3548569b>${ssrInterpolate(unref(saving) ? "Opslaan..." : "Opslaan")}</button></div></div>`);
        if (unref(error)) {
          _push(`<div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" data-v-3548569b>${ssrInterpolate(unref(error))}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="${ssrRenderClass([unref(showPreview) ? "lg:grid-cols-2" : "", "grid gap-4"])}" data-v-3548569b><div class="section space-y-4" data-v-3548569b><div data-v-3548569b><label class="label" data-v-3548569b>Titel</label><input${ssrRenderAttr("value", unref(article).title)} type="text" class="input" maxlength="200" data-v-3548569b></div><div class="grid grid-cols-2 gap-3" data-v-3548569b><div data-v-3548569b><label class="label" data-v-3548569b>Slug (URL)</label><input${ssrRenderAttr("value", unref(article).slug)} type="text" class="input font-mono text-sm" maxlength="80" data-v-3548569b></div><div data-v-3548569b><label class="label" data-v-3548569b>Categorie</label><input${ssrRenderAttr("value", unref(article).category)} type="text" class="input" placeholder="bv. Aan de slag" maxlength="60" data-v-3548569b></div></div><div data-v-3548569b><label class="label" data-v-3548569b>Excerpt (korte samenvatting)</label><textarea class="input" rows="2" maxlength="400" placeholder="1-2 zinnen die op de indexpagina getoond worden" data-v-3548569b>${ssrInterpolate(unref(article).excerpt)}</textarea></div><div data-v-3548569b><div class="flex items-center justify-between mb-1.5" data-v-3548569b><label class="label !mb-0" data-v-3548569b>Inhoud <span class="text-gray-400 font-normal" data-v-3548569b>(Markdown)</span></label><button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(uploading)) ? " disabled" : ""} data-v-3548569b>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "upload",
          size: 12
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(uploading) ? "Uploaden..." : "Screenshot invoegen")}</button><input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" class="hidden" data-v-3548569b></div><textarea class="input font-mono text-sm" style="${ssrRenderStyle({ "min-height": "500px" })}" spellcheck="true" data-v-3548569b>${ssrInterpolate(unref(article).body_md)}</textarea><p class="mt-1 text-[11px] text-gray-400" data-v-3548569b> Ondersteuning: <code data-v-3548569b>##</code> koppen, <code data-v-3548569b>**vet**</code>, <code data-v-3548569b>*cursief*</code>, <code data-v-3548569b>[link](url)</code>, lijsten, code-blocks, tabellen (GFM). Screenshots plakken via de knop hierboven. </p></div></div>`);
        if (unref(showPreview)) {
          _push(`<div class="section" data-v-3548569b><p class="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500" data-v-3548569b>Preview</p><h1 class="text-2xl font-bold text-gray-900" data-v-3548569b>${ssrInterpolate(unref(article).title)}</h1>`);
          if (unref(article).excerpt) {
            _push(`<p class="mt-1 text-sm text-gray-500" data-v-3548569b>${ssrInterpolate(unref(article).excerpt)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="prose prose-sm mt-6 max-w-none" data-v-3548569b>${(_a = unref(preview)) != null ? _a : ""}</div></div>`);
        } else {
          _push(`<!---->`);
        }
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/platform/support/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3548569b"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-ClW_x0ee.mjs.map
