import { c as _export_sfc, u as usePartner, a as useConfirm, _ as _sfc_main$5, h as useBackdropClose } from './server.mjs';
import { defineComponent, ref, watch, computed, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderStyle, ssrInterpolate, ssrRenderList, ssrRenderClass, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual, ssrRenderTeleport, ssrRenderDynamicModel } from 'vue/server-renderer';
import { u as useIntegrations } from './useIntegrations-BEERw8am.mjs';
import { g as getModuleTheme } from './module-theme-8XLQDN8U.mjs';
import { l as labelChip, L as LABEL_COLORS } from './ticket-labels-D5te2Ho2.mjs';
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
  __name: "IntegrationConfigModal",
  __ssrInlineRender: true,
  props: {
    open: { type: Boolean },
    integration: {}
  },
  emits: ["close", "saved"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { partner } = usePartner();
    const { getCredentials: getIntegrationCredentials } = useIntegrations();
    const credentialFields = {
      "Sundata": [
        { label: "E-mailadres", key: "email", type: "email", placeholder: "installateur@bedrijf.nl" },
        { label: "Wachtwoord", key: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }
      ],
      "Weheat": [
        { label: "E-mailadres Weheat portal", key: "username", type: "email", placeholder: "installateur@bedrijf.nl" },
        { label: "Wachtwoord", key: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }
      ],
      "Easee": [
        { label: "Gebruikersnaam", key: "username", type: "text", placeholder: "installateur@bedrijf.nl" },
        { label: "Wachtwoord", key: "password", type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" }
      ],
      "Mollie Payments": [
        { label: "API Key (live)", key: "api_key", type: "password", placeholder: "live_xxxxxxxxxxxxxxxxxxxxxxxx" }
      ],
      "Basecone": [
        { label: "API Key", key: "api_key", type: "password", placeholder: "bc_xxxxxxxxxxxxxxxx" }
      ],
      "Boekhoudgemak": [
        { label: "API Key", key: "api_key", type: "password", placeholder: "bg_xxxxxxxxxxxxxxxx" }
      ],
      "Gripp.com": [
        { label: "API Key", key: "api_key", type: "password", placeholder: "gripp_xxxxxxxxxxxxxxxx" },
        { label: "Subdomain", key: "subdomain", type: "text", placeholder: "jouwbedrijf" }
      ]
    };
    const integrationInfo = {
      "Sundata": {
        description: "Koppel met Sundata om de zonnepanelen van je klanten real-time te monitoren. Ondersteunt alle merken omvormers.",
        helpUrl: "https://sundata.nl/docs",
        features: ["Storingmeldingen", "Alle omvormer-merken", "Historische data"]
      },
      "Weheat": {
        description: "Koppel met Weheat voor real-time monitoring van warmtepompen. Log in met je eigen Weheat-portal account \u2014 g\xE9\xE9n aparte developer-toegang nodig.",
        helpUrl: "https://portal.weheat.nl/",
        features: ["Real-time statusmonitoring", "COP & vermogensdata", "Energieverbruik", "Foutmeldingen"]
      },
      "Easee": {
        description: "Koppel met Easee voor laadpaal monitoring. Gebruik het account waarmee je in de Easee app inlogt \u2014 bij voorkeur een aparte technicus-gebruiker zonder 2FA.",
        helpUrl: "https://easee.com/se/support/",
        features: ["Laadsessie-overzicht", "Real-time vermogen", "Energieverbruik", "Laadstatus"]
      },
      "Mollie Payments": {
        description: "Automatische incasso en betalingsverwerking via Mollie. Verwerk maandelijkse servicecontracten automatisch.",
        helpUrl: "https://mollie.com/dashboard",
        features: ["Automatische incasso (SEPA)", "iDEAL betalingen", "Factuurverwerking", "Terugbetalingen"]
      },
      "Basecone": {
        description: "Automatische documentverwerking en boekhoudkoppeling via Basecone.",
        helpUrl: "https://basecone.com",
        features: ["Factuurscanning", "Automatische boekingen", "Documentarchief"]
      },
      "Boekhoudgemak": {
        description: "Online boekhoudsoftware integratie voor factuurverwerking en financieel overzicht.",
        helpUrl: "https://boekhoudgemak.nl",
        features: ["Factuurkoppeling", "BTW-aangifte", "Financi\xEBle rapportages"]
      },
      "Gripp.com": {
        description: "CRM en projectmanagement koppeling. Synchroniseer klantgegevens en projecten.",
        helpUrl: "https://gripp.com/api",
        features: ["Klantsynchronisatie", "Projectkoppeling", "Urenregistratie", "Offertebeheer"]
      }
    };
    const step = ref("credentials");
    const credentials = ref({});
    const showPasswords = ref({});
    const testError = ref("");
    const devices = ref([]);
    const devicesLoading = ref(false);
    const fields = computed(() => {
      if (!props.integration) return [];
      return credentialFields[props.integration.name] || [];
    });
    const info = computed(() => {
      if (!props.integration) return null;
      return integrationInfo[props.integration.name] || null;
    });
    const hasDevices = computed(() => {
      var _a, _b, _c;
      return ((_a = testDetails.value) == null ? void 0 : _a.plants) > 0 || ((_b = testDetails.value) == null ? void 0 : _b.heatPumps) > 0 || ((_c = testDetails.value) == null ? void 0 : _c.chargers) > 0;
    });
    watch(() => props.open, (isOpen) => {
      if (isOpen && props.integration) {
        showPasswords.value = {};
        testError.value = "";
        testDetails.value = null;
        const intType = props.integration.integrationType;
        intType ? getIntegrationCredentials(partner.id, intType) : null;
        {
          step.value = "credentials";
          credentials.value = {};
        }
      }
    });
    const allFieldsFilled = computed(() => {
      return fields.value.every((f) => {
        var _a;
        return (_a = credentials.value[f.key]) == null ? void 0 : _a.trim();
      });
    });
    const weheatConnecting = ref(false);
    const weheatConnectError = ref("");
    const weheatUsername = ref("");
    const weheatPassword = ref("");
    const testDetails = ref(null);
    useBackdropClose(() => handleClose());
    function handleClose() {
      emit("close");
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      ssrRenderTeleport(_push, (_push2) => {
        var _a, _b, _c;
        if (__props.open && __props.integration) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-16c26900><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-16c26900></div><div class="relative w-full max-w-xl rounded-2xl bg-white shadow-xl overflow-hidden" data-v-16c26900><div class="${ssrRenderClass([__props.integration.category === "monitoring" ? "bg-gradient-to-r from-gray-50 to-gray-100" : "bg-gradient-to-r from-purple-50 to-purple-100", "px-6 pt-5 pb-4"])}" data-v-16c26900><div class="flex items-center justify-between" data-v-16c26900><div class="flex items-center gap-3" data-v-16c26900>`);
          if (__props.integration.category === "monitoring" && __props.integration.type) {
            _push2(`<div class="${ssrRenderClass([[
              __props.integration.type === "solar" ? "bg-amber-100 text-amber-600" : "",
              __props.integration.type === "heat_pump" ? "bg-orange-100 text-orange-600" : "",
              __props.integration.type === "ev_charger" ? "bg-sky-100 text-sky-600" : ""
            ], "flex h-10 w-10 items-center justify-center rounded-xl"])}" data-v-16c26900>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: __props.integration.type === "solar" ? "solar" : __props.integration.type === "heat_pump" ? "heat-pump" : "ev-charger",
              size: 22
            }, null, _parent));
            _push2(`</div>`);
          } else {
            _push2(`<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600" data-v-16c26900>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: __props.integration.icon || "puzzle",
              size: 22
            }, null, _parent));
            _push2(`</div>`);
          }
          _push2(`<div data-v-16c26900><h3 class="text-lg font-semibold text-gray-900" data-v-16c26900>${ssrInterpolate(__props.integration.name)}</h3><p class="text-sm text-gray-500" data-v-16c26900>${ssrInterpolate(__props.integration.desc)}</p></div></div><button class="rounded-lg p-1.5 text-gray-400 hover:bg-white/60 hover:text-gray-600" data-v-16c26900>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div></div><div class="px-6 pb-6" data-v-16c26900>`);
          if (unref(info)) {
            _push2(`<div class="mt-4 mb-5" data-v-16c26900><p class="text-sm text-gray-600" data-v-16c26900>${ssrInterpolate(unref(info).description)}</p><div class="mt-3 flex flex-wrap gap-2" data-v-16c26900><!--[-->`);
            ssrRenderList(unref(info).features, (feature) => {
              _push2(`<span class="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600" data-v-16c26900>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "check",
                size: 12,
                class: "text-green-500"
              }, null, _parent));
              _push2(` ${ssrInterpolate(feature)}</span>`);
            });
            _push2(`<!--]--></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(step) === "credentials") {
            _push2(`<div data-v-16c26900>`);
            if (__props.integration.integrationType === "weheat") {
              _push2(`<div class="rounded-xl border border-gray-200 p-5" data-v-16c26900><div class="flex items-center gap-3 mb-3" data-v-16c26900><div class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-600" data-v-16c26900>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "heat-pump",
                size: 20
              }, null, _parent));
              _push2(`</div><div data-v-16c26900><h4 class="text-sm font-semibold text-gray-900" data-v-16c26900>Verbinden via Weheat</h4><p class="text-xs text-gray-500" data-v-16c26900>Log in met je Weheat portal-account. Wij doen de rest.</p></div></div><div class="space-y-3" data-v-16c26900><div data-v-16c26900><label class="label" data-v-16c26900>E-mailadres Weheat portal</label><input${ssrRenderAttr("value", unref(weheatUsername))} type="email" class="input" placeholder="installateur@bedrijf.nl" autocomplete="off" data-v-16c26900></div><div data-v-16c26900><label class="label" data-v-16c26900>Wachtwoord</label><input${ssrRenderAttr("value", unref(weheatPassword))} type="password" class="input" placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" autocomplete="off" data-v-16c26900></div></div>`);
              if (unref(weheatConnectError)) {
                _push2(`<p class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" data-v-16c26900>${ssrInterpolate(unref(weheatConnectError))}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<p class="mt-3 text-[11px] text-gray-400" data-v-16c26900> We slaan alleen het sessie-token op, niet je wachtwoord. </p><div class="mt-4 flex justify-end gap-3" data-v-16c26900><button class="btn-secondary" data-v-16c26900>Annuleren</button><button class="btn-primary"${ssrIncludeBooleanAttr(!unref(weheatUsername).trim() || !unref(weheatPassword) || unref(weheatConnecting)) ? " disabled" : ""} data-v-16c26900>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "check",
                size: 16
              }, null, _parent));
              _push2(` ${ssrInterpolate(unref(weheatConnecting) ? "Verbinden..." : "Verbinden")}</button></div></div>`);
            } else {
              _push2(`<div class="rounded-xl border border-gray-200 p-4" data-v-16c26900><h4 class="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2" data-v-16c26900>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "settings",
                size: 16,
                class: "text-gray-400"
              }, null, _parent));
              _push2(` Inloggegevens </h4><div class="space-y-3" data-v-16c26900><!--[-->`);
              ssrRenderList(unref(fields), (field) => {
                _push2(`<div data-v-16c26900><label class="label" data-v-16c26900>${ssrInterpolate(field.label)}</label><div class="relative" data-v-16c26900><input${ssrRenderDynamicModel(field.type === "password" && !unref(showPasswords)[field.key] ? "password" : "text", unref(credentials)[field.key], null)}${ssrRenderAttr("type", field.type === "password" && !unref(showPasswords)[field.key] ? "password" : "text")}${ssrRenderAttr("placeholder", field.placeholder)} class="${ssrRenderClass([field.type === "password" ? "pr-10" : "", "input"])}" data-v-16c26900>`);
                if (field.type === "password") {
                  _push2(`<button type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600" data-v-16c26900>`);
                  _push2(ssrRenderComponent(_component_AppIcon, {
                    name: unref(showPasswords)[field.key] ? "x-circle" : "search",
                    size: 16
                  }, null, _parent));
                  _push2(`</button>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
              });
              _push2(`<!--]--></div>`);
              if (unref(info)) {
                _push2(`<div class="mt-3" data-v-16c26900><a${ssrRenderAttr("href", unref(info).helpUrl)} target="_blank" class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700" data-v-16c26900>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "external",
                  size: 12
                }, null, _parent));
                _push2(` Waar vind ik deze gegevens? </a></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            }
            if (unref(testError)) {
              _push2(`<div class="mt-4 rounded-lg bg-red-50 border border-red-200 p-3" data-v-16c26900><p class="text-sm text-red-700 flex items-center gap-2" data-v-16c26900>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "x-circle",
                size: 16,
                class: "text-red-500 shrink-0"
              }, null, _parent));
              _push2(` ${ssrInterpolate(unref(testError))}</p></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.integration.integrationType !== "weheat") {
              _push2(`<div class="mt-5 flex justify-end gap-3" data-v-16c26900><button class="btn-secondary" data-v-16c26900>Annuleren</button><button${ssrIncludeBooleanAttr(!unref(allFieldsFilled)) ? " disabled" : ""} class="${ssrRenderClass([{ "opacity-50 cursor-not-allowed": !unref(allFieldsFilled) }, "btn-primary"])}" data-v-16c26900>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "switch",
                size: 16
              }, null, _parent));
              _push2(` Verbinding testen </button></div>`);
            } else {
              _push2(`<div class="mt-5 flex justify-end" data-v-16c26900><button class="btn-secondary" data-v-16c26900>Annuleren</button></div>`);
            }
            _push2(`</div>`);
          } else if (unref(step) === "testing") {
            _push2(`<div class="py-8 text-center" data-v-16c26900><div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-500" data-v-16c26900></div><p class="text-sm font-medium text-gray-900" data-v-16c26900>Verbinding testen...</p><p class="mt-1 text-xs text-gray-500" data-v-16c26900>Even geduld, we verifi\xEBren je gegevens bij ${ssrInterpolate(__props.integration.name)}.</p></div>`);
          } else if (unref(step) === "success") {
            _push2(`<div data-v-16c26900><div class="rounded-xl border border-green-200 bg-green-50 p-4 text-center" data-v-16c26900><div class="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-green-100" data-v-16c26900>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 28,
              class: "text-green-600"
            }, null, _parent));
            _push2(`</div><p class="text-sm font-semibold text-green-800" data-v-16c26900>Verbinding actief</p><p class="mt-1 text-xs text-green-600" data-v-16c26900>${ssrInterpolate(__props.integration.name)} is succesvol gekoppeld. `);
            if (((_a = unref(testDetails)) == null ? void 0 : _a.companies) != null) {
              _push2(`<!--[--> Verbonden met ${ssrInterpolate(unref(testDetails).companies)} bedrijf(ven). <!--]-->`);
            } else if (((_b = unref(testDetails)) == null ? void 0 : _b.heatPumps) != null) {
              _push2(`<!--[-->${ssrInterpolate(unref(testDetails).heatPumps)} warmtepomp(en) gevonden. <!--]-->`);
            } else if (((_c = unref(testDetails)) == null ? void 0 : _c.chargers) != null) {
              _push2(`<!--[-->${ssrInterpolate(unref(testDetails).chargers)} laadpa(a)l(en) gevonden. <!--]-->`);
            } else {
              _push2(`<!--[--> Gegevens worden automatisch gesynchroniseerd. <!--]-->`);
            }
            _push2(`</p></div>`);
            if (__props.integration.category === "monitoring" && unref(hasDevices)) {
              _push2(`<div class="mt-4" data-v-16c26900><button class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50" data-v-16c26900><div class="flex items-center gap-3" data-v-16c26900><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600" data-v-16c26900>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "puzzle",
                size: 18
              }, null, _parent));
              _push2(`</div><div data-v-16c26900><p class="text-sm font-medium text-gray-900" data-v-16c26900>${ssrInterpolate(unref(devices).length)} apparaten gevonden</p><p class="text-xs text-gray-500" data-v-16c26900>Bekijk gekoppelde apparaten en klanten</p></div></div>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 18,
                class: "text-gray-400"
              }, null, _parent));
              _push2(`</button></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="mt-4 rounded-xl border border-gray-200 p-4" data-v-16c26900><h4 class="text-sm font-semibold text-gray-900 mb-3" data-v-16c26900>Verbindingsgegevens</h4><div class="space-y-2" data-v-16c26900><!--[-->`);
            ssrRenderList(unref(fields), (field) => {
              _push2(`<div class="flex items-center justify-between" data-v-16c26900><span class="text-xs text-gray-500" data-v-16c26900>${ssrInterpolate(field.label)}</span><span class="text-xs font-mono text-gray-700" data-v-16c26900>${ssrInterpolate(field.type === "password" ? "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : unref(credentials)[field.key] || "demo-value")}</span></div>`);
            });
            _push2(`<!--]--><div class="flex items-center justify-between pt-2 border-t border-gray-100" data-v-16c26900><span class="text-xs text-gray-500" data-v-16c26900>Status</span><span class="badge badge--green" data-v-16c26900>Verbonden</span></div><div class="flex items-center justify-between" data-v-16c26900><span class="text-xs text-gray-500" data-v-16c26900>Laatst gesynchroniseerd</span><span class="text-xs text-gray-700" data-v-16c26900>Vandaag, 14:32</span></div></div></div><div class="mt-5 flex justify-between" data-v-16c26900><button class="btn-ghost text-red-600 hover:bg-red-50 hover:text-red-700" data-v-16c26900> Ontkoppelen </button><button class="btn-primary" data-v-16c26900>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check",
              size: 16
            }, null, _parent));
            _push2(` Opslaan &amp; sluiten </button></div></div>`);
          } else if (unref(step) === "devices") {
            _push2(`<div data-v-16c26900><button class="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" data-v-16c26900>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "chevron-right",
              size: 14,
              class: "rotate-180"
            }, null, _parent));
            _push2(` Terug </button><h4 class="text-sm font-semibold text-gray-900 mb-3" data-v-16c26900> Gekoppelde apparaten </h4>`);
            if (unref(devicesLoading)) {
              _push2(`<div class="py-6 text-center" data-v-16c26900><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-16c26900></div><p class="mt-2 text-xs text-gray-500" data-v-16c26900>Apparaten ophalen...</p></div>`);
            } else if (unref(devices).length === 0) {
              _push2(`<div class="py-6 text-center" data-v-16c26900><p class="text-sm text-gray-500" data-v-16c26900>Geen apparaten gevonden.</p></div>`);
            } else {
              _push2(`<div class="space-y-2" data-v-16c26900><!--[-->`);
              ssrRenderList(unref(devices), (device) => {
                _push2(`<div class="flex items-center justify-between rounded-xl border border-gray-200 p-3" data-v-16c26900><div class="flex items-center gap-3" data-v-16c26900><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100" data-v-16c26900>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: __props.integration.type === "solar" ? "solar" : __props.integration.type === "heat_pump" ? "heat-pump" : "ev-charger",
                  size: 18,
                  class: "text-gray-600"
                }, null, _parent));
                _push2(`</div><div data-v-16c26900><p class="text-sm font-medium text-gray-900" data-v-16c26900>${ssrInterpolate(device.name)}</p><p class="font-mono text-xs text-gray-400" data-v-16c26900>${ssrInterpolate(device.serial)}</p></div></div><div class="text-right" data-v-16c26900>`);
                if (device.customer) {
                  _push2(`<span class="badge badge--green" data-v-16c26900>${ssrInterpolate(device.customer)}</span>`);
                } else {
                  _push2(`<span class="badge badge--yellow" data-v-16c26900>Niet gekoppeld</span>`);
                }
                _push2(`</div></div>`);
              });
              _push2(`<!--]--></div>`);
            }
            _push2(`<p class="mt-3 text-xs text-gray-400" data-v-16c26900> Apparaten worden automatisch gesynchroniseerd. Koppel apparaten aan klanten via de klantpagina. </p><div class="mt-5 flex justify-end" data-v-16c26900><button class="btn-primary" data-v-16c26900>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check",
              size: 16
            }, null, _parent));
            _push2(` Sluiten </button></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div></div>`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/IntegrationConfigModal.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-16c26900"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "settings",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner, save: savePartner, isLoading: isSavingPartner, loadFullPartner } = usePartner();
    const { isConnected: isIntegrationConnected } = useIntegrations();
    const moduleConfigs = ref([]);
    const pricingLoaded = ref(false);
    ref(null);
    const ticketLabels = ref([]);
    const labelsLoaded = ref(false);
    const newLabelName = ref("");
    const newLabelColor = ref("blue");
    const labelBusy = ref(false);
    const labelError = ref("");
    const editingLabelId = ref(null);
    const editLabelName = ref("");
    const moduleIcons = { solar: "solar", heat_pump: "heat-pump", ev_charger: "ev-charger" };
    const moduleColors = { solar: "bg-amber-50 text-amber-600", heat_pump: "bg-orange-50 text-orange-600", ev_charger: "bg-sky-50 text-sky-600" };
    function formatPrice(cents) {
      return (cents / 100).toFixed(2).replace(".", ",");
    }
    ref("");
    const newPw = ref("");
    const confirmPw = ref("");
    const pwSaving = ref(false);
    const pwSuccess = ref(false);
    const pwError = ref("");
    const partnerSnapshot = ref("");
    const pricingSnapshot = ref("");
    const saveStatus = ref("idle");
    const saveError = ref("");
    function snapshotString(obj) {
      return JSON.stringify(obj);
    }
    function currentPartnerSnapshot() {
      return snapshotString({
        name: partner.value.name,
        slug: partner.value.slug,
        support_email: partner.value.support_email,
        support_phone: partner.value.support_phone,
        primary_color: partner.value.primary_color,
        secondary_color: partner.value.secondary_color,
        logo_url: partner.value.logo_url,
        terms_content: partner.value.terms_content,
        terms_url: partner.value.terms_url,
        terms_placeholders: partner.value.terms_placeholders
      });
    }
    function currentPricingSnapshot() {
      return snapshotString(moduleConfigs.value.map((c) => ({
        id: c.id,
        price_monthly: c.price_monthly,
        price_yearly: c.price_yearly,
        is_enabled: c.is_enabled,
        min_contract_months: c.min_contract_months
      })));
    }
    watch(() => partner.value.id, () => {
      partnerSnapshot.value = currentPartnerSnapshot();
    }, { immediate: true });
    watch(pricingLoaded, (v) => {
      if (v) pricingSnapshot.value = currentPricingSnapshot();
    });
    const partnerDirty = computed(() => partnerSnapshot.value && partnerSnapshot.value !== currentPartnerSnapshot());
    const pricingDirty = computed(() => pricingSnapshot.value && pricingSnapshot.value !== currentPricingSnapshot());
    const hasChanges = computed(() => partnerDirty.value || pricingDirty.value);
    useConfirm();
    function ensurePlaceholderDefaults() {
      if (!partner.value.terms_placeholders || typeof partner.value.terms_placeholders !== "object") {
        partner.value.terms_placeholders = {};
      }
      const ph = partner.value.terms_placeholders;
      if (!ph.bedrijfsnaam) ph.bedrijfsnaam = partner.value.name || "";
      if (!ph.kvk) ph.kvk = "";
      if (!ph.adres) ph.adres = "";
      if (!ph.email) ph.email = partner.value.support_email || "";
      if (!ph.telefoon) ph.telefoon = partner.value.support_phone || "";
      if (ph.uurtarief === void 0) ph.uurtarief = "";
      if (ph.voorrijkosten === void 0) ph.voorrijkosten = "";
      if (!ph.module_terms || typeof ph.module_terms !== "object") {
        ph.module_terms = { solar: "", heat_pump: "", ev_charger: "", battery: "" };
      } else {
        for (const k of ["solar", "heat_pump", "ev_charger", "battery"]) {
          if (ph.module_terms[k] === void 0) ph.module_terms[k] = "";
        }
      }
    }
    ensurePlaceholderDefaults();
    watch(() => partner.value.terms_placeholders, () => ensurePlaceholderDefaults(), { deep: false });
    watch(() => partner.value.id, () => ensurePlaceholderDefaults());
    const placeholderFields = [
      { key: "bedrijfsnaam", label: "Bedrijfsnaam", tag: "{{bedrijfsnaam}}" },
      { key: "kvk", label: "KvK-nummer", tag: "{{kvk}}" },
      { key: "adres", label: "Adres", tag: "{{adres}}" },
      { key: "email", label: "E-mail", tag: "{{email}}" },
      { key: "telefoon", label: "Telefoon", tag: "{{telefoon}}" },
      { key: "uurtarief", label: "Uurtarief", tag: "{{uurtarief}}" },
      { key: "voorrijkosten", label: "Voorrijkosten", tag: "{{voorrijkosten}}" }
    ];
    const moduleTermTabs = [
      { key: "solar", label: "Zonnepanelen", icon: "solar", appendix: "A" },
      { key: "heat_pump", label: "Warmtepomp", icon: "heat-pump", appendix: "B" },
      { key: "ev_charger", label: "Laadpaal", icon: "ev-charger", appendix: "C" },
      { key: "battery", label: "Batterij", icon: "battery", appendix: "D" }
    ];
    const activeModuleTab = ref("solar");
    function moduleTermsHasContent(key) {
      var _a, _b;
      return !!(((_b = (_a = partner.value.terms_placeholders) == null ? void 0 : _a.module_terms) == null ? void 0 : _b[key]) || "").trim();
    }
    const monitoringIntegrations = computed(() => [
      { name: "Sundata", desc: "Zonnepaneel monitoring (alle merken)", type: "solar", integrationType: "sundata", category: "monitoring", connected: isIntegrationConnected(partner.id, "sundata") },
      { name: "Weheat", desc: "Warmtepomp monitoring", type: "heat_pump", integrationType: "weheat", category: "monitoring", connected: isIntegrationConnected(partner.id, "weheat") },
      { name: "Easee", desc: "Laadpaal monitoring", type: "ev_charger", integrationType: "easee", category: "monitoring", connected: isIntegrationConnected(partner.id, "easee") }
    ]);
    const adminIntegrations = computed(() => [
      { name: "Gripp.com", desc: "CRM & projectmanagement", icon: "users", integrationType: "gripp", category: "admin", connected: isIntegrationConnected(partner.id, "gripp") }
    ]);
    const configModalOpen = ref(false);
    const selectedIntegration = ref(null);
    function handleSaved() {
      if (selectedIntegration.value) {
        selectedIntegration.value.connected = true;
      }
      configModalOpen.value = false;
    }
    ref(null);
    const logoUploading = ref(false);
    const logoSuccess = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b;
      const _component_AppIcon = _sfc_main$5;
      const _component_IntegrationConfigModal = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: unref(hasChanges) || unref(saveStatus) !== "idle" ? "pb-20" : ""
      }, _attrs))} data-v-c396f5f9><div class="mb-6" data-v-c396f5f9><h1 class="text-2xl font-bold text-gray-900" data-v-c396f5f9>Instellingen</h1><p class="mt-1 text-sm text-gray-500" data-v-c396f5f9>Beheer je partneromgeving, branding en koppelingen.</p></div><div class="grid gap-6 lg:grid-cols-2" data-v-c396f5f9><div class="space-y-6" data-v-c396f5f9><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "settings",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Partnerinformatie</h2></div><div class="space-y-3" data-v-c396f5f9><div data-v-c396f5f9><label class="label" data-v-c396f5f9>Bedrijfsnaam</label><input type="text"${ssrRenderAttr("value", unref(partner).name)} class="input" data-v-c396f5f9></div><div data-v-c396f5f9><label class="label" data-v-c396f5f9>Portaal URL</label><div class="flex items-center gap-2" data-v-c396f5f9><input type="text"${ssrRenderAttr("value", unref(partner).slug)} class="input flex-1" data-v-c396f5f9><span class="text-sm text-gray-400 whitespace-nowrap" data-v-c396f5f9>.upsol.nl</span></div></div><div class="grid grid-cols-2 gap-3" data-v-c396f5f9><div data-v-c396f5f9><label class="label" data-v-c396f5f9>Support e-mail</label><input type="email"${ssrRenderAttr("value", unref(partner).support_email)} class="input" data-v-c396f5f9></div><div data-v-c396f5f9><label class="label" data-v-c396f5f9>Telefoon</label><input type="tel"${ssrRenderAttr("value", unref(partner).support_phone)} class="input" data-v-c396f5f9></div></div></div></div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "solar",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Branding</h2></div><p class="mb-4 text-xs text-gray-500" data-v-c396f5f9>Deze kleuren worden automatisch toegepast in het klantportaal.</p><div class="grid grid-cols-2 gap-4" data-v-c396f5f9><div class="rounded-xl border border-gray-200 p-3" data-v-c396f5f9><p class="text-xs font-medium text-gray-500 mb-2" data-v-c396f5f9>Primair</p><div class="flex items-center gap-2" data-v-c396f5f9><div class="relative shrink-0" data-v-c396f5f9><div class="h-9 w-9 rounded-lg shadow-sm cursor-pointer" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}" data-v-c396f5f9></div><input type="color"${ssrRenderAttr("value", unref(partner).primary_color)} class="absolute inset-0 h-full w-full cursor-pointer opacity-0" data-v-c396f5f9></div><input type="text"${ssrRenderAttr("value", unref(partner).primary_color)} class="input font-mono text-sm !py-1.5" placeholder="#000000" maxlength="7" data-v-c396f5f9></div></div><div class="rounded-xl border border-gray-200 p-3" data-v-c396f5f9><p class="text-xs font-medium text-gray-500 mb-2" data-v-c396f5f9>Achtergrond</p><div class="flex items-center gap-2" data-v-c396f5f9><div class="relative shrink-0" data-v-c396f5f9><div class="h-9 w-9 rounded-lg border border-gray-200 shadow-sm cursor-pointer" style="${ssrRenderStyle({ backgroundColor: unref(partner).secondary_color })}" data-v-c396f5f9></div><input type="color"${ssrRenderAttr("value", unref(partner).secondary_color)} class="absolute inset-0 h-full w-full cursor-pointer opacity-0" data-v-c396f5f9></div><input type="text"${ssrRenderAttr("value", unref(partner).secondary_color)} class="input font-mono text-sm !py-1.5" placeholder="#ffffff" maxlength="7" data-v-c396f5f9></div></div></div></div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "home",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Logo</h2></div><div class="flex items-start gap-5" data-v-c396f5f9><button class="group relative flex h-16 w-32 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 transition-all hover:border-gray-300 hover:bg-gray-100 shrink-0" data-v-c396f5f9>`);
      if (unref(partner).logo_url) {
        _push(`<img${ssrRenderAttr("src", unref(partner).logo_url)}${ssrRenderAttr("alt", unref(partner).name)} class="h-12 w-auto max-w-[7rem] object-contain" data-v-c396f5f9>`);
      } else {
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "plus",
          size: 20,
          class: "text-gray-300"
        }, null, _parent));
      }
      _push(`<div class="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "plus",
        size: 18,
        class: "text-white"
      }, null, _parent));
      _push(`</div>`);
      if (unref(logoUploading)) {
        _push(`<div class="absolute inset-0 flex items-center justify-center rounded-xl bg-white/80" data-v-c396f5f9><div class="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" data-v-c396f5f9></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</button><div class="min-w-0 flex-1" data-v-c396f5f9><p class="text-sm font-medium text-gray-700" data-v-c396f5f9>${ssrInterpolate(unref(partner).name)}</p><p class="text-xs text-gray-400" data-v-c396f5f9>Wordt getoond in het klantportaal en e-mails.</p><button class="btn-ghost mt-1 text-xs" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "plus",
        size: 12
      }, null, _parent));
      _push(` Logo wijzigen </button>`);
      if (unref(logoSuccess)) {
        _push(`<p class="mt-1 text-xs font-medium text-green-600" data-v-c396f5f9> Logo succesvol bijgewerkt! </p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><input type="file" accept="image/*" class="hidden" data-v-c396f5f9></div><details class="mt-3 group" data-v-c396f5f9><summary class="inline-flex cursor-pointer items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 select-none list-none" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "help-circle",
        size: 12
      }, null, _parent));
      _push(`<span class="underline-offset-2 group-hover:underline" data-v-c396f5f9>Tips voor het beste resultaat</span>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "chevron-down",
        size: 11,
        class: "transition-transform group-open:rotate-180"
      }, null, _parent));
      _push(`</summary><ul class="mt-2 ml-5 space-y-1 text-xs text-gray-500 max-w-xl" data-v-c396f5f9><li data-v-c396f5f9><strong class="text-gray-700" data-v-c396f5f9>Snij witruimte rondom weg.</strong> Het logo wordt op ~56 px hoog getoond \u2014 extra padding in de afbeelding maakt &#39;em onnodig klein. </li><li data-v-c396f5f9><strong class="text-gray-700" data-v-c396f5f9>Transparante PNG of SVG.</strong> Een witte achtergrond geeft een rechthoek in gekleurde headers. </li><li data-v-c396f5f9><strong class="text-gray-700" data-v-c396f5f9>Lang en smal werkt het best.</strong> Streefverhouding ~3:1 of 4:1 (bv. 600\xD7180 px). </li><li data-v-c396f5f9><strong class="text-gray-700" data-v-c396f5f9>Minimaal 280 px breed.</strong> Scherp op Retina-/4K-schermen. </li></ul></details></div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "euro",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Tarieven</h2></div><p class="mb-4 text-xs text-gray-500" data-v-c396f5f9> Deze tarieven verschijnen als <code class="rounded bg-gray-100 px-1 font-mono text-[11px]" data-v-c396f5f9>{{uurtarief}}</code> en <code class="rounded bg-gray-100 px-1 font-mono text-[11px]" data-v-c396f5f9>{{voorrijkosten}}</code> in je voorwaarden en offertes. </p><div class="grid grid-cols-2 gap-3" data-v-c396f5f9><div data-v-c396f5f9><label class="label" data-v-c396f5f9>Uurtarief <span class="text-gray-400 font-normal" data-v-c396f5f9>(\u20AC excl. btw)</span></label><div class="relative" data-v-c396f5f9><span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" data-v-c396f5f9>\u20AC</span><input type="text" inputmode="decimal"${ssrRenderAttr("value", unref(partner).terms_placeholders.uurtarief)} placeholder="95,00" class="input pl-7" data-v-c396f5f9></div></div><div data-v-c396f5f9><label class="label" data-v-c396f5f9>Voorrijkosten <span class="text-gray-400 font-normal" data-v-c396f5f9>(\u20AC excl. btw)</span></label><div class="relative" data-v-c396f5f9><span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" data-v-c396f5f9>\u20AC</span><input type="text" inputmode="decimal"${ssrRenderAttr("value", unref(partner).terms_placeholders.voorrijkosten)} placeholder="25,00" class="input pl-7" data-v-c396f5f9></div></div></div></div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "check-circle",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Servicevoorwaarden</h2></div><div class="mb-5" data-v-c396f5f9><h3 class="text-sm font-semibold text-gray-800 mb-1" data-v-c396f5f9>Bedrijfsgegevens</h3><p class="text-xs text-gray-500 mb-3" data-v-c396f5f9> Deze waarden worden automatisch ingevuld in je voorwaarden. E-mail en telefoon worden samen met je <em data-v-c396f5f9>support-gegevens</em> opgeslagen, zodat klanten overal hetzelfde nummer zien. </p><div class="grid grid-cols-2 gap-3" data-v-c396f5f9><!--[-->`);
      ssrRenderList(placeholderFields.slice(0, 5), (field) => {
        _push(`<div data-v-c396f5f9><label class="label" data-v-c396f5f9>${ssrInterpolate(field.label)}</label>`);
        if (field.key === "email") {
          _push(`<input type="email"${ssrRenderAttr("value", unref(partner).support_email)} class="input" data-v-c396f5f9>`);
        } else if (field.key === "telefoon") {
          _push(`<input type="tel"${ssrRenderAttr("value", unref(partner).support_phone)} class="input" data-v-c396f5f9>`);
        } else {
          _push(`<input type="text"${ssrRenderAttr("value", unref(partner).terms_placeholders[field.key])} class="input" data-v-c396f5f9>`);
        }
        _push(`</div>`);
      });
      _push(`<!--]--></div></div><div class="mb-4" data-v-c396f5f9><h3 class="text-sm font-semibold text-gray-800 mb-1" data-v-c396f5f9>Algemene voorwaarden</h3><p class="text-xs text-gray-500 mb-2" data-v-c396f5f9> Gebruik placeholders in je tekst. Verwijs naar product-specifieke bijlagen met bv. <span class="rounded bg-gray-100 px-1 font-mono text-[11px]" data-v-c396f5f9>Bijlage A: Zonnepanelen</span>. </p><div class="mb-3 flex flex-wrap gap-1.5" data-v-c396f5f9><!--[-->`);
      ssrRenderList(placeholderFields, (field) => {
        _push(`<span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600" data-v-c396f5f9>${ssrInterpolate(field.tag)}</span>`);
      });
      _push(`<!--]--></div><textarea class="input font-mono" style="${ssrRenderStyle({ "min-height": "400px", "resize": "vertical" })}" placeholder="Voer hier je algemene servicevoorwaarden in..." data-v-c396f5f9>${ssrInterpolate(unref(partner).terms_content)}</textarea></div><a${ssrRenderAttr("href", `/voorwaarden/${unref(partner).slug}`)} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors" data-v-c396f5f9> Bekijk voorwaarden `);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "external",
        size: 14
      }, null, _parent));
      _push(`</a></div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "document",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Aanvullende voorwaarden per product</h2></div><p class="mb-4 text-xs text-gray-500" data-v-c396f5f9> Deze teksten verschijnen als <strong data-v-c396f5f9>bijlagen</strong> onder je algemene voorwaarden. Lege bijlagen worden verborgen. </p><div class="mb-3 flex gap-1 rounded-xl bg-gray-100 p-1 overflow-x-auto" data-v-c396f5f9><!--[-->`);
      ssrRenderList(moduleTermTabs, (tab) => {
        _push(`<button type="button" class="${ssrRenderClass([unref(activeModuleTab) === tab.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"])}" data-v-c396f5f9>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: tab.icon,
          size: 14
        }, null, _parent));
        _push(` Bijlage ${ssrInterpolate(tab.appendix)}: ${ssrInterpolate(tab.label)} `);
        if (moduleTermsHasContent(tab.key)) {
          _push(`<span class="h-1.5 w-1.5 rounded-full bg-green-500" title="Bevat tekst" data-v-c396f5f9></span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</button>`);
      });
      _push(`<!--]--></div>`);
      if ((_a = unref(partner).terms_placeholders) == null ? void 0 : _a.module_terms) {
        _push(`<textarea class="input font-mono" style="${ssrRenderStyle({ "min-height": "260px", "resize": "vertical" })}"${ssrRenderAttr("placeholder", `Aanvullende voorwaarden voor ${(_b = moduleTermTabs.find((t) => t.key === unref(activeModuleTab))) == null ? void 0 : _b.label}. Verwijs gerust naar {{uurtarief}} en {{voorrijkosten}} \u2014 die worden automatisch ingevuld.`)} data-v-c396f5f9>${ssrInterpolate(unref(partner).terms_placeholders.module_terms[unref(activeModuleTab)])}</textarea>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<p class="mt-2 text-[11px] text-gray-400" data-v-c396f5f9> Tip: verwijs in je algemene voorwaarden naar de juiste bijlage, bv. <em data-v-c396f5f9>&quot;Voor specifieke voorwaarden rond zonnepanelen, zie Bijlage A hieronder.&quot;</em></p></div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "tag",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Ticketlabels</h2></div><p class="mb-4 text-xs text-gray-500" data-v-c396f5f9> Interne labels om de werkstroom op tickets bij te houden (bv. &quot;Wacht op antwoord klant&quot;). Alleen zichtbaar voor jou en je team \u2014 de klant ziet ze niet. </p>`);
      if (unref(labelError)) {
        _push(`<div class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" data-v-c396f5f9>${ssrInterpolate(unref(labelError))}</div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(labelsLoaded) && unref(ticketLabels).length) {
        _push(`<div class="space-y-1.5 mb-4" data-v-c396f5f9><!--[-->`);
        ssrRenderList(unref(ticketLabels), (label) => {
          _push(`<div class="${ssrRenderClass([label.is_active === false ? "opacity-50" : "", "flex items-center gap-2 rounded-lg border border-gray-100 px-3 py-2"])}" data-v-c396f5f9><select${ssrRenderAttr("value", label.color)} class="${ssrRenderClass([unref(labelChip)(label.color).dot, "h-6 w-6 shrink-0 cursor-pointer rounded-full border-0 p-0 appearance-none"])}" title="Kleur wijzigen" data-v-c396f5f9><!--[-->`);
          ssrRenderList(unref(LABEL_COLORS), (c) => {
            _push(`<option${ssrRenderAttr("value", c)} data-v-c396f5f9>${ssrInterpolate(c)}</option>`);
          });
          _push(`<!--]--></select>`);
          if (unref(editingLabelId) === label.id) {
            _push(`<!--[--><input${ssrRenderAttr("value", unref(editLabelName))} type="text" class="input flex-1 text-sm py-1" maxlength="60" data-v-c396f5f9><button class="rounded-lg bg-gray-900 px-2.5 py-1 text-xs font-medium text-white" data-v-c396f5f9>Opslaan</button><button class="rounded-lg border border-gray-200 px-2.5 py-1 text-xs text-gray-600" data-v-c396f5f9>Annuleer</button><!--]-->`);
          } else {
            _push(`<!--[--><span class="${ssrRenderClass([[unref(labelChip)(label.color).bg, unref(labelChip)(label.color).text], "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"])}" data-v-c396f5f9><span class="${ssrRenderClass([unref(labelChip)(label.color).dot, "h-1.5 w-1.5 rounded-full"])}" data-v-c396f5f9></span> ${ssrInterpolate(label.name)}</span><span class="flex-1" data-v-c396f5f9></span><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700" title="Naam wijzigen" data-v-c396f5f9>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "settings",
              size: 14
            }, null, _parent));
            _push(`</button><button class="rounded-lg p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500" title="Verwijderen" data-v-c396f5f9>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "trash",
              size: 14
            }, null, _parent));
            _push(`</button><!--]-->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      } else if (unref(labelsLoaded)) {
        _push(`<p class="mb-4 text-xs text-gray-400" data-v-c396f5f9>Nog geen labels. Voeg je eerste hieronder toe.</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="flex items-center gap-2 border-t border-gray-100 pt-3" data-v-c396f5f9><select class="${ssrRenderClass([unref(labelChip)(unref(newLabelColor)).dot, "h-8 w-8 shrink-0 cursor-pointer rounded-full border-0 p-0 appearance-none"])}" title="Kleur" data-v-c396f5f9><!--[-->`);
      ssrRenderList(unref(LABEL_COLORS), (c) => {
        _push(`<option${ssrRenderAttr("value", c)} data-v-c396f5f9${ssrIncludeBooleanAttr(Array.isArray(unref(newLabelColor)) ? ssrLooseContain(unref(newLabelColor), c) : ssrLooseEqual(unref(newLabelColor), c)) ? " selected" : ""}>${ssrInterpolate(c)}</option>`);
      });
      _push(`<!--]--></select><input${ssrRenderAttr("value", unref(newLabelName))} type="text" class="input flex-1 text-sm" placeholder="Nieuw label, bv. Wacht op monteur" maxlength="60" data-v-c396f5f9><button class="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(newLabelName).trim() || unref(labelBusy)) ? " disabled" : ""} data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "plus",
        size: 14
      }, null, _parent));
      _push(` Toevoegen </button></div></div></div><div class="space-y-6" data-v-c396f5f9><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "euro",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Module prijzen</h2></div>`);
      if (!unref(pricingLoaded)) {
        _push(`<div class="py-4 text-center" data-v-c396f5f9><div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-c396f5f9></div></div>`);
      } else {
        _push(`<div class="space-y-3" data-v-c396f5f9><!--[-->`);
        ssrRenderList(unref(moduleConfigs), (config) => {
          var _a2, _b2, _c;
          _push(`<div class="rounded-xl border border-gray-200 p-4" data-v-c396f5f9><div class="flex items-center justify-between mb-3" data-v-c396f5f9><div class="flex items-center gap-2" data-v-c396f5f9><div class="${ssrRenderClass([moduleColors[(_a2 = config.module_definition) == null ? void 0 : _a2.type] || "bg-gray-100", "flex h-7 w-7 items-center justify-center rounded-lg"])}" data-v-c396f5f9>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: moduleIcons[(_b2 = config.module_definition) == null ? void 0 : _b2.type] || "puzzle",
            size: 14
          }, null, _parent));
          _push(`</div><span class="text-sm font-medium text-gray-900" data-v-c396f5f9>${ssrInterpolate((_c = config.module_definition) == null ? void 0 : _c.name)}</span></div><button class="${ssrRenderClass([config.is_enabled ? "bg-green-500" : "bg-gray-300", "relative inline-flex h-5 w-9 items-center rounded-full transition-colors"])}" data-v-c396f5f9><span class="${ssrRenderClass([config.is_enabled ? "translate-x-4" : "translate-x-1", "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform"])}" data-v-c396f5f9></span></button></div><div class="grid grid-cols-3 gap-2" data-v-c396f5f9><div data-v-c396f5f9><label class="text-[10px] text-gray-400 uppercase" data-v-c396f5f9>Per maand</label><div class="flex items-center gap-1" data-v-c396f5f9><span class="text-xs text-gray-400" data-v-c396f5f9>\u20AC</span><input${ssrRenderAttr("value", formatPrice(config.price_monthly))} type="text" class="input !py-1 text-sm" data-v-c396f5f9></div></div><div data-v-c396f5f9><label class="text-[10px] text-gray-400 uppercase" data-v-c396f5f9>Per jaar</label><div class="flex items-center gap-1" data-v-c396f5f9><span class="text-xs text-gray-400" data-v-c396f5f9>\u20AC</span><input${ssrRenderAttr("value", formatPrice(config.price_yearly))} type="text" class="input !py-1 text-sm" data-v-c396f5f9></div></div><div data-v-c396f5f9><label class="text-[10px] text-gray-400 uppercase" data-v-c396f5f9>Min. maanden</label><input${ssrRenderAttr("value", config.min_contract_months)} type="number" class="input !py-1 text-sm" data-v-c396f5f9></div></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "puzzle",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Monitoring integraties</h2></div><p class="mb-3 text-xs text-gray-500" data-v-c396f5f9>Koppel met monitoringplatforms om apparaten van klanten real-time te volgen.</p><div class="space-y-3" data-v-c396f5f9><!--[-->`);
      ssrRenderList(unref(monitoringIntegrations), (int) => {
        _push(`<button class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm" data-v-c396f5f9><div class="flex items-center gap-3" data-v-c396f5f9><div class="${ssrRenderClass([[unref(getModuleTheme)(int.type).bg, unref(getModuleTheme)(int.type).text], "flex h-8 w-8 items-center justify-center rounded-lg"])}" data-v-c396f5f9>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(getModuleTheme)(int.type).icon,
          size: 16
        }, null, _parent));
        _push(`</div><div data-v-c396f5f9><p class="text-sm font-medium text-gray-900" data-v-c396f5f9>${ssrInterpolate(int.name)}</p><p class="text-xs text-gray-500" data-v-c396f5f9>${ssrInterpolate(int.desc)}</p></div></div><div class="flex items-center gap-2" data-v-c396f5f9><span class="${ssrRenderClass([int.connected ? "badge--green" : "badge--yellow", "badge"])}" data-v-c396f5f9>${ssrInterpolate(int.connected ? "Verbonden" : "Niet geconfigureerd")}</span>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "chevron-right",
          size: 16,
          class: "text-gray-300"
        }, null, _parent));
        _push(`</div></button>`);
      });
      _push(`<!--]--></div></div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "credit-card",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Administratie &amp; facturatie</h2></div><p class="mb-3 text-xs text-gray-500" data-v-c396f5f9>Koppelingen met boekhouding, CRM en betalingsverwerking.</p><div class="space-y-3" data-v-c396f5f9><!--[-->`);
      ssrRenderList(unref(adminIntegrations), (int) => {
        _push(`<button class="flex w-full items-center justify-between rounded-xl border border-gray-200 p-3 text-left transition-all hover:border-gray-300 hover:shadow-sm" data-v-c396f5f9><div class="flex items-center gap-3" data-v-c396f5f9><div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600" data-v-c396f5f9>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: int.icon,
          size: 16
        }, null, _parent));
        _push(`</div><div data-v-c396f5f9><p class="text-sm font-medium text-gray-900" data-v-c396f5f9>${ssrInterpolate(int.name)}</p><p class="text-xs text-gray-500" data-v-c396f5f9>${ssrInterpolate(int.desc)}</p></div></div><div class="flex items-center gap-2" data-v-c396f5f9><span class="${ssrRenderClass([int.connected ? "badge--green" : "badge--yellow", "badge"])}" data-v-c396f5f9>${ssrInterpolate(int.connected ? "Verbonden" : "Niet geconfigureerd")}</span>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "chevron-right",
          size: 16,
          class: "text-gray-300"
        }, null, _parent));
        _push(`</div></button>`);
      });
      _push(`<!--]--></div></div><div class="section" data-v-c396f5f9><div class="mb-4 flex items-center gap-3" data-v-c396f5f9>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "shield",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`<h2 class="text-base font-semibold text-gray-900" data-v-c396f5f9>Wachtwoord wijzigen</h2></div><form class="space-y-3" data-v-c396f5f9><div data-v-c396f5f9><label class="label" data-v-c396f5f9>Nieuw wachtwoord</label><input${ssrRenderAttr("value", unref(newPw))} type="password" class="input" placeholder="Minimaal 8 tekens" required autocomplete="new-password" data-v-c396f5f9></div><div data-v-c396f5f9><label class="label" data-v-c396f5f9>Bevestig wachtwoord</label><input${ssrRenderAttr("value", unref(confirmPw))} type="password" class="input" placeholder="Herhaal wachtwoord" required autocomplete="new-password" data-v-c396f5f9></div>`);
      if (unref(pwError)) {
        _push(`<p class="text-sm text-red-500" data-v-c396f5f9>${ssrInterpolate(unref(pwError))}</p>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(pwSuccess)) {
        _push(`<p class="text-sm text-green-600 font-medium" data-v-c396f5f9>Wachtwoord gewijzigd!</p>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<button type="submit" class="flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(pwSaving) || !unref(newPw) || !unref(confirmPw)) ? " disabled" : ""} data-v-c396f5f9>${ssrInterpolate(unref(pwSaving) ? "Wijzigen..." : "Wachtwoord wijzigen")}</button></form></div></div></div>`);
      if (unref(hasChanges) || unref(saveStatus) !== "idle") {
        _push(`<div class="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg" data-v-c396f5f9><div class="mx-auto flex max-w-6xl items-center justify-between px-6 py-3" data-v-c396f5f9><div class="flex items-center gap-3" data-v-c396f5f9>`);
        if (unref(saveStatus) === "saving") {
          _push(`<!--[--><div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-c396f5f9></div><span class="text-sm text-gray-600" data-v-c396f5f9>Bezig met opslaan...</span><!--]-->`);
        } else if (unref(saveStatus) === "saved") {
          _push(`<!--[-->`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check-circle",
            size: 18,
            class: "text-green-500"
          }, null, _parent));
          _push(`<span class="text-sm text-green-600 font-medium" data-v-c396f5f9>Opgeslagen</span><!--]-->`);
        } else if (unref(saveStatus) === "error") {
          _push(`<!--[-->`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "warning",
            size: 18,
            class: "text-red-500"
          }, null, _parent));
          _push(`<span class="text-sm text-red-500" data-v-c396f5f9>${ssrInterpolate(unref(saveError))}</span><!--]-->`);
        } else {
          _push(`<!--[--><div class="h-2 w-2 rounded-full bg-amber-500 animate-pulse" data-v-c396f5f9></div><span class="text-sm text-gray-700" data-v-c396f5f9> Je hebt onopgeslagen wijzigingen </span><!--]-->`);
        }
        _push(`</div><div class="flex items-center gap-2" data-v-c396f5f9>`);
        if (unref(hasChanges) && unref(saveStatus) === "idle") {
          _push(`<button class="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100" data-v-c396f5f9> Annuleren </button>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(hasChanges)) {
          _push(`<button class="flex items-center gap-2 rounded-xl bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(saveStatus) === "saving") ? " disabled" : ""} data-v-c396f5f9>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 16
          }, null, _parent));
          _push(` Wijzigingen opslaan </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(ssrRenderComponent(_component_IntegrationConfigModal, {
        open: unref(configModalOpen),
        integration: unref(selectedIntegration),
        onClose: ($event) => configModalOpen.value = false,
        onSaved: handleSaved
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/settings.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const settings = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-c396f5f9"]]);

export { settings as default };
//# sourceMappingURL=settings-BTIojTSM.mjs.map
