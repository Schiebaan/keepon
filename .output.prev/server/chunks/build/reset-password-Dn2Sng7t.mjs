import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { f as useSupabaseClient, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, mergeProps, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
  __name: "reset-password",
  __ssrInlineRender: true,
  setup(__props) {
    useSupabaseClient();
    const newPassword = ref("");
    const confirmPassword = ref("");
    const isSaving = ref(false);
    const isDone = ref(false);
    const isLoading = ref(true);
    const sessionReady = ref(false);
    const errorMessage = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex min-h-screen items-center justify-center bg-gray-50 px-4" }, _attrs))}><div class="w-full max-w-sm"><div class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center"><div class="mb-6"><div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-white text-xl font-bold"> U </div><h1 class="text-xl font-semibold text-gray-900">UPsol</h1><p class="mt-1 text-sm text-gray-500">Nieuw wachtwoord instellen</p></div>`);
      if (unref(isLoading)) {
        _push(`<div class="py-8"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div><p class="mt-3 text-sm text-gray-500">Resetlink verifi\xEBren...</p></div>`);
      } else if (!unref(sessionReady) && !unref(isDone)) {
        _push(`<div class="rounded-xl bg-red-50 p-5 text-left"><p class="text-sm text-red-700">${ssrInterpolate(unref(errorMessage) || "De resetlink is ongeldig of verlopen.")}</p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/login",
          class: "mt-4 inline-block text-sm text-red-700 underline hover:text-red-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Terug naar inloggen `);
            } else {
              return [
                createTextVNode(" Terug naar inloggen ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else if (unref(isDone)) {
        _push(`<div class="rounded-xl bg-green-50 p-5 text-left"><div class="flex items-center gap-2 mb-2">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "check-circle",
          size: 20,
          class: "text-green-600"
        }, null, _parent));
        _push(`<p class="text-sm font-semibold text-green-800">Wachtwoord gewijzigd</p></div><p class="text-sm text-green-700"> Je wachtwoord is succesvol gewijzigd. Je kunt nu inloggen. </p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/login",
          class: "mt-4 inline-block text-sm text-green-700 underline hover:text-green-900"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Naar inloggen `);
            } else {
              return [
                createTextVNode(" Naar inloggen ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      } else {
        _push(`<form><div class="text-left"><label for="new-password" class="block text-xs font-medium text-gray-500 mb-1.5">Nieuw wachtwoord</label><input id="new-password"${ssrRenderAttr("value", unref(newPassword))} type="password" class="input" placeholder="Minimaal 8 tekens" required autocomplete="new-password"></div><div class="mt-3 text-left"><label for="confirm-password" class="block text-xs font-medium text-gray-500 mb-1.5">Bevestig wachtwoord</label><input id="confirm-password"${ssrRenderAttr("value", unref(confirmPassword))} type="password" class="input" placeholder="Herhaal je wachtwoord" required autocomplete="new-password"></div>`);
        if (unref(errorMessage)) {
          _push(`<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">${ssrInterpolate(unref(errorMessage))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button type="submit" class="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(isSaving)) ? " disabled" : ""}>`);
        if (unref(isSaving)) {
          _push(`<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Opslaan... </span>`);
        } else {
          _push(`<span>Wachtwoord opslaan</span>`);
        }
        _push(`</button></form>`);
      }
      _push(`</div><p class="mt-6 text-center text-xs text-gray-400"> Beveiligd door UPsol </p></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/auth/reset-password.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=reset-password-Dn2Sng7t.mjs.map
