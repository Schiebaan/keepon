import { defineComponent, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderList, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "integrations",
  __ssrInlineRender: true,
  setup(__props) {
    const integrations = [
      {
        type: "sundata",
        name: "Sundata",
        description: "Monitoring van zonnepanelen via Sundata API",
        fields: ["api_email", "api_password"]
      },
      {
        type: "weheat",
        name: "Weheat",
        description: "Monitoring van warmtepompen via Weheat API",
        fields: ["client_id", "client_secret"]
      },
      {
        type: "easee",
        name: "Easee",
        description: "Monitoring van laadpalen via Easee API",
        fields: ["username", "password"]
      },
      {
        type: "mollie",
        name: "Mollie",
        description: "Betalingen via Mollie",
        fields: ["api_key"]
      }
    ];
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}><h1 class="mb-6 text-2xl font-bold text-gray-900">Integraties</h1><p class="mb-6 text-sm text-gray-500"> Overzicht van beschikbare integraties. Credentials worden per partner geconfigureerd. </p><div class="grid gap-4 sm:grid-cols-2"><!--[-->`);
      ssrRenderList(integrations, (integration) => {
        _push(`<div class="card"><h3 class="font-semibold text-gray-900">${ssrInterpolate(integration.name)}</h3><p class="mt-1 text-sm text-gray-500">${ssrInterpolate(integration.description)}</p><div class="mt-3"><p class="text-xs font-medium text-gray-400">Benodigde velden:</p><div class="mt-1 flex flex-wrap gap-1"><!--[-->`);
        ssrRenderList(integration.fields, (field) => {
          _push(`<span class="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">${ssrInterpolate(field)}</span>`);
        });
        _push(`<!--]--></div></div></div>`);
      });
      _push(`<!--]--></div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/platform/integrations.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=integrations-CDby-d2N.mjs.map
