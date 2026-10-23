import { l as useAuth, u as usePartner, n as navigateTo, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderComponent, ssrIncludeBooleanAttr, ssrRenderClass } from 'vue/server-renderer';
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
  __name: "login",
  __ssrInlineRender: true,
  setup(__props) {
    const { signInWithMagicLink, signInWithPassword, resetPassword, user } = useAuth();
    const { partner } = usePartner();
    if (user.value) {
      navigateTo("/auth/callback", { replace: true });
    }
    const loginMode = ref("password");
    const email = ref("");
    const password = ref("");
    const isSending = ref(false);
    const isSent = ref(false);
    const isResetSent = ref(false);
    const showResetForm = ref(false);
    const errorMessage = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex min-h-screen items-center justify-center bg-gray-50 px-4" }, _attrs))}><div class="w-full max-w-sm"><div class="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-gray-100 text-center"><div class="mb-6">`);
      if ((_a = unref(partner)) == null ? void 0 : _a.logo_url) {
        _push(`<img${ssrRenderAttr("src", unref(partner).logo_url)}${ssrRenderAttr("alt", (_b = unref(partner)) == null ? void 0 : _b.name)} class="mx-auto mb-3 h-12 w-auto rounded-xl">`);
      } else {
        _push(`<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white text-xl font-bold"> K </div>`);
      }
      _push(`<h1 class="text-xl font-semibold text-gray-900">${ssrInterpolate(((_c = unref(partner)) == null ? void 0 : _c.name) || "UPsol")}</h1><p class="mt-1 text-sm text-gray-500"> Log in op je portaal </p></div>`);
      if (unref(isResetSent)) {
        _push(`<div class="rounded-xl bg-blue-50 p-5 text-left"><div class="flex items-center gap-2 mb-2">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "check-circle",
          size: 20,
          class: "text-blue-600"
        }, null, _parent));
        _push(`<p class="text-sm font-semibold text-blue-800">Herstelmail verstuurd</p></div><p class="text-sm text-blue-700"> We hebben een link gestuurd naar <strong>${ssrInterpolate(unref(email))}</strong> om je wachtwoord te herstellen. Controleer je inbox (en spam). </p><button class="mt-4 text-sm text-blue-700 underline hover:text-blue-900"> Terug naar inloggen </button></div>`);
      } else if (unref(isSent)) {
        _push(`<div class="rounded-xl bg-green-50 p-5 text-left"><div class="flex items-center gap-2 mb-2">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "check-circle",
          size: 20,
          class: "text-green-600"
        }, null, _parent));
        _push(`<p class="text-sm font-semibold text-green-800">Inloglink verstuurd</p></div><p class="text-sm text-green-700"> We hebben een link gestuurd naar <strong>${ssrInterpolate(unref(email))}</strong>. Controleer je inbox en klik op de link om in te loggen. </p><button class="mt-4 text-sm text-green-700 underline hover:text-green-900"> Ander e-mailadres gebruiken </button></div>`);
      } else if (unref(showResetForm)) {
        _push(`<div><form><p class="mb-4 text-sm text-gray-600"> Vul je e-mailadres in. We sturen je een link om je wachtwoord te herstellen. </p><div class="text-left"><label for="reset-email" class="block text-xs font-medium text-gray-500 mb-1.5">E-mailadres</label><input id="reset-email"${ssrRenderAttr("value", unref(email))} type="email" class="input" placeholder="je@email.nl" required autocomplete="email"></div>`);
        if (unref(errorMessage)) {
          _push(`<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">${ssrInterpolate(unref(errorMessage))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button type="submit" class="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(isSending)) ? " disabled" : ""}>`);
        if (unref(isSending)) {
          _push(`<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> Versturen... </span>`);
        } else {
          _push(`<span>Herstelmail versturen</span>`);
        }
        _push(`</button><button type="button" class="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"> Terug naar inloggen </button></form></div>`);
      } else {
        _push(`<div><div class="mb-5 flex rounded-lg bg-gray-100 p-1"><button type="button" class="${ssrRenderClass([unref(loginMode) === "password" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"])}"> Wachtwoord </button><button type="button" class="${ssrRenderClass([unref(loginMode) === "magic" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors"])}"> Magic link </button></div><form><div class="text-left"><label for="email" class="block text-xs font-medium text-gray-500 mb-1.5">E-mailadres</label><input id="email"${ssrRenderAttr("value", unref(email))} type="email" class="input" placeholder="je@email.nl" required autocomplete="email"></div>`);
        if (unref(loginMode) === "password") {
          _push(`<div class="mt-3 text-left"><label for="password" class="block text-xs font-medium text-gray-500 mb-1.5">Wachtwoord</label><input id="password"${ssrRenderAttr("value", unref(password))} type="password" class="input" placeholder="Je wachtwoord" required autocomplete="current-password"><button type="button" class="mt-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"> Wachtwoord vergeten? </button></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(errorMessage)) {
          _push(`<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">${ssrInterpolate(unref(errorMessage))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button type="submit" class="mt-4 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(isSending)) ? " disabled" : ""}>`);
        if (unref(isSending)) {
          _push(`<span class="flex items-center justify-center gap-2"><svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> ${ssrInterpolate(unref(loginMode) === "magic" ? "Versturen..." : "Inloggen...")}</span>`);
        } else {
          _push(`<span>${ssrInterpolate(unref(loginMode) === "magic" ? "Inloglink versturen" : "Inloggen")}</span>`);
        }
        _push(`</button>`);
        if (unref(loginMode) === "magic") {
          _push(`<p class="mt-4 text-xs text-gray-400"> Je ontvangt een veilige inloglink per e-mail. Geen wachtwoord nodig. </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</form></div>`);
      }
      _push(`</div><p class="mt-6 text-center text-xs text-gray-400"> Beveiligd door UPsol </p></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/login.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=login-qzozohBt.mjs.map
