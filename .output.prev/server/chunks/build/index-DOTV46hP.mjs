import { c as _export_sfc, e as useRouter, d as useRoute, h as useBackdropClose, _ as _sfc_main$5, f as useSupabaseClient } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, computed, unref, withCtx, createVNode, openBlock, createBlock, toDisplayString, createCommentVNode, createTextVNode, Fragment, renderList, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrRenderAttr, ssrRenderTeleport, ssrIncludeBooleanAttr, ssrLooseContain, ssrLooseEqual } from 'vue/server-renderer';
import { f as formatTicketRef } from './formatters-BMgUYP7c.mjs';
import { l as labelChip } from './ticket-labels-D5te2Ho2.mjs';
import { u as useCustomers } from './useCustomers-B2wkzFun.mjs';
import { u as useLiveRefresh, a as useRelativeTime } from './useLiveRefresh-CD064e2y.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { customers } = useCustomers();
    useRouter();
    const route = useRoute();
    const tickets = ref([]);
    const isLoading = ref(true);
    const showCreateModal = ref(false);
    useBackdropClose(() => {
      showCreateModal.value = false;
    });
    const activeFilter = ref("wacht");
    const searchQuery = ref("");
    async function getAuthHeaders() {
      const supabase = useSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      return (session == null ? void 0 : session.access_token) ? { Authorization: `Bearer ${session.access_token}` } : {};
    }
    const nieuwBinnengekomen = ref(0);
    async function loadTickets(background = false) {
      if (!background) isLoading.value = true;
      try {
        const headers = await getAuthHeaders();
        const verse = await $fetch("/api/tickets", { headers });
        if (background) {
          const bekend = new Set(tickets.value.map((t) => t.id));
          nieuwBinnengekomen.value += verse.filter((t) => !bekend.has(t.id)).length;
        }
        tickets.value = verse;
      } catch {
        if (!background) tickets.value = [];
      } finally {
        if (!background) isLoading.value = false;
      }
    }
    const { lastRefreshed } = useLiveRefresh(() => loadTickets(true), {
      intervalMs: 45e3,
      paused: showCreateModal
    });
    const bijgewerkt = useRelativeTime(lastRefreshed);
    function normStatus(s) {
      return s === "open" ? "nieuw" : s;
    }
    const counts = computed(() => {
      const c = { alle: tickets.value.length, wacht: 0, nieuw: 0, in_behandeling: 0, opgelost: 0 };
      for (const t of tickets.value) {
        const s = normStatus(t.status);
        if (s === "nieuw") c.nieuw++;
        else if (s === "in_behandeling") c.in_behandeling++;
        else if (s === "opgelost" || s === "gesloten") c.opgelost++;
        if (awaitsReply(t)) c.wacht++;
      }
      return c;
    });
    const filteredTickets = computed(() => {
      const q = searchQuery.value.trim().toLowerCase();
      return tickets.value.filter((t) => {
        var _a, _b, _c;
        const s = normStatus(t.status);
        if (activeFilter.value === "wacht" && !awaitsReply(t)) return false;
        if (activeFilter.value === "nieuw" && s !== "nieuw") return false;
        if (activeFilter.value === "in_behandeling" && s !== "in_behandeling") return false;
        if (activeFilter.value === "opgelost" && s !== "opgelost" && s !== "gesloten") return false;
        if (!q) return true;
        const haystack = [
          t.subject || "",
          t.description || "",
          ((_a = t.latest_message) == null ? void 0 : _a.text) || "",
          ((_b = t.customer) == null ? void 0 : _b.full_name) || "",
          ((_c = t.customer) == null ? void 0 : _c.email) || ""
        ].join(" ").toLowerCase();
        return haystack.includes(q);
      });
    });
    function lastMessagePreview(t) {
      var _a, _b;
      if (t.latest_message) {
        const who = t.latest_message.role === "customer" ? ((_a = t.customer) == null ? void 0 : _a.full_name) || "Klant" : "Jullie";
        return { who, text: t.latest_message.text, isCustomer: t.latest_message.role === "customer" };
      }
      return { who: ((_b = t.customer) == null ? void 0 : _b.full_name) || "Klant", text: t.description || "", isCustomer: true };
    }
    function awaitsReply(t) {
      if (t.status === "opgelost" || t.status === "gesloten") return false;
      if (!t.latest_message) return true;
      return t.latest_message.role === "customer";
    }
    const createForm = ref({ customer_id: "", subject: "", description: "", urgency: "normaal", module_type: "" });
    const creating = ref(false);
    const createError = ref("");
    if (route.query.customer) ;
    const statusMeta = {
      nieuw: { label: "Nieuw", dot: "bg-blue-500", bg: "bg-blue-50", text: "text-blue-700" },
      in_behandeling: { label: "In behandeling", dot: "bg-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
      opgelost: { label: "Opgelost", dot: "bg-green-500", bg: "bg-green-50", text: "text-green-700" },
      gesloten: { label: "Gesloten", dot: "bg-gray-400", bg: "bg-gray-100", text: "text-gray-600" }
    };
    function statusFor(t) {
      return statusMeta[normStatus(t.status)] || statusMeta.nieuw;
    }
    const moduleIcons = {
      solar: "solar",
      heat_pump: "heat-pump",
      ev_charger: "ev-charger",
      battery: "battery"
    };
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
    function timeAgo(iso) {
      const ms = Date.now() - new Date(iso).getTime();
      const min = Math.round(ms / 6e4);
      if (min < 1) return "zojuist";
      if (min < 60) return `${min} min`;
      const h = Math.round(min / 60);
      if (h < 24) return `${h} uur`;
      const d = Math.round(h / 24);
      if (d < 7) return `${d}d`;
      return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    }
    function shortPreview(s, max = 140) {
      if (!s) return "";
      const clean = s.replace(/\s+/g, " ").trim();
      return clean.length > max ? clean.slice(0, max - 1) + "\u2026" : clean;
    }
    function initials(name) {
      if (!name) return "?";
      return name.split(" ").map((p) => p.charAt(0).toUpperCase()).slice(0, 2).join("");
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-e41d3cad><div class="mb-6 flex items-start justify-between gap-4" data-v-e41d3cad><div data-v-e41d3cad><div class="flex items-center gap-3" data-v-e41d3cad><h1 class="text-2xl font-bold text-gray-900" data-v-e41d3cad>Service</h1>`);
      if (unref(nieuwBinnengekomen)) {
        _push(`<button type="button" class="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700" data-v-e41d3cad><span class="relative flex h-1.5 w-1.5" data-v-e41d3cad><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" data-v-e41d3cad></span><span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" data-v-e41d3cad></span></span> ${ssrInterpolate(unref(nieuwBinnengekomen))} ${ssrInterpolate(unref(nieuwBinnengekomen) === 1 ? "nieuwe aanvraag" : "nieuwe aanvragen")}</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div><p class="mt-1 text-sm text-gray-500" data-v-e41d3cad>`);
      if (unref(counts).wacht) {
        _push(`<!--[--><span class="font-medium text-blue-700" data-v-e41d3cad>${ssrInterpolate(unref(counts).wacht)} wacht op reactie</span>`);
        if (unref(counts).in_behandeling) {
          _push(`<span data-v-e41d3cad> \xB7 ${ssrInterpolate(unref(counts).in_behandeling)} in behandeling</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<!--]-->`);
      } else if (unref(counts).in_behandeling) {
        _push(`<!--[-->${ssrInterpolate(unref(counts).in_behandeling)} in behandeling, niets wacht op jou <!--]-->`);
      } else {
        _push(`<!--[--> Alle meldingen afgehandeld <!--]-->`);
      }
      if (unref(bijgewerkt)) {
        _push(`<span class="text-gray-400" data-v-e41d3cad> \xB7 bijgewerkt ${ssrInterpolate(unref(bijgewerkt))}</span>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</p></div><button class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800" data-v-e41d3cad>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "plus",
        size: 16
      }, null, _parent));
      _push(` Nieuw ticket </button></div><div class="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between" data-v-e41d3cad><div class="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit" data-v-e41d3cad><!--[-->`);
      ssrRenderList([
        { k: "nieuw", label: "Nieuw", count: unref(counts).nieuw },
        { k: "in_behandeling", label: "In behandeling", count: unref(counts).in_behandeling },
        { k: "opgelost", label: "Opgelost", count: unref(counts).opgelost },
        { k: "alle", label: "Alle", count: unref(counts).alle }
      ], (f) => {
        _push(`<button class="${ssrRenderClass([unref(activeFilter) === f.k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"])}" data-v-e41d3cad>${ssrInterpolate(f.label)} <span class="ml-1 text-xs text-gray-400" data-v-e41d3cad>(${ssrInterpolate(f.count)})</span></button>`);
      });
      _push(`<!--]--></div><div class="relative w-full sm:w-72" data-v-e41d3cad>`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "search",
        size: 16,
        class: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
      }, null, _parent));
      _push(`<input${ssrRenderAttr("value", unref(searchQuery))} type="text" class="input pl-9" placeholder="Zoek op klant, onderwerp..." data-v-e41d3cad></div></div>`);
      if (unref(isLoading)) {
        _push(`<div class="section py-12 text-center" data-v-e41d3cad><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-e41d3cad></div></div>`);
      } else if (unref(filteredTickets).length === 0) {
        _push(`<div class="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center" data-v-e41d3cad>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "message",
          size: 32,
          class: "mx-auto text-gray-300 mb-3"
        }, null, _parent));
        _push(`<p class="text-sm text-gray-500" data-v-e41d3cad>`);
        if (unref(searchQuery)) {
          _push(`<!--[-->Geen tickets gevonden voor &quot;${ssrInterpolate(unref(searchQuery))}&quot;<!--]-->`);
        } else if (unref(activeFilter) === "nieuw") {
          _push(`<!--[-->Geen nieuwe tickets<!--]-->`);
        } else if (unref(activeFilter) === "in_behandeling") {
          _push(`<!--[-->Geen tickets in behandeling<!--]-->`);
        } else if (unref(activeFilter) === "opgelost") {
          _push(`<!--[-->Nog niets opgelost<!--]-->`);
        } else {
          _push(`<!--[-->Nog geen tickets<!--]-->`);
        }
        _push(`</p>`);
        if (!unref(searchQuery)) {
          _push(`<button class="mt-4 text-sm font-medium text-gray-700 hover:text-gray-900" data-v-e41d3cad> + Nieuw ticket aanmaken </button>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      } else {
        _push(`<div class="space-y-2" data-v-e41d3cad><!--[-->`);
        ssrRenderList(unref(filteredTickets), (t) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: t.id,
            to: `/admin/service/${t.id}`,
            class: "flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-sm no-underline"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a, _b, _c, _d;
              if (_push2) {
                _push2(`<div class="${ssrRenderClass([[moduleTint(t.module_type).bg, moduleTint(t.module_type).text], "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"])}" data-v-e41d3cad${_scopeId}>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: moduleIcon(t.module_type),
                  size: 20
                }, null, _parent2, _scopeId));
                _push2(`</div><div class="flex-1 min-w-0" data-v-e41d3cad${_scopeId}><div class="flex items-center gap-2 flex-wrap" data-v-e41d3cad${_scopeId}>`);
                if (unref(formatTicketRef)(t)) {
                  _push2(`<span class="shrink-0 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 tabular-nums" data-v-e41d3cad${_scopeId}> #${ssrInterpolate(unref(formatTicketRef)(t))}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<p class="truncate font-semibold text-gray-900 text-sm" data-v-e41d3cad${_scopeId}>${ssrInterpolate(t.subject)}</p><span class="${ssrRenderClass([[statusFor(t).bg, statusFor(t).text], "shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"])}" data-v-e41d3cad${_scopeId}><span class="${ssrRenderClass([statusFor(t).dot, "h-1.5 w-1.5 rounded-full"])}" data-v-e41d3cad${_scopeId}></span> ${ssrInterpolate(statusFor(t).label)}</span>`);
                if (t.urgency === "hoog") {
                  _push2(`<span class="shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700" data-v-e41d3cad${_scopeId}>`);
                  _push2(ssrRenderComponent(_component_AppIcon, {
                    name: "alert-circle",
                    size: 10
                  }, null, _parent2, _scopeId));
                  _push2(` Urgent </span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div><div class="mt-1 flex items-center gap-2 text-xs text-gray-500" data-v-e41d3cad${_scopeId}><div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600" data-v-e41d3cad${_scopeId}>${ssrInterpolate(initials((_a = t.customer) == null ? void 0 : _a.full_name))}</div><span class="truncate" data-v-e41d3cad${_scopeId}>${ssrInterpolate(((_b = t.customer) == null ? void 0 : _b.full_name) || "Onbekend")}</span><span class="text-gray-300" data-v-e41d3cad${_scopeId}>\xB7</span><span class="shrink-0" data-v-e41d3cad${_scopeId}>${ssrInterpolate(timeAgo(t.updated_at))}</span></div>`);
                if (t.labels && t.labels.length) {
                  _push2(`<div class="mt-2 flex flex-wrap gap-1" data-v-e41d3cad${_scopeId}><!--[-->`);
                  ssrRenderList(t.labels, (l) => {
                    _push2(`<span class="${ssrRenderClass([[unref(labelChip)(l.color).bg, unref(labelChip)(l.color).text], "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"])}" data-v-e41d3cad${_scopeId}><span class="${ssrRenderClass([unref(labelChip)(l.color).dot, "h-1 w-1 rounded-full"])}" data-v-e41d3cad${_scopeId}></span> ${ssrInterpolate(l.name)}</span>`);
                  });
                  _push2(`<!--]--></div>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<div class="mt-2 flex items-center gap-2 min-w-0" data-v-e41d3cad${_scopeId}>`);
                if (awaitsReply(t)) {
                  _push2(`<span class="shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800" title="Wacht op je reactie" data-v-e41d3cad${_scopeId}><span class="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" data-v-e41d3cad${_scopeId}></span> Reactie nodig </span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`<p class="truncate text-xs text-gray-500" data-v-e41d3cad${_scopeId}><span class="font-medium text-gray-700" data-v-e41d3cad${_scopeId}>${ssrInterpolate(lastMessagePreview(t).who)}:</span> ${ssrInterpolate(shortPreview(lastMessagePreview(t).text))}</p>`);
                if (t.message_count > 0) {
                  _push2(`<span class="shrink-0 text-[11px] text-gray-400" data-v-e41d3cad${_scopeId}> \xB7 ${ssrInterpolate(t.message_count)} ${ssrInterpolate(t.message_count === 1 ? "reactie" : "reacties")}</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div></div>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 16,
                  class: "shrink-0 text-gray-300 mt-2"
                }, null, _parent2, _scopeId));
              } else {
                return [
                  createVNode("div", {
                    class: ["flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", [moduleTint(t.module_type).bg, moduleTint(t.module_type).text]]
                  }, [
                    createVNode(_component_AppIcon, {
                      name: moduleIcon(t.module_type),
                      size: 20
                    }, null, 8, ["name"])
                  ], 2),
                  createVNode("div", { class: "flex-1 min-w-0" }, [
                    createVNode("div", { class: "flex items-center gap-2 flex-wrap" }, [
                      unref(formatTicketRef)(t) ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "shrink-0 inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-700 tabular-nums"
                      }, " #" + toDisplayString(unref(formatTicketRef)(t)), 1)) : createCommentVNode("", true),
                      createVNode("p", { class: "truncate font-semibold text-gray-900 text-sm" }, toDisplayString(t.subject), 1),
                      createVNode("span", {
                        class: ["shrink-0 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium", [statusFor(t).bg, statusFor(t).text]]
                      }, [
                        createVNode("span", {
                          class: ["h-1.5 w-1.5 rounded-full", statusFor(t).dot]
                        }, null, 2),
                        createTextVNode(" " + toDisplayString(statusFor(t).label), 1)
                      ], 2),
                      t.urgency === "hoog" ? (openBlock(), createBlock("span", {
                        key: 1,
                        class: "shrink-0 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-medium text-red-700"
                      }, [
                        createVNode(_component_AppIcon, {
                          name: "alert-circle",
                          size: 10
                        }),
                        createTextVNode(" Urgent ")
                      ])) : createCommentVNode("", true)
                    ]),
                    createVNode("div", { class: "mt-1 flex items-center gap-2 text-xs text-gray-500" }, [
                      createVNode("div", { class: "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[9px] font-semibold text-gray-600" }, toDisplayString(initials((_c = t.customer) == null ? void 0 : _c.full_name)), 1),
                      createVNode("span", { class: "truncate" }, toDisplayString(((_d = t.customer) == null ? void 0 : _d.full_name) || "Onbekend"), 1),
                      createVNode("span", { class: "text-gray-300" }, "\xB7"),
                      createVNode("span", { class: "shrink-0" }, toDisplayString(timeAgo(t.updated_at)), 1)
                    ]),
                    t.labels && t.labels.length ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "mt-2 flex flex-wrap gap-1"
                    }, [
                      (openBlock(true), createBlock(Fragment, null, renderList(t.labels, (l) => {
                        return openBlock(), createBlock("span", {
                          key: l.id,
                          class: ["inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", [unref(labelChip)(l.color).bg, unref(labelChip)(l.color).text]]
                        }, [
                          createVNode("span", {
                            class: ["h-1 w-1 rounded-full", unref(labelChip)(l.color).dot]
                          }, null, 2),
                          createTextVNode(" " + toDisplayString(l.name), 1)
                        ], 2);
                      }), 128))
                    ])) : createCommentVNode("", true),
                    createVNode("div", { class: "mt-2 flex items-center gap-2 min-w-0" }, [
                      awaitsReply(t) ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "shrink-0 inline-flex items-center gap-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800",
                        title: "Wacht op je reactie"
                      }, [
                        createVNode("span", { class: "h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" }),
                        createTextVNode(" Reactie nodig ")
                      ])) : createCommentVNode("", true),
                      createVNode("p", { class: "truncate text-xs text-gray-500" }, [
                        createVNode("span", { class: "font-medium text-gray-700" }, toDisplayString(lastMessagePreview(t).who) + ":", 1),
                        createTextVNode(" " + toDisplayString(shortPreview(lastMessagePreview(t).text)), 1)
                      ]),
                      t.message_count > 0 ? (openBlock(), createBlock("span", {
                        key: 1,
                        class: "shrink-0 text-[11px] text-gray-400"
                      }, " \xB7 " + toDisplayString(t.message_count) + " " + toDisplayString(t.message_count === 1 ? "reactie" : "reacties"), 1)) : createCommentVNode("", true)
                    ])
                  ]),
                  createVNode(_component_AppIcon, {
                    name: "chevron-right",
                    size: 16,
                    class: "shrink-0 text-gray-300 mt-2"
                  })
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div>`);
      }
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(showCreateModal)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-e41d3cad><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-e41d3cad></div><div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden" data-v-e41d3cad><div class="border-b border-gray-100 px-6 py-4 flex items-center justify-between" data-v-e41d3cad><h3 class="text-lg font-semibold text-gray-900" data-v-e41d3cad>Nieuw ticket</h3><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100" data-v-e41d3cad>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div><form class="px-6 py-5 space-y-4" data-v-e41d3cad><div data-v-e41d3cad><label class="label" data-v-e41d3cad>Klant <span class="text-red-400" data-v-e41d3cad>*</span></label><select class="input" required data-v-e41d3cad><option value="" disabled data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).customer_id) ? ssrLooseContain(unref(createForm).customer_id, "") : ssrLooseEqual(unref(createForm).customer_id, "")) ? " selected" : ""}>Selecteer klant...</option><!--[-->`);
          ssrRenderList(unref(customers), (c) => {
            _push2(`<option${ssrRenderAttr("value", c.id)} data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).customer_id) ? ssrLooseContain(unref(createForm).customer_id, c.id) : ssrLooseEqual(unref(createForm).customer_id, c.id)) ? " selected" : ""}>${ssrInterpolate(c.full_name || c.email)}</option>`);
          });
          _push2(`<!--]--></select></div><div data-v-e41d3cad><label class="label" data-v-e41d3cad>Onderwerp <span class="text-red-400" data-v-e41d3cad>*</span></label><input${ssrRenderAttr("value", unref(createForm).subject)} type="text" class="input" placeholder="Bijv. Storing zonnepanelen" required data-v-e41d3cad></div><div class="grid grid-cols-2 gap-3" data-v-e41d3cad><div data-v-e41d3cad><label class="label" data-v-e41d3cad>Module</label><select class="input" data-v-e41d3cad><option value="" data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).module_type) ? ssrLooseContain(unref(createForm).module_type, "") : ssrLooseEqual(unref(createForm).module_type, "")) ? " selected" : ""}>Algemeen</option><option value="solar" data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).module_type) ? ssrLooseContain(unref(createForm).module_type, "solar") : ssrLooseEqual(unref(createForm).module_type, "solar")) ? " selected" : ""}>Zonnepanelen</option><option value="heat_pump" data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).module_type) ? ssrLooseContain(unref(createForm).module_type, "heat_pump") : ssrLooseEqual(unref(createForm).module_type, "heat_pump")) ? " selected" : ""}>Warmtepomp</option><option value="ev_charger" data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).module_type) ? ssrLooseContain(unref(createForm).module_type, "ev_charger") : ssrLooseEqual(unref(createForm).module_type, "ev_charger")) ? " selected" : ""}>Laadpaal</option><option value="battery" data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).module_type) ? ssrLooseContain(unref(createForm).module_type, "battery") : ssrLooseEqual(unref(createForm).module_type, "battery")) ? " selected" : ""}>Batterij</option></select></div><div data-v-e41d3cad><label class="label" data-v-e41d3cad>Urgentie</label><select class="input" data-v-e41d3cad><option value="laag" data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).urgency) ? ssrLooseContain(unref(createForm).urgency, "laag") : ssrLooseEqual(unref(createForm).urgency, "laag")) ? " selected" : ""}>Laag</option><option value="normaal" data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).urgency) ? ssrLooseContain(unref(createForm).urgency, "normaal") : ssrLooseEqual(unref(createForm).urgency, "normaal")) ? " selected" : ""}>Normaal</option><option value="hoog" data-v-e41d3cad${ssrIncludeBooleanAttr(Array.isArray(unref(createForm).urgency) ? ssrLooseContain(unref(createForm).urgency, "hoog") : ssrLooseEqual(unref(createForm).urgency, "hoog")) ? " selected" : ""}>Hoog</option></select></div></div><div data-v-e41d3cad><label class="label" data-v-e41d3cad>Omschrijving</label><textarea class="input" rows="3" placeholder="Beschrijf het probleem..." data-v-e41d3cad>${ssrInterpolate(unref(createForm).description)}</textarea></div>`);
          if (unref(createError)) {
            _push2(`<p class="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600" data-v-e41d3cad>${ssrInterpolate(unref(createError))}</p>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</form><div class="border-t border-gray-100 px-6 py-4 flex justify-end gap-3" data-v-e41d3cad><button class="btn-secondary" data-v-e41d3cad>Annuleren</button><button class="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(createForm).customer_id || !unref(createForm).subject || unref(creating)) ? " disabled" : ""} data-v-e41d3cad>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "plus",
            size: 16
          }, null, _parent));
          _push2(` ${ssrInterpolate(unref(creating) ? "Aanmaken..." : "Ticket aanmaken")}</button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/service/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-e41d3cad"]]);

export { index as default };
//# sourceMappingURL=index-DOTV46hP.mjs.map
