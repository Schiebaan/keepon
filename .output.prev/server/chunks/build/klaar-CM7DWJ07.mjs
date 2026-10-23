import { c as _export_sfc, _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, computed, ref, mergeProps, unref, withCtx, createVNode, toDisplayString, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrRenderStyle, ssrRenderAttr, ssrInterpolate, ssrRenderComponent, ssrRenderClass } from 'vue/server-renderer';
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

const MODULE_COPY = {
  solar: {
    module: "solar",
    label: "Zonnepanelen",
    icon: "solar",
    bg: "bg-amber-50",
    text: "text-amber-700",
    hero: "Maximale opbrengst, minimum gedoe",
    headline: "Jouw zonnepanelen op autopilot",
    why: "Je weet wanneer er iets mis is voordat het je geld kost. Een storing van een week kan zomaar honderden kWh opbrengst betekenen.",
    whatYouGet: [
      "Live opbrengst in je portaal",
      "Direct bericht bij een storing",
      "Vergelijking met de voorspelling \u2014 zie je of het systeem doet wat het hoort te doen",
      "Jaarrapport met opgewekte kWh + bespaarde euro's",
      "Voorrang bij service-aanvragen"
    ]
  },
  heat_pump: {
    module: "heat_pump",
    label: "Warmtepomp",
    icon: "heat-pump",
    bg: "bg-orange-50",
    text: "text-orange-700",
    hero: "Zorg dat je niet in de kou zit",
    headline: "Warmte zonder zorgen",
    why: "Een warmtepomp die uitvalt op de koudste dag van het jaar \u2014 daar zit je niet op te wachten. Wij houden hem voor je in de gaten.",
    whatYouGet: [
      "Real-time monitoring (COP, temperatuur, vermogen)",
      "Storing? Wij zien het meteen, vaak nog v\xF3\xF3r jij merkt dat het kouder wordt",
      "Advies over zuiniger draaien",
      "Voorrangsbeurt bij een spoed-monteur",
      "Jaarcheck inclusief filter en koudemiddel"
    ]
  },
  ev_charger: {
    module: "ev_charger",
    label: "Laadpaal",
    icon: "ev-charger",
    bg: "bg-sky-50",
    text: "text-sky-700",
    hero: "Slim laden, geen verrassingen",
    headline: "Laden zoals jij wil",
    why: "Hoeveel kost een vol opladen \u2018s nachts versus overdag op je eigen zon? Je hoort er pas iets van als de rekening komt \u2014 tenzij je inzicht hebt.",
    whatYouGet: [
      "Overzicht van laadsessies en kosten",
      "Slim-laden op zonneoverschot",
      "Storing? Wij krijgen direct een melding",
      "Voorrang bij laadpaal-storingen",
      "Maandoverzicht voor zakelijke verrekening"
    ]
  },
  battery: {
    module: "battery",
    label: "Thuisbatterij",
    icon: "battery",
    bg: "bg-violet-50",
    text: "text-violet-700",
    hero: "Je eigen stroom, op het juiste moment",
    headline: "Eigen energie als jij hem nodig hebt",
    why: "Een batterij is alleen winstgevend als hij effici\xEBnt laadt en ontlaadt. Wij houden de cycli en gezondheid in de gaten.",
    whatYouGet: [
      "Live laad- en ontlaadgegevens",
      "Inzicht in batterijgezondheid (cycles, capaciteit)",
      "Optimalisatie-advies bij dynamische tarieven",
      "Storing? Wij weten het direct"
    ]
  }
};
function getModuleCopy(module) {
  return MODULE_COPY[module] || null;
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "klaar",
  __ssrInlineRender: true,
  setup(__props) {
    const { state, isLoading } = useOnboarding();
    const partner = computed(() => {
      var _a;
      return (_a = state.value) == null ? void 0 : _a.partner;
    });
    const firstName = computed(() => {
      var _a, _b;
      return ((_b = (_a = state.value) == null ? void 0 : _a.customer) == null ? void 0 : _b.first_name) || "";
    });
    const modules = computed(() => {
      var _a, _b;
      return ((_b = (_a = state.value) == null ? void 0 : _a.proposal) == null ? void 0 : _b.modules) || [];
    });
    const mandateSkipped = computed(() => {
      var _a;
      return !!((_a = state.value) == null ? void 0 : _a.mandate_skipped);
    });
    const confettiPieces = ref([]);
    const tourCards = computed(() => {
      const cards = [];
      for (const m of modules.value) {
        const c = getModuleCopy(m.module);
        if (!c) continue;
        if (m.module === "solar") {
          cards.push({ title: "Je opbrengst", text: "Live data, vergelijking met voorspelling, jaaroverzicht.", icon: c.icon, to: "/klant/zonnepanelen", bg: c.bg, text_class: c.text });
        }
        if (m.module === "heat_pump") {
          cards.push({ title: "Je warmtepomp", text: "Status, COP en watertemperatuur, straks live in beeld.", icon: c.icon, to: "/klant/warmtepomp", bg: c.bg, text_class: c.text });
        }
        if (m.module === "ev_charger") {
          cards.push({ title: "Je laadpaal", text: "Sessies en kosten op \xE9\xE9n plek.", icon: c.icon, to: "/klant/laadpaal", bg: c.bg, text_class: c.text });
        }
      }
      cards.push({ title: "Hulp nodig?", text: "Stel een vraag of bekijk je meldingen.", icon: "tool", to: "/klant/service", bg: "bg-indigo-50", text_class: "text-indigo-700" });
      return cards;
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "page",
        style: ((_a = unref(partner)) == null ? void 0 : _a.primary_color) ? `--brand: ${unref(partner).primary_color};` : ""
      }, _attrs))} data-v-cbb052ce><div class="confetti" aria-hidden="true" data-v-cbb052ce><!--[-->`);
      ssrRenderList(unref(confettiPieces), (p) => {
        _push(`<span class="confetti-piece" style="${ssrRenderStyle({ left: p.left + "%", backgroundColor: p.color, animationDelay: p.delay + "s", "--rot": p.rotate + "deg" })}" data-v-cbb052ce></span>`);
      });
      _push(`<!--]--></div><div class="container" data-v-cbb052ce><header class="header" data-v-cbb052ce><div class="brand" data-v-cbb052ce>`);
      if ((_b = unref(partner)) == null ? void 0 : _b.logo_url) {
        _push(`<img${ssrRenderAttr("src", unref(partner).logo_url)} alt="" aria-hidden="true" class="logo" data-v-cbb052ce>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="brand-name" data-v-cbb052ce>${ssrInterpolate((_c = unref(partner)) == null ? void 0 : _c.name)}</span></div><span class="step-marker" data-v-cbb052ce>Klaar</span></header>`);
      if (unref(isLoading) && !unref(state)) {
        _push(`<div class="text-center py-16" data-v-cbb052ce><div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-cbb052ce></div></div>`);
      } else {
        _push(`<!--[--><div class="hero" data-v-cbb052ce><div class="check-circle" data-v-cbb052ce>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "check",
          size: 44
        }, null, _parent));
        _push(`</div><p class="eyebrow" data-v-cbb052ce>Klaar voor gebruik</p><h1 class="title" data-v-cbb052ce>${ssrInterpolate(unref(firstName) ? `${unref(firstName).charAt(0).toUpperCase()}${unref(firstName).slice(1)}, je portaal staat live!` : "Je portaal staat live!")}</h1><p class="subtitle" data-v-cbb052ce> Bedankt voor je akkoord. Vanaf nu krijg je een seintje als je systeem aandacht nodig heeft. Je kunt op elk moment terugkomen om alles te zien. </p></div><ul class="checklist" data-v-cbb052ce><li class="done" data-v-cbb052ce>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "check-circle",
          size: 20
        }, null, _parent));
        _push(`<span data-v-cbb052ce>Account aangemaakt</span></li><li class="done" data-v-cbb052ce>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "check-circle",
          size: 20
        }, null, _parent));
        _push(`<span data-v-cbb052ce>Servicecontract akkoord</span></li><li class="${ssrRenderClass(unref(mandateSkipped) ? "pending" : "done")}" data-v-cbb052ce>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(mandateSkipped) ? "clock" : "check-circle",
          size: 20
        }, null, _parent));
        if (unref(mandateSkipped)) {
          _push(`<span data-v-cbb052ce>Incasso volgt nog, we sturen je later een mailtje</span>`);
        } else {
          _push(`<span data-v-cbb052ce>Automatische incasso geregeld</span>`);
        }
        _push(`</li></ul><div class="tour" data-v-cbb052ce><p class="tour-title" data-v-cbb052ce>Wat kan je hier?</p><div class="tour-grid" data-v-cbb052ce><!--[-->`);
        ssrRenderList(unref(tourCards), (t) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: t.to,
            to: t.to,
            class: ["tour-card", t.bg + " no-underline"]
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([[t.bg, t.text_class], "tour-icon"])}" data-v-cbb052ce${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: t.icon,
                  size: 18
                }, null, _parent2, _scopeId));
                _push2(`</div><p class="tour-card-title" data-v-cbb052ce${_scopeId}>${ssrInterpolate(t.title)}</p><p class="tour-card-text" data-v-cbb052ce${_scopeId}>${ssrInterpolate(t.text)}</p>`);
              } else {
                return [
                  createVNode("div", {
                    class: ["tour-icon", [t.bg, t.text_class]]
                  }, [
                    createVNode(_component_AppIcon, {
                      name: t.icon,
                      size: 18
                    }, null, 8, ["name"])
                  ], 2),
                  createVNode("p", { class: "tour-card-title" }, toDisplayString(t.title), 1),
                  createVNode("p", { class: "tour-card-text" }, toDisplayString(t.text), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div></div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant",
          class: "cta-link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Naar mijn portaal `);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 16
              }, null, _parent2, _scopeId));
            } else {
              return [
                createTextVNode(" Naar mijn portaal "),
                createVNode(_component_AppIcon, {
                  name: "chevron-right",
                  size: 16
                })
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<p class="footnote" data-v-cbb052ce> Servicecontract bij UPsol \xB7 Service door ${ssrInterpolate((_d = unref(partner)) == null ? void 0 : _d.name)}</p><!--]-->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/welkom/klaar.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const klaar = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-cbb052ce"]]);

export { klaar as default };
//# sourceMappingURL=klaar-CM7DWJ07.mjs.map
