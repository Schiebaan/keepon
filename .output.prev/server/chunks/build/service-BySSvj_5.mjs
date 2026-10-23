import { c as _export_sfc, u as usePartner, _ as _sfc_main$5, f as useSupabaseClient } from './server.mjs';
import { defineComponent, ref, watch, computed, mergeProps, unref, nextTick, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderClass, ssrRenderStyle, ssrRenderList, ssrIncludeBooleanAttr, ssrRenderAttr } from 'vue/server-renderer';
import { f as formatTicketRef } from './formatters-BMgUYP7c.mjs';
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
  __name: "service",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    const tickets = ref([]);
    const ticketsLoading = ref(true);
    const activeChat = ref(null);
    const startInput = ref("");
    const messageInput = ref("");
    const isAiTyping = ref(false);
    const messagesContainer = ref(null);
    function loadLastSeen() {
      return {};
    }
    const lastSeen = ref(loadLastSeen());
    async function authHeaders() {
      const supabase = useSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      return (session == null ? void 0 : session.access_token) ? { Authorization: `Bearer ${session.access_token}` } : {};
    }
    function scrollToBottom() {
      nextTick(() => {
        if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      });
    }
    watch(() => {
      var _a;
      return (_a = activeChat.value) == null ? void 0 : _a.messages.length;
    }, scrollToBottom);
    function formatTime(t) {
      return new Date(t).toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    }
    function timeAgo(t) {
      const then = new Date(t).getTime();
      const diffMin = Math.round((Date.now() - then) / 6e4);
      if (diffMin < 1) return "zojuist";
      if (diffMin < 60) return `${diffMin} min geleden`;
      const diffH = Math.round(diffMin / 60);
      if (diffH < 24) return `${diffH} uur geleden`;
      const diffD = Math.round(diffH / 24);
      if (diffD < 7) return `${diffD} dag${diffD === 1 ? "" : "en"} geleden`;
      return new Date(t).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    }
    function isUnread(t) {
      if (t.status === "gesloten") return false;
      const last = t.latest_message;
      if (!last || last.role !== "installer") return false;
      const seen = lastSeen.value[t.id];
      return !seen || new Date(seen).getTime() < new Date(last.at || t.updated_at).getTime();
    }
    const quickActions = [
      { label: "Hoe presteren mijn zonnepanelen?", moduleType: "solar", icon: "solar" },
      { label: "Vraag over mijn warmtepomp", moduleType: "heat_pump", icon: "heat-pump" },
      { label: "Status van mijn laadpaal", moduleType: "ev_charger", icon: "ev-charger" },
      { label: "Vraag over mijn factuur", moduleType: null, icon: "file-text" }
    ];
    async function loadTickets(background = false) {
      if (!background) ticketsLoading.value = true;
      try {
        tickets.value = await $fetch("/api/customer/tickets", { headers: await authHeaders() });
      } catch {
        if (!background) tickets.value = [];
      } finally {
        if (!background) ticketsLoading.value = false;
      }
    }
    useLiveRefresh(() => loadTickets(true), { intervalMs: 6e4 });
    const openTickets = computed(() => tickets.value.filter((t) => t.status !== "opgelost" && t.status !== "gesloten"));
    const resolvedTickets = computed(() => tickets.value.filter((t) => t.status === "opgelost" || t.status === "gesloten"));
    const unreadCount = computed(() => tickets.value.filter(isUnread).length);
    const isClosing = ref(false);
    const closeError = ref("");
    ref(false);
    const helpedBySaving = ref(false);
    const helpedByError = ref("");
    const helpedByOptions = computed(() => {
      if (!activeChat.value) return [];
      const seen = /* @__PURE__ */ new Set();
      const out = [];
      for (const m of activeChat.value.messages) {
        if (m.role !== "installer") continue;
        const n = (m.author_name || "").trim();
        if (!n || seen.has(n)) continue;
        seen.add(n);
        out.push(n);
      }
      return out;
    });
    function statusLabel(t) {
      if (t.status === "opgelost") return "Opgelost";
      if (t.status === "gesloten") return "Afgehandeld";
      const last = t.latest_message;
      if ((last == null ? void 0 : last.role) === "installer") {
        return last.author_name ? `Reactie van ${last.author_name} (${partner.value.name})` : `Reactie van ${partner.value.name}`;
      }
      if ((last == null ? void 0 : last.role) === "customer") return "Wacht op installateur";
      if (t.status === "in_behandeling") return "In behandeling";
      return `Ontvangen \xB7 wacht op ${partner.value.name}`;
    }
    function statusDotClass(t) {
      if (t.status === "opgelost" || t.status === "gesloten") return "bg-gray-300";
      if (isUnread(t)) return "bg-green-500 animate-pulse";
      const last = t.latest_message;
      if ((last == null ? void 0 : last.role) === "installer") return "bg-green-500";
      return "bg-blue-500";
    }
    function cardClass(t) {
      if (isUnread(t)) return "border-green-200 bg-green-50/40 hover:bg-green-50";
      if (t.status === "opgelost" || t.status === "gesloten") return "border-gray-100 bg-white/60 hover:bg-white";
      return "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm";
    }
    function chatStatusBadge(s) {
      switch (s) {
        case "actief":
          return "bg-blue-50 text-blue-700";
        case "ai_opgelost":
          return "bg-green-50 text-green-700";
        case "geescaleerd":
          return "bg-amber-50 text-amber-700";
        default:
          return "bg-gray-100 text-gray-600";
      }
    }
    function chatStatusLabel(s) {
      switch (s) {
        case "actief":
          return "Actief";
        case "ai_opgelost":
          return "Opgelost";
        case "geescaleerd":
          return "Bij installateur";
        default:
          return s;
      }
    }
    function moduleIcon(m) {
      switch (m) {
        case "solar":
          return "solar";
        case "heat_pump":
          return "heat-pump";
        case "ev_charger":
          return "ev-charger";
        case "battery":
          return "battery";
        default:
          return "help-circle";
      }
    }
    function moduleTint(m) {
      switch (m) {
        case "solar":
          return { bg: "bg-amber-50", text: "text-amber-600" };
        case "heat_pump":
          return { bg: "bg-orange-50", text: "text-orange-600" };
        case "ev_charger":
          return { bg: "bg-sky-50", text: "text-sky-600" };
        case "battery":
          return { bg: "bg-violet-50", text: "text-violet-600" };
        default:
          return { bg: "bg-gray-100", text: "text-gray-500" };
      }
    }
    function shortPreview(s, max = 120) {
      if (!s) return "";
      const firstLine = s.split("\n")[0];
      return firstLine.length > max ? firstLine.slice(0, max - 1) + "\u2026" : firstLine;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex flex-col" }, _attrs))} data-v-1af23f2c>`);
      if (unref(activeChat)) {
        _push(`<div class="flex flex-col" data-v-1af23f2c><div class="mb-4 flex items-center gap-3 border-b border-gray-100 pb-3" data-v-1af23f2c><button class="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900" data-v-1af23f2c>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "chevron-right",
          size: 16,
          class: "rotate-180"
        }, null, _parent));
        _push(` Terug naar service </button><div class="min-w-0 flex-1" data-v-1af23f2c><h2 class="truncate text-sm font-semibold text-gray-900" data-v-1af23f2c>${ssrInterpolate(unref(activeChat).subject)}</h2>`);
        if (unref(formatTicketRef)({ ticket_number: unref(activeChat).ticketNumber })) {
          _push(`<p class="text-[11px] text-gray-500" data-v-1af23f2c> Ticket ${ssrInterpolate(unref(formatTicketRef)({ ticket_number: unref(activeChat).ticketNumber }))}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><span class="${ssrRenderClass([chatStatusBadge(unref(activeChat).status), "rounded-full px-2 py-0.5 text-[11px] font-medium"])}" data-v-1af23f2c>${ssrInterpolate(chatStatusLabel(unref(activeChat).status))}</span></div><div class="space-y-4 overflow-y-auto pb-4 pr-1" style="${ssrRenderStyle({ "max-height": "calc(100vh - 340px)", "min-height": "300px" })}" data-v-1af23f2c><!--[-->`);
        ssrRenderList(unref(activeChat).messages, (msg) => {
          var _a, _b;
          _push(`<!--[-->`);
          if (msg.role === "ai") {
            _push(`<div class="flex items-start gap-2.5" data-v-1af23f2c><div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white" data-v-1af23f2c>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "zap",
              size: 14
            }, null, _parent));
            _push(`</div><div class="max-w-[85%]" data-v-1af23f2c><div class="chat-bubble-ai" data-v-1af23f2c><p class="whitespace-pre-line text-sm text-gray-800" data-v-1af23f2c>${ssrInterpolate(msg.content)}</p></div>`);
            if (((_a = msg.metadata) == null ? void 0 : _a.systemCheck) && ((_b = msg.metadata.dataPoints) == null ? void 0 : _b.length)) {
              _push(`<div class="mt-2 rounded-xl border border-blue-100 bg-blue-50 px-3.5 py-2.5" data-v-1af23f2c><p class="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-500" data-v-1af23f2c>`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "activity",
                size: 12
              }, null, _parent));
              _push(` Systeemcheck </p><div class="grid grid-cols-3 gap-2" data-v-1af23f2c><!--[-->`);
              ssrRenderList(msg.metadata.dataPoints, (dp) => {
                _push(`<div data-v-1af23f2c><p class="text-[11px] text-blue-400" data-v-1af23f2c>${ssrInterpolate(dp.label)}</p><p class="text-xs font-semibold text-blue-800" data-v-1af23f2c>${ssrInterpolate(dp.value)}</p></div>`);
              });
              _push(`<!--]--></div></div>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<p class="mt-1 text-[11px] text-gray-400" data-v-1af23f2c>AI-assistent \xB7 ${ssrInterpolate(formatTime(msg.timestamp))}</p></div></div>`);
          } else if (msg.role === "customer") {
            _push(`<div class="flex items-start justify-end gap-2.5" data-v-1af23f2c><div class="max-w-[85%]" data-v-1af23f2c><div class="chat-bubble-customer" data-v-1af23f2c><p class="whitespace-pre-line text-sm" data-v-1af23f2c>${ssrInterpolate(msg.content)}</p></div><p class="mt-1 text-right text-[11px] text-gray-400" data-v-1af23f2c>${ssrInterpolate(formatTime(msg.timestamp))}</p></div></div>`);
          } else if (msg.role === "installer") {
            _push(`<div class="flex items-start gap-2.5" data-v-1af23f2c><div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white" data-v-1af23f2c>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "tool",
              size: 14
            }, null, _parent));
            _push(`</div><div class="max-w-[85%]" data-v-1af23f2c><div class="chat-bubble-installer" data-v-1af23f2c><p class="mb-1 text-[11px] font-semibold text-orange-700" data-v-1af23f2c>`);
            if (msg.author_name) {
              _push(`<!--[-->${ssrInterpolate(msg.author_name)} <span class="font-normal text-orange-600/70" data-v-1af23f2c>van ${ssrInterpolate(unref(partner).name)}</span><!--]-->`);
            } else {
              _push(`<!--[-->${ssrInterpolate(unref(partner).name)}<!--]-->`);
            }
            _push(`</p><p class="whitespace-pre-line text-sm text-gray-800" data-v-1af23f2c>${ssrInterpolate(msg.content)}</p></div><p class="mt-1 text-[11px] text-gray-400" data-v-1af23f2c>${ssrInterpolate(formatTime(msg.timestamp))}</p></div></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<!--]-->`);
        });
        _push(`<!--]-->`);
        if (unref(isAiTyping)) {
          _push(`<div class="flex items-start gap-2.5" data-v-1af23f2c><div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white" data-v-1af23f2c>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "zap",
            size: 14
          }, null, _parent));
          _push(`</div><div class="chat-bubble-ai" data-v-1af23f2c><div class="typing-indicator" data-v-1af23f2c><span data-v-1af23f2c></span><span data-v-1af23f2c></span><span data-v-1af23f2c></span></div></div></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(activeChat).ticketId && (unref(activeChat).ticketStatus === "opgelost" || unref(activeChat).ticketStatus === "gesloten") && (unref(activeChat).helpedByName || unref(helpedByOptions).length)) {
          _push(`<div class="mb-3 rounded-xl border border-green-100 bg-green-50/60 p-3" data-v-1af23f2c>`);
          if (unref(activeChat).helpedByName) {
            _push(`<p class="flex items-center gap-2 text-sm text-green-900" data-v-1af23f2c>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 14,
              class: "text-green-600"
            }, null, _parent));
            _push(` Bedankt \u2014 <strong data-v-1af23f2c>${ssrInterpolate(unref(activeChat).helpedByName)}</strong> staat genoteerd als degene die je geholpen heeft. </p>`);
          } else {
            _push(`<!--[--><p class="text-xs font-medium text-gray-700 mb-2" data-v-1af23f2c> Wie heeft je geholpen? <span class="font-normal text-gray-500" data-v-1af23f2c>Tik op de naam van de juiste persoon.</span></p><div class="flex flex-wrap gap-1.5" data-v-1af23f2c><!--[-->`);
            ssrRenderList(unref(helpedByOptions), (name) => {
              _push(`<button type="button" class="inline-flex items-center gap-1.5 rounded-full border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100 disabled:opacity-50"${ssrIncludeBooleanAttr(unref(helpedBySaving)) ? " disabled" : ""} data-v-1af23f2c>`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "user",
                size: 12
              }, null, _parent));
              _push(` ${ssrInterpolate(name)}</button>`);
            });
            _push(`<!--]--></div>`);
            if (unref(helpedByError)) {
              _push(`<p class="mt-1.5 text-[11px] text-red-600" data-v-1af23f2c>${ssrInterpolate(unref(helpedByError))}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<!--]-->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(activeChat).ticketId && unref(activeChat).ticketStatus !== "opgelost" && unref(activeChat).ticketStatus !== "gesloten") {
          _push(`<div class="mb-3" data-v-1af23f2c><button type="button" class="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-60"${ssrIncludeBooleanAttr(unref(isClosing)) ? " disabled" : ""} data-v-1af23f2c>`);
          if (unref(isClosing)) {
            _push(`<span class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-green-400 border-t-transparent" data-v-1af23f2c></span>`);
          } else {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 14
            }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(isClosing) ? "Bezig..." : "Melding is opgelost, afsluiten")}</button><p class="mt-1.5 text-[11px] text-gray-400" data-v-1af23f2c>Je kunt hierna altijd nog reageren; de melding gaat dan vanzelf weer open.</p>`);
          if (unref(closeError)) {
            _push(`<p class="mt-1.5 text-[11px] text-red-600" data-v-1af23f2c>${ssrInterpolate(unref(closeError))}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(activeChat).status === "actief" && !unref(isAiTyping) && unref(activeChat).messages.length > 1) {
          _push(`<div class="mb-3 flex flex-wrap gap-2" data-v-1af23f2c><button class="inline-flex items-center gap-1.5 rounded-lg border border-green-300 bg-white px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50" data-v-1af23f2c>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 14
          }, null, _parent));
          _push(` Dit helpt, bedankt! </button><button class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50" data-v-1af23f2c>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "phone",
            size: 14
          }, null, _parent));
          _push(` Stuur door naar ${ssrInterpolate(unref(partner).name)}</button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="border-t border-gray-100 pt-3" data-v-1af23f2c><form class="flex items-center gap-2" data-v-1af23f2c><input${ssrRenderAttr("value", unref(messageInput))} type="text" class="input flex-1"${ssrRenderAttr("placeholder", unref(activeChat).ticketId ? `Reageer aan ${unref(partner).name}...` : "Typ een bericht...")}${ssrIncludeBooleanAttr(unref(activeChat).status === "ai_opgelost" && !unref(activeChat).ticketId || unref(isAiTyping)) ? " disabled" : ""} data-v-1af23f2c><button type="submit"${ssrIncludeBooleanAttr(!unref(messageInput).trim() || unref(isAiTyping) || unref(activeChat).status === "ai_opgelost" && !unref(activeChat).ticketId) ? " disabled" : ""} class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600" data-v-1af23f2c>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "send",
          size: 18
        }, null, _parent));
        _push(`</button></form>`);
        if (unref(activeChat).ticketId) {
          _push(`<p class="mt-2 text-center text-[11px] text-gray-500" data-v-1af23f2c> Elke reactie stuurt een mail naar ${ssrInterpolate(unref(partner).name)}. Gesloten meldingen worden automatisch heropend. </p>`);
        } else if (unref(activeChat).status === "geescaleerd") {
          _push(`<p class="mt-2 text-center text-[11px] text-gray-500" data-v-1af23f2c> Deze melding is bij ${ssrInterpolate(unref(partner).name)}. Je krijgt een reactie via e-mail en ziet &#39;m ook hier terug. </p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!--[--><div class="mb-6 flex items-start justify-between gap-4" data-v-1af23f2c><div data-v-1af23f2c><h1 class="text-2xl font-bold text-gray-900" data-v-1af23f2c>Service</h1><p class="mt-1 text-sm text-gray-500" data-v-1af23f2c>Stel een vraag of bekijk je lopende meldingen.</p></div>`);
        if (unref(unreadCount)) {
          _push(`<div class="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700" data-v-1af23f2c><span class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" data-v-1af23f2c></span> ${ssrInterpolate(unref(unreadCount))} nieuw${ssrInterpolate(unref(unreadCount) === 1 ? "" : "e")} reactie${ssrInterpolate(unref(unreadCount) === 1 ? "" : "s")}</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div><div class="mb-6 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] shadow-sm" data-v-1af23f2c><div class="rounded-2xl bg-white p-5" data-v-1af23f2c><div class="flex items-start gap-4" data-v-1af23f2c><div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white" data-v-1af23f2c>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "zap",
          size: 22
        }, null, _parent));
        _push(`</div><div class="flex-1 min-w-0" data-v-1af23f2c><p class="text-xs font-semibold uppercase tracking-wider text-indigo-600" data-v-1af23f2c>AI-assistent</p><p class="mt-0.5 text-base font-semibold text-gray-900" data-v-1af23f2c>Hoe kunnen we helpen?</p><p class="mt-0.5 text-xs text-gray-500" data-v-1af23f2c>Direct antwoord met een live check op je systeem \u2014 of we sturen door naar ${ssrInterpolate(unref(partner).name)}.</p><form class="mt-3 flex items-center gap-2" data-v-1af23f2c><input${ssrRenderAttr("value", unref(startInput))} type="text" class="input flex-1" placeholder="Stel je vraag..." data-v-1af23f2c><button type="submit"${ssrIncludeBooleanAttr(!unref(startInput).trim()) ? " disabled" : ""} class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600" data-v-1af23f2c>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "send",
          size: 18
        }, null, _parent));
        _push(`</button></form><div class="mt-3 flex flex-wrap gap-2" data-v-1af23f2c><!--[-->`);
        ssrRenderList(quickActions, (action) => {
          _push(`<button class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-gray-600 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700" data-v-1af23f2c>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: action.icon,
            size: 12
          }, null, _parent));
          _push(` ${ssrInterpolate(action.label)}</button>`);
        });
        _push(`<!--]--></div></div></div></div></div>`);
        if (unref(openTickets).length || unref(ticketsLoading)) {
          _push(`<section class="mb-6" data-v-1af23f2c><div class="mb-3 flex items-center justify-between" data-v-1af23f2c><h2 class="text-sm font-semibold text-gray-900" data-v-1af23f2c> Lopende meldingen <span class="ml-1 text-gray-400 font-normal" data-v-1af23f2c>(${ssrInterpolate(unref(openTickets).length)})</span></h2></div>`);
          if (unref(ticketsLoading)) {
            _push(`<div class="py-6 text-center" data-v-1af23f2c><div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-1af23f2c></div></div>`);
          } else {
            _push(`<div class="space-y-2" data-v-1af23f2c><!--[-->`);
            ssrRenderList(unref(openTickets), (t) => {
              _push(`<button class="${ssrRenderClass([cardClass(t), "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all"])}" data-v-1af23f2c><div class="${ssrRenderClass([[moduleTint(t.module_type).bg, moduleTint(t.module_type).text], "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"])}" data-v-1af23f2c>`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: moduleIcon(t.module_type),
                size: 20
              }, null, _parent));
              _push(`</div><div class="min-w-0 flex-1" data-v-1af23f2c><div class="flex items-center gap-2 flex-wrap" data-v-1af23f2c>`);
              if (unref(formatTicketRef)(t)) {
                _push(`<span class="shrink-0 inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-bold text-gray-700 tabular-nums" data-v-1af23f2c> #${ssrInterpolate(unref(formatTicketRef)(t))}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`<p class="truncate font-semibold text-gray-900 text-sm" data-v-1af23f2c>${ssrInterpolate(t.subject)}</p>`);
              if (isUnread(t)) {
                _push(`<span class="shrink-0 rounded-full bg-green-500 px-2 py-0.5 text-[10px] font-semibold text-white" data-v-1af23f2c> Nieuw </span>`);
              } else if (t.urgency === "hoog") {
                _push(`<span class="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-red-600" data-v-1af23f2c>`);
                _push(ssrRenderComponent(_component_AppIcon, {
                  name: "alert-circle",
                  size: 10
                }, null, _parent));
                _push(` Urgent </span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div><p class="mt-1 truncate text-xs text-gray-500" data-v-1af23f2c>`);
              if (t.latest_message) {
                _push(`<!--[--><span class="font-medium text-gray-700" data-v-1af23f2c>${ssrInterpolate(t.latest_message.role === "installer" ? t.latest_message.author_name ? `${t.latest_message.author_name} van ${unref(partner).name}` : unref(partner).name : "Jij")}:</span> ${ssrInterpolate(shortPreview(t.latest_message.text))}<!--]-->`);
              } else {
                _push(`<!--[--><span class="font-medium text-gray-700" data-v-1af23f2c>Jouw melding:</span> ${ssrInterpolate(shortPreview(t.description))}<!--]-->`);
              }
              if ((t.message_count || 0) > 0) {
                _push(`<span class="ml-1 text-gray-400" data-v-1af23f2c>\xB7 ${ssrInterpolate(t.message_count)} ${ssrInterpolate(t.message_count === 1 ? "reactie" : "reacties")}</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</p><div class="mt-2 flex items-center gap-3 text-[11px] text-gray-400" data-v-1af23f2c><span class="inline-flex items-center gap-1" data-v-1af23f2c><span class="${ssrRenderClass([statusDotClass(t), "h-1.5 w-1.5 rounded-full"])}" data-v-1af23f2c></span> ${ssrInterpolate(statusLabel(t))}</span><span data-v-1af23f2c>\xB7</span><span data-v-1af23f2c>${ssrInterpolate(timeAgo(t.updated_at))}</span></div></div>`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 16,
                class: "shrink-0 text-gray-300 mt-3"
              }, null, _parent));
              _push(`</button>`);
            });
            _push(`<!--]--></div>`);
          }
          _push(`</section>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(resolvedTickets).length) {
          _push(`<section class="mb-6" data-v-1af23f2c><h2 class="mb-3 text-sm font-semibold text-gray-500" data-v-1af23f2c> Afgehandeld <span class="ml-1 font-normal text-gray-400" data-v-1af23f2c>(${ssrInterpolate(unref(resolvedTickets).length)})</span></h2><div class="space-y-2" data-v-1af23f2c><!--[-->`);
          ssrRenderList(unref(resolvedTickets), (t) => {
            _push(`<button class="flex w-full items-center gap-3 rounded-xl border border-gray-100 bg-white/60 p-3 text-left transition-all hover:bg-white" data-v-1af23f2c><div class="${ssrRenderClass([[moduleTint(t.module_type).bg, moduleTint(t.module_type).text], "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg opacity-70"])}" data-v-1af23f2c>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: moduleIcon(t.module_type),
              size: 16
            }, null, _parent));
            _push(`</div><div class="min-w-0 flex-1" data-v-1af23f2c><div class="flex items-center gap-1.5" data-v-1af23f2c>`);
            if (unref(formatTicketRef)(t)) {
              _push(`<span class="text-[10px] font-semibold text-gray-400 shrink-0" data-v-1af23f2c>#${ssrInterpolate(unref(formatTicketRef)(t))}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`<p class="truncate text-sm text-gray-600" data-v-1af23f2c>${ssrInterpolate(t.subject)}</p></div><p class="text-[11px] text-gray-400" data-v-1af23f2c>Opgelost \xB7 ${ssrInterpolate(timeAgo(t.updated_at))}</p></div>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "chevron-right",
              size: 14,
              class: "shrink-0 text-gray-300"
            }, null, _parent));
            _push(`</button>`);
          });
          _push(`<!--]--></div></section>`);
        } else {
          _push(`<!---->`);
        }
        if (!unref(ticketsLoading) && !unref(tickets).length) {
          _push(`<div class="mb-6 rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center" data-v-1af23f2c>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "message",
            size: 32,
            class: "mx-auto text-gray-300 mb-2"
          }, null, _parent));
          _push(`<p class="text-sm text-gray-500" data-v-1af23f2c>Nog geen meldingen. Stel hierboven een vraag of neem direct contact op.</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mt-2 rounded-2xl bg-white border border-gray-100 p-5" data-v-1af23f2c><h3 class="text-sm font-semibold text-gray-900 mb-3" data-v-1af23f2c>Direct contact met ${ssrInterpolate(unref(partner).name)}</h3><div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-v-1af23f2c>`);
        if (unref(partner).support_email) {
          _push(`<a${ssrRenderAttr("href", "mailto:" + unref(partner).support_email)} class="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors" data-v-1af23f2c><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600" data-v-1af23f2c>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "mail",
            size: 18
          }, null, _parent));
          _push(`</div><div data-v-1af23f2c><p class="text-xs text-gray-400" data-v-1af23f2c>E-mail</p><p class="text-sm font-medium text-gray-900" data-v-1af23f2c>${ssrInterpolate(unref(partner).support_email)}</p></div></a>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(partner).support_phone) {
          _push(`<a${ssrRenderAttr("href", "tel:" + unref(partner).support_phone)} class="flex items-center gap-3 rounded-xl border border-gray-100 p-3 hover:bg-gray-50 transition-colors" data-v-1af23f2c><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600" data-v-1af23f2c>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "phone",
            size: 18
          }, null, _parent));
          _push(`</div><div data-v-1af23f2c><p class="text-xs text-gray-400" data-v-1af23f2c>Telefoon</p><p class="text-sm font-medium text-gray-900" data-v-1af23f2c>${ssrInterpolate(unref(partner).support_phone)}</p></div></a>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div><!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/klant/service.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const service = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-1af23f2c"]]);

export { service as default };
//# sourceMappingURL=service-BySSvj_5.mjs.map
