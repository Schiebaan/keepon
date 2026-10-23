import { c as _export_sfc, l as useAuth, u as usePartner, _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
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
  __name: "callback",
  __ssrInlineRender: true,
  setup(__props) {
    const { resolveRole } = useAuth();
    const { partner } = usePartner();
    const status = ref("loading");
    const errorMessage = ref("");
    const loadingText = ref("Voorstel wordt geladen...");
    const resendEmail = ref("");
    const resendState = ref("idle");
    const resendError = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "page",
        style: ((_a = unref(partner)) == null ? void 0 : _a.primary_color) ? `--brand: ${unref(partner).primary_color};` : ""
      }, _attrs))} data-v-b5ca0123><div class="card" data-v-b5ca0123>`);
      if (unref(status) === "loading") {
        _push(`<!--[--><div class="spinner" data-v-b5ca0123></div><p class="loading-text" data-v-b5ca0123>${ssrInterpolate(unref(loadingText))}</p><!--]-->`);
      } else if (unref(status) === "expired") {
        _push(`<!--[--><div class="icon-wrap icon-amber" data-v-b5ca0123>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "clock",
          size: 32
        }, null, _parent));
        _push(`</div><h1 data-v-b5ca0123>Link verlopen</h1><p class="subtitle" data-v-b5ca0123>${ssrInterpolate(unref(errorMessage))}</p><p class="hint" data-v-b5ca0123>Geen probleem. Vul je e-mailadres in en we sturen je direct een nieuwe.</p>`);
        if (unref(resendState) !== "sent") {
          _push(`<div class="resend-form" data-v-b5ca0123><input${ssrRenderAttr("value", unref(resendEmail))} type="email" placeholder="je@email.nl" class="input" autocomplete="email" data-v-b5ca0123><button class="btn-primary"${ssrIncludeBooleanAttr(!unref(resendEmail) || unref(resendState) === "sending") ? " disabled" : ""} data-v-b5ca0123>`);
          if (unref(resendState) === "sending") {
            _push(`<span class="btn-spinner" data-v-b5ca0123></span>`);
          } else {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "send",
              size: 14
            }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(resendState) === "sending" ? "Versturen..." : "Stuur nieuwe link")}</button>`);
          if (unref(resendError)) {
            _push(`<p class="error" data-v-b5ca0123>${ssrInterpolate(unref(resendError))}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<div class="success" data-v-b5ca0123>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check-circle",
            size: 20
          }, null, _parent));
          _push(`<div data-v-b5ca0123><p data-v-b5ca0123><strong data-v-b5ca0123>Verstuurd!</strong></p><p class="success-text" data-v-b5ca0123>Open je inbox van <strong data-v-b5ca0123>${ssrInterpolate(unref(resendEmail))}</strong> en klik op de nieuwe knop.</p></div></div>`);
        }
        _push(`<!--]-->`);
      } else {
        _push(`<!--[--><div class="icon-wrap icon-red" data-v-b5ca0123>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "alert-circle",
          size: 32
        }, null, _parent));
        _push(`</div><h1 data-v-b5ca0123>Inloggen niet gelukt</h1><p class="subtitle" data-v-b5ca0123>${ssrInterpolate(unref(errorMessage))}</p>`);
        if (unref(resendState) !== "sent") {
          _push(`<div class="resend-form" data-v-b5ca0123><input${ssrRenderAttr("value", unref(resendEmail))} type="email" placeholder="je@email.nl" class="input" autocomplete="email" data-v-b5ca0123><button class="btn-primary"${ssrIncludeBooleanAttr(!unref(resendEmail) || unref(resendState) === "sending") ? " disabled" : ""} data-v-b5ca0123>`);
          if (unref(resendState) === "sending") {
            _push(`<span class="btn-spinner" data-v-b5ca0123></span>`);
          } else {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "send",
              size: 14
            }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(resendState) === "sending" ? "Versturen..." : "Stuur nieuwe link")}</button>`);
          if (unref(resendError)) {
            _push(`<p class="error" data-v-b5ca0123>${ssrInterpolate(unref(resendError))}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<div class="success" data-v-b5ca0123>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check-circle",
            size: 20
          }, null, _parent));
          _push(`<div data-v-b5ca0123><p data-v-b5ca0123><strong data-v-b5ca0123>Verstuurd!</strong></p><p class="success-text" data-v-b5ca0123>Open je inbox van <strong data-v-b5ca0123>${ssrInterpolate(unref(resendEmail))}</strong>.</p></div></div>`);
        }
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/login",
          class: "link-secondary"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Of: log in met je wachtwoord`);
            } else {
              return [
                createTextVNode("Of: log in met je wachtwoord")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<!--]-->`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/auth/callback.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const callback = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-b5ca0123"]]);

export { callback as default };
//# sourceMappingURL=callback-B7vSnErU.mjs.map
