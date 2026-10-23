import { _ as _sfc_main$1 } from './BrandedShell-BwN96rOe.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { l as useAuth, b as useMockData, _ as _sfc_main$5, j as useRuntimeConfig } from './server.mjs';
import { defineComponent, withCtx, unref, createVNode, openBlock, createBlock, createCommentVNode, toDisplayString, useSSRContext } from 'vue';
import { ssrRenderComponent, ssrRenderAttr, ssrRenderStyle, ssrInterpolate } from 'vue/server-renderer';
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
    const config = useRuntimeConfig();
    const { user, userRole, resolveRole } = useAuth();
    const partner = config.public.demoMode ? useMockData().partner : null;
    if (!config.public.demoMode) ;
    return (_ctx, _push, _parent, _attrs) => {
      const _component_BrandedShell = _sfc_main$1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(ssrRenderComponent(_component_BrandedShell, _attrs, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (!unref(config).public.demoMode) {
              _push2(`<div class="flex min-h-screen items-center justify-center px-4"${_scopeId}><div class="text-center"${_scopeId}><div class="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600"${_scopeId}></div><p class="text-sm text-gray-500"${_scopeId}>Laden...</p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(config).public.demoMode) {
              _push2(`<div class="flex min-h-screen items-center justify-center px-4"${_scopeId}><div class="w-full max-w-md"${_scopeId}><div class="mb-8 text-center"${_scopeId}>`);
              if (unref(partner).logo_url) {
                _push2(`<div class="mx-auto mb-5 flex items-center justify-center"${_scopeId}><img${ssrRenderAttr("src", unref(partner).logo_url)}${ssrRenderAttr("alt", unref(partner).name)} class="h-20 w-auto max-w-[280px] object-contain"${_scopeId}></div>`);
              } else {
                _push2(`<div class="mx-auto mb-4 h-1 w-12 rounded-full" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}"${_scopeId}></div>`);
              }
              _push2(`<h1 class="text-3xl font-bold tracking-tight text-gray-900"${_scopeId}>${ssrInterpolate(unref(partner).name)}</h1><p class="mt-2 text-sm text-gray-500"${_scopeId}> Modulair klantportaal voor installateurs </p></div><div class="space-y-3"${_scopeId}>`);
              _push2(ssrRenderComponent(_component_NuxtLink, {
                to: "/platform",
                class: "group flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm transition-all hover:border-gray-700 hover:shadow-md"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppIcon, {
                      name: "globe",
                      size: 24
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div${_scopeId2}><p class="font-semibold text-white"${_scopeId2}>Platform beheer</p><p class="text-sm text-gray-400"${_scopeId2}>Partners, klanten en platform inzicht</p></div>`);
                    _push3(ssrRenderComponent(_component_AppIcon, {
                      name: "chevron-right",
                      size: 18,
                      class: "ml-auto text-gray-500 transition-colors group-hover:text-gray-300"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode("div", { class: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors" }, [
                        createVNode(_component_AppIcon, {
                          name: "globe",
                          size: 24
                        })
                      ]),
                      createVNode("div", null, [
                        createVNode("p", { class: "font-semibold text-white" }, "Platform beheer"),
                        createVNode("p", { class: "text-sm text-gray-400" }, "Partners, klanten en platform inzicht")
                      ]),
                      createVNode(_component_AppIcon, {
                        name: "chevron-right",
                        size: 18,
                        class: "ml-auto text-gray-500 transition-colors group-hover:text-gray-300"
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_NuxtLink, {
                to: "/admin",
                class: "group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color + "15", color: unref(partner).primary_color })}"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppIcon, {
                      name: "settings",
                      size: 24
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div${_scopeId2}><p class="font-semibold text-gray-900"${_scopeId2}>Installateur portaal</p><p class="text-sm text-gray-500"${_scopeId2}>Klanten, modules en omzet beheren</p></div>`);
                    _push3(ssrRenderComponent(_component_AppIcon, {
                      name: "chevron-right",
                      size: 18,
                      class: "ml-auto text-gray-300 transition-colors group-hover:text-gray-500"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode("div", {
                        class: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                        style: { backgroundColor: unref(partner).primary_color + "15", color: unref(partner).primary_color }
                      }, [
                        createVNode(_component_AppIcon, {
                          name: "settings",
                          size: 24
                        })
                      ], 4),
                      createVNode("div", null, [
                        createVNode("p", { class: "font-semibold text-gray-900" }, "Installateur portaal"),
                        createVNode("p", { class: "text-sm text-gray-500" }, "Klanten, modules en omzet beheren")
                      ]),
                      createVNode(_component_AppIcon, {
                        name: "chevron-right",
                        size: 18,
                        class: "ml-auto text-gray-300 transition-colors group-hover:text-gray-500"
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(ssrRenderComponent(_component_NuxtLink, {
                to: "/klant",
                class: "group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100"${_scopeId2}>`);
                    _push3(ssrRenderComponent(_component_AppIcon, {
                      name: "home",
                      size: 24
                    }, null, _parent3, _scopeId2));
                    _push3(`</div><div${_scopeId2}><p class="font-semibold text-gray-900"${_scopeId2}>Klant portaal</p><p class="text-sm text-gray-500"${_scopeId2}>Mijn huis, systemen en contracten</p></div>`);
                    _push3(ssrRenderComponent(_component_AppIcon, {
                      name: "chevron-right",
                      size: 18,
                      class: "ml-auto text-gray-300 transition-colors group-hover:text-gray-500"
                    }, null, _parent3, _scopeId2));
                  } else {
                    return [
                      createVNode("div", { class: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100" }, [
                        createVNode(_component_AppIcon, {
                          name: "home",
                          size: 24
                        })
                      ]),
                      createVNode("div", null, [
                        createVNode("p", { class: "font-semibold text-gray-900" }, "Klant portaal"),
                        createVNode("p", { class: "text-sm text-gray-500" }, "Mijn huis, systemen en contracten")
                      ]),
                      createVNode(_component_AppIcon, {
                        name: "chevron-right",
                        size: 18,
                        class: "ml-auto text-gray-300 transition-colors group-hover:text-gray-500"
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent2, _scopeId));
              _push2(`</div><p class="mt-6 text-center text-xs text-gray-400"${_scopeId}> Demo modus \xB7 klik op een portaal om te starten </p></div></div>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              !unref(config).public.demoMode ? (openBlock(), createBlock("div", {
                key: 0,
                class: "flex min-h-screen items-center justify-center px-4"
              }, [
                createVNode("div", { class: "text-center" }, [
                  createVNode("div", { class: "mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-gray-600" }),
                  createVNode("p", { class: "text-sm text-gray-500" }, "Laden...")
                ])
              ])) : createCommentVNode("", true),
              unref(config).public.demoMode ? (openBlock(), createBlock("div", {
                key: 1,
                class: "flex min-h-screen items-center justify-center px-4"
              }, [
                createVNode("div", { class: "w-full max-w-md" }, [
                  createVNode("div", { class: "mb-8 text-center" }, [
                    unref(partner).logo_url ? (openBlock(), createBlock("div", {
                      key: 0,
                      class: "mx-auto mb-5 flex items-center justify-center"
                    }, [
                      createVNode("img", {
                        src: unref(partner).logo_url,
                        alt: unref(partner).name,
                        class: "h-20 w-auto max-w-[280px] object-contain"
                      }, null, 8, ["src", "alt"])
                    ])) : (openBlock(), createBlock("div", {
                      key: 1,
                      class: "mx-auto mb-4 h-1 w-12 rounded-full",
                      style: { backgroundColor: unref(partner).primary_color }
                    }, null, 4)),
                    createVNode("h1", { class: "text-3xl font-bold tracking-tight text-gray-900" }, toDisplayString(unref(partner).name), 1),
                    createVNode("p", { class: "mt-2 text-sm text-gray-500" }, " Modulair klantportaal voor installateurs ")
                  ]),
                  createVNode("div", { class: "space-y-3" }, [
                    createVNode(_component_NuxtLink, {
                      to: "/platform",
                      class: "group flex items-center gap-4 rounded-2xl border border-gray-800 bg-gray-900 p-5 shadow-sm transition-all hover:border-gray-700 hover:shadow-md"
                    }, {
                      default: withCtx(() => [
                        createVNode("div", { class: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition-colors" }, [
                          createVNode(_component_AppIcon, {
                            name: "globe",
                            size: 24
                          })
                        ]),
                        createVNode("div", null, [
                          createVNode("p", { class: "font-semibold text-white" }, "Platform beheer"),
                          createVNode("p", { class: "text-sm text-gray-400" }, "Partners, klanten en platform inzicht")
                        ]),
                        createVNode(_component_AppIcon, {
                          name: "chevron-right",
                          size: 18,
                          class: "ml-auto text-gray-500 transition-colors group-hover:text-gray-300"
                        })
                      ]),
                      _: 1
                    }),
                    createVNode(_component_NuxtLink, {
                      to: "/admin",
                      class: "group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                    }, {
                      default: withCtx(() => [
                        createVNode("div", {
                          class: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors",
                          style: { backgroundColor: unref(partner).primary_color + "15", color: unref(partner).primary_color }
                        }, [
                          createVNode(_component_AppIcon, {
                            name: "settings",
                            size: 24
                          })
                        ], 4),
                        createVNode("div", null, [
                          createVNode("p", { class: "font-semibold text-gray-900" }, "Installateur portaal"),
                          createVNode("p", { class: "text-sm text-gray-500" }, "Klanten, modules en omzet beheren")
                        ]),
                        createVNode(_component_AppIcon, {
                          name: "chevron-right",
                          size: 18,
                          class: "ml-auto text-gray-300 transition-colors group-hover:text-gray-500"
                        })
                      ]),
                      _: 1
                    }),
                    createVNode(_component_NuxtLink, {
                      to: "/klant",
                      class: "group flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                    }, {
                      default: withCtx(() => [
                        createVNode("div", { class: "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 transition-colors group-hover:bg-green-100" }, [
                          createVNode(_component_AppIcon, {
                            name: "home",
                            size: 24
                          })
                        ]),
                        createVNode("div", null, [
                          createVNode("p", { class: "font-semibold text-gray-900" }, "Klant portaal"),
                          createVNode("p", { class: "text-sm text-gray-500" }, "Mijn huis, systemen en contracten")
                        ]),
                        createVNode(_component_AppIcon, {
                          name: "chevron-right",
                          size: 18,
                          class: "ml-auto text-gray-300 transition-colors group-hover:text-gray-500"
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  createVNode("p", { class: "mt-6 text-center text-xs text-gray-400" }, " Demo modus \xB7 klik op een portaal om te starten ")
                ])
              ])) : createCommentVNode("", true)
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main as default };
//# sourceMappingURL=index-COiJhJ1o.mjs.map
