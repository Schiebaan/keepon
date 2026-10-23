import { _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderClass, ssrRenderComponent, ssrInterpolate } from 'vue/server-renderer';
import { g as getModuleTheme } from './module-theme-8XLQDN8U.mjs';
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
  __name: "modules",
  __ssrInlineRender: true,
  setup(__props) {
    const modules = [
      { type: "solar", name: "Zonnepanelen monitoring", integration: "Sundata", theme: getModuleTheme("solar") },
      { type: "heat_pump", name: "Warmtepomp monitoring", integration: "Weheat", theme: getModuleTheme("heat_pump") },
      { type: "ev_charger", name: "Laadpaal monitoring", integration: "Easee", theme: getModuleTheme("ev_charger") }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">Modules</h1><p class="mt-1 text-sm text-gray-500">Beschikbare monitoringmodules voor je klanten.</p></div><div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"><!--[-->`);
      ssrRenderList(modules, (mod) => {
        _push(`<div class="section"><div class="flex items-center gap-3 mb-3"><div class="${ssrRenderClass([[mod.theme.bg, mod.theme.text], "flex h-10 w-10 items-center justify-center rounded-xl"])}">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: mod.theme.icon,
          size: 20
        }, null, _parent));
        _push(`</div><div><h3 class="font-semibold text-gray-900">${ssrInterpolate(mod.name)}</h3><p class="text-xs text-gray-500">Integratie: ${ssrInterpolate(mod.integration)}</p></div></div><p class="text-sm text-gray-500"> Koppel deze module aan klanten via het klantdossier. Configureer de integratie via Instellingen. </p></div>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/modules.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=modules-DKPskyYJ.mjs.map
