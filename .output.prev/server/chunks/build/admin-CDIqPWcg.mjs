import { _ as _sfc_main$3 } from './BrandedShell-BwN96rOe.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { c as _export_sfc, u as usePartner, l as useAuth, d as useRoute, _ as _sfc_main$5 } from './server.mjs';
import { withCtx, createVNode, renderSlot, defineComponent, mergeProps, unref, openBlock, createBlock, Fragment, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderSlot, ssrRenderAttrs, ssrRenderAttr, ssrRenderStyle, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
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

const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "AdminSidebar",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const { signOut } = useAuth();
    const route = useRoute();
    const navItems = [
      { label: "Dashboard", icon: "dashboard", to: "/admin" },
      { label: "Uitnodigingen", icon: "send", to: "/admin/uitnodigingen" },
      { label: "Klanten", icon: "users", to: "/admin/customers" },
      { label: "Betalingen", icon: "credit-card", to: "/admin/payments" },
      { label: "Service", icon: "tool", to: "/admin/service" },
      { label: "Communicatie", icon: "mail", to: "/admin/communicatie" },
      { label: "Gebruikers", icon: "users", to: "/admin/users" },
      { label: "Instellingen", icon: "settings", to: "/admin/settings" }
    ];
    function isActive(to) {
      if (to === "/admin") return route.path === "/admin";
      return route.path.startsWith(to);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<aside${ssrRenderAttrs(mergeProps({ class: "flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white" }, _attrs))}><div class="flex h-16 items-center gap-3 border-b border-gray-100 px-5">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "flex items-center gap-3 no-underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(partner).logo_url) {
              _push2(`<img${ssrRenderAttr("src", unref(partner).logo_url)}${ssrRenderAttr("alt", unref(partner).name)} class="h-12 w-auto max-w-[180px] object-contain"${_scopeId}>`);
            } else {
              _push2(`<!--[--><span class="block h-8 w-[3px] shrink-0 rounded-full" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}"${_scopeId}></span><p class="text-sm font-bold tracking-tight text-gray-900"${_scopeId}>${ssrInterpolate(unref(partner).name)}</p><!--]-->`);
            }
          } else {
            return [
              unref(partner).logo_url ? (openBlock(), createBlock("img", {
                key: 0,
                src: unref(partner).logo_url,
                alt: unref(partner).name,
                class: "h-12 w-auto max-w-[180px] object-contain"
              }, null, 8, ["src", "alt"])) : (openBlock(), createBlock(Fragment, { key: 1 }, [
                createVNode("span", {
                  class: "block h-8 w-[3px] shrink-0 rounded-full",
                  style: { backgroundColor: unref(partner).primary_color }
                }, null, 4),
                createVNode("p", { class: "text-sm font-bold tracking-tight text-gray-900" }, toDisplayString(unref(partner).name), 1)
              ], 64))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div><nav class="flex-1 space-y-1 px-3 py-4"><!--[-->`);
      ssrRenderList(navItems, (item) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: item.to,
          to: item.to,
          class: ["nav-link", { "nav-link--active": isActive(item.to) }]
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: item.icon,
                size: 18
              }, null, _parent2, _scopeId));
              _push2(`<span${_scopeId}>${ssrInterpolate(item.label)}</span>`);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: item.icon,
                  size: 18
                }, null, 8, ["name"]),
                createVNode("span", null, toDisplayString(item.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav><div class="border-t border-gray-100 p-4"><button class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-700">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "logout",
        size: 16
      }, null, _parent));
      _push(`<span>Uitloggen</span></button></div></aside>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/AdminSidebar.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AdminTopBar",
  __ssrInlineRender: true,
  props: {
    title: {}
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      _push(`<header${ssrRenderAttrs(mergeProps({ class: "flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6" }, _attrs))}><div>`);
      ssrRenderSlot(_ctx.$slots, "title", {}, () => {
        if (__props.title) {
          _push(`<h1 class="text-lg font-semibold text-gray-900">${ssrInterpolate(__props.title)}</h1>`);
        } else {
          _push(`<!---->`);
        }
      }, _push, _parent);
      _push(`</div><div class="flex items-center gap-3"><div class="relative hidden lg:block">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "search",
        size: 16,
        class: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      }, null, _parent));
      _push(`<input type="text" placeholder="Zoeken..." class="h-9 w-56 rounded-lg border border-gray-200 bg-gray-50 pl-9 pr-3 text-sm text-gray-600 placeholder-gray-400 focus:border-gray-300 focus:bg-white focus:outline-none"></div><div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-600"> A </div></div></header>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/AdminTopBar.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_BrandedShell = _sfc_main$3;
  const _component_AdminSidebar = _sfc_main$2;
  const _component_AdminTopBar = _sfc_main$1;
  _push(ssrRenderComponent(_component_BrandedShell, _attrs, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`<div class="flex h-screen overflow-hidden"${_scopeId}>`);
        _push2(ssrRenderComponent(_component_AdminSidebar, null, null, _parent2, _scopeId));
        _push2(`<div class="flex flex-1 flex-col overflow-hidden"${_scopeId}>`);
        _push2(ssrRenderComponent(_component_AdminTopBar, null, null, _parent2, _scopeId));
        _push2(`<main class="flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8"${_scopeId}><div class="mx-auto max-w-6xl"${_scopeId}>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
        _push2(`</div></main></div></div>`);
      } else {
        return [
          createVNode("div", { class: "flex h-screen overflow-hidden" }, [
            createVNode(_component_AdminSidebar),
            createVNode("div", { class: "flex flex-1 flex-col overflow-hidden" }, [
              createVNode(_component_AdminTopBar),
              createVNode("main", { class: "flex-1 overflow-y-auto bg-gray-50 p-6 lg:p-8" }, [
                createVNode("div", { class: "mx-auto max-w-6xl" }, [
                  renderSlot(_ctx.$slots, "default")
                ])
              ])
            ])
          ])
        ];
      }
    }),
    _: 3
  }, _parent));
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/admin.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const admin = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { admin as default };
//# sourceMappingURL=admin-CDIqPWcg.mjs.map
