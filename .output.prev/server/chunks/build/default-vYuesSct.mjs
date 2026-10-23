import { _ as _sfc_main$1 } from './BrandedShell-BwN96rOe.mjs';
import { _ as _sfc_main$1$1, a as _sfc_main$2 } from './AppFooter-BWreZKe-.mjs';
import { withCtx, createVNode, renderSlot, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderSlot } from 'vue/server-renderer';
import { c as _export_sfc } from './server.mjs';
import './nuxt-link-DjY7r90I.mjs';
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

const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  const _component_BrandedShell = _sfc_main$1;
  const _component_AppHeader = _sfc_main$1$1;
  const _component_AppFooter = _sfc_main$2;
  _push(ssrRenderComponent(_component_BrandedShell, _attrs, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`<div class="flex min-h-screen flex-col"${_scopeId}>`);
        _push2(ssrRenderComponent(_component_AppHeader, null, null, _parent2, _scopeId));
        _push2(`<main class="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6"${_scopeId}>`);
        ssrRenderSlot(_ctx.$slots, "default", {}, null, _push2, _parent2, _scopeId);
        _push2(`</main>`);
        _push2(ssrRenderComponent(_component_AppFooter, null, null, _parent2, _scopeId));
        _push2(`</div>`);
      } else {
        return [
          createVNode("div", { class: "flex min-h-screen flex-col" }, [
            createVNode(_component_AppHeader),
            createVNode("main", { class: "mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6" }, [
              renderSlot(_ctx.$slots, "default")
            ]),
            createVNode(_component_AppFooter)
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("layouts/default.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _default = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);

export { _default as default };
//# sourceMappingURL=default-vYuesSct.mjs.map
