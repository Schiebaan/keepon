import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, withAsyncContext, computed, unref, mergeProps, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderStyle, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
import { c as _export_sfc, d as useRoute } from './server.mjs';
import { u as useFetch } from './fetch-C069USNx.mjs';
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

function renderTerms(template, placeholders) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return placeholders[key] || `[${key}]`;
  });
}
const DEFAULT_TERMS_TEMPLATE = `Servicevoorwaarden {{bedrijfsnaam}}

Laatst bijgewerkt: maart 2026

1. Algemeen

Deze servicevoorwaarden zijn van toepassing op alle servicecontracten afgesloten bij {{bedrijfsnaam}}, gevestigd te {{adres}}, ingeschreven bij de Kamer van Koophandel onder nummer {{kvk}}.

2. Definities

Serviceprovider: {{bedrijfsnaam}}, bereikbaar via {{email}} en {{telefoon}}.
Klant: de natuurlijke persoon die een servicecontract heeft afgesloten.
Installatie: het energiesysteem (zonnepanelen, warmtepomp en/of laadpaal) waarop het servicecontract betrekking heeft.

3. Servicecontract

3.1 Het servicecontract omvat monitoring, storingsanalyse en indien van toepassing proactief onderhoud van de installatie.
3.2 De exacte diensten zijn afhankelijk van het gekozen servicepakket (Start, Slim of Max).
3.3 {{bedrijfsnaam}} spant zich in om storingen binnen de afgesproken termijn te analyseren en op te lossen.

4. Tarieven buiten het contract

4.1 Werkzaamheden die buiten het servicecontract vallen worden gefactureerd tegen het geldende uurtarief van \u20AC {{uurtarief}} per uur (excl. btw).
4.2 Voor het bezoek aan locatie worden voorrijkosten berekend van \u20AC {{voorrijkosten}} (excl. btw).

5. Productvoorwaarden

Voor specifieke voorwaarden per product gelden de bijlagen hieronder (indien van toepassing op jouw installatie).

6. Looptijd en opzegging

6.1 Het servicecontract heeft een minimale looptijd zoals vermeld bij het afsluiten van het contract.
6.2 Na afloop van de minimale looptijd is het contract maandelijks opzegbaar met een opzegtermijn van 1 maand.
6.3 Opzegging kan via het klantportaal of per e-mail naar {{email}}.

7. Betaling

7.1 Betaling geschiedt maandelijks via automatische incasso.
7.2 Bij het uitblijven van betaling wordt de klant per e-mail herinnerd.

8. Contact

Voor vragen over deze voorwaarden:
{{bedrijfsnaam}} \xB7 {{adres}} \xB7 {{email}} \xB7 {{telefoon}} \xB7 KvK: {{kvk}}`;
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = route.params.slug;
    const { data: partner, error } = ([__temp, __restore] = withAsyncContext(() => useFetch(`/api/voorwaarden/${slug}`, "$bQsLyCJ1DS")), __temp = await __temp, __restore(), __temp);
    const placeholders = computed(() => {
      var _a, _b, _c, _d;
      const raw = ((_a = partner.value) == null ? void 0 : _a.terms_placeholders) || {};
      return {
        bedrijfsnaam: raw.bedrijfsnaam || ((_b = partner.value) == null ? void 0 : _b.name) || "",
        kvk: raw.kvk || "",
        adres: raw.adres || "",
        email: raw.email || ((_c = partner.value) == null ? void 0 : _c.support_email) || "",
        telefoon: raw.telefoon || ((_d = partner.value) == null ? void 0 : _d.support_phone) || "",
        uurtarief: raw.uurtarief || "\u2014",
        voorrijkosten: raw.voorrijkosten || "\u2014"
      };
    });
    const generalTerms = computed(() => {
      if (!partner.value) return "";
      const template = partner.value.terms_content || DEFAULT_TERMS_TEMPLATE;
      return renderTerms(template, placeholders.value);
    });
    const MODULE_META = [
      { key: "solar", label: "Zonnepanelen", appendix: "A" },
      { key: "heat_pump", label: "Warmtepomp", appendix: "B" },
      { key: "ev_charger", label: "Laadpaal", appendix: "C" },
      { key: "battery", label: "Batterij", appendix: "D" }
    ];
    const appendices = computed(() => {
      var _a, _b;
      const mods = ((_b = (_a = partner.value) == null ? void 0 : _a.terms_placeholders) == null ? void 0 : _b.module_terms) || {};
      return MODULE_META.map((m) => ({ ...m, content: (mods[m.key] || "").trim() })).filter((m) => m.content).map((m) => ({ ...m, rendered: renderTerms(m.content, placeholders.value) }));
    });
    function formatLines(text) {
      return text.split("\n").map((line) => ({
        text: line,
        bold: /^\d+\./.test(line.trim())
      }));
    }
    const generalLines = computed(() => formatLines(generalTerms.value));
    const partnerInitial = computed(() => {
      var _a, _b;
      return ((_b = (_a = partner.value) == null ? void 0 : _a.name) == null ? void 0 : _b.charAt(0).toUpperCase()) || "";
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      if (unref(error) || !unref(partner)) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "terms-page" }, _attrs))} data-v-5d9d9eb9><div class="terms-container" data-v-5d9d9eb9><div class="terms-error" data-v-5d9d9eb9><div class="terms-error__icon" data-v-5d9d9eb9>?</div><h1 class="terms-error__title" data-v-5d9d9eb9>Pagina niet gevonden</h1><p class="terms-error__text" data-v-5d9d9eb9> De voorwaardenpagina voor deze partner kon niet worden gevonden. Controleer of de URL correct is. </p>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/",
          class: "terms-error__link"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Terug naar de homepage`);
            } else {
              return [
                createTextVNode("Terug naar de homepage")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div></div>`);
      } else {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "terms-page" }, _attrs))} data-v-5d9d9eb9><div class="terms-container" data-v-5d9d9eb9><header class="terms-header" data-v-5d9d9eb9><div class="terms-header__brand" data-v-5d9d9eb9>`);
        if (unref(partner).logo_url) {
          _push(`<img${ssrRenderAttr("src", unref(partner).logo_url)}${ssrRenderAttr("alt", unref(partner).name)} class="terms-header__logo" data-v-5d9d9eb9>`);
        } else {
          _push(`<div class="terms-header__initial" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}" data-v-5d9d9eb9>${ssrInterpolate(unref(partnerInitial))}</div>`);
        }
        _push(`<span class="terms-header__name" data-v-5d9d9eb9>${ssrInterpolate(unref(partner).name)}</span></div></header><h1 class="terms-title" data-v-5d9d9eb9>Servicevoorwaarden</h1><div class="terms-body" data-v-5d9d9eb9><!--[-->`);
        ssrRenderList(unref(generalLines), (line, idx) => {
          _push(`<!--[-->`);
          if (line.bold) {
            _push(`<span class="terms-line terms-line--bold" data-v-5d9d9eb9>${ssrInterpolate(line.text)}<br data-v-5d9d9eb9></span>`);
          } else {
            _push(`<span class="terms-line" data-v-5d9d9eb9>${ssrInterpolate(line.text)}<br data-v-5d9d9eb9></span>`);
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]--></div>`);
        if (unref(appendices).length) {
          _push(`<!--[--><hr class="terms-divider" data-v-5d9d9eb9><!--[-->`);
          ssrRenderList(unref(appendices), (app) => {
            _push(`<section${ssrRenderAttr("id", `bijlage-${app.key}`)} class="terms-appendix" data-v-5d9d9eb9><p class="terms-appendix__label" data-v-5d9d9eb9>Bijlage ${ssrInterpolate(app.appendix)}</p><h2 class="terms-appendix__title" data-v-5d9d9eb9>Aanvullende voorwaarden \u2014 ${ssrInterpolate(app.label)}</h2><div class="terms-body" data-v-5d9d9eb9><!--[-->`);
            ssrRenderList(formatLines(app.rendered), (line, idx) => {
              _push(`<!--[-->`);
              if (line.bold) {
                _push(`<span class="terms-line terms-line--bold" data-v-5d9d9eb9>${ssrInterpolate(line.text)}<br data-v-5d9d9eb9></span>`);
              } else {
                _push(`<span class="terms-line" data-v-5d9d9eb9>${ssrInterpolate(line.text)}<br data-v-5d9d9eb9></span>`);
              }
              _push(`<!--]-->`);
            });
            _push(`<!--]--></div></section>`);
          });
          _push(`<!--]--><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`<footer class="terms-footer" data-v-5d9d9eb9>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant",
          class: "terms-footer__link",
          style: { color: unref(partner).primary_color }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` \u2190 Terug naar portaal `);
            } else {
              return [
                createTextVNode(" \u2190 Terug naar portaal ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</footer></div></div>`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/voorwaarden/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-5d9d9eb9"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-Oo3W3Zvj.mjs.map
