import { u as usePartner, a as useConfirm, _ as _sfc_main$5, b as useMockData } from './server.mjs';
import { defineComponent, ref, computed, unref, createVNode, resolveDynamicComponent, withCtx, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderStyle, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderList, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderVNode } from 'vue/server-renderer';
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

function useEmailTemplates() {
  const mock = useMockData();
  return {
    templates: mock.emailTemplates,
    getTemplate: (type) => mock.getEmailTemplate(type),
    updateTemplate: (type, updates) => mock.updateEmailTemplate(type, updates),
    resetTemplate: (type) => mock.resetEmailTemplate(type)
    // TODO: Replace with Supabase queries when email_templates table is populated
  };
}
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "communicatie",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const { templates: emailTemplates } = useEmailTemplates();
    const logLoading = ref(false);
    const logError = ref("");
    const notifications = ref([]);
    const stats = ref({ total: 0, this_month: 0, failed: 0 });
    const totalSent = computed(() => stats.value.total - stats.value.failed);
    const totalFailed = computed(() => stats.value.failed);
    const thisMonth = computed(() => stats.value.this_month);
    const activeTab = ref("templates");
    const editingTemplate = ref(null);
    const previewTemplate = ref(null);
    function typeClass(type) {
      const classes = {
        welkomstmail: "bg-purple-50 text-purple-700",
        ticket: "bg-amber-50 text-amber-700",
        installatie: "bg-green-50 text-green-700",
        wachtwoord: "bg-blue-50 text-blue-700",
        overig: "bg-gray-100 text-gray-700"
      };
      return classes[type] || "bg-gray-100 text-gray-700";
    }
    function statusClass(status) {
      switch (status) {
        case "verzonden":
          return "badge--green";
        case "mislukt":
          return "badge--red";
        default:
          return "badge--gray";
      }
    }
    function formatLogDate(iso) {
      try {
        return new Date(iso).toLocaleString("nl-NL", {
          day: "numeric",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch {
        return iso;
      }
    }
    const placeholders = [
      { tag: "{{voornaam}}", desc: "Voornaam klant" },
      { tag: "{{naam}}", desc: "Volledige naam klant" },
      { tag: "{{email}}", desc: "E-mailadres klant" },
      { tag: "{{bedrijfsnaam}}", desc: "Naam van je bedrijf" },
      { tag: "{{module}}", desc: "Naam van de module" }
    ];
    useConfirm();
    function previewText(text) {
      return text.replace(/\{\{voornaam\}\}/g, "Jan").replace(/\{\{naam\}\}/g, "Jan de Vries").replace(/\{\{email\}\}/g, "jan@voorbeeld.nl").replace(/\{\{bedrijfsnaam\}\}/g, partner.name || "Uw bedrijf").replace(/\{\{module\}\}/g, "Zonnepanelen monitoring");
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="mb-6"><h1 class="text-2xl font-bold text-gray-900">Communicatie</h1><p class="mt-1 text-sm text-gray-500">Beheer automatische berichten en bekijk het verzendoverzicht.</p></div><div class="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3"><div class="stat-card" style="${ssrRenderStyle({ "--stat-color": "#1a56db" })}"><div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-500">Verzonden</span>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "mail",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`</div><p class="mt-2 text-2xl font-bold text-gray-900">${ssrInterpolate(unref(totalSent))}</p><p class="mt-1 text-xs text-green-600">Alle kanalen</p></div><div class="stat-card" style="${ssrRenderStyle({ "--stat-color": "#059669" })}"><div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-500">Deze maand</span>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "clock",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`</div><p class="mt-2 text-2xl font-bold text-gray-900">${ssrInterpolate(unref(thisMonth))}</p></div><div class="stat-card" style="${ssrRenderStyle({ "--stat-color": "#dc2626" })}"><div class="flex items-center justify-between"><span class="text-sm font-medium text-gray-500">Mislukt</span>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "warning",
        size: 18,
        class: "text-gray-400"
      }, null, _parent));
      _push(`</div><p class="mt-2 text-2xl font-bold text-gray-900">${ssrInterpolate(unref(totalFailed))}</p></div></div><div class="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6"><button class="${ssrRenderClass([unref(activeTab) === "templates" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"])}">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "settings",
        size: 16
      }, null, _parent));
      _push(` E-mail templates </button><button class="${ssrRenderClass([unref(activeTab) === "log" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"])}">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "mail",
        size: 16
      }, null, _parent));
      _push(` Berichtenlog </button></div>`);
      if (unref(activeTab) === "templates") {
        _push(`<div><div class="mb-5 rounded-xl bg-blue-50 border border-blue-100 p-4"><p class="text-xs font-semibold text-blue-800 mb-2">Beschikbare placeholders</p><div class="flex flex-wrap gap-2"><!--[-->`);
        ssrRenderList(placeholders, (p) => {
          _push(`<span class="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs font-mono text-blue-700 border border-blue-200"${ssrRenderAttr("title", p.desc)}>${ssrInterpolate(p.tag)} <span class="text-blue-400 font-sans">${ssrInterpolate(p.desc)}</span></span>`);
        });
        _push(`<!--]--></div></div><div class="space-y-4"><!--[-->`);
        ssrRenderList(unref(emailTemplates), (tmpl) => {
          _push(`<div class="rounded-xl border border-gray-200 bg-white overflow-hidden"><div class="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-gray-50 transition-colors"><div class="flex items-center gap-3"><div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "mail",
            size: 16
          }, null, _parent));
          _push(`</div><div><p class="text-sm font-medium text-gray-900">${ssrInterpolate(tmpl.label)}</p><p class="text-xs text-gray-500">${ssrInterpolate(tmpl.description)}</p></div></div><div class="flex items-center gap-3"><button class="${ssrRenderClass([tmpl.enabled ? "bg-green-500" : "bg-gray-300", "relative inline-flex h-6 w-11 items-center rounded-full transition-colors"])}"><span class="${ssrRenderClass([tmpl.enabled ? "translate-x-6" : "translate-x-1", "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"])}"></span></button>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "chevron-down",
            size: 16,
            class: ["text-gray-400 transition-transform", unref(editingTemplate) === tmpl.type ? "rotate-180" : ""]
          }, null, _parent));
          _push(`</div></div>`);
          if (unref(editingTemplate) === tmpl.type) {
            _push(`<div class="border-t border-gray-100 px-5 py-4 space-y-3 bg-gray-50"><div><label class="label">Onderwerp</label><input${ssrRenderAttr("value", tmpl.subject)} type="text" class="input font-mono text-sm" placeholder="Onderwerpregel"></div><div><label class="label">Koptekst</label><input${ssrRenderAttr("value", tmpl.heading)} type="text" class="input text-sm" placeholder="Koptekst in de email"></div><div><label class="label">Berichttekst</label><textarea class="input text-sm" rows="3" placeholder="De hoofdtekst van je bericht...">${ssrInterpolate(tmpl.body)}</textarea></div><div><label class="label">Knoptekst</label><input${ssrRenderAttr("value", tmpl.buttonText)} type="text" class="input text-sm" placeholder="Tekst op de actieknop"></div>`);
            if (unref(previewTemplate) === tmpl.type) {
              _push(`<div class="rounded-lg border border-gray-200 bg-white p-4"><p class="text-xs font-medium text-gray-400 mb-2">Preview</p><p class="text-xs text-gray-500 mb-1">Onderwerp: <strong class="text-gray-700">${ssrInterpolate(previewText(tmpl.subject))}</strong></p><div class="mt-2 rounded-lg bg-gray-50 p-3"><p class="text-base font-bold text-gray-900 mb-1">${ssrInterpolate(previewText(tmpl.heading))}</p><p class="text-sm text-gray-600 mb-3">${ssrInterpolate(previewText(tmpl.body))}</p><span class="inline-block rounded-lg px-4 py-2 text-sm font-medium text-white" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}">${ssrInterpolate(tmpl.buttonText)}</span></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<div class="flex items-center justify-between pt-2"><div class="flex items-center gap-2"><button class="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "search",
              size: 12
            }, null, _parent));
            _push(` ${ssrInterpolate(unref(previewTemplate) === tmpl.type ? "Verberg preview" : "Toon preview")}</button>`);
            if (["welkomstmail", "activatie_bevestiging", "wachtwoord_reset"].includes(tmpl.type)) {
              _push(`<button class="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1">`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "external",
                size: 12
              }, null, _parent));
              _push(` HTML preview </button>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><button class="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "refresh",
              size: 12
            }, null, _parent));
            _push(` Terugzetten </button></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div><p class="mt-4 text-xs text-gray-400"> Wijzigingen worden automatisch opgeslagen. Gebruik placeholders om berichten te personaliseren. </p></div>`);
      } else {
        _push(`<!---->`);
      }
      if (unref(activeTab) === "log") {
        _push(`<div><div class="section"><div class="mb-3 flex items-center justify-between"><p class="text-sm text-gray-500">`);
        if (unref(logLoading)) {
          _push(`<!--[-->Laden...<!--]-->`);
        } else if (unref(logError)) {
          _push(`<!--[-->${ssrInterpolate(unref(logError))}<!--]-->`);
        } else if (!unref(notifications).length) {
          _push(`<!--[-->Nog geen berichten verstuurd.<!--]-->`);
        } else {
          _push(`<!--[-->${ssrInterpolate(unref(notifications).length)} berichten (laatste 90 dagen)<!--]-->`);
        }
        _push(`</p><button class="text-xs text-gray-500 hover:text-gray-900 flex items-center gap-1.5 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(logLoading)) ? " disabled" : ""}>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "refresh",
          size: 14,
          class: unref(logLoading) ? "animate-spin" : ""
        }, null, _parent));
        _push(` Vernieuwen </button></div>`);
        if (unref(notifications).length) {
          _push(`<div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wider text-gray-500"><th class="pb-3 pr-3">Datum</th><th class="pb-3 pr-3">Type</th><th class="pb-3 pr-3">Ontvanger</th><th class="pb-3 pr-3">Onderwerp</th><th class="pb-3">Status</th></tr></thead><tbody class="divide-y divide-gray-100"><!--[-->`);
          ssrRenderList(unref(notifications), (n) => {
            _push(`<tr class="hover:bg-gray-50"><td class="py-3 pr-3 text-xs text-gray-500 whitespace-nowrap">${ssrInterpolate(formatLogDate(n.created_at))}</td><td class="py-3 pr-3"><span class="${ssrRenderClass([typeClass(n.type), "inline-flex rounded-md px-2 py-0.5 text-xs font-medium"])}">${ssrInterpolate(n.type_label)}</span></td><td class="py-3 pr-3">`);
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(n.entity_link ? "NuxtLink" : "div"), {
              to: n.entity_link || void 0,
              class: ["block", n.entity_link ? "hover:underline" : ""]
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`<p class="text-sm text-gray-900"${_scopeId}>${ssrInterpolate(n.recipient_name || n.recipient_email)}</p>`);
                  if (n.recipient_name) {
                    _push2(`<p class="text-xs text-gray-400"${_scopeId}>${ssrInterpolate(n.recipient_email)}</p>`);
                  } else {
                    _push2(`<!---->`);
                  }
                } else {
                  return [
                    createVNode("p", { class: "text-sm text-gray-900" }, toDisplayString(n.recipient_name || n.recipient_email), 1),
                    n.recipient_name ? (openBlock(), createBlock("p", {
                      key: 0,
                      class: "text-xs text-gray-400"
                    }, toDisplayString(n.recipient_email), 1)) : createCommentVNode("", true)
                  ];
                }
              }),
              _: 2
            }), _parent);
            _push(`</td><td class="py-3 pr-3 text-sm text-gray-700 max-w-xs truncate">${ssrInterpolate(n.subject)}</td><td class="py-3"><span class="${ssrRenderClass([statusClass(n.status), "badge"])}">${ssrInterpolate(n.status)}</span></td></tr>`);
          });
          _push(`<!--]--></tbody></table></div>`);
        } else if (!unref(logLoading) && !unref(logError)) {
          _push(`<div class="rounded-xl border border-dashed border-gray-200 bg-gray-50 py-12 px-6 text-center">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "mail",
            size: 32,
            class: "mx-auto text-gray-300 mb-3"
          }, null, _parent));
          _push(`<p class="text-sm text-gray-500 font-medium">Nog geen berichten verstuurd.</p><p class="mt-1 text-xs text-gray-400">Zodra je een klant aanmaakt of een ticket beantwoordt verschijnen de berichten hier.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/communicatie.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=communicatie-CSqIVrOg.mjs.map
