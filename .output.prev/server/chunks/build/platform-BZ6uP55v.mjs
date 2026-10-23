import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, mergeProps, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import { d as useRoute } from './server.mjs';
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
  __name: "platform",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const navItems = [
      { label: "Dashboard", to: "/platform" },
      { label: "Partners", to: "/platform/partners" },
      { label: "Integraties", to: "/platform/integrations" },
      { label: "Support", to: "/platform/support" }
    ];
    function isActive(to) {
      if (to === "/platform") return route.path === "/platform";
      return route.path.startsWith(to);
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex min-h-screen flex-col" }, _attrs))}><header class="border-b border-gray-200 bg-gray-900"><div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6"><div class="flex items-center gap-8">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/platform",
        class: "text-lg font-semibold text-white"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`UPsol Platform`);
          } else {
            return [
              createTextVNode("UPsol Platform")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<nav class="flex items-center gap-1"><!--[-->`);
      ssrRenderList(navItems, (item) => {
        _push(ssrRenderComponent(_component_NuxtLink, {
          key: item.to,
          to: item.to,
          class: ["rounded-lg px-3 py-1.5 text-sm transition-colors", isActive(item.to) ? "bg-white/15 font-medium text-white" : "text-gray-400 hover:text-white"]
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`${ssrInterpolate(item.label)}`);
            } else {
              return [
                createTextVNode(toDisplayString(item.label), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
      });
      _push(`<!--]--></nav></div><div class="flex items-center gap-3"><span class="text-sm text-gray-400">Platform Admin</span><div class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-700 text-sm font-medium text-white"> K </div></div></div></header><main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</main></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/platform.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=platform-BZ6uP55v.mjs.map
