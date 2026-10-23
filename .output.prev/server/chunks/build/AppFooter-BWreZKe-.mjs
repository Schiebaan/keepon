import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { u as usePartner, l as useAuth, d as useRoute, _ as _sfc_main$5 } from './server.mjs';
import { defineComponent, ref, watch, mergeProps, unref, withCtx, openBlock, createBlock, Fragment, createVNode, toDisplayString, createTextVNode, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderAttr, ssrRenderStyle, ssrInterpolate } from 'vue/server-renderer';

const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "AppHeader",
  __ssrInlineRender: true,
  props: {
    variant: {}
  },
  setup(__props) {
    const { partner } = usePartner();
    const { signOut } = useAuth();
    const hasSolar = ref(true);
    const hasHeatPump = ref(true);
    const hasEv = ref(true);
    const isMenuOpen = ref(false);
    const showAccountMenu = ref(false);
    ref(null);
    function closeAccountMenu() {
      showAccountMenu.value = false;
    }
    const route = useRoute();
    watch(() => route.fullPath, () => {
      isMenuOpen.value = false;
      showAccountMenu.value = false;
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      const _component_AppIcon = _sfc_main$5;
      _push(`<header${ssrRenderAttrs(mergeProps({
        class: "border-b bg-white",
        style: { borderBottomColor: `color-mix(in srgb, ${unref(partner).primary_color} 30%, #e5e7eb)` }
      }, _attrs))}><div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/",
        class: "flex items-center gap-3 no-underline"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            if (unref(partner).logo_url) {
              _push2(`<img${ssrRenderAttr("src", unref(partner).logo_url)}${ssrRenderAttr("alt", unref(partner).name)} class="h-12 w-auto max-w-[240px] object-contain"${_scopeId}>`);
            } else {
              _push2(`<!--[--><span class="block h-7 w-[3px] shrink-0 rounded-full" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}"${_scopeId}></span><span class="text-xl font-bold tracking-tight text-gray-900"${_scopeId}>${ssrInterpolate(unref(partner).name)}</span><!--]-->`);
            }
          } else {
            return [
              unref(partner).logo_url ? (openBlock(), createBlock("img", {
                key: 0,
                src: unref(partner).logo_url,
                alt: unref(partner).name,
                class: "h-12 w-auto max-w-[240px] object-contain"
              }, null, 8, ["src", "alt"])) : (openBlock(), createBlock(Fragment, { key: 1 }, [
                createVNode("span", {
                  class: "block h-7 w-[3px] shrink-0 rounded-full",
                  style: { backgroundColor: unref(partner).primary_color }
                }, null, 4),
                createVNode("span", { class: "text-xl font-bold tracking-tight text-gray-900" }, toDisplayString(unref(partner).name), 1)
              ], 64))
            ];
          }
        }),
        _: 1
      }, _parent));
      if (__props.variant === "customer") {
        _push(`<nav class="hidden items-center gap-1 md:flex">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant",
          class: "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          "exact-active-class": "!bg-opacity-10 !font-semibold",
          style: { "--tw-bg-opacity": "0.08" }
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "home",
                size: 16
              }, null, _parent2, _scopeId));
              _push2(` Mijn Huis `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "home",
                  size: 16
                }),
                createTextVNode(" Mijn Huis ")
              ];
            }
          }),
          _: 1
        }, _parent));
        if (unref(hasSolar)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/zonnepanelen",
            class: "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            "active-class": "!bg-amber-50 !text-amber-700 !font-semibold"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "solar",
                  size: 16
                }, null, _parent2, _scopeId));
                _push2(` Zonnepanelen `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "solar",
                    size: 16
                  }),
                  createTextVNode(" Zonnepanelen ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(hasHeatPump)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/warmtepomp",
            class: "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            "active-class": "!bg-orange-50 !text-orange-700 !font-semibold"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "heat-pump",
                  size: 16
                }, null, _parent2, _scopeId));
                _push2(` Warmtepomp `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "heat-pump",
                    size: 16
                  }),
                  createTextVNode(" Warmtepomp ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(hasEv)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/laadpaal",
            class: "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900",
            "active-class": "!bg-sky-50 !text-sky-700 !font-semibold"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "ev-charger",
                  size: 16
                }, null, _parent2, _scopeId));
                _push2(` Laadpaal `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "ev-charger",
                    size: 16
                  }),
                  createTextVNode(" Laadpaal ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/energie",
          class: "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          "active-class": "!bg-emerald-50 !text-emerald-700 !font-semibold"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "zap",
                size: 16
              }, null, _parent2, _scopeId));
              _push2(` Energie `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "zap",
                  size: 16
                }),
                createTextVNode(" Energie ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/service",
          class: "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900",
          "active-class": "!bg-gray-100 !text-gray-900 !font-semibold"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "tool",
                size: 16
              }, null, _parent2, _scopeId));
              _push2(` Service `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "tool",
                  size: 16
                }),
                createTextVNode(" Service ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<div class="relative ml-1"><button class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "user",
          size: 16
        }, null, _parent));
        _push(` Mijn Account `);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "chevron-down",
          size: 14,
          class: ["transition-transform", { "rotate-180": unref(showAccountMenu) }]
        }, null, _parent));
        _push(`</button>`);
        if (unref(showAccountMenu)) {
          _push(`<div class="absolute right-0 top-full z-50 mt-1 w-48 origin-top-right rounded-xl border border-gray-200 bg-white py-1 shadow-lg">`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/gegevens",
            class: "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50",
            onClick: closeAccountMenu
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "user",
                  size: 15,
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(` Gegevens `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "user",
                    size: 15,
                    class: "text-gray-400"
                  }),
                  createTextVNode(" Gegevens ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/facturen",
            class: "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50",
            onClick: closeAccountMenu
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "file-text",
                  size: 15,
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(` Facturen `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "file-text",
                    size: 15,
                    class: "text-gray-400"
                  }),
                  createTextVNode(" Facturen ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/contracten",
            class: "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50",
            onClick: closeAccountMenu
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "document",
                  size: 15,
                  class: "text-gray-400"
                }, null, _parent2, _scopeId));
                _push2(` Contracten `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "document",
                    size: 15,
                    class: "text-gray-400"
                  }),
                  createTextVNode(" Contracten ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<div class="my-1 border-t border-gray-100"></div><button class="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "logout",
            size: 15,
            class: "text-gray-400"
          }, null, _parent));
          _push(` Uitloggen </button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></nav>`);
      } else {
        _push(`<!---->`);
      }
      if (__props.variant === "customer") {
        _push(`<button class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 md:hidden">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(isMenuOpen) ? "x" : "menu",
          size: 22
        }, null, _parent));
        _push(`</button>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
      if (__props.variant === "customer" && unref(isMenuOpen)) {
        _push(`<nav class="border-t border-gray-100 bg-white px-4 pb-4 pt-2 md:hidden"><div class="space-y-1">`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant",
          class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "home",
                size: 18
              }, null, _parent2, _scopeId));
              _push2(` Mijn Huis `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "home",
                  size: 18
                }),
                createTextVNode(" Mijn Huis ")
              ];
            }
          }),
          _: 1
        }, _parent));
        if (unref(hasSolar)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/zonnepanelen",
            class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "solar",
                  size: 18
                }, null, _parent2, _scopeId));
                _push2(` Zonnepanelen `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "solar",
                    size: 18
                  }),
                  createTextVNode(" Zonnepanelen ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(hasHeatPump)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/warmtepomp",
            class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "heat-pump",
                  size: 18
                }, null, _parent2, _scopeId));
                _push2(` Warmtepomp `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "heat-pump",
                    size: 18
                  }),
                  createTextVNode(" Warmtepomp ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(hasEv)) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: "/klant/laadpaal",
            class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "ev-charger",
                  size: 18
                }, null, _parent2, _scopeId));
                _push2(` Laadpaal `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "ev-charger",
                    size: 18
                  }),
                  createTextVNode(" Laadpaal ")
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/energie",
          class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "zap",
                size: 18
              }, null, _parent2, _scopeId));
              _push2(` Energie `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "zap",
                  size: 18
                }),
                createTextVNode(" Energie ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/service",
          class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "tool",
                size: 18
              }, null, _parent2, _scopeId));
              _push2(` Service `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "tool",
                  size: 18
                }),
                createTextVNode(" Service ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<div class="my-2 border-t border-gray-100"></div>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/gegevens",
          class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "user",
                size: 18
              }, null, _parent2, _scopeId));
              _push2(` Gegevens `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "user",
                  size: 18
                }),
                createTextVNode(" Gegevens ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/facturen",
          class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "file-text",
                size: 18
              }, null, _parent2, _scopeId));
              _push2(` Facturen `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "file-text",
                  size: 18
                }),
                createTextVNode(" Facturen ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/klant/contracten",
          class: "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "document",
                size: 18
              }, null, _parent2, _scopeId));
              _push2(` Contracten `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "document",
                  size: 18
                }),
                createTextVNode(" Contracten ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<div class="my-2 border-t border-gray-100"></div><button class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "logout",
          size: 18
        }, null, _parent));
        _push(` Uitloggen </button></div></nav>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</header>`);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/AppHeader.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "AppFooter",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(`<footer${ssrRenderAttrs(mergeProps({ class: "border-t border-gray-200 bg-white py-6" }, _attrs))}><div class="mx-auto max-w-7xl px-4 sm:px-6"><div class="flex flex-col items-center justify-between gap-2 sm:flex-row"><p class="text-sm text-gray-400">${ssrInterpolate(unref(partner).name)} \xB7 Powered by UPsol </p><div class="flex gap-4 text-sm text-gray-400">`);
      _push(ssrRenderComponent(_component_NuxtLink, {
        to: "/voorwaarden/" + (unref(partner).slug || "volt4u"),
        class: "hover:text-gray-600"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`Voorwaarden`);
          } else {
            return [
              createTextVNode("Voorwaarden")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<span>${ssrInterpolate(unref(partner).support_email)}</span></div></div></div></footer>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/layout/AppFooter.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};

export { _sfc_main$1 as _, _sfc_main as a };
//# sourceMappingURL=AppFooter-BWreZKe-.mjs.map
