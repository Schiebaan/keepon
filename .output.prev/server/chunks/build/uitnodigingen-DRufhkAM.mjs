import { c as _export_sfc, a as useConfirm, _ as _sfc_main$5, u as usePartner, h as useBackdropClose } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, computed, watch, unref, isRef, withCtx, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderComponent, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderAttr, ssrLooseContain, ssrLooseEqual, ssrRenderList, ssrRenderTeleport } from 'vue/server-renderer';
import { g as getModuleTheme } from './module-theme-8XLQDN8U.mjs';
import { u as useIntegrations } from './useIntegrations-BEERw8am.mjs';
import { u as useCustomers } from './useCustomers-B2wkzFun.mjs';
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

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "OnboardModal",
  __ssrInlineRender: true,
  props: {
    modelValue: { type: Boolean }
  },
  emits: ["update:modelValue", "onboarded"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const { partner } = usePartner();
    const { isConnected } = useIntegrations();
    const { createCustomer } = useCustomers({ autoLoad: false });
    const grippConnected = computed(() => isConnected(partner.value.id, "gripp"));
    const submitError = ref("");
    const inputMode = ref("manual");
    const form = ref({
      erp_project_id: "",
      full_name: "",
      email: "",
      phone: "",
      street: "",
      house_number: "",
      postal_code: "",
      city: ""
    });
    const selectedModules = ref(/* @__PURE__ */ new Set());
    const availableModules = [
      { type: "solar", label: "Zonnepanelen", desc: "Monitoring via Sundata", icon: "solar" },
      { type: "heat_pump", label: "Warmtepomp", desc: "Monitoring via Weheat", icon: "heat-pump" },
      { type: "ev_charger", label: "Laadpaal", desc: "Monitoring via Easee", icon: "ev-charger" }
    ];
    const showAdvanced = ref(false);
    const billingInterval = ref("monthly");
    const yearlyDiscountMonths = ref(null);
    const trialMonths = ref(null);
    const overridePrice = ref({});
    const overrideReason = ref({});
    function priceEur(cents) {
      if (!cents) return "";
      return (cents / 100).toFixed(2).replace(".", ",");
    }
    const addressComplete = computed(
      () => !!(form.value.street.trim() && form.value.house_number.trim() && form.value.postal_code.trim() && form.value.city.trim())
    );
    const submitting = ref(false);
    const result = ref(null);
    const importLoading = ref(false);
    const importError = ref("");
    function close() {
      emit("update:modelValue", false);
      setTimeout(() => {
        resetForm();
      }, 300);
    }
    useBackdropClose(close);
    function resetForm() {
      form.value = { erp_project_id: "", full_name: "", email: "", phone: "", street: "", house_number: "", postal_code: "", city: "" };
      selectedModules.value = /* @__PURE__ */ new Set();
      result.value = null;
      submitting.value = false;
      importLoading.value = false;
      importError.value = "";
      inputMode.value = "manual";
      showAdvanced.value = false;
      billingInterval.value = "monthly";
      yearlyDiscountMonths.value = null;
      trialMonths.value = null;
      overridePrice.value = {};
      overrideReason.value = {};
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      ssrRenderTeleport(_push, (_push2) => {
        var _a, _b;
        if (__props.modelValue) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-04af6e71><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-04af6e71></div><div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden" data-v-04af6e71><div class="border-b border-gray-100 px-6 py-4" data-v-04af6e71><div class="flex items-center justify-between" data-v-04af6e71><h3 class="text-lg font-semibold text-gray-900" data-v-04af6e71>Klant uitnodigen</h3><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" data-v-04af6e71>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div></div>`);
          if (unref(result)) {
            _push2(`<div class="px-6 py-8 space-y-5" data-v-04af6e71><div class="text-center" data-v-04af6e71><div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50" data-v-04af6e71>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 28,
              class: "text-green-500"
            }, null, _parent));
            _push2(`</div><p class="mt-3 text-base font-semibold text-gray-900" data-v-04af6e71>${ssrInterpolate(unref(result).customer.full_name)} is uitgenodigd!</p><p class="mt-1 text-sm text-gray-500" data-v-04af6e71>Welkomstmail verstuurd naar ${ssrInterpolate(unref(result).customer.email)}</p></div>`);
            if ((_a = unref(result).selectedModules) == null ? void 0 : _a.length) {
              _push2(`<div class="rounded-xl border border-amber-200 bg-amber-50 p-4" data-v-04af6e71><p class="text-xs font-semibold text-amber-800 mb-3 flex items-center gap-1.5" data-v-04af6e71>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "info",
                size: 14
              }, null, _parent));
              _push2(` Volgende stap: modules koppelen </p><div class="space-y-2" data-v-04af6e71><!--[-->`);
              ssrRenderList(unref(result).selectedModules, (modType) => {
                _push2(`<div class="flex items-center gap-3 rounded-lg bg-white p-2.5" data-v-04af6e71><div class="${ssrRenderClass([[unref(getModuleTheme)(modType).bg, unref(getModuleTheme)(modType).text], "flex h-8 w-8 items-center justify-center rounded-lg"])}" data-v-04af6e71>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: unref(getModuleTheme)(modType).icon,
                  size: 16
                }, null, _parent));
                _push2(`</div><div class="flex-1" data-v-04af6e71><p class="text-sm font-medium text-gray-900" data-v-04af6e71>${ssrInterpolate(unref(getModuleTheme)(modType).label)}</p><p class="text-xs text-gray-500" data-v-04af6e71>Nog te koppelen via het klantdossier</p></div><span class="badge badge--yellow" data-v-04af6e71>Te koppelen</span></div>`);
              });
              _push2(`<!--]--></div><p class="mt-3 text-xs text-amber-700" data-v-04af6e71> Ga naar het klantdossier om de monitoring per module te koppelen. </p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex justify-center gap-3" data-v-04af6e71><button class="btn-secondary" data-v-04af6e71>Sluiten</button>`);
            if ((_b = unref(result).customer) == null ? void 0 : _b.id) {
              _push2(ssrRenderComponent(_component_NuxtLink, {
                to: `/admin/customers/${unref(result).customer.id}`,
                class: "btn-primary inline-flex items-center gap-2",
                onClick: close
              }, {
                default: withCtx((_, _push3, _parent2, _scopeId) => {
                  if (_push3) {
                    _push3(ssrRenderComponent(_component_AppIcon, {
                      name: "folder",
                      size: 14
                    }, null, _parent2, _scopeId));
                    _push3(` Naar dossier `);
                  } else {
                    return [
                      createVNode(_component_AppIcon, {
                        name: "folder",
                        size: 14
                      }),
                      createTextVNode(" Naar dossier ")
                    ];
                  }
                }),
                _: 1
              }, _parent));
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
          } else {
            _push2(`<!--[--><div class="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto" data-v-04af6e71><div class="flex gap-1 rounded-lg bg-gray-100 p-1" data-v-04af6e71><button type="button" class="${ssrRenderClass([unref(inputMode) === "manual" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors"])}" data-v-04af6e71>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "user",
              size: 14
            }, null, _parent));
            _push2(` Handmatig invoeren </button><button type="button" class="${ssrRenderClass([unref(inputMode) === "import" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors"])}" data-v-04af6e71>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "refresh",
              size: 14
            }, null, _parent));
            _push2(` Importeren uit CRM </button></div>`);
            if (unref(inputMode) === "import") {
              _push2(`<div class="rounded-xl border border-gray-200 p-4" data-v-04af6e71><div class="flex items-center gap-3 mb-3" data-v-04af6e71><div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600" data-v-04af6e71>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "users",
                size: 16
              }, null, _parent));
              _push2(`</div><div data-v-04af6e71><p class="text-sm font-medium text-gray-900" data-v-04af6e71>Gripp.com</p><p class="${ssrRenderClass([unref(grippConnected) ? "text-green-600" : "text-gray-400", "text-xs"])}" data-v-04af6e71>${ssrInterpolate(unref(grippConnected) ? "Verbonden" : "Niet gekoppeld")}</p></div></div><div class="flex gap-2" data-v-04af6e71><input${ssrRenderAttr("value", unref(form).erp_project_id)} type="text" class="input flex-1" placeholder="Projectnummer (bijv. GRP-2024-0847)" data-v-04af6e71><button type="button" class="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-xs font-medium text-white hover:bg-gray-800 disabled:opacity-50 shrink-0"${ssrIncludeBooleanAttr(!unref(form).erp_project_id || unref(importLoading)) ? " disabled" : ""} data-v-04af6e71>`);
              if (unref(importLoading)) {
                _push2(`<span class="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" data-v-04af6e71></span>`);
              } else {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "download",
                  size: 14
                }, null, _parent));
              }
              _push2(` ${ssrInterpolate(unref(importLoading) ? "Ophalen..." : "Importeer")}</button></div>`);
              if (unref(importError)) {
                _push2(`<p class="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700" data-v-04af6e71>${ssrInterpolate(unref(importError))}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="space-y-4" data-v-04af6e71><div class="flex items-center gap-2 text-xs text-gray-400" data-v-04af6e71><div class="flex-1 border-t border-gray-200" data-v-04af6e71></div><span data-v-04af6e71>Klantgegevens</span><div class="flex-1 border-t border-gray-200" data-v-04af6e71></div></div>`);
            if (unref(inputMode) === "manual") {
              _push2(`<div data-v-04af6e71><label class="label" data-v-04af6e71>Referentienummer <span class="text-gray-400 font-normal" data-v-04af6e71>(optioneel)</span></label><input${ssrRenderAttr("value", unref(form).erp_project_id)} type="text" class="input" placeholder="Intern projectnummer of referentie" data-v-04af6e71></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="grid grid-cols-2 gap-3" data-v-04af6e71><div data-v-04af6e71><label class="label" data-v-04af6e71>Naam <span class="text-red-400" data-v-04af6e71>*</span></label><input${ssrRenderAttr("value", unref(form).full_name)} type="text" class="input" placeholder="Volledige naam" required data-v-04af6e71></div><div data-v-04af6e71><label class="label" data-v-04af6e71>E-mailadres <span class="text-red-400" data-v-04af6e71>*</span></label><input${ssrRenderAttr("value", unref(form).email)} type="email" class="input" placeholder="klant@voorbeeld.nl" required data-v-04af6e71></div></div><div data-v-04af6e71><label class="label" data-v-04af6e71>Telefoon</label><input${ssrRenderAttr("value", unref(form).phone)} type="tel" class="input" placeholder="06-12345678" data-v-04af6e71></div><div class="grid grid-cols-3 gap-3" data-v-04af6e71><div class="col-span-2" data-v-04af6e71><label class="label" data-v-04af6e71>Straat</label><input${ssrRenderAttr("value", unref(form).street)} type="text" class="input" placeholder="Straatnaam" data-v-04af6e71></div><div data-v-04af6e71><label class="label" data-v-04af6e71>Huisnummer</label><input${ssrRenderAttr("value", unref(form).house_number)} type="text" class="input" placeholder="Nr." data-v-04af6e71></div></div><div class="grid grid-cols-2 gap-3" data-v-04af6e71><div data-v-04af6e71><label class="label" data-v-04af6e71>Postcode</label><input${ssrRenderAttr("value", unref(form).postal_code)} type="text" class="input" placeholder="1234 AB" data-v-04af6e71></div><div data-v-04af6e71><label class="label" data-v-04af6e71>Woonplaats</label><input${ssrRenderAttr("value", unref(form).city)} type="text" class="input" placeholder="Stad" data-v-04af6e71></div></div></div><div data-v-04af6e71><div class="flex items-center gap-2 text-xs text-gray-400 mb-3" data-v-04af6e71><div class="flex-1 border-t border-gray-200" data-v-04af6e71></div><span data-v-04af6e71>Modules <span class="text-red-500" data-v-04af6e71>*</span></span><div class="flex-1 border-t border-gray-200" data-v-04af6e71></div></div><p class="text-xs text-gray-500 mb-3" data-v-04af6e71> Selecteer welke modules bij deze klant ge\xEFnstalleerd zijn \u2014 <strong data-v-04af6e71>ten minste \xE9\xE9n is verplicht</strong>. Zonder module kan de klant niks activeren in het portaal. Monitoring koppel je later in het klantdossier. </p>`);
            if (unref(selectedModules).has("solar") && !unref(addressComplete)) {
              _push2(`<p class="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800" data-v-04af6e71>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "info",
                size: 13,
                class: "mt-0.5 shrink-0"
              }, null, _parent));
              _push2(`<span data-v-04af6e71> Voor zonnepanelen heb je straks een <strong data-v-04af6e71>volledig adres</strong> nodig om de omvormer aan Sundata te koppelen. Je kunt nu doorgaan en het later aanvullen, maar meteen invullen scheelt een stap. </span></p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="grid grid-cols-1 sm:grid-cols-3 gap-2" data-v-04af6e71><!--[-->`);
            ssrRenderList(availableModules, (mod) => {
              _push2(`<button type="button" class="${ssrRenderClass([unref(selectedModules).has(mod.type) ? "border-gray-900 bg-gray-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50", "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all text-center"])}" data-v-04af6e71><div class="${ssrRenderClass([unref(selectedModules).has(mod.type) ? [unref(getModuleTheme)(mod.type).bg, unref(getModuleTheme)(mod.type).text] : "bg-gray-100 text-gray-400", "flex h-10 w-10 items-center justify-center rounded-lg"])}" data-v-04af6e71>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: mod.icon,
                size: 20
              }, null, _parent));
              _push2(`</div><div data-v-04af6e71><p class="${ssrRenderClass([unref(selectedModules).has(mod.type) ? "text-gray-900" : "text-gray-600", "text-xs font-medium"])}" data-v-04af6e71>${ssrInterpolate(mod.label)}</p><p class="text-[10px] text-gray-400 mt-0.5" data-v-04af6e71>${ssrInterpolate(mod.desc)}</p></div>`);
              if (unref(selectedModules).has(mod.type)) {
                _push2(`<div class="flex h-5 w-5 items-center justify-center rounded-full bg-gray-900" data-v-04af6e71>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "check",
                  size: 12,
                  class: "text-white"
                }, null, _parent));
                _push2(`</div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</button>`);
            });
            _push2(`<!--]--></div></div><div class="mt-5 rounded-xl border border-gray-200 bg-gray-50/60" data-v-04af6e71><button type="button" class="flex w-full items-center justify-between gap-2 px-4 py-3 text-left" data-v-04af6e71><div class="flex items-center gap-2" data-v-04af6e71>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "settings",
              size: 14,
              class: "text-gray-500"
            }, null, _parent));
            _push2(`<span class="text-sm font-medium text-gray-900" data-v-04af6e71>Speciale voorwaarden</span><span class="text-xs text-gray-400" data-v-04af6e71>(optioneel)</span></div>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: unref(showAdvanced) ? "chevron-up" : "chevron-down",
              size: 14,
              class: "text-gray-400"
            }, null, _parent));
            _push2(`</button>`);
            if (unref(showAdvanced)) {
              _push2(`<div class="border-t border-gray-200 px-4 py-4 space-y-4 bg-white rounded-b-xl" data-v-04af6e71><div data-v-04af6e71><label class="label" data-v-04af6e71>Standaard termijn</label><div class="mt-1 grid grid-cols-2 gap-2" data-v-04af6e71><button type="button" class="${ssrRenderClass([unref(billingInterval) === "monthly" ? "border-gray-900 bg-gray-50 text-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50", "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors"])}" data-v-04af6e71>Per maand</button><button type="button" class="${ssrRenderClass([unref(billingInterval) === "yearly" ? "border-gray-900 bg-gray-50 text-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50", "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors"])}" data-v-04af6e71>Per jaar</button></div><p class="mt-1 text-[11px] text-gray-500" data-v-04af6e71>Klant kan dit zelf nog wisselen op de akkoordpagina.</p></div><div data-v-04af6e71><label class="label" data-v-04af6e71>Korting bij jaarbetaling (maanden gratis)</label><input${ssrRenderAttr("value", unref(yearlyDiscountMonths))} type="number" min="0" max="12" step="0.5" class="input" placeholder="bv. 1" data-v-04af6e71><p class="mt-1 text-[11px] text-gray-500" data-v-04af6e71>Bv. 1 = 1 maand gratis bij jaarbetaling. 0 = geen korting.</p></div><div data-v-04af6e71><label class="label" data-v-04af6e71>Proefperiode (maanden gratis na incasso-activatie)</label><input${ssrRenderAttr("value", unref(trialMonths))} type="number" min="0" max="60" step="1" class="input" placeholder="bv. 3" data-v-04af6e71><p class="mt-1 text-[11px] text-gray-500" data-v-04af6e71>Klant ziet &quot;Eerste 3 maanden gratis&quot;. Telt vanaf het moment dat de IBAN is afgegeven.</p></div>`);
              if (unref(selectedModules).size > 0) {
                _push2(`<div data-v-04af6e71><label class="label" data-v-04af6e71>Afwijkend tarief per module (optioneel)</label><p class="mt-1 mb-2 text-[11px] text-gray-500" data-v-04af6e71>Laat leeg om de standaardprijs van ${ssrInterpolate(unref(partner).name)} aan te houden.</p><div class="space-y-2" data-v-04af6e71><!--[-->`);
                ssrRenderList(availableModules.filter((m) => unref(selectedModules).has(m.type)), (mod) => {
                  _push2(`<div class="grid grid-cols-[1fr_auto_2fr] gap-2 items-center" data-v-04af6e71><span class="text-sm text-gray-700" data-v-04af6e71>${ssrInterpolate(mod.label)}</span><div class="relative" data-v-04af6e71><span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" data-v-04af6e71>\u20AC</span><input${ssrRenderAttr("value", unref(overridePrice)[mod.type] !== null && unref(overridePrice)[mod.type] !== void 0 ? priceEur(unref(overridePrice)[mod.type]) : "")} type="text" class="input pl-6 w-24 text-sm tabular-nums" placeholder="\u2014" data-v-04af6e71></div><input${ssrRenderAttr("value", unref(overrideReason)[mod.type])} type="text" class="input text-sm" placeholder="Reden (intern, optioneel)" maxlength="200" data-v-04af6e71></div>`);
                });
                _push2(`<!--]--></div></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div></div>`);
            if (unref(submitError)) {
              _push2(`<div class="px-6" data-v-04af6e71><p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" data-v-04af6e71>${ssrInterpolate(unref(submitError))}</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="border-t border-gray-100 px-6 py-4 flex items-center justify-between" data-v-04af6e71><p class="text-xs text-gray-400" data-v-04af6e71>${ssrInterpolate(unref(selectedModules).size)} module${ssrInterpolate(unref(selectedModules).size !== 1 ? "s" : "")} geselecteerd </p><div class="flex gap-3" data-v-04af6e71><button class="btn-secondary" data-v-04af6e71>Annuleren</button><button${ssrIncludeBooleanAttr(!unref(form).full_name || !unref(form).email || unref(selectedModules).size === 0 || unref(submitting)) ? " disabled" : ""} class="${ssrRenderClass([{ "opacity-50 cursor-not-allowed": !unref(form).full_name || !unref(form).email || unref(selectedModules).size === 0 || unref(submitting) }, "btn-primary"])}"${ssrRenderAttr("title", unref(selectedModules).size === 0 ? "Kies eerst minstens \xE9\xE9n module" : "")} data-v-04af6e71>`);
            if (!unref(submitting)) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "plus",
                size: 16
              }, null, _parent));
            } else {
              _push2(`<!---->`);
            }
            if (unref(submitting)) {
              _push2(`<span class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" data-v-04af6e71></span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(unref(submitting) ? "Bezig..." : "Verstuur uitnodiging")}</button></div></div><!--]-->`);
          }
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/customer/OnboardModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-04af6e71"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "uitnodigingen",
  __ssrInlineRender: true,
  setup(__props) {
    const { customers, isLoading: customersLoading, total: customersTotal, hasMore: customersHasMore, refresh: refreshCustomers, loadMore: loadMoreCustomers } = useCustomers({ autoLoad: false });
    useConfirm();
    const showOnboardModal = ref(false);
    const onboardToast = ref("");
    async function handleOnboarded(result) {
      if (!(result == null ? void 0 : result.customer)) return;
      onboardToast.value = `${result.customer.full_name || result.customer.email} is uitgenodigd!`;
      setTimeout(() => {
        onboardToast.value = "";
      }, 3e3);
      await refreshCustomers(currentFilters.value);
    }
    const pending = computed(() => customers.value);
    const selected = ref(/* @__PURE__ */ new Set());
    const allSelected = computed(
      () => filteredPending.value.length > 0 && selected.value.size === filteredPending.value.length
    );
    const searchQuery = ref("");
    const ageFilter = ref("all");
    const moduleFilter = ref("all");
    const batchFilter = ref("all");
    function daysSince(iso) {
      if (!iso) return null;
      const ms = Date.now() - new Date(iso).getTime();
      return Math.floor(ms / (1e3 * 60 * 60 * 24));
    }
    const filteredPending = computed(() => {
      let list = pending.value;
      if (ageFilter.value !== "all") {
        const cutoffDays = { "7d": 7, "30d": 30, "90d": 90 }[ageFilter.value];
        list = list.filter((c) => {
          const d = daysSince(c.created_at);
          return d !== null && d <= cutoffDays;
        });
      }
      if (batchFilter.value === "never_mailed") {
        list = list.filter((c) => !c.latest_batch);
      } else if (batchFilter.value === "mailed_30d") {
        list = list.filter((c) => {
          var _a;
          const d = daysSince((_a = c.latest_batch) == null ? void 0 : _a.created_at);
          return d !== null && d <= 30;
        });
      }
      return list;
    });
    let searchTimer;
    const currentFilters = computed(() => ({
      accepted: "false",
      q: searchQuery.value || void 0,
      module: moduleFilter.value === "all" ? void 0 : moduleFilter.value
    }));
    function refetchPending() {
      if (searchTimer) (void 0).clearTimeout(searchTimer);
      searchTimer = (void 0).setTimeout(() => {
        refreshCustomers(currentFilters.value);
      }, 250);
    }
    watch([searchQuery, moduleFilter], refetchPending);
    const batches = ref([]);
    const batchesLoading = ref(false);
    const mailStatus = ref({});
    const MAIL_EVENT = {
      sent: { label: "Verstuurd", cls: "bg-gray-100 text-gray-600", uitleg: "Verstuurd, nog geen bevestiging van de ontvangende server." },
      queued: { label: "Verstuurd", cls: "bg-gray-100 text-gray-600", uitleg: "In de wachtrij bij de mailserver." },
      delivery_delayed: { label: "Vertraagd", cls: "bg-amber-50 text-amber-700", uitleg: "De ontvangende server neemt de mail (nog) niet aan. Er wordt opnieuw geprobeerd." },
      delivered: { label: "Afgeleverd", cls: "bg-green-50 text-green-700", uitleg: "Aangekomen in de mailbox van de klant." },
      opened: { label: "Geopend", cls: "bg-emerald-100 text-emerald-800", uitleg: "De klant heeft de mail geopend." },
      clicked: { label: "Geklikt", cls: "bg-emerald-100 text-emerald-800", uitleg: "De klant heeft op de link in de mail geklikt." },
      bounced: { label: "Geweigerd", cls: "bg-red-50 text-red-700", uitleg: "Het adres bestaat niet of weigert mail. Controleer het e-mailadres." },
      complained: { label: "Als spam gemeld", cls: "bg-red-50 text-red-700", uitleg: "De klant heeft de mail als spam gemarkeerd." },
      failed: { label: "Mislukt", cls: "bg-red-50 text-red-700", uitleg: "Versturen is mislukt." }
    };
    function mailInfo(email) {
      const st = email ? mailStatus.value[email.toLowerCase()] : void 0;
      if (!(st == null ? void 0 : st.last_event)) return null;
      const ev = MAIL_EVENT[st.last_event] || { label: st.last_event, cls: "bg-gray-100 text-gray-600", uitleg: "" };
      return { ...ev, title: `${ev.uitleg}
${st.subject || ""} \xB7 ${new Date(st.sent_at).toLocaleString("nl-NL")}` };
    }
    const mailSamenvatting = computed(() => {
      const tel = {};
      for (const c of pending.value) {
        const st = c.email ? mailStatus.value[c.email.toLowerCase()] : void 0;
        if (!(st == null ? void 0 : st.last_event)) continue;
        const k = ["opened", "clicked"].includes(st.last_event) ? "geopend" : ["bounced", "complained", "failed"].includes(st.last_event) ? "geweigerd" : st.last_event === "delivered" ? "afgeleverd" : st.last_event === "delivery_delayed" ? "vertraagd" : "verstuurd";
        tel[k] = (tel[k] || 0) + 1;
      }
      return tel;
    });
    const showCreate = ref(false);
    const creating = ref(false);
    const createError = ref("");
    const batchName = ref("");
    const batchTag = ref("");
    const ignoreRecentDups = ref(true);
    const selectedCustomers = computed(
      () => filteredPending.value.filter((c) => selected.value.has(c.id))
    );
    const recentlyMailedSelected = computed(
      () => selectedCustomers.value.filter((c) => {
        var _a;
        const d = daysSince((_a = c.latest_batch) == null ? void 0 : _a.created_at);
        return d !== null && d <= 30;
      })
    );
    const finalCustomerIds = computed(
      () => ignoreRecentDups.value ? selectedCustomers.value.filter((c) => {
        var _a;
        const d = daysSince((_a = c.latest_batch) == null ? void 0 : _a.created_at);
        return d === null || d > 30;
      }).map((c) => c.id) : selectedCustomers.value.map((c) => c.id)
    );
    const sendingForId = ref(null);
    const sendResult = ref(null);
    const deletingId = ref(null);
    const bulkSending = ref(false);
    const bulkProgress = ref(null);
    const bulkDeleting = ref(false);
    const deleteError = ref("");
    const moduleOptions = computed(() => {
      const set = /* @__PURE__ */ new Set();
      for (const c of pending.value) {
        for (const cat of c.product_categories || []) set.add(cat);
      }
      return Array.from(set);
    });
    const MODULE_LABEL = {
      solar_panel: "Zonnepanelen",
      heat_pump: "Warmtepomp",
      ev_charger: "Laadpaal",
      battery: "Thuisbatterij"
    };
    function relativeDays(iso) {
      const d = daysSince(iso);
      if (d === null) return "";
      if (d === 0) return "vandaag";
      if (d === 1) return "gisteren";
      if (d < 30) return `${d} dgn geleden`;
      if (d < 365) return `${Math.floor(d / 30)} mnd geleden`;
      return `${Math.floor(d / 365)} jr geleden`;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      const _component_OnboardModal = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-254db492><div class="mb-6 flex items-start justify-between gap-4" data-v-254db492><div data-v-254db492><h1 class="text-2xl font-bold text-gray-900" data-v-254db492>Uitnodigingen</h1>`);
      if (unref(bulkProgress) && !unref(bulkSending)) {
        _push(`<p class="${ssrRenderClass([unref(bulkProgress).failed.length ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700", "mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium"])}" data-v-254db492>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(bulkProgress).failed.length ? "alert-circle" : "check-circle",
          size: 12
        }, null, _parent));
        if (!unref(bulkProgress).failed.length) {
          _push(`<!--[-->${ssrInterpolate(unref(bulkProgress).total)} uitnodigingen verstuurd<!--]-->`);
        } else {
          _push(`<!--[-->${ssrInterpolate(unref(bulkProgress).total - unref(bulkProgress).failed.length)} verstuurd, mislukt: ${ssrInterpolate(unref(bulkProgress).failed.join(", "))}<!--]-->`);
        }
        _push(`</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-1 text-sm text-gray-500" data-v-254db492> Klanten die nog geen akkoord hebben gegeven. Nodig \xE9\xE9n klant tegelijk uit, of exporteer een batch naar Mailchimp. </p></div><div class="flex items-center gap-2" data-v-254db492>`);
      if (unref(selected).size) {
        _push(`<button class="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(bulkDeleting)) ? " disabled" : ""} data-v-254db492>`);
        if (unref(bulkDeleting)) {
          _push(`<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" data-v-254db492><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-254db492></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" data-v-254db492></path></svg>`);
        } else {
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "trash",
            size: 14
          }, null, _parent));
        }
        _push(` ${ssrInterpolate(unref(bulkDeleting) ? "Verwijderen..." : "Verwijder")} <span class="rounded-full bg-red-100 px-1.5 py-0.5 text-xs" data-v-254db492>${ssrInterpolate(unref(selected).size)}</span></button>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(selected).size) {
        _push(`<button class="inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(bulkSending) || unref(bulkDeleting)) ? " disabled" : ""} data-v-254db492>`);
        if (unref(bulkSending)) {
          _push(`<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" data-v-254db492><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-254db492></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" data-v-254db492></path></svg>`);
        } else {
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "send",
            size: 14
          }, null, _parent));
        }
        _push(` ${ssrInterpolate(unref(bulkSending) && unref(bulkProgress) ? `Versturen ${unref(bulkProgress).done}/${unref(bulkProgress).total}` : "Verstuur uitnodiging")} `);
        if (!unref(bulkSending)) {
          _push(`<span class="rounded-full bg-white/20 px-1.5 py-0.5 text-xs" data-v-254db492>${ssrInterpolate(unref(selected).size)}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button class="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(selected).size) ? " disabled" : ""} data-v-254db492>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "send",
        size: 14
      }, null, _parent));
      _push(` Maak mailing-batch `);
      if (unref(selected).size) {
        _push(`<span class="rounded-full bg-gray-100 px-1.5 py-0.5 text-xs" data-v-254db492>${ssrInterpolate(unref(selected).size)}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button><button class="btn-primary" data-v-254db492>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "plus",
        size: 14
      }, null, _parent));
      _push(` Klant uitnodigen </button></div></div>`);
      if (unref(deleteError)) {
        _push(`<div class="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-800" data-v-254db492>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "warning",
          size: 14,
          class: "mt-0.5 shrink-0"
        }, null, _parent));
        _push(`<span class="flex-1" data-v-254db492>${ssrInterpolate(unref(deleteError))}</span><button class="shrink-0 text-red-400 hover:text-red-700" title="Sluiten" data-v-254db492>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "x",
          size: 14
        }, null, _parent));
        _push(`</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]" data-v-254db492><div data-v-254db492><div class="mb-4 rounded-xl border border-gray-100 bg-white p-3" data-v-254db492><div class="flex flex-wrap items-center gap-2" data-v-254db492><div class="relative flex-1 min-w-[200px]" data-v-254db492>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "search",
        size: 14,
        class: "absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(searchQuery))} type="search" class="input pl-8 text-sm" placeholder="Zoek op naam, e-mail of plaats" data-v-254db492></div><select class="input text-sm w-auto" data-v-254db492><option value="all" data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(ageFilter)) ? ssrLooseContain(unref(ageFilter), "all") : ssrLooseEqual(unref(ageFilter), "all")) ? " selected" : ""}>Alle leeftijden</option><option value="7d" data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(ageFilter)) ? ssrLooseContain(unref(ageFilter), "7d") : ssrLooseEqual(unref(ageFilter), "7d")) ? " selected" : ""}>Aangemaakt \u2264 7 dgn</option><option value="30d" data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(ageFilter)) ? ssrLooseContain(unref(ageFilter), "30d") : ssrLooseEqual(unref(ageFilter), "30d")) ? " selected" : ""}>Aangemaakt \u2264 30 dgn</option><option value="90d" data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(ageFilter)) ? ssrLooseContain(unref(ageFilter), "90d") : ssrLooseEqual(unref(ageFilter), "90d")) ? " selected" : ""}>Aangemaakt \u2264 90 dgn</option></select><select class="input text-sm w-auto" data-v-254db492><option value="all" data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(moduleFilter)) ? ssrLooseContain(unref(moduleFilter), "all") : ssrLooseEqual(unref(moduleFilter), "all")) ? " selected" : ""}>Alle modules</option><!--[-->`);
      ssrRenderList(unref(moduleOptions), (m) => {
        _push(`<option${ssrRenderAttr("value", m)} data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(moduleFilter)) ? ssrLooseContain(unref(moduleFilter), m) : ssrLooseEqual(unref(moduleFilter), m)) ? " selected" : ""}>${ssrInterpolate(MODULE_LABEL[m] || m)}</option>`);
      });
      _push(`<!--]--></select><select class="input text-sm w-auto" data-v-254db492><option value="all" data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(batchFilter)) ? ssrLooseContain(unref(batchFilter), "all") : ssrLooseEqual(unref(batchFilter), "all")) ? " selected" : ""}>Mailing-historie: alles</option><option value="never_mailed" data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(batchFilter)) ? ssrLooseContain(unref(batchFilter), "never_mailed") : ssrLooseEqual(unref(batchFilter), "never_mailed")) ? " selected" : ""}>Nog nooit gemaild</option><option value="mailed_30d" data-v-254db492${ssrIncludeBooleanAttr(Array.isArray(unref(batchFilter)) ? ssrLooseContain(unref(batchFilter), "mailed_30d") : ssrLooseEqual(unref(batchFilter), "mailed_30d")) ? " selected" : ""}>Gemaild laatste 30 dgn</option></select></div></div><div class="mb-2 flex items-center justify-between px-1 text-xs text-gray-500" data-v-254db492><span data-v-254db492><strong class="text-gray-700" data-v-254db492>${ssrInterpolate(unref(filteredPending).length)}</strong> ${ssrInterpolate(unref(filteredPending).length === 1 ? "klant" : "klanten")} zonder akkoord `);
      if (unref(selected).size) {
        _push(`<span data-v-254db492>\xB7 ${ssrInterpolate(unref(selected).size)} geselecteerd</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</span>`);
      if (unref(filteredPending).length) {
        _push(`<button class="font-medium text-gray-700 hover:text-gray-900" data-v-254db492>${ssrInterpolate(unref(allSelected) ? "Selectie wissen" : "Selecteer alle")}</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (Object.keys(unref(mailSamenvatting)).length) {
        _push(`<div class="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500" title="Laatste mail per klant in deze lijst, volgens Resend" data-v-254db492>`);
        if (unref(mailSamenvatting).afgeleverd) {
          _push(`<span data-v-254db492><span class="font-semibold text-green-700" data-v-254db492>${ssrInterpolate(unref(mailSamenvatting).afgeleverd)}</span> afgeleverd</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(mailSamenvatting).geopend) {
          _push(`<span data-v-254db492><span class="font-semibold text-emerald-700" data-v-254db492>${ssrInterpolate(unref(mailSamenvatting).geopend)}</span> geopend</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(mailSamenvatting).vertraagd) {
          _push(`<span data-v-254db492><span class="font-semibold text-amber-700" data-v-254db492>${ssrInterpolate(unref(mailSamenvatting).vertraagd)}</span> vertraagd</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(mailSamenvatting).geweigerd) {
          _push(`<span data-v-254db492><span class="font-semibold text-red-700" data-v-254db492>${ssrInterpolate(unref(mailSamenvatting).geweigerd)}</span> geweigerd</span>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(mailSamenvatting).verstuurd) {
          _push(`<span data-v-254db492><span class="font-semibold text-gray-700" data-v-254db492>${ssrInterpolate(unref(mailSamenvatting).verstuurd)}</span> onderweg</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(customersLoading)) {
        _push(`<div class="rounded-xl border border-gray-100 bg-white p-12 text-center" data-v-254db492><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-254db492></div></div>`);
      } else if (!unref(filteredPending).length) {
        _push(`<div class="rounded-xl border-2 border-dashed border-gray-200 p-12 text-center" data-v-254db492>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "mail",
          size: 32,
          class: "mx-auto text-gray-300 mb-2"
        }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-254db492>Geen klanten zonder akkoord met deze filters.</p></div>`);
      } else {
        _push(`<div class="overflow-hidden rounded-xl border border-gray-100 bg-white" data-v-254db492><table class="w-full text-sm" data-v-254db492><thead data-v-254db492><tr class="border-b border-gray-100 text-left text-xs font-medium uppercase tracking-wider text-gray-400" data-v-254db492><th class="px-3 py-2.5 w-10" data-v-254db492></th><th class="px-3 py-2.5" data-v-254db492>Naam</th><th class="px-3 py-2.5" data-v-254db492>E-mail</th><th class="px-3 py-2.5" data-v-254db492>Modules</th><th class="px-3 py-2.5" data-v-254db492>Aangemaakt</th><th class="px-3 py-2.5" data-v-254db492>Laatste batch</th><th class="px-3 py-2.5" data-v-254db492>Mail</th><th class="px-3 py-2.5 w-32 text-right" data-v-254db492>Actie</th></tr></thead><tbody class="divide-y divide-gray-50" data-v-254db492><!--[-->`);
        ssrRenderList(unref(filteredPending), (c) => {
          _push(`<tr class="${ssrRenderClass([{ "bg-blue-50/40": unref(selected).has(c.id) }, "cursor-pointer hover:bg-gray-50/60"])}" data-v-254db492><td class="px-3 py-2.5" data-v-254db492><input type="checkbox"${ssrIncludeBooleanAttr(unref(selected).has(c.id)) ? " checked" : ""} class="h-4 w-4 cursor-pointer" data-v-254db492></td><td class="px-3 py-2.5 font-medium text-gray-900" data-v-254db492>${ssrInterpolate(c.full_name || "\u2014")}</td><td class="px-3 py-2.5 text-gray-600" data-v-254db492>${ssrInterpolate(c.email)}</td><td class="px-3 py-2.5" data-v-254db492><!--[-->`);
          ssrRenderList(c.product_categories || [], (cat) => {
            _push(`<span class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 mr-1" data-v-254db492>${ssrInterpolate(MODULE_LABEL[cat] || cat)}</span>`);
          });
          _push(`<!--]--></td><td class="px-3 py-2.5 text-xs text-gray-500" data-v-254db492>${ssrInterpolate(relativeDays(c.created_at))}</td><td class="px-3 py-2.5" data-v-254db492>`);
          if (c.latest_batch) {
            _push(`<span class="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700"${ssrRenderAttr("title", c.latest_batch.name)} data-v-254db492>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "clock",
              size: 10
            }, null, _parent));
            _push(` ${ssrInterpolate(relativeDays(c.latest_batch.created_at))}</span>`);
          } else if (!c.invite_sent_at) {
            _push(`<span class="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700" title="Aangemaakt zonder mail. Klaar om te versturen." data-v-254db492>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "send",
              size: 10
            }, null, _parent));
            _push(` Klaargezet </span>`);
          } else {
            _push(`<span class="text-[11px] text-gray-400" data-v-254db492>Uitgenodigd</span>`);
          }
          _push(`</td><td class="px-3 py-2.5" data-v-254db492>`);
          if (mailInfo(c.email)) {
            _push(`<span class="${ssrRenderClass([mailInfo(c.email).cls, "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium"])}"${ssrRenderAttr("title", mailInfo(c.email).title)} data-v-254db492>${ssrInterpolate(mailInfo(c.email).label)}</span>`);
          } else {
            _push(`<span class="text-[11px] text-gray-300" data-v-254db492>\u2014</span>`);
          }
          _push(`</td><td class="px-3 py-2.5 text-right" data-v-254db492>`);
          if (unref(sendResult) && unref(sendResult).id === c.id) {
            _push(`<div class="${ssrRenderClass([unref(sendResult).type === "success" ? "text-green-600" : "text-red-600", "inline-flex items-center gap-1 text-[11px] font-medium"])}" data-v-254db492>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: unref(sendResult).type === "success" ? "check-circle" : "alert-circle",
              size: 12
            }, null, _parent));
            _push(` ${ssrInterpolate(unref(sendResult).type === "success" ? "Verstuurd" : "Mislukt")}</div>`);
          } else {
            _push(`<div class="inline-flex items-center gap-1" data-v-254db492><button class="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(sendingForId) === c.id || unref(deletingId) === c.id || unref(bulkDeleting)) ? " disabled" : ""}${ssrRenderAttr("title", c.latest_batch ? `Laatste mail: ${c.latest_batch.name}` : "Nog niet eerder uitgenodigd")} data-v-254db492>`);
            if (unref(sendingForId) === c.id) {
              _push(`<svg class="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" data-v-254db492><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-254db492></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" data-v-254db492></path></svg>`);
            } else {
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "send",
                size: 11
              }, null, _parent));
            }
            _push(` ${ssrInterpolate(unref(sendingForId) === c.id ? "Bezig..." : "Stuur uitnodiging")}</button><button class="rounded-lg p-1.5 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(deletingId) === c.id || unref(bulkDeleting) || unref(sendingForId) === c.id) ? " disabled" : ""} title="Uitnodiging verwijderen" data-v-254db492>`);
            if (unref(deletingId) === c.id) {
              _push(`<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" data-v-254db492><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-254db492></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" data-v-254db492></path></svg>`);
            } else {
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "trash",
                size: 13
              }, null, _parent));
            }
            _push(`</button></div>`);
          }
          _push(`</td></tr>`);
        });
        _push(`<!--]--></tbody></table></div>`);
      }
      if (unref(customersHasMore)) {
        _push(`<div class="mt-2 text-center" data-v-254db492><button class="text-xs font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(customersLoading)) ? " disabled" : ""} data-v-254db492>${ssrInterpolate(unref(customersLoading) ? "Laden..." : `Toon volgende ${Math.min(100, unref(customersTotal) - unref(pending).length)} klanten`)}</button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><aside class="rounded-xl border border-gray-100 bg-white p-4" data-v-254db492><h2 class="text-sm font-semibold text-gray-900 mb-3" data-v-254db492>Eerdere batches</h2>`);
      if (unref(batchesLoading)) {
        _push(`<div class="py-6 text-center" data-v-254db492><div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-254db492></div></div>`);
      } else if (!unref(batches).length) {
        _push(`<div class="text-xs text-gray-400 py-2" data-v-254db492> Nog geen batches verstuurd. </div>`);
      } else {
        _push(`<ul class="space-y-2" data-v-254db492><!--[-->`);
        ssrRenderList(unref(batches), (b) => {
          _push(`<li class="rounded-lg border border-gray-100 p-2.5 hover:bg-gray-50" data-v-254db492><p class="text-xs font-semibold text-gray-900" data-v-254db492>${ssrInterpolate(b.name)}</p><p class="mt-0.5 text-[11px] text-gray-500" data-v-254db492>${ssrInterpolate(b.customer_count)} ${ssrInterpolate(b.customer_count === 1 ? "klant" : "klanten")} \xB7 ${ssrInterpolate(relativeDays(b.created_at))}</p>`);
          if (b.mailchimp_tag) {
            _push(`<p class="mt-0.5 text-[10px] text-gray-400 font-mono" data-v-254db492> tag: ${ssrInterpolate(b.mailchimp_tag)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="mt-2 text-[11px] font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1" data-v-254db492>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "external",
            size: 10
          }, null, _parent));
          _push(` Download opnieuw </button></li>`);
        });
        _push(`<!--]--></ul>`);
      }
      _push(`</aside></div>`);
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(showCreate)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-254db492><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-254db492></div><div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden" data-v-254db492><div class="border-b border-gray-100 px-6 py-4" data-v-254db492><h3 class="text-lg font-semibold text-gray-900" data-v-254db492>Nieuwe mailing-batch</h3><p class="mt-1 text-sm text-gray-500" data-v-254db492> Snapshot van wie er in deze mailing zit. De CSV download daarna direct. </p></div><div class="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto" data-v-254db492><div data-v-254db492><label class="label" data-v-254db492>Batch-naam</label><input${ssrRenderAttr("value", unref(batchName))} type="text" class="input" data-v-254db492><p class="mt-1 text-xs text-gray-400" data-v-254db492>Verschijnt later in de batch-historie. Tip: noem de aanleiding (bv. &quot;Weheat-import mei&quot;, &quot;Q2 herinnering&quot;).</p></div><div data-v-254db492><label class="label" data-v-254db492>Mailchimp-tag <span class="text-gray-400 font-normal" data-v-254db492>(optioneel)</span></label><input${ssrRenderAttr("value", unref(batchTag))} type="text" class="input" placeholder="upsol-batch-mei-2026" data-v-254db492><p class="mt-1 text-xs text-gray-400" data-v-254db492>Wordt als extra kolom in het CSV gezet. Handig om in Mailchimp opvolg-segmenten te maken.</p></div><div class="rounded-xl border border-gray-200 bg-gray-50 p-3" data-v-254db492><p class="text-xs font-semibold text-gray-700 mb-2" data-v-254db492>In deze batch</p><p class="text-sm text-gray-900" data-v-254db492><strong data-v-254db492>${ssrInterpolate(unref(finalCustomerIds).length)}</strong> ${ssrInterpolate(unref(finalCustomerIds).length === 1 ? "klant" : "klanten")} krijgen een persoonlijke inloglink in het CSV. </p>`);
          if (unref(recentlyMailedSelected).length) {
            _push2(`<div class="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-xs" data-v-254db492><p class="font-semibold text-amber-900 mb-1" data-v-254db492>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "alert-circle",
              size: 12,
              class: "inline -mt-0.5"
            }, null, _parent));
            _push2(` ${ssrInterpolate(unref(recentlyMailedSelected).length)} ${ssrInterpolate(unref(recentlyMailedSelected).length === 1 ? "klant zat" : "klanten zaten")} al in een recente batch </p><ul class="ml-4 list-disc text-amber-800" data-v-254db492><!--[-->`);
            ssrRenderList(unref(recentlyMailedSelected).slice(0, 5), (c) => {
              var _a, _b;
              _push2(`<li data-v-254db492>${ssrInterpolate(c.full_name || c.email)} \u2014 ${ssrInterpolate((_a = c.latest_batch) == null ? void 0 : _a.name)} (${ssrInterpolate(relativeDays((_b = c.latest_batch) == null ? void 0 : _b.created_at))}) </li>`);
            });
            _push2(`<!--]-->`);
            if (unref(recentlyMailedSelected).length > 5) {
              _push2(`<li class="list-none text-amber-700 italic" data-v-254db492> en nog ${ssrInterpolate(unref(recentlyMailedSelected).length - 5)} ander${ssrInterpolate(unref(recentlyMailedSelected).length - 5 === 1 ? "e" : "en")}</li>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</ul><label class="mt-2 flex items-center gap-2 cursor-pointer" data-v-254db492><input${ssrIncludeBooleanAttr(Array.isArray(unref(ignoreRecentDups)) ? ssrLooseContain(unref(ignoreRecentDups), null) : unref(ignoreRecentDups)) ? " checked" : ""} type="checkbox" class="h-3.5 w-3.5" data-v-254db492><span class="font-medium text-amber-900" data-v-254db492>Sluit deze ${ssrInterpolate(unref(recentlyMailedSelected).length)} uit (aanbevolen)</span></label></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div><div class="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600" data-v-254db492><p class="font-semibold mb-1 text-gray-800" data-v-254db492>Behandel het CSV als gevoelig</p><p data-v-254db492>De inloglinks geven volledige toegang tot een klantportaal. Bewaar het bestand niet langer dan nodig en deel het alleen binnen je mail-tool.</p></div>`);
          if (unref(createError)) {
            _push2(`<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert" data-v-254db492>${ssrInterpolate(unref(createError))}</p>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div><div class="border-t border-gray-100 px-6 py-4 flex items-center justify-end gap-3" data-v-254db492><button class="btn-secondary" data-v-254db492>Annuleren</button><button class="btn-primary"${ssrIncludeBooleanAttr(unref(creating) || !unref(finalCustomerIds).length || !unref(batchName).trim()) ? " disabled" : ""} data-v-254db492>`);
          if (!unref(creating)) {
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "external",
              size: 14
            }, null, _parent));
          } else {
            _push2(`<!---->`);
          }
          _push2(` ${ssrInterpolate(unref(creating) ? "Aanmaken..." : "Maak batch + download")}</button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(ssrRenderComponent(_component_OnboardModal, {
        modelValue: unref(showOnboardModal),
        "onUpdate:modelValue": ($event) => isRef(showOnboardModal) ? showOnboardModal.value = $event : null,
        onOnboarded: handleOnboarded
      }, null, _parent));
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(onboardToast)) {
          _push2(`<div class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-lg" data-v-254db492>${ssrInterpolate(unref(onboardToast))}</div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/uitnodigingen.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const uitnodigingen = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-254db492"]]);

export { uitnodigingen as default };
//# sourceMappingURL=uitnodigingen-DRufhkAM.mjs.map
