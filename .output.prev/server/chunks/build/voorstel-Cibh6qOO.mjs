import { c as _export_sfc, _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, computed, ref, watch, mergeProps, unref, withCtx, createTextVNode, createVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderClass, ssrRenderComponent, ssrRenderList, ssrRenderStyle, ssrIncludeBooleanAttr, ssrLooseContain } from 'vue/server-renderer';
import { I as INCASSANT } from '../_/incassant.mjs';
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
  __name: "voorstel",
  __ssrInlineRender: true,
  setup(__props) {
    const { state, isLoading, formatPrice } = useOnboarding();
    const partner = computed(() => {
      var _a;
      return (_a = state.value) == null ? void 0 : _a.partner;
    });
    const firstName = computed(() => {
      var _a, _b;
      return ((_b = (_a = state.value) == null ? void 0 : _a.customer) == null ? void 0 : _b.first_name) || "";
    });
    const addressShort = computed(() => {
      var _a, _b;
      return ((_b = (_a = state.value) == null ? void 0 : _a.customer) == null ? void 0 : _b.address_short) || null;
    });
    const proposal = computed(() => {
      var _a;
      return (_a = state.value) == null ? void 0 : _a.proposal;
    });
    const allModules = computed(() => {
      var _a;
      return ((_a = proposal.value) == null ? void 0 : _a.modules) || [];
    });
    const alreadyAccepted = computed(() => {
      var _a;
      return !!((_a = state.value) == null ? void 0 : _a.accepted_at);
    });
    const mandateSet = computed(() => {
      var _a;
      return !!((_a = state.value) == null ? void 0 : _a.mandate_at);
    });
    const selectedModules = ref(/* @__PURE__ */ new Set());
    function syncDefaults() {
      var _a;
      if (!allModules.value.length) return;
      const next = /* @__PURE__ */ new Set();
      const prev = (_a = state.value) == null ? void 0 : _a.accepted_modules;
      if (Array.isArray(prev) && prev.length) {
        for (const m of prev) next.add(m);
      } else {
        for (const m of allModules.value) next.add(m.module);
      }
      selectedModules.value = next;
    }
    watch([allModules, alreadyAccepted], syncDefaults, { immediate: true });
    function isSelected(module) {
      return selectedModules.value.has(module);
    }
    const selectedTotalMonthly = computed(
      () => allModules.value.filter((m) => isSelected(m.module)).reduce((s, m) => {
        var _a;
        return s + (((_a = m.price) == null ? void 0 : _a.monthly_cents) || 0);
      }, 0)
    );
    const selectedTotalYearly = computed(
      () => allModules.value.filter((m) => isSelected(m.module)).reduce((s, m) => {
        var _a;
        return s + (((_a = m.price) == null ? void 0 : _a.yearly_cents) || 0);
      }, 0)
    );
    const selectedCount = computed(() => selectedModules.value.size);
    const billingInterval = ref("monthly");
    const yearlyDiscountMonths = computed(() => {
      var _a, _b;
      return ((_b = (_a = state.value) == null ? void 0 : _a.proposal) == null ? void 0 : _b.yearly_discount_months) || 0;
    });
    const showYearlyOption = computed(() => yearlyDiscountMonths.value > 0);
    const trialMonths = computed(() => {
      var _a, _b;
      return ((_b = (_a = state.value) == null ? void 0 : _a.proposal) == null ? void 0 : _b.trial_months) || 0;
    });
    watch(() => {
      var _a, _b;
      return (_b = (_a = state.value) == null ? void 0 : _a.proposal) == null ? void 0 : _b.billing_interval;
    }, (v) => {
      if (v === "yearly" || v === "monthly") billingInterval.value = v;
    }, { immediate: true });
    computed(
      () => billingInterval.value === "yearly" ? selectedTotalYearly.value : selectedTotalMonthly.value
    );
    const yearlySavingsCents = computed(
      () => Math.max(0, selectedTotalMonthly.value * 12 - selectedTotalYearly.value)
    );
    const accepting = ref(false);
    const acceptError = ref("");
    const consentChecked = ref(false);
    watch(alreadyAccepted, (v) => {
      if (v) consentChecked.value = true;
    }, { immediate: true });
    ref(null);
    const MODULE_LABEL = {
      solar: "Zonnepanelen",
      heat_pump: "Warmtepomp",
      ev_charger: "Laadpaal",
      battery: "Thuisbatterij"
    };
    const MODULE_ICON = {
      solar: "solar",
      heat_pump: "heat-pump",
      ev_charger: "ev-charger",
      battery: "battery"
    };
    const MODULE_THEME = {
      solar: {
        bg: "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)",
        iconBg: "linear-gradient(135deg, #f59e0b, #d97706)",
        iconColor: "#fff",
        chip: "rgba(255,255,255,0.7)",
        chipText: "#92400e",
        ring: "#f59e0b"
      },
      heat_pump: {
        bg: "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
        iconBg: "linear-gradient(135deg, #f43f5e, #e11d48)",
        iconColor: "#fff",
        chip: "rgba(255,255,255,0.7)",
        chipText: "#9f1239",
        ring: "#f43f5e"
      },
      ev_charger: {
        bg: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
        iconBg: "linear-gradient(135deg, #0ea5e9, #0284c7)",
        iconColor: "#fff",
        chip: "rgba(255,255,255,0.7)",
        chipText: "#075985",
        ring: "#0ea5e9"
      },
      battery: {
        bg: "linear-gradient(135deg, #faf5ff 0%, #ede9fe 100%)",
        iconBg: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
        iconColor: "#fff",
        chip: "rgba(255,255,255,0.7)",
        chipText: "#5b21b6",
        ring: "#8b5cf6"
      }
    };
    const MODULE_STORY = {
      solar: {
        headline: "Maximaal halen uit jouw panelen",
        story: "Je panelen liggen er al. Wij volgen live wat ze opleveren en geven je een seintje als de opbrengst tegenvalt.",
        bullets: ["Live opbrengst", "Seintje bij storing", "Voorrang bij service"]
      },
      heat_pump: {
        headline: "Warmte zonder zorgen",
        story: "Een warmtepomp die het laat afweten op de koudste dag, daar zit niemand op te wachten. Wij houden hem 24/7 voor je in de gaten.",
        bullets: ["COP en temperatuur live", "Vroege signalering bij uitval", "Voorrang bij spoed"]
      },
      ev_charger: {
        headline: "Slim laden, geen verrassingen",
        story: "Wat kost een laadsessie, en hoeveel daarvan komt van je eigen panelen? Je krijgt het complete overzicht en storingen zien we direct.",
        bullets: ["Sessies en kosten", "Eigen zon zichtbaar", "Hulp bij storingen"]
      },
      battery: {
        headline: "Jouw stroom, op het juiste moment",
        story: "Een thuisbatterij verdient zichzelf alleen terug als hij slim laadt en ontlaadt. Wij houden cycli en gezondheid in de gaten, zodat hij zo lang mogelijk meegaat.",
        bullets: ["Gezondheid in beeld", "Slim laadadvies", "Continu monitoren"]
      }
    };
    const faqs = [
      { q: "Waarom ontvang ik dit?", a: () => {
        var _a;
        return `Omdat ${((_a = partner.value) == null ? void 0 : _a.name) || "je installateur"} jouw installaties heeft geleverd of beheert.`;
      } },
      { q: "Is dit verplicht?", a: () => "Nee, je kiest zelf of je de service activeert. Zonder akkoord gebeurt er niets." },
      { q: "Kan ik later opzeggen?", a: () => "Ja, na de minimale looptijd is het maandelijks opzegbaar." },
      { q: "Wanneer wordt er betaald?", a: () => "Pas vanaf de volgende maand. Eerst regelen we de incasso, dat doe je in de volgende stap." },
      { q: "Bij wie kom ik terecht?", a: () => {
        var _a;
        return `Voor service en vragen: ${((_a = partner.value) == null ? void 0 : _a.name) || "je installateur"}.`;
      } }
    ];
    const openFaq = ref(null);
    const installLine = computed(() => {
      const c = selectedCount.value;
      if (c === 0) {
        return addressShort.value ? `Jouw installaties op ${addressShort.value}` : "Jouw installaties";
      }
      const noun = c === 1 ? "installatie" : "installaties";
      if (addressShort.value) return `${c} ${noun} op ${addressShort.value}`;
      return `${c} ${noun}`;
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j;
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "page",
        style: ((_a = unref(partner)) == null ? void 0 : _a.primary_color) ? `--brand: ${unref(partner).primary_color};` : ""
      }, _attrs))} data-v-e78f4686><div class="bg-gradient" aria-hidden="true" data-v-e78f4686></div><div class="container" data-v-e78f4686><header class="topbar" data-v-e78f4686><div class="brand" data-v-e78f4686>`);
      if ((_b = unref(partner)) == null ? void 0 : _b.logo_url) {
        _push(`<img${ssrRenderAttr("src", unref(partner).logo_url)} alt="" aria-hidden="true" class="logo" data-v-e78f4686>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<span class="brand-name" data-v-e78f4686>${ssrInterpolate((_c = unref(partner)) == null ? void 0 : _c.name)}</span></div><div class="step-dots"${ssrRenderAttr("aria-label", unref(alreadyAccepted) ? "Stap 2 van 2: portaal" : "Stap 1 van 2: voorstel")} data-v-e78f4686><span class="${ssrRenderClass([{ active: !unref(alreadyAccepted), done: unref(alreadyAccepted) }, "dot"])}" data-v-e78f4686></span><span class="${ssrRenderClass([{ active: unref(alreadyAccepted) }, "dot"])}" data-v-e78f4686></span></div></header>`);
      if (unref(isLoading) && !unref(state)) {
        _push(`<div class="loading" data-v-e78f4686><div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-e78f4686></div></div>`);
      } else {
        _push(`<!--[--><section class="hero" data-v-e78f4686><p class="eyebrow" data-v-e78f4686>Persoonlijk voor ${ssrInterpolate(unref(firstName) || "jou")}</p><h1 class="hero-title" data-v-e78f4686>${ssrInterpolate(unref(firstName) ? `Hoi ${unref(firstName)},` : "Hallo,")}<br data-v-e78f4686> zo regelen we de service voor jouw installaties. </h1>`);
        if (unref(addressShort)) {
          _push(`<p class="hero-address" data-v-e78f4686>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "map-pin",
            size: 14
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(addressShort))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="hero-sub" data-v-e78f4686>${ssrInterpolate((_d = unref(partner)) == null ? void 0 : _d.name)} heeft een service-voorstel klaargezet voor jouw installaties. Activeer met \xE9\xE9n klik. Geen gedoe, geen verrassingen. </p>`);
        if (unref(alreadyAccepted)) {
          _push(`<div class="akkoord-block" data-v-e78f4686><div class="akkoord-check" data-v-e78f4686>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 32
          }, null, _parent));
          _push(`</div><p class="akkoord-eyebrow" data-v-e78f4686>Akkoord ontvangen</p><h1 class="akkoord-title" data-v-e78f4686>${ssrInterpolate(unref(firstName) ? `Bedankt ${unref(firstName)}.` : "Bedankt.")}</h1><p class="akkoord-text" data-v-e78f4686> Je service is actief vanaf vandaag. Je portaal staat klaar. </p>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant",
            class: "btn-primary akkoord-cta"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Open mijn portaal `);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 16
                }, null, _parent2, _scopeId));
              } else {
                return [
                  createTextVNode(" Open mijn portaal "),
                  createVNode(_component_AppIcon, {
                    name: "chevron-right",
                    size: 16
                  })
                ];
              }
            }),
            _: 1
          }, _parent));
          if (!unref(mandateSet)) {
            _push(`<p class="incasso-hint" data-v-e78f4686> De betaling regelen we daarna. `);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/welkom/incasso",
              class: "incasso-link"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`Incasso nu instellen`);
                } else {
                  return [
                    createTextVNode("Incasso nu instellen")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(` of later via je portaal. </p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!--[--><div class="hero-actions" data-v-e78f4686><button class="btn-primary" data-v-e78f4686> Activeer mijn service `);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "chevron-right",
            size: 16
          }, null, _parent));
          _push(`</button></div>`);
          if (unref(selectedTotalMonthly) > 0) {
            _push(`<p class="hero-price-hint" data-v-e78f4686><strong data-v-e78f4686>\u20AC ${ssrInterpolate(unref(formatPrice)(unref(selectedTotalMonthly)))}</strong> per maand voor ${ssrInterpolate(unref(installLine))}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<ul class="reassurance" data-v-e78f4686><li data-v-e78f4686><span class="check" data-v-e78f4686>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 10
          }, null, _parent));
          _push(`</span> Direct actief</li><li data-v-e78f4686><span class="check" data-v-e78f4686>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 10
          }, null, _parent));
          _push(`</span> Geen verrassingen</li><li data-v-e78f4686><span class="check" data-v-e78f4686>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 10
          }, null, _parent));
          _push(`</span> Stop wanneer je wil</li></ul><!--]-->`);
        }
        _push(`</section>`);
        if (unref(allModules).length) {
          _push(`<section class="modules" data-v-e78f4686><div class="section-head" data-v-e78f4686><p class="section-eyebrow" data-v-e78f4686>Voor jou klaargezet</p><h2 class="section-title" data-v-e78f4686>${ssrInterpolate(unref(installLine))}</h2>`);
          if (!unref(alreadyAccepted)) {
            _push(`<p class="section-sub" data-v-e78f4686> Wil je niet alles? Vink uit wat je niet hoeft. De prijs past zich aan. </p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><!--[-->`);
          ssrRenderList(unref(allModules), (m) => {
            var _a2, _b2, _c2, _d2, _e2, _f2, _g2, _h2, _i2, _j2;
            _push(`<article class="${ssrRenderClass([{ unselected: !isSelected(m.module), locked: unref(alreadyAccepted) }, "module-hero"])}" style="${ssrRenderStyle({ background: (_a2 = MODULE_THEME[m.module]) == null ? void 0 : _a2.bg })}"${ssrRenderAttr("tabindex", unref(alreadyAccepted) ? -1 : 0)}${ssrRenderAttr("role", unref(alreadyAccepted) ? void 0 : "checkbox")}${ssrRenderAttr("aria-checked", unref(alreadyAccepted) ? void 0 : isSelected(m.module))}${ssrRenderAttr("aria-label", unref(alreadyAccepted) ? void 0 : `${MODULE_LABEL[m.module]} ${isSelected(m.module) ? "geselecteerd" : "niet geselecteerd"}, druk op enter om te wisselen`)} data-v-e78f4686>`);
            if (!unref(alreadyAccepted)) {
              _push(`<div class="${ssrRenderClass([{ on: isSelected(m.module) }, "toggle"])}" style="${ssrRenderStyle(isSelected(m.module) ? { background: (_b2 = MODULE_THEME[m.module]) == null ? void 0 : _b2.ring, borderColor: (_c2 = MODULE_THEME[m.module]) == null ? void 0 : _c2.ring } : {})}" aria-hidden="true" data-v-e78f4686>`);
              if (isSelected(m.module)) {
                _push(ssrRenderComponent(_component_AppIcon, {
                  name: "check",
                  size: 14
                }, null, _parent));
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            } else {
              _push(`<div class="active-badge" style="${ssrRenderStyle({ background: (_d2 = MODULE_THEME[m.module]) == null ? void 0 : _d2.ring, color: "white" })}" aria-hidden="true" data-v-e78f4686>`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "check",
                size: 12
              }, null, _parent));
              _push(` Actief </div>`);
            }
            _push(`<div class="module-icon-large" style="${ssrRenderStyle({ background: (_e2 = MODULE_THEME[m.module]) == null ? void 0 : _e2.iconBg, color: (_f2 = MODULE_THEME[m.module]) == null ? void 0 : _f2.iconColor })}" data-v-e78f4686>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: MODULE_ICON[m.module] || "puzzle",
              size: 28
            }, null, _parent));
            _push(`</div><div class="module-content" data-v-e78f4686><p class="module-tag" style="${ssrRenderStyle({ color: (_g2 = MODULE_THEME[m.module]) == null ? void 0 : _g2.chipText })}" data-v-e78f4686>${ssrInterpolate(MODULE_LABEL[m.module])}</p><h3 class="module-headline" data-v-e78f4686>${ssrInterpolate((_h2 = MODULE_STORY[m.module]) == null ? void 0 : _h2.headline)}</h3><p class="module-story" data-v-e78f4686>${ssrInterpolate((_i2 = MODULE_STORY[m.module]) == null ? void 0 : _i2.story)}</p><div class="module-chips" data-v-e78f4686><!--[-->`);
            ssrRenderList(((_j2 = MODULE_STORY[m.module]) == null ? void 0 : _j2.bullets) || [], (b) => {
              var _a3, _b3;
              _push(`<span class="chip" style="${ssrRenderStyle({ background: (_a3 = MODULE_THEME[m.module]) == null ? void 0 : _a3.chip, color: (_b3 = MODULE_THEME[m.module]) == null ? void 0 : _b3.chipText })}" data-v-e78f4686>${ssrInterpolate(b)}</span>`);
            });
            _push(`<!--]--></div>`);
            if (m.price) {
              _push(`<div class="module-price-row" data-v-e78f4686><div class="price-tag" data-v-e78f4686><span class="price-amount" data-v-e78f4686>\u20AC ${ssrInterpolate(unref(formatPrice)(m.price.monthly_cents))}</span><span class="price-unit" data-v-e78f4686>per maand</span></div>`);
              if (!isSelected(m.module)) {
                _push(`<span class="off-label" data-v-e78f4686>Niet actief</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></article>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<section class="card-block empty" data-v-e78f4686>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "puzzle",
            size: 32,
            class: "text-gray-300 mx-auto"
          }, null, _parent));
          _push(`<p data-v-e78f4686> Er staan nog geen installaties klaar bij ons. `);
          if ((_e = unref(partner)) == null ? void 0 : _e.support_email) {
            _push(`<!--[--> Mail <a${ssrRenderAttr("href", `mailto:${unref(partner).support_email}`)} data-v-e78f4686>${ssrInterpolate(unref(partner).support_email)}</a> en we zetten dit voor je recht. <!--]-->`);
          } else {
            _push(`<!--[--> Neem contact op met ${ssrInterpolate((_f = unref(partner)) == null ? void 0 : _f.name)} om je voorstel compleet te maken. <!--]-->`);
          }
          _push(`</p></section>`);
        }
        if (!unref(alreadyAccepted)) {
          _push(`<section class="activate-block" data-v-e78f4686><div class="activate-inner" data-v-e78f4686><p class="activate-eyebrow" data-v-e78f4686>Klaar voor activatie</p><h2 class="activate-title" data-v-e78f4686>Activeer in \xE9\xE9n klik</h2>`);
          if (unref(showYearlyOption)) {
            _push(`<div class="interval-toggle" role="radiogroup" aria-label="Betaaltermijn" data-v-e78f4686><button type="button" class="${ssrRenderClass([{ active: unref(billingInterval) === "monthly" }, "interval-option"])}" role="radio"${ssrRenderAttr("aria-checked", unref(billingInterval) === "monthly")} data-v-e78f4686><span class="interval-option-label" data-v-e78f4686>Per maand</span><span class="interval-option-amount" data-v-e78f4686>\u20AC ${ssrInterpolate(unref(formatPrice)(unref(selectedTotalMonthly)))}</span></button><button type="button" class="${ssrRenderClass([{ active: unref(billingInterval) === "yearly" }, "interval-option"])}" role="radio"${ssrRenderAttr("aria-checked", unref(billingInterval) === "yearly")} data-v-e78f4686><span class="interval-option-badge" data-v-e78f4686> Bespaar \u20AC ${ssrInterpolate(unref(formatPrice)(unref(yearlySavingsCents)))}</span><span class="interval-option-label" data-v-e78f4686>Per jaar</span><span class="interval-option-amount" data-v-e78f4686>\u20AC ${ssrInterpolate(unref(formatPrice)(unref(selectedTotalYearly)))}</span></button></div>`);
          } else {
            _push(`<div class="price-summary" data-v-e78f4686><span class="price-summary-label" data-v-e78f4686>Jouw maandbedrag</span><span class="price-summary-amount" data-v-e78f4686>\u20AC ${ssrInterpolate(unref(formatPrice)(unref(selectedTotalMonthly)))}</span></div>`);
          }
          if (unref(trialMonths) > 0) {
            _push(`<p class="trial-callout" data-v-e78f4686>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 14
            }, null, _parent));
            _push(` Eerste ${ssrInterpolate(unref(trialMonths) === 1 ? "maand" : `${unref(trialMonths)} maanden`)} gratis na het instellen van de incasso. </p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<p class="activate-text" data-v-e78f4686> Vandaag akkoord, vandaag actief. De betaling regelen we daarna. </p><label class="consent" data-v-e78f4686><input${ssrIncludeBooleanAttr(Array.isArray(unref(consentChecked)) ? ssrLooseContain(unref(consentChecked), null) : unref(consentChecked)) ? " checked" : ""} type="checkbox"${ssrIncludeBooleanAttr(unref(selectedCount) === 0) ? " disabled" : ""} data-v-e78f4686><span data-v-e78f4686> Ik ga akkoord met de prijs en de <a${ssrRenderAttr("href", ((_g = unref(partner)) == null ? void 0 : _g.terms_url) || "#")} target="_blank" rel="noopener" data-v-e78f4686>servicevoorwaarden</a>. </span></label>`);
          if (unref(acceptError)) {
            _push(`<p class="error" role="alert" aria-live="assertive" data-v-e78f4686>${ssrInterpolate(unref(acceptError))}</p>`);
          } else if (unref(selectedCount) === 0) {
            _push(`<p class="soft-hint" aria-live="polite" data-v-e78f4686>Kies minstens \xE9\xE9n onderdeel om te activeren.</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="btn-cta"${ssrIncludeBooleanAttr(!unref(consentChecked) || unref(accepting) || unref(selectedCount) === 0) ? " disabled" : ""} data-v-e78f4686>`);
          if (unref(accepting)) {
            _push(`<span class="spinner" data-v-e78f4686></span>`);
          } else {
            _push(`<!--[-->`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "zap",
              size: 18
            }, null, _parent));
            _push(` Activeer mijn service <!--]-->`);
          }
          _push(`</button>`);
          if ((_h = unref(partner)) == null ? void 0 : _h.support_email) {
            _push(`<button class="btn-link" data-v-e78f4686> Liever eerst overleggen met ${ssrInterpolate((_i = unref(partner)) == null ? void 0 : _i.name)}? </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="faq-block" data-v-e78f4686><h2 class="faq-title" data-v-e78f4686>Vragen?</h2><ul class="faq" data-v-e78f4686><!--[-->`);
        ssrRenderList(faqs, (item, i) => {
          _push(`<li class="${ssrRenderClass({ open: unref(openFaq) === i })}" data-v-e78f4686><button class="faq-q" data-v-e78f4686>${ssrInterpolate(item.q)} `);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "chevron-down",
            size: 14,
            class: { "rotate-180": unref(openFaq) === i }
          }, null, _parent));
          _push(`</button>`);
          if (unref(openFaq) === i) {
            _push(`<p class="faq-a" data-v-e78f4686>${ssrInterpolate(item.a())}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</li>`);
        });
        _push(`<!--]--></ul></section>`);
        if (!unref(alreadyAccepted)) {
          _push(`<div class="final-cta" data-v-e78f4686><button class="btn-cta btn-cta-final" data-v-e78f4686>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "zap",
            size: 18
          }, null, _parent));
          _push(` Activeer mijn service </button><p class="final-trust" data-v-e78f4686>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "shield",
            size: 12
          }, null, _parent));
          _push(` Niets gebeurt zonder jouw akkoord </p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<p class="legal" data-v-e78f4686> Service door <strong data-v-e78f4686>${ssrInterpolate((_j = unref(partner)) == null ? void 0 : _j.name)}</strong>. Contractuele afhandeling en incasso via ${ssrInterpolate(unref(INCASSANT))}. </p><!--]-->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/welkom/voorstel.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const voorstel = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-e78f4686"]]);

export { voorstel as default };
//# sourceMappingURL=voorstel-Cibh6qOO.mjs.map
