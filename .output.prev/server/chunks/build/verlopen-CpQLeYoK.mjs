import { c as _export_sfc, d as useRoute, u as usePartner, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, computed, ref, mergeProps, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderAttr, ssrIncludeBooleanAttr } from 'vue/server-renderer';
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
  __name: "verlopen",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const { partner } = usePartner();
    const reason = computed(() => route.query.reason || "unknown");
    const reasonText = computed(() => {
      switch (reason.value) {
        case "expired":
          return "Deze welkomstlink is verlopen.";
        case "bad_signature":
          return "Deze welkomstlink is ongeldig.";
        case "malformed":
          return "De link in je e-mail is beschadigd.";
        case "missing":
          return "We hebben geen e-mailadres voor dit account.";
        case "generate":
          return "Het lukt nu even niet om je in te loggen.";
        default:
          return "Je welkomstlink werkt niet meer.";
      }
    });
    const resendEmail = ref("");
    const resendState = ref("idle");
    const resendError = ref("");
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "page",
        style: ((_a = unref(partner)) == null ? void 0 : _a.primary_color) ? `--brand: ${unref(partner).primary_color};` : ""
      }, _attrs))} data-v-87a81657><div class="card" data-v-87a81657><div class="icon-wrap" data-v-87a81657>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "clock",
        size: 32
      }, null, _parent));
      _push(`</div><h1 data-v-87a81657>Link verlopen</h1><p class="subtitle" data-v-87a81657>${ssrInterpolate(unref(reasonText))}</p><p class="hint" data-v-87a81657>Geen probleem. Vul je e-mailadres in en we sturen je direct een nieuwe.</p>`);
      if (unref(resendState) !== "sent") {
        _push(`<div class="resend" data-v-87a81657><input${ssrRenderAttr("value", unref(resendEmail))} type="email" placeholder="je@email.nl" class="input" autocomplete="email" data-v-87a81657><button class="btn"${ssrIncludeBooleanAttr(!unref(resendEmail) || unref(resendState) === "sending") ? " disabled" : ""} data-v-87a81657>`);
        if (unref(resendState) === "sending") {
          _push(`<span class="spinner" data-v-87a81657></span>`);
        } else {
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "send",
            size: 14
          }, null, _parent));
        }
        _push(` ${ssrInterpolate(unref(resendState) === "sending" ? "Versturen..." : "Stuur nieuwe link")}</button>`);
        if (unref(resendError)) {
          _push(`<p class="error" data-v-87a81657>${ssrInterpolate(unref(resendError))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="success" data-v-87a81657>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "check-circle",
          size: 20
        }, null, _parent));
        _push(`<div data-v-87a81657><p data-v-87a81657><strong data-v-87a81657>Verstuurd!</strong></p><p class="success-text" data-v-87a81657>Open je inbox van <strong data-v-87a81657>${ssrInterpolate(unref(resendEmail))}</strong>.</p></div></div>`);
      }
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/welkom/verlopen.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const verlopen = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-87a81657"]]);

export { verlopen as default };
//# sourceMappingURL=verlopen-CpQLeYoK.mjs.map
