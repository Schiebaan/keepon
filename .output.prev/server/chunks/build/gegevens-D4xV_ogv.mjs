import { u as usePartner, f as useSupabaseClient, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderAttr } from 'vue/server-renderer';
import { u as useCurrentCustomer } from './useCurrentCustomer-Dbh6BR3o.mjs';
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
  __name: "gegevens",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const { customer, isLoading } = useCurrentCustomer();
    useSupabaseClient();
    const isEditing = ref(false);
    const isSaving = ref(false);
    const showSuccess = ref(false);
    const editForm = ref({ full_name: "", phone: "", street: "", house_number: "", postal_code: "", city: "" });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">Mijn gegevens</h1><p class="mt-1 text-sm text-gray-500">Bekijk en wijzig je persoonlijke gegevens.</p></div>`);
      if (unref(isLoading)) {
        _push(`<div class="section py-12 text-center"><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (unref(customer)) {
        _push(`<div class="section">`);
        if (!unref(isEditing)) {
          _push(`<!--[--><div class="flex items-center justify-between mb-4"><h2 class="text-base font-semibold text-gray-900">Persoonlijke gegevens</h2><button class="btn-secondary text-sm">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "settings",
            size: 14
          }, null, _parent));
          _push(` Bewerken </button></div>`);
          if (unref(showSuccess)) {
            _push(`<p class="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-600">Gegevens opgeslagen!</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><p class="text-xs text-gray-400">Naam</p><p class="text-sm font-medium text-gray-900">${ssrInterpolate(unref(customer).full_name || "\u2014")}</p></div><div><p class="text-xs text-gray-400">E-mail</p><p class="text-sm font-medium text-gray-900">${ssrInterpolate(unref(customer).email)}</p></div><div><p class="text-xs text-gray-400">Telefoon</p><p class="text-sm font-medium text-gray-900">${ssrInterpolate(unref(customer).phone || "\u2014")}</p></div><div><p class="text-xs text-gray-400">Adres</p><p class="text-sm font-medium text-gray-900">`);
          if (unref(customer).street) {
            _push(`<!--[-->${ssrInterpolate(unref(customer).street)} ${ssrInterpolate(unref(customer).house_number)}, ${ssrInterpolate(unref(customer).postal_code)} ${ssrInterpolate(unref(customer).city)}<!--]-->`);
          } else {
            _push(`<!--[-->\u2014<!--]-->`);
          }
          _push(`</p></div></div><!--]-->`);
        } else {
          _push(`<!--[--><div class="flex items-center justify-between mb-4"><h2 class="text-base font-semibold text-gray-900">Gegevens bewerken</h2><div class="flex gap-2"><button class="btn-primary text-sm"${ssrIncludeBooleanAttr(unref(isSaving)) ? " disabled" : ""}>${ssrInterpolate(unref(isSaving) ? "Opslaan..." : "Opslaan")}</button><button class="btn-secondary text-sm">Annuleren</button></div></div><div class="space-y-3"><div><label class="label">Naam</label><input${ssrRenderAttr("value", unref(editForm).full_name)} type="text" class="input"></div><div><label class="label">Telefoon</label><input${ssrRenderAttr("value", unref(editForm).phone)} type="tel" class="input"></div><div class="grid grid-cols-3 gap-3"><div class="col-span-2"><label class="label">Straat</label><input${ssrRenderAttr("value", unref(editForm).street)} type="text" class="input"></div><div><label class="label">Huisnummer</label><input${ssrRenderAttr("value", unref(editForm).house_number)} type="text" class="input"></div></div><div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label class="label">Postcode</label><input${ssrRenderAttr("value", unref(editForm).postal_code)} type="text" class="input"></div><div><label class="label">Woonplaats</label><input${ssrRenderAttr("value", unref(editForm).city)} type="text" class="input"></div></div></div><!--]-->`);
        }
        _push(`</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/gegevens.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=gegevens-D4xV_ogv.mjs.map
