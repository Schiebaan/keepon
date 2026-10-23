import { d as useRoute, _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderStyle, ssrInterpolate, ssrRenderClass } from 'vue/server-renderer';
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
  __name: "[slug]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    route.params.slug;
    const partner = ref(null);
    const isLoading = ref(true);
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      if (unref(isLoading)) {
        _push(`<div class="py-16 text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (!unref(partner)) {
        _push(`<div class="section py-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "x-circle",
          size: 40,
          class: "mx-auto text-gray-300 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Partner niet gevonden</h2>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/platform/partners",
          class: "text-sm text-gray-500 hover:text-gray-700 underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Terug naar partners `);
            } else {
              return [
                createTextVNode(" Terug naar partners ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/platform/partners",
          class: "mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 14,
                class: "rotate-180"
              }, null, _parent2, _scopeId));
              _push2(` Terug naar partners `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "chevron-right",
                  size: 14,
                  class: "rotate-180"
                }),
                createTextVNode(" Terug naar partners ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<div class="section mb-6"><div class="flex items-center gap-4">`);
        if (unref(partner).logo_url) {
          _push(`<img${ssrRenderAttr("src", unref(partner).logo_url)}${ssrRenderAttr("alt", unref(partner).name)} class="h-14 w-14 rounded-2xl object-contain">`);
        } else {
          _push(`<div class="flex h-14 w-14 items-center justify-center rounded-2xl text-xl font-bold text-white" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}">${ssrInterpolate((_a = unref(partner).name) == null ? void 0 : _a.charAt(0))}</div>`);
        }
        _push(`<div class="flex-1"><div class="flex items-center gap-3"><h1 class="text-2xl font-bold text-gray-900">${ssrInterpolate(unref(partner).name)}</h1><span class="${ssrRenderClass([unref(partner).is_active ? "badge--green" : "badge--gray", "badge"])}">${ssrInterpolate(unref(partner).is_active ? "Actief" : "Inactief")}</span></div><p class="text-sm text-gray-500">${ssrInterpolate(unref(partner).slug)}.upsol.nl \xB7 Sinds ${ssrInterpolate(unref(formatDate)(unref(partner).created_at))}</p></div><div class="flex items-center gap-2"><div class="h-6 w-6 rounded-full ring-2 ring-white" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}"></div><a${ssrRenderAttr("href", `https://${unref(partner).slug}.upsol.nl/admin`)} target="_blank" class="btn-primary inline-flex items-center gap-2">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "external",
          size: 14
        }, null, _parent));
        _push(` Open portaal </a></div></div><div class="mt-4 flex flex-wrap gap-6 border-t border-gray-100 pt-4 text-sm text-gray-500">`);
        if (unref(partner).support_email) {
          _push(`<span>${ssrInterpolate(unref(partner).support_email)}</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(partner).support_phone) {
          _push(`<span>${ssrInterpolate(unref(partner).support_phone)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6"><div class="stat-card" style="${ssrRenderStyle({ "--stat-color": "#1a56db" })}"><div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-500">Klanten</span>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "users",
          size: 18,
          class: "text-gray-400"
        }, null, _parent));
        _push(`</div><p class="mt-2 text-2xl font-bold text-gray-900">${ssrInterpolate(unref(partner).customer_count)}</p></div><div class="stat-card" style="${ssrRenderStyle({ "--stat-color": "#059669" })}"><div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-500">Beheerders</span>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "shield",
          size: 18,
          class: "text-gray-400"
        }, null, _parent));
        _push(`</div><p class="mt-2 text-2xl font-bold text-gray-900">${ssrInterpolate(unref(partner).admin_count)}</p></div><div class="stat-card" style="${ssrRenderStyle({ "--stat-color": "#7c3aed" })}"><div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-500">Branding</span><div class="flex gap-1"><div class="h-5 w-5 rounded" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}"></div><div class="h-5 w-5 rounded border border-gray-200" style="${ssrRenderStyle({ backgroundColor: unref(partner).secondary_color })}"></div></div></div><p class="mt-2 text-sm font-medium text-gray-700">${ssrInterpolate(unref(partner).primary_color)}</p></div></div><div class="section"><p class="text-xs text-gray-400"> Logo, kleuren, voorwaarden, Sundata credentials en beschikbare merken worden door de partner zelf beheerd. De wizard haalt automatisch de geactiveerde omvormer-merken op uit het Sundata-account van deze partner. </p><p class="mt-2 text-xs text-gray-400"> Open partnerinstellingen: <a${ssrRenderAttr("href", `https://${unref(partner).slug}.upsol.nl/admin/settings`)} target="_blank" class="text-blue-600 hover:underline">${ssrInterpolate(unref(partner).slug)}.upsol.nl/admin/settings</a></p></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/platform/partners/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=_slug_-B5bhVfmT.mjs.map
