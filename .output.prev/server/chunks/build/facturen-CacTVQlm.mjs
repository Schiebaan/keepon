import { _ as _sfc_main$5 } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, unref, withCtx, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderClass, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'vue/server-renderer';
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
  __name: "facturen",
  __ssrInlineRender: true,
  setup(__props) {
    const loading = ref(true);
    const error = ref("");
    const rows = ref([]);
    const mandateInfo = ref(null);
    function euros(cents) {
      return "\u20AC " + (cents / 100).toFixed(2).replace(".", ",");
    }
    function fmtDate(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
      } catch {
        return "";
      }
    }
    function statusLabel(status) {
      switch (status) {
        case "paid":
          return { label: "Betaald", cls: "bg-green-50 text-green-700 border-green-200" };
        case "open":
        case "pending":
        case "authorized":
          return { label: "In behandeling", cls: "bg-amber-50 text-amber-700 border-amber-200" };
        case "failed":
          return { label: "Mislukt", cls: "bg-red-50 text-red-700 border-red-200" };
        case "expired":
        case "canceled":
          return { label: "Verlopen", cls: "bg-gray-100 text-gray-700 border-gray-200" };
        case "chargeback":
          return { label: "Storno", cls: "bg-red-50 text-red-800 border-red-200" };
        default:
          return { label: status, cls: "bg-gray-100 text-gray-700 border-gray-200" };
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">Facturen</h1><p class="mt-1 text-sm text-gray-500">Overzicht van je facturen en automatische incasso&#39;s.</p></div>`);
      if (!unref(loading) && unref(mandateInfo)) {
        _push(`<div class="${ssrRenderClass([{
          "border-green-200 bg-green-50": unref(mandateInfo).mandate_active,
          "border-amber-200 bg-amber-50": !unref(mandateInfo).mandate_active && unref(mandateInfo).mandate_at && !unref(mandateInfo).mandate_skipped,
          "border-gray-200 bg-gray-50": unref(mandateInfo).mandate_skipped
        }, "card mb-6 flex items-start gap-3"])}">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(mandateInfo).mandate_active ? "check-circle" : unref(mandateInfo).mandate_skipped ? "clock" : "clock",
          size: 18,
          class: ["mt-0.5 shrink-0", {
            "text-green-600": unref(mandateInfo).mandate_active,
            "text-amber-600": !unref(mandateInfo).mandate_active && unref(mandateInfo).mandate_at && !unref(mandateInfo).mandate_skipped,
            "text-gray-400": unref(mandateInfo).mandate_skipped
          }]
        }, null, _parent));
        _push(`<div class="min-w-0">`);
        if (unref(mandateInfo).mandate_active) {
          _push(`<!--[--><p class="text-sm font-medium text-green-900">Automatische incasso is actief</p><p class="text-xs text-green-800/80 mt-0.5">Maandelijkse servicekosten worden automatisch van je rekening afgeschreven.</p><!--]-->`);
        } else if (unref(mandateInfo).mandate_at && !unref(mandateInfo).mandate_skipped) {
          _push(`<!--[--><p class="text-sm font-medium text-amber-900">Mandaat wordt bevestigd</p><p class="text-xs text-amber-800/80 mt-0.5">We wachten op bevestiging van je bank. Dit duurt meestal enkele seconden tot een paar minuten.</p><!--]-->`);
        } else if (unref(mandateInfo).mandate_skipped) {
          _push(`<!--[--><p class="text-sm font-medium text-gray-700">Incasso nog niet geregeld</p><p class="text-xs text-gray-600 mt-0.5">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/welkom/incasso",
            class: "underline hover:text-gray-900"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`Regel automatische incasso`);
              } else {
                return [
                  createTextVNode("Regel automatische incasso")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(` zodat we maandfacturen direct kunnen verwerken. </p><!--]-->`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(loading)) {
        _push(`<div class="py-12 text-center"><div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"></div></div>`);
      } else if (unref(error)) {
        _push(`<div class="card border-red-200 bg-red-50 text-sm text-red-800" role="alert">${ssrInterpolate(unref(error))}</div>`);
      } else if (unref(rows).length === 0) {
        _push(`<div class="section py-12 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "credit-card",
          size: 40,
          class: "mx-auto text-gray-300 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2">Nog geen facturen</h2><p class="text-sm text-gray-500 max-w-sm mx-auto"> Zodra je eerste maandfactuur is aangemaakt, verschijnt deze hier. </p></div>`);
      } else {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(rows), (row) => {
          _push(`<div class="card flex items-start justify-between gap-4"><div class="min-w-0 flex-1"><div class="flex items-center gap-2 flex-wrap"><p class="font-medium text-gray-900 truncate">${ssrInterpolate(row.description || "Servicekosten")}</p><span class="${ssrRenderClass([statusLabel(row.status).cls, "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium"])}">${ssrInterpolate(statusLabel(row.status).label)}</span></div><div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500"><span class="flex items-center gap-1">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "calendar",
            size: 12
          }, null, _parent));
          _push(` ${ssrInterpolate(fmtDate(row.created_at))}</span>`);
          if (row.period_start || row.period_end) {
            _push(`<span class="flex items-center gap-1">`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "clock",
              size: 12
            }, null, _parent));
            _push(` Periode ${ssrInterpolate(fmtDate(row.period_start))}`);
            if (row.period_end) {
              _push(`<!--[--> \u2013 ${ssrInterpolate(fmtDate(row.period_end))}<!--]-->`);
            } else {
              _push(`<!---->`);
            }
            _push(`</span>`);
          } else {
            _push(`<!---->`);
          }
          if (row.paid_at) {
            _push(`<span class="flex items-center gap-1 text-green-700">`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "check",
              size: 12
            }, null, _parent));
            _push(` Betaald op ${ssrInterpolate(fmtDate(row.paid_at))}</span>`);
          } else if (row.failed_at) {
            _push(`<span class="flex items-center gap-1 text-red-700">`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "x",
              size: 12
            }, null, _parent));
            _push(` Mislukt op ${ssrInterpolate(fmtDate(row.failed_at))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div><div class="text-right shrink-0"><p class="text-lg font-bold text-gray-900 whitespace-nowrap">${ssrInterpolate(euros(row.amount_cents))}</p>`);
          if (row.mollie_method === "directdebit") {
            _push(`<p class="text-[11px] text-gray-400 mt-0.5">Automatische incasso</p>`);
          } else if (row.mollie_method) {
            _push(`<p class="text-[11px] text-gray-400 mt-0.5">${ssrInterpolate(row.mollie_method)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/facturen.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=facturen-CacTVQlm.mjs.map
