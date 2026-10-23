import { defineComponent, computed, mergeProps, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderSlot } from 'vue/server-renderer';
import { u as usePartner, m as useHead } from './server.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "BrandedShell",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    useHead({
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" }
      ],
      style: [{
        innerHTML: computed(() => {
          var _a, _b;
          return `:root { --brand-primary: ${((_a = partner.value) == null ? void 0 : _a.primary_color) || "#1a56db"}; --brand-secondary: ${((_b = partner.value) == null ? void 0 : _b.secondary_color) || "#f3f4f6"}; }`;
        })
      }]
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "min-h-screen bg-gray-50" }, _attrs))}>`);
      ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/BrandedShell.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as _ };
//# sourceMappingURL=BrandedShell-BwN96rOe.mjs.map
