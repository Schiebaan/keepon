import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { c as _export_sfc, d as useRoute, u as usePartner, _ as _sfc_main$5, f as useSupabaseClient } from './server.mjs';
import { defineComponent, ref, computed, withCtx, createVNode, createTextVNode, unref, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderAttr, ssrIncludeBooleanAttr, ssrRenderList } from 'vue/server-renderer';
import { f as formatTicketRef } from './formatters-BMgUYP7c.mjs';
import { l as labelChip } from './ticket-labels-D5te2Ho2.mjs';
import { u as useLiveRefresh } from './useLiveRefresh-CD064e2y.mjs';
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
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const ticketId = route.params.id;
    const { partner } = usePartner();
    const ticket = ref(null);
    const isLoading = ref(true);
    const loadError = ref("");
    const replyText = ref("");
    const isSending = ref(false);
    const sendError = ref("");
    const flash = ref("");
    const isEditing = ref(false);
    const editForm = ref({ subject: "", description: "" });
    const editSaving = ref(false);
    async function getAuthHeaders() {
      const supabase = useSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      return (session == null ? void 0 : session.access_token) ? { Authorization: `Bearer ${session.access_token}` } : {};
    }
    async function loadTicket(background = false) {
      var _a;
      if (!background) {
        isLoading.value = true;
        loadError.value = "";
      }
      try {
        ticket.value = await $fetch(`/api/tickets/${ticketId}`, { headers: await authHeaders() });
      } catch (e) {
        if (!background) loadError.value = ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message) || "Ticket niet gevonden";
      } finally {
        if (!background) isLoading.value = false;
      }
    }
    const authHeaders = getAuthHeaders;
    useLiveRefresh(() => loadTicket(true), { intervalMs: 3e4, paused: isSending });
    const labelCatalog = ref([]);
    const showLabelPicker = ref(false);
    const labelSaving = ref(false);
    const assignedLabelIds = computed(() => {
      var _a;
      return new Set((((_a = ticket.value) == null ? void 0 : _a.labels) || []).map((l) => l.id));
    });
    const statusMeta = {
      nieuw: { label: "Nieuw", dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
      open: { label: "Nieuw", dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
      in_behandeling: { label: "In behandeling", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
      opgelost: { label: "Opgelost", dot: "bg-green-500", bg: "bg-green-50", text: "text-green-700" },
      gesloten: { label: "Gesloten", dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600" }
    };
    const urgencyMeta = {
      laag: { label: "Laag", bg: "bg-gray-50", text: "text-gray-500" },
      normaal: { label: "Normaal", bg: "bg-blue-50", text: "text-blue-700" },
      hoog: { label: "Hoog", bg: "bg-red-50", text: "text-red-700" }
    };
    const moduleIcons = { solar: "solar", heat_pump: "heat-pump", ev_charger: "ev-charger", battery: "battery" };
    const moduleLabels = { solar: "Zonnepanelen", heat_pump: "Warmtepomp", ev_charger: "Laadpaal", battery: "Batterij" };
    const moduleTints = {
      solar: { bg: "bg-amber-50", text: "text-amber-600" },
      heat_pump: { bg: "bg-orange-50", text: "text-orange-600" },
      ev_charger: { bg: "bg-sky-50", text: "text-sky-600" },
      battery: { bg: "bg-violet-50", text: "text-violet-600" }
    };
    function moduleIcon(m) {
      return m && moduleIcons[m] || "tool";
    }
    function moduleTint(m) {
      return m && moduleTints[m] || { bg: "bg-gray-100", text: "text-gray-500" };
    }
    function formatDateTime(iso) {
      return new Date(iso).toLocaleString("nl-NL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    }
    function timeAgo(iso) {
      const ms = Date.now() - new Date(iso).getTime();
      const min = Math.round(ms / 6e4);
      if (min < 1) return "zojuist";
      if (min < 60) return `${min} min geleden`;
      const h = Math.round(min / 60);
      if (h < 24) return `${h} uur geleden`;
      const d = Math.round(h / 24);
      if (d < 7) return `${d} dag${d === 1 ? "" : "en"} geleden`;
      return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    }
    function initials(name) {
      if (!name) return "?";
      return name.split(" ").map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join("");
    }
    const customerAddress = computed(() => {
      var _a;
      const c = (_a = ticket.value) == null ? void 0 : _a.customer;
      if (!(c == null ? void 0 : c.street) || !(c == null ? void 0 : c.house_number)) return null;
      return `${c.street} ${c.house_number}, ${c.postal_code || ""} ${c.city || ""}`.replace(/\s+/g, " ").trim();
    });
    const isClosed = computed(() => {
      var _a, _b;
      return ((_a = ticket.value) == null ? void 0 : _a.status) === "opgelost" || ((_b = ticket.value) == null ? void 0 : _b.status) === "gesloten";
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-cb909f5f>`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/admin/service",
        class: "inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 no-underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "chevron-right",
              size: 14,
              class: "rotate-180"
            }, null, _parent2, _scopeId));
            _push2(` Terug naar service `);
          } else {
            return [
              createVNode(_component_AppIcon, {
                name: "chevron-right",
                size: 14,
                class: "rotate-180"
              }),
              createTextVNode(" Terug naar service ")
            ];
          }
        }),
        _: 1
      }, _parent));
      if (unref(isLoading)) {
        _push(`<div class="py-16 text-center" data-v-cb909f5f><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-cb909f5f></div></div>`);
      } else if (unref(loadError)) {
        _push(`<div class="rounded-2xl border border-red-100 bg-red-50 p-6 text-center" data-v-cb909f5f>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "alert-circle",
          size: 28,
          class: "mx-auto text-red-400 mb-2"
        }, null, _parent));
        _push(`<p class="text-sm font-medium text-red-700" data-v-cb909f5f>${ssrInterpolate(unref(loadError))}</p></div>`);
      } else if (unref(ticket)) {
        _push(`<!--[--><div class="mb-4 rounded-2xl border border-gray-100 bg-white p-5" data-v-cb909f5f><div class="flex items-start gap-4" data-v-cb909f5f><div class="${ssrRenderClass([[moduleTint(unref(ticket).module_type).bg, moduleTint(unref(ticket).module_type).text], "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"])}" data-v-cb909f5f>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: moduleIcon(unref(ticket).module_type),
          size: 24
        }, null, _parent));
        _push(`</div><div class="flex-1 min-w-0" data-v-cb909f5f>`);
        if (unref(isEditing)) {
          _push(`<!--[--><input${ssrRenderAttr("value", unref(editForm).subject)} type="text" class="input text-lg font-semibold" maxlength="200" placeholder="Onderwerp" data-v-cb909f5f><textarea class="input mt-2 text-sm" rows="4" placeholder="Beschrijving" data-v-cb909f5f>${ssrInterpolate(unref(editForm).description)}</textarea><div class="mt-2 flex gap-2" data-v-cb909f5f><button class="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(editSaving) || !unref(editForm).subject.trim()) ? " disabled" : ""} data-v-cb909f5f>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 12
          }, null, _parent));
          _push(` Opslaan </button><button class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50" data-v-cb909f5f> Annuleren </button></div><!--]-->`);
        } else {
          _push(`<!--[--><div class="flex items-start gap-2" data-v-cb909f5f><h1 class="text-lg font-semibold text-gray-900 flex-1 break-words" data-v-cb909f5f>${ssrInterpolate(unref(ticket).subject)}</h1><button class="shrink-0 rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Bewerk onderwerp &amp; beschrijving" data-v-cb909f5f>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "settings",
            size: 14
          }, null, _parent));
          _push(`</button></div><div class="mt-1.5 flex flex-wrap items-center gap-2 text-xs" data-v-cb909f5f><span class="${ssrRenderClass([[((_a = statusMeta[unref(ticket).status]) == null ? void 0 : _a.bg) || "bg-gray-100", ((_b = statusMeta[unref(ticket).status]) == null ? void 0 : _b.text) || "text-gray-600"], "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium"])}" data-v-cb909f5f><span class="${ssrRenderClass([((_c = statusMeta[unref(ticket).status]) == null ? void 0 : _c.dot) || "bg-gray-400", "h-1.5 w-1.5 rounded-full"])}" data-v-cb909f5f></span> ${ssrInterpolate(((_d = statusMeta[unref(ticket).status]) == null ? void 0 : _d.label) || unref(ticket).status)}</span>`);
          if (unref(ticket).module_type) {
            _push(`<span class="text-gray-500" data-v-cb909f5f>${ssrInterpolate(moduleLabels[unref(ticket).module_type])}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<span class="text-gray-400" data-v-cb909f5f>\xB7</span><span class="text-gray-500" data-v-cb909f5f>Geopend ${ssrInterpolate(timeAgo(unref(ticket).created_at))}</span>`);
          if (unref(ticket).updated_at !== unref(ticket).created_at) {
            _push(`<span class="text-gray-400" data-v-cb909f5f>\xB7 bijgewerkt ${ssrInterpolate(timeAgo(unref(ticket).updated_at))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><!--]-->`);
        }
        _push(`</div>`);
        if (unref(flash)) {
          _push(`<span class="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700" data-v-cb909f5f>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 12
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(flash))}</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><div class="grid grid-cols-1 lg:grid-cols-3 gap-4" data-v-cb909f5f><div class="lg:col-span-2 space-y-3" data-v-cb909f5f><div class="rounded-2xl border border-gray-100 bg-white p-5" data-v-cb909f5f><div class="flex items-start gap-3 mb-2" data-v-cb909f5f><div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700" data-v-cb909f5f>${ssrInterpolate(initials((_e = unref(ticket).customer) == null ? void 0 : _e.full_name))}</div><div class="flex-1 min-w-0" data-v-cb909f5f><p class="text-sm font-semibold text-gray-900" data-v-cb909f5f>${ssrInterpolate(((_f = unref(ticket).customer) == null ? void 0 : _f.full_name) || "Onbekende klant")}</p><p class="text-xs text-gray-400" data-v-cb909f5f>Opening \xB7 ${ssrInterpolate(formatDateTime(unref(ticket).created_at))}</p></div></div>`);
        if (unref(ticket).description) {
          _push(`<p class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed" data-v-cb909f5f>${ssrInterpolate(unref(ticket).description)}</p>`);
        } else {
          _push(`<p class="text-sm italic text-gray-400" data-v-cb909f5f>Geen toelichting.</p>`);
        }
        _push(`</div><!--[-->`);
        ssrRenderList(unref(ticket).messages, (msg) => {
          var _a2, _b2;
          _push(`<div class="${ssrRenderClass([msg.role === "installer" ? "border-amber-100 bg-amber-50/40" : "border-gray-100 bg-white", "rounded-2xl border p-5"])}" data-v-cb909f5f><div class="flex items-start gap-3 mb-2" data-v-cb909f5f><div class="${ssrRenderClass([msg.role === "installer" ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-700", "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold"])}" data-v-cb909f5f>`);
          if (msg.role === "installer") {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "tool",
              size: 16
            }, null, _parent));
          } else {
            _push(`<span data-v-cb909f5f>${ssrInterpolate(initials(msg.author_name || ((_a2 = unref(ticket).customer) == null ? void 0 : _a2.full_name)))}</span>`);
          }
          _push(`</div><div class="flex-1 min-w-0" data-v-cb909f5f><p class="text-sm font-semibold text-gray-900" data-v-cb909f5f>${ssrInterpolate(msg.role === "installer" ? msg.author_name ? `${msg.author_name} \xB7 ${unref(partner).name}` : unref(partner).name : msg.author_name || ((_b2 = unref(ticket).customer) == null ? void 0 : _b2.full_name) || "Klant")}</p><p class="text-xs text-gray-400" data-v-cb909f5f>${ssrInterpolate(formatDateTime(msg.at))}</p></div></div><p class="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed" data-v-cb909f5f>${ssrInterpolate(msg.text)}</p></div>`);
        });
        _push(`<!--]-->`);
        if (!unref(isClosed)) {
          _push(`<div class="rounded-2xl border border-gray-100 bg-white p-5" data-v-cb909f5f><p class="text-sm font-semibold text-gray-900 mb-2" data-v-cb909f5f>Nieuwe reactie</p><textarea rows="5" class="input text-sm" placeholder="Typ je reactie. Cmd/Ctrl+Enter om te versturen." data-v-cb909f5f>${ssrInterpolate(unref(replyText))}</textarea>`);
          if (unref(sendError)) {
            _push(`<p class="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" data-v-cb909f5f>${ssrInterpolate(unref(sendError))}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="mt-3 flex flex-wrap items-center gap-2" data-v-cb909f5f><button class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed"${ssrIncludeBooleanAttr(!unref(replyText).trim() || unref(isSending)) ? " disabled" : ""} data-v-cb909f5f>`);
          if (unref(isSending)) {
            _push(`<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" data-v-cb909f5f><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-cb909f5f></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" data-v-cb909f5f></path></svg>`);
          } else {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "send",
              size: 14
            }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(isSending) ? "Versturen..." : "Verstuur reactie")}</button>`);
          if (unref(ticket).status !== "opgelost") {
            _push(`<button class="inline-flex items-center gap-2 rounded-xl border border-green-300 bg-white px-4 py-2 text-sm font-semibold text-green-700 hover:bg-green-50" data-v-cb909f5f>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "check",
              size: 14
            }, null, _parent));
            _push(` Markeer als opgelost </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="flex-1" data-v-cb909f5f></div><kbd class="hidden sm:inline-flex items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-mono text-gray-500" data-v-cb909f5f>\u2318\u21B5</kbd></div><p class="mt-2 text-xs text-gray-400" data-v-cb909f5f>`);
          if (unref(ticket).status === "nieuw" || unref(ticket).status === "open") {
            _push(`<!--[--> Bij versturen wordt het ticket automatisch op <strong data-v-cb909f5f>In behandeling</strong> gezet en krijgt de klant een mail. <!--]-->`);
          } else {
            _push(`<!--[--> De klant krijgt direct een mail met je reactie en kan ook weer antwoorden. <!--]-->`);
          }
          _push(`</p></div>`);
        } else {
          _push(`<div class="rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center" data-v-cb909f5f><p class="text-sm text-gray-600" data-v-cb909f5f><span class="font-medium text-gray-900" data-v-cb909f5f>Dit ticket is ${ssrInterpolate(unref(ticket).status === "gesloten" ? "gesloten" : "opgelost")}.</span> Nieuwe reacties van de klant heropenen het ticket automatisch. </p><button class="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50" data-v-cb909f5f>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "zap",
            size: 14
          }, null, _parent));
          _push(` Heropen ticket </button></div>`);
        }
        _push(`</div><aside class="space-y-4" data-v-cb909f5f><div class="rounded-2xl border border-gray-100 bg-white p-5" data-v-cb909f5f><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" data-v-cb909f5f>Klant</p><div class="flex items-center gap-3 mb-3" data-v-cb909f5f><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-semibold text-gray-700" data-v-cb909f5f>${ssrInterpolate(initials((_g = unref(ticket).customer) == null ? void 0 : _g.full_name))}</div><div class="min-w-0 flex-1" data-v-cb909f5f><p class="truncate text-sm font-semibold text-gray-900" data-v-cb909f5f>${ssrInterpolate(((_h = unref(ticket).customer) == null ? void 0 : _h.full_name) || "Onbekend")}</p><p class="truncate text-xs text-gray-500" data-v-cb909f5f>${ssrInterpolate((_i = unref(ticket).customer) == null ? void 0 : _i.email)}</p></div></div><div class="space-y-1.5 text-sm" data-v-cb909f5f>`);
        if ((_j = unref(ticket).customer) == null ? void 0 : _j.email) {
          _push(`<a${ssrRenderAttr("href", `mailto:${unref(ticket).customer.email}`)} class="flex items-center gap-2 text-gray-600 hover:text-gray-900" data-v-cb909f5f>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "mail",
            size: 14,
            class: "text-gray-400"
          }, null, _parent));
          _push(`<span class="truncate" data-v-cb909f5f>${ssrInterpolate(unref(ticket).customer.email)}</span></a>`);
        } else {
          _push(`<!---->`);
        }
        if ((_k = unref(ticket).customer) == null ? void 0 : _k.phone) {
          _push(`<a${ssrRenderAttr("href", `tel:${unref(ticket).customer.phone}`)} class="flex items-center gap-2 text-gray-600 hover:text-gray-900" data-v-cb909f5f>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "phone",
            size: 14,
            class: "text-gray-400"
          }, null, _parent));
          _push(`<span data-v-cb909f5f>${ssrInterpolate(unref(ticket).customer.phone)}</span></a>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(customerAddress)) {
          _push(`<p class="flex items-start gap-2 text-gray-600" data-v-cb909f5f>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "home",
            size: 14,
            class: "text-gray-400 mt-0.5"
          }, null, _parent));
          _push(`<span class="text-xs" data-v-cb909f5f>${ssrInterpolate(unref(customerAddress))}</span></p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if ((_l = unref(ticket).customer) == null ? void 0 : _l.id) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/admin/customers/${unref(ticket).customer.id}`,
            class: "mt-4 inline-flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(` Open klantkaart `);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 12
                }, null, _parent2, _scopeId));
              } else {
                return [
                  createTextVNode(" Open klantkaart "),
                  createVNode(_component_AppIcon, {
                    name: "chevron-right",
                    size: 12
                  })
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="rounded-2xl border border-gray-100 bg-white p-5" data-v-cb909f5f><div class="flex items-center justify-between mb-3" data-v-cb909f5f><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider" data-v-cb909f5f>Labels</p><button class="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800" data-v-cb909f5f>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(showLabelPicker) ? "check" : "plus",
          size: 12
        }, null, _parent));
        _push(` ${ssrInterpolate(unref(showLabelPicker) ? "Klaar" : "Wijzig")}</button></div>`);
        if (!unref(showLabelPicker)) {
          _push(`<div data-v-cb909f5f>`);
          if (unref(ticket).labels && unref(ticket).labels.length) {
            _push(`<div class="flex flex-wrap gap-1.5" data-v-cb909f5f><!--[-->`);
            ssrRenderList(unref(ticket).labels, (l) => {
              _push(`<span class="${ssrRenderClass([[unref(labelChip)(l.color).bg, unref(labelChip)(l.color).text], "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"])}" data-v-cb909f5f><span class="${ssrRenderClass([unref(labelChip)(l.color).dot, "h-1.5 w-1.5 rounded-full"])}" data-v-cb909f5f></span> ${ssrInterpolate(l.name)}</span>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<p class="text-xs text-gray-400" data-v-cb909f5f>Nog geen labels. Klik op &quot;Wijzig&quot;.</p>`);
          }
          _push(`</div>`);
        } else {
          _push(`<div data-v-cb909f5f>`);
          if (unref(labelCatalog).length) {
            _push(`<div class="flex flex-wrap gap-1.5" data-v-cb909f5f><!--[-->`);
            ssrRenderList(unref(labelCatalog), (l) => {
              _push(`<button type="button" class="${ssrRenderClass([unref(assignedLabelIds).has(l.id) ? [unref(labelChip)(l.color).bg, unref(labelChip)(l.color).text, "ring-1", unref(labelChip)(l.color).ring] : "bg-gray-50 text-gray-400 hover:bg-gray-100", "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all disabled:opacity-50"])}"${ssrIncludeBooleanAttr(unref(labelSaving)) ? " disabled" : ""} data-v-cb909f5f><span class="${ssrRenderClass([unref(assignedLabelIds).has(l.id) ? unref(labelChip)(l.color).dot : "bg-gray-300", "h-1.5 w-1.5 rounded-full"])}" data-v-cb909f5f></span> ${ssrInterpolate(l.name)} `);
              if (unref(assignedLabelIds).has(l.id)) {
                _push(ssrRenderComponent(_component_AppIcon, {
                  name: "check",
                  size: 10
                }, null, _parent));
              } else {
                _push(`<!---->`);
              }
              _push(`</button>`);
            });
            _push(`<!--]--></div>`);
          } else {
            _push(`<p class="text-xs text-gray-400" data-v-cb909f5f> Nog geen labels ingesteld. `);
            _push(ssrRenderComponent(_component_NuxtLink, {
              to: "/admin/settings",
              class: "text-blue-600 hover:underline"
            }, {
              default: withCtx((_, _push2, _parent2, _scopeId) => {
                if (_push2) {
                  _push2(`Beheer ze in Instellingen.`);
                } else {
                  return [
                    createTextVNode("Beheer ze in Instellingen.")
                  ];
                }
              }),
              _: 1
            }, _parent));
            _push(`</p>`);
          }
          _push(`</div>`);
        }
        _push(`</div><div class="rounded-2xl border border-gray-100 bg-white p-5" data-v-cb909f5f><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" data-v-cb909f5f>Status</p><div class="grid grid-cols-2 gap-1.5" data-v-cb909f5f><!--[-->`);
        ssrRenderList(["nieuw", "in_behandeling", "opgelost", "gesloten"], (s) => {
          _push(`<button class="${ssrRenderClass([unref(ticket).status === s || s === "nieuw" && unref(ticket).status === "open" ? `${statusMeta[s].bg} ${statusMeta[s].text} border-transparent` : "border-gray-200 text-gray-500 hover:bg-gray-50", "flex items-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition-colors"])}"${ssrIncludeBooleanAttr(unref(ticket).status === s) ? " disabled" : ""} data-v-cb909f5f><span class="${ssrRenderClass([statusMeta[s].dot, "h-1.5 w-1.5 rounded-full"])}" data-v-cb909f5f></span> ${ssrInterpolate(statusMeta[s].label)}</button>`);
        });
        _push(`<!--]--></div></div><div class="rounded-2xl border border-gray-100 bg-white p-5" data-v-cb909f5f><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3" data-v-cb909f5f>Urgentie</p><div class="grid grid-cols-3 gap-1.5" data-v-cb909f5f><!--[-->`);
        ssrRenderList(["laag", "normaal", "hoog"], (u) => {
          _push(`<button class="${ssrRenderClass([unref(ticket).urgency === u ? `${urgencyMeta[u].bg} ${urgencyMeta[u].text} border-transparent` : "border-gray-200 text-gray-500 hover:bg-gray-50", "rounded-lg border px-2 py-2 text-xs font-medium transition-colors"])}"${ssrIncludeBooleanAttr(unref(ticket).urgency === u) ? " disabled" : ""} data-v-cb909f5f>${ssrInterpolate(urgencyMeta[u].label)}</button>`);
        });
        _push(`<!--]--></div></div>`);
        if (unref(ticket).helped_by_name) {
          _push(`<div class="rounded-2xl border border-green-100 bg-green-50/60 p-5" data-v-cb909f5f><p class="flex items-center gap-1.5 text-xs font-semibold text-green-700 uppercase tracking-wider mb-2" data-v-cb909f5f>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check-circle",
            size: 12
          }, null, _parent));
          _push(` Geholpen door </p><p class="text-base font-semibold text-gray-900" data-v-cb909f5f>${ssrInterpolate(unref(ticket).helped_by_name)}</p><p class="mt-1 text-[11px] text-gray-500" data-v-cb909f5f>Door de klant zelf ingevuld na afronden.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="rounded-2xl border border-gray-100 bg-white p-5 text-xs space-y-2" data-v-cb909f5f><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" data-v-cb909f5f>Details</p><div class="flex items-center justify-between" data-v-cb909f5f><span class="text-gray-500" data-v-cb909f5f>Aangemaakt</span><span class="text-gray-900" data-v-cb909f5f>${ssrInterpolate(formatDateTime(unref(ticket).created_at))}</span></div><div class="flex items-center justify-between" data-v-cb909f5f><span class="text-gray-500" data-v-cb909f5f>Laatst bijgewerkt</span><span class="text-gray-900" data-v-cb909f5f>${ssrInterpolate(formatDateTime(unref(ticket).updated_at))}</span></div><div class="flex items-center justify-between" data-v-cb909f5f><span class="text-gray-500" data-v-cb909f5f>Reacties</span><span class="text-gray-900" data-v-cb909f5f>${ssrInterpolate(unref(ticket).messages.length)}</span></div><div class="flex items-center justify-between" data-v-cb909f5f><span class="text-gray-500" data-v-cb909f5f>Module</span><span class="text-gray-900" data-v-cb909f5f>${ssrInterpolate(unref(ticket).module_type ? moduleLabels[unref(ticket).module_type] : "Algemeen")}</span></div>`);
        if (unref(formatTicketRef)(unref(ticket))) {
          _push(`<div class="flex items-center justify-between" data-v-cb909f5f><span class="text-gray-500" data-v-cb909f5f>Ticketnummer</span><span class="text-sm font-semibold text-gray-900" data-v-cb909f5f>#${ssrInterpolate(unref(formatTicketRef)(unref(ticket)))}</span></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></aside></div><!--]-->`);
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
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/service/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-cb909f5f"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-XvrOSmjR.mjs.map
