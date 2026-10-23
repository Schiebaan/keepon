import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { c as _export_sfc, d as useRoute, f as useSupabaseClient, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, computed, watch, mergeProps, unref, withCtx, createVNode, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrInterpolate, ssrIncludeBooleanAttr } from 'vue/server-renderer';
import { I as INCASSANT, A as AFSCHRIFT_NAAM } from '../_/incassant.mjs';
import { u as useOnboarding } from './useOnboarding-qzHH_gJ9.mjs';
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
  __name: "incasso",
  __ssrInlineRender: true,
  setup(__props) {
    const { state, isLoading, formatPrice } = useOnboarding();
    const route = useRoute();
    useSupabaseClient();
    ref(route.query.mandate === "pending");
    const checkingReturn = ref(false);
    const startingIdeal = ref(false);
    const showManual = ref(false);
    const partner = computed(() => {
      var _a;
      return (_a = state.value) == null ? void 0 : _a.partner;
    });
    const totalMonthly = computed(() => {
      var _a, _b;
      return ((_b = (_a = state.value) == null ? void 0 : _a.proposal) == null ? void 0 : _b.total_monthly_cents) || 0;
    });
    const iban = ref("");
    const accountHolder = ref("");
    const submitting = ref(false);
    const submitError = ref("");
    function formatIban(s) {
      return s.replace(/\s+/g, "").toUpperCase().replace(/(.{4})/g, "$1 ").trim();
    }
    watch(iban, (v) => {
      const formatted = formatIban(v);
      if (formatted !== v) iban.value = formatted;
    });
    const ibanLooksValid = computed(() => {
      const v = iban.value.replace(/\s+/g, "").toUpperCase();
      return /^NL\d{2}[A-Z]{4}\d{10}$/.test(v);
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "page",
        style: ((_a = unref(partner)) == null ? void 0 : _a.primary_color) ? `--brand: ${unref(partner).primary_color};` : ""
      }, _attrs))} data-v-5539aeea><div class="container" data-v-5539aeea><header class="header" data-v-5539aeea>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/welkom/voorstel",
        class: "back-link"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "chevron-right",
              size: 14,
              class: "rotate-180"
            }, null, _parent2, _scopeId));
            _push2(` Terug `);
          } else {
            return [
              createVNode(_component_AppIcon, {
                name: "chevron-right",
                size: 14,
                class: "rotate-180"
              }),
              createTextVNode(" Terug ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<div class="brand" data-v-5539aeea>`);
      if ((_b = unref(partner)) == null ? void 0 : _b.logo_url) {
        _push(`<img${ssrRenderAttr("src", unref(partner).logo_url)} alt="" aria-hidden="true" class="logo" data-v-5539aeea>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="brand-name" data-v-5539aeea>${ssrInterpolate((_c = unref(partner)) == null ? void 0 : _c.name)}</span></div><span class="step-marker" aria-label="Optionele stap" data-v-5539aeea>Incasso</span></header>`);
      if (unref(checkingReturn)) {
        _push(`<div class="text-center py-16" data-v-5539aeea><div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-5539aeea></div><p class="mt-4 text-sm font-medium text-gray-900" data-v-5539aeea>Je machtiging wordt bevestigd</p><p class="mt-1 text-sm text-gray-500" data-v-5539aeea>Even geduld, dit duurt een paar seconden.</p></div>`);
      } else if (unref(isLoading) && !unref(state)) {
        _push(`<div class="text-center py-16" data-v-5539aeea><div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-5539aeea></div></div>`);
      } else {
        _push(`<!--[--><div class="title-block" data-v-5539aeea><p class="eyebrow" data-v-5539aeea>Bijna klaar</p><h1 class="title" data-v-5539aeea>Automatische incasso</h1><p class="subtitle" data-v-5539aeea> E\xE9n afschrijving per maand, geen omkijken naar. Veilig geregeld via Mollie en volgens SEPA. Je kunt elke incasso binnen 8 weken kosteloos terugdraaien. </p></div><div class="card" data-v-5539aeea><div class="amount-row" data-v-5539aeea><div data-v-5539aeea><p class="amount-label" data-v-5539aeea>Maandelijks bedrag</p><p class="amount" data-v-5539aeea>\u20AC${ssrInterpolate(unref(formatPrice)(unref(totalMonthly)))}</p><p class="amount-note" data-v-5539aeea>Eerste afschrijving volgende maand</p></div><div class="badge" data-v-5539aeea>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "shield",
          size: 14
        }, null, _parent));
        _push(` SEPA via Mollie </div></div>`);
        if (unref(submitError)) {
          _push(`<p class="error" role="alert" aria-live="assertive" data-v-5539aeea>${ssrInterpolate(unref(submitError))}</p>`);
        } else {
          _push(`<!---->`);
        }
        if (((_d = unref(state)) == null ? void 0 : _d.incasso_available) === false) {
          _push(`<!--[--><div class="pending-note" data-v-5539aeea><p class="pending-title" data-v-5539aeea>De machtiging volgt later</p><p class="pending-text" data-v-5539aeea> We ronden de automatische incasso nog af met onze betaalpartner. Zodra het kan krijg je van ons een mail met een link om de machtiging in een minuut af te geven. Tot die tijd wordt er niets afgeschreven. </p></div><button type="button" class="btn-primary"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} data-v-5539aeea>`);
          if (unref(submitting)) {
            _push(`<span class="spinner" data-v-5539aeea></span>`);
          } else {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "check",
              size: 16
            }, null, _parent));
          }
          _push(` Naar mijn portaal </button><!--]-->`);
        } else if (!unref(showManual)) {
          _push(`<!--[--><button type="button" class="btn-primary"${ssrIncludeBooleanAttr(unref(startingIdeal)) ? " disabled" : ""} data-v-5539aeea>`);
          if (unref(startingIdeal)) {
            _push(`<span class="spinner" data-v-5539aeea></span>`);
          } else {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "shield",
              size: 16
            }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(startingIdeal) ? "Je gaat naar je bank..." : "Machtigen via iDEAL")}</button><ul class="ideal-steps" data-v-5539aeea><li data-v-5539aeea>Je kiest je eigen bank en logt in zoals je gewend bent.</li><li data-v-5539aeea>We schrijven <strong data-v-5539aeea>\u20AC0,01</strong> af om je rekening te bevestigen.</li><li data-v-5539aeea>Daarna loopt de maandelijkse incasso vanzelf.</li></ul><button type="button" class="btn-link" data-v-5539aeea> Liever je IBAN zelf invullen? </button><button type="button" class="btn-secondary"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} data-v-5539aeea> Nu nog niet, doe ik later </button><!--]-->`);
        } else {
          _push(`<form class="form" data-v-5539aeea><div class="field" data-v-5539aeea><label data-v-5539aeea>IBAN</label><input${ssrRenderAttr("value", unref(iban))} type="text" placeholder="NL91 ABNA 0417 1643 00" maxlength="34" autocomplete="off" data-v-5539aeea><p class="field-hint" data-v-5539aeea>Het rekeningnummer waarvan we mogen incasseren</p></div><div class="field" data-v-5539aeea><label data-v-5539aeea>Naam op rekening</label><input${ssrRenderAttr("value", unref(accountHolder))} type="text" placeholder="J. de Vries" autocomplete="name" data-v-5539aeea></div><p class="manual-note" data-v-5539aeea>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "warning",
            size: 14
          }, null, _parent));
          _push(` Controleer het nummer goed \u2014 we kunnen het hier niet bij je bank verifi\xEBren. </p><button type="submit" class="btn-primary"${ssrIncludeBooleanAttr(unref(submitting) || !unref(ibanLooksValid) || !unref(accountHolder)) ? " disabled" : ""} data-v-5539aeea>`);
          if (unref(submitting)) {
            _push(`<span class="spinner" data-v-5539aeea></span>`);
          } else {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "check",
              size: 16
            }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(submitting) ? "Bezig..." : "Mandaat verlenen")}</button><button type="button" class="btn-link" data-v-5539aeea> Toch via iDEAL, dat is veiliger </button><button type="button" class="btn-secondary"${ssrIncludeBooleanAttr(unref(submitting)) ? " disabled" : ""} data-v-5539aeea> Nu nog niet, doe ik later </button></form>`);
        }
        _push(`</div><div class="reassurance" data-v-5539aeea><div class="reassurance-item" data-v-5539aeea>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "shield",
          size: 16
        }, null, _parent));
        _push(`<div data-v-5539aeea><p class="reassurance-title" data-v-5539aeea>Veilig</p><p class="reassurance-text" data-v-5539aeea>Je gegevens gaan rechtstreeks naar Mollie, een Nederlandse betaalverwerker.</p></div></div><div class="reassurance-item" data-v-5539aeea>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "zap",
          size: 16
        }, null, _parent));
        _push(`<div data-v-5539aeea><p class="reassurance-title" data-v-5539aeea>Geen verrassingen</p><p class="reassurance-text" data-v-5539aeea>Bij elke incasso krijg je een mail. Niet eens? Tot 8 weken terugdraaien.</p></div></div></div><p class="explainer" data-v-5539aeea> Het mandaat geef je af aan <strong data-v-5539aeea>${ssrInterpolate(unref(INCASSANT))}</strong> namens je servicecontract met ${ssrInterpolate((_e = unref(partner)) == null ? void 0 : _e.name)}. Op je bankafschrift staat <strong data-v-5539aeea>${ssrInterpolate(unref(AFSCHRIFT_NAAM))}</strong>. </p><!--]-->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/welkom/incasso.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const incasso = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-5539aeea"]]);

export { incasso as default };
//# sourceMappingURL=incasso-CMwj627o.mjs.map
