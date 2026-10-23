import { c as _export_sfc, u as usePartner, a as useConfirm, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderStyle, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderTeleport } from 'vue/server-renderer';
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
  __name: "users",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const users2 = ref([]);
    const isLoading = ref(true);
    const showAddModal = ref(false);
    const newEmail = ref("");
    const newName = ref("");
    const isAdding = ref(false);
    const addResult = ref(null);
    const addError = ref("");
    const editingId = ref(null);
    const editName = ref("");
    const savingId = ref(null);
    useConfirm();
    function formatDate(d) {
      if (!d) return "Nooit";
      return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    function initials(u) {
      const src = u.full_name || u.display_name || u.email;
      return src.split(/\s+/).map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join("") || "?";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-c1706771><div class="mb-6 flex items-center justify-between" data-v-c1706771><div data-v-c1706771><h1 class="text-2xl font-bold text-gray-900" data-v-c1706771>Gebruikers</h1><p class="mt-1 text-sm text-gray-500" data-v-c1706771>Beheer wie toegang heeft tot het ${ssrInterpolate(unref(partner).name)} portaal.</p></div><button class="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 transition-colors" data-v-c1706771>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "plus",
        size: 16
      }, null, _parent));
      _push(` Gebruiker toevoegen </button></div>`);
      if (unref(isLoading)) {
        _push(`<div class="section py-12 text-center" data-v-c1706771><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-c1706771></div><p class="mt-3 text-sm text-gray-500" data-v-c1706771>Laden...</p></div>`);
      } else {
        _push(`<div class="section" data-v-c1706771>`);
        if (unref(users2).length === 0) {
          _push(`<div class="py-12 text-center" data-v-c1706771>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "users",
            size: 32,
            class: "mx-auto text-gray-300 mb-3"
          }, null, _parent));
          _push(`<p class="text-sm text-gray-500" data-v-c1706771>Nog geen extra gebruikers toegevoegd.</p></div>`);
        } else {
          _push(`<div class="divide-y divide-gray-100" data-v-c1706771><!--[-->`);
          ssrRenderList(unref(users2), (u) => {
            _push(`<div class="flex items-center justify-between py-4 gap-3" data-v-c1706771><div class="flex items-center gap-3 min-w-0 flex-1" data-v-c1706771><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium text-white" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}" data-v-c1706771>${ssrInterpolate(initials(u))}</div><div class="min-w-0 flex-1" data-v-c1706771>`);
            if (unref(editingId) === u.id) {
              _push(`<!--[--><form class="flex items-center gap-2" data-v-c1706771><input${ssrRenderAttr("value", unref(editName))} type="text" class="input flex-1 text-sm" placeholder="Voornaam (en evt. achternaam)" maxlength="80" autofocus${ssrIncludeBooleanAttr(unref(savingId) === u.id) ? " disabled" : ""} data-v-c1706771><button type="submit" class="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(savingId) === u.id) ? " disabled" : ""} data-v-c1706771>${ssrInterpolate(unref(savingId) === u.id ? "Opslaan..." : "Opslaan")}</button><button type="button" class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50" data-v-c1706771> Annuleren </button></form><p class="mt-1 text-[11px] text-gray-400" data-v-c1706771>${ssrInterpolate(u.email)}</p><!--]-->`);
            } else {
              _push(`<!--[--><div class="flex items-center gap-2 flex-wrap" data-v-c1706771><p class="text-sm font-medium text-gray-900 truncate" data-v-c1706771>${ssrInterpolate(u.full_name || u.display_name)}</p>`);
              if (!u.full_name) {
                _push(`<span class="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700" data-v-c1706771> afgeleid uit e-mail </span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`<button class="text-[11px] font-medium text-gray-400 hover:text-gray-700" data-v-c1706771> Bewerken </button></div><p class="text-xs text-gray-500 truncate" data-v-c1706771>${ssrInterpolate(u.email)}</p><p class="text-[11px] text-gray-400" data-v-c1706771>Laatst ingelogd: ${ssrInterpolate(formatDate(u.last_sign_in))}</p><!--]-->`);
            }
            _push(`</div></div>`);
            if (unref(editingId) !== u.id) {
              _push(`<button class="shrink-0 rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="Verwijderen" data-v-c1706771>`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "trash",
                size: 16
              }, null, _parent));
              _push(`</button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div>`);
        }
        _push(`</div>`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(showAddModal)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-c1706771><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-c1706771></div><div class="relative w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden" data-v-c1706771><div class="border-b border-gray-100 px-6 py-4" data-v-c1706771><div class="flex items-center justify-between" data-v-c1706771><h3 class="text-lg font-semibold text-gray-900" data-v-c1706771>Gebruiker toevoegen</h3><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" data-v-c1706771>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div></div><div class="px-6 py-5" data-v-c1706771>`);
          if (unref(addResult)) {
            _push2(`<div class="text-center" data-v-c1706771><div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50" data-v-c1706771>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 28,
              class: "text-green-600"
            }, null, _parent));
            _push2(`</div><p class="text-sm font-semibold text-gray-900 mb-1" data-v-c1706771>Gebruiker aangemaakt</p><p class="text-sm text-gray-600 mb-4" data-v-c1706771>${ssrInterpolate(unref(addResult).email)}</p><div class="rounded-lg bg-amber-50 border border-amber-200 p-3 text-left mb-4" data-v-c1706771><p class="text-xs font-semibold text-amber-800 mb-1" data-v-c1706771>Tijdelijk wachtwoord</p><p class="font-mono text-sm text-amber-900 select-all" data-v-c1706771>${ssrInterpolate(unref(addResult).temporary_password)}</p><p class="text-xs text-amber-600 mt-1" data-v-c1706771>Deel dit veilig met de gebruiker. Ze kunnen het wijzigen na inloggen.</p></div><button class="btn-primary w-full" data-v-c1706771>Sluiten</button></div>`);
          } else {
            _push2(`<!--[--><p class="text-sm text-gray-600 mb-4" data-v-c1706771> Voeg een collega toe als beheerder van ${ssrInterpolate(unref(partner).name)}. Hun naam wordt zichtbaar voor klanten bij ticketreacties. </p><form data-v-c1706771><div data-v-c1706771><label class="label" data-v-c1706771>Naam</label><input${ssrRenderAttr("value", unref(newName))} type="text" class="input" placeholder="bv. Mark Jansen" maxlength="80" autofocus data-v-c1706771><p class="mt-1 text-[11px] text-gray-500" data-v-c1706771>Klanten zien deze naam onder reacties op hun tickets.</p></div><div class="mt-4" data-v-c1706771><label class="label" data-v-c1706771>E-mailadres</label><input${ssrRenderAttr("value", unref(newEmail))} type="email" class="input" placeholder="mark@bedrijf.nl" required data-v-c1706771></div>`);
            if (unref(addError)) {
              _push2(`<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" data-v-c1706771>${ssrInterpolate(unref(addError))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="mt-5 flex justify-end gap-3" data-v-c1706771><button type="button" class="btn-secondary" data-v-c1706771>Annuleren</button><button type="submit" class="btn-primary"${ssrIncludeBooleanAttr(!unref(newEmail) || unref(isAdding)) ? " disabled" : ""} data-v-c1706771>`);
            if (!unref(isAdding)) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "plus",
                size: 16
              }, null, _parent));
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(unref(isAdding) ? "Toevoegen..." : "Toevoegen")}</button></div></form><!--]-->`);
          }
          _push2(`</div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/users.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const users = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c1706771"]]);

export { users as default };
//# sourceMappingURL=users-CPkTYmUx.mjs.map
