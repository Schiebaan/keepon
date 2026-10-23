import { computed, reactive, ref, defineComponent, mergeProps, unref, toRef, isRef, hasInjectionContext, inject, getCurrentInstance, watchEffect, watch, version, defineAsyncComponent, h, provide, shallowReactive, Suspense, Fragment, useSSRContext, createApp, nextTick, withCtx, createVNode, onErrorCaptured, onServerPrefetch, resolveDynamicComponent, effectScope, getCurrentScope, shallowRef, isReadonly, isShallow, isReactive, toRaw } from 'vue';
import { x as hasProtocol, y as isScriptProtocol, z as joinURL, c as createError$1, A as withQuery, B as sanitizeStatusCode, C as getContext, $ as $fetch$1, D as createHooks, a as getHeader, E as toRouteMatcher, F as createRouter$1, G as defu, m as setCookie, H as klona, I as parse, b as getRequestHeader, J as destr, j as getCookie, k as deleteCookie } from '../nitro/nitro.mjs';
import { b as baseURL } from '../routes/renderer.mjs';
import { getActiveHead, CapoPlugin } from 'unhead';
import { defineHeadPlugin, composableNames } from '@unhead/shared';
import { useRoute as useRoute$1, RouterView, createMemoryHistory, createRouter, START_LOCATION } from 'vue-router';
import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { ssrRenderAttrs, ssrRenderList, ssrRenderAttr, ssrRenderTeleport, ssrRenderStyle, ssrRenderClass, ssrRenderComponent, ssrInterpolate, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';

const defaults = Object.freeze({
  ignoreUnknown: false,
  respectType: false,
  respectFunctionNames: false,
  respectFunctionProperties: false,
  unorderedObjects: true,
  unorderedArrays: false,
  unorderedSets: false,
  excludeKeys: void 0,
  excludeValues: void 0,
  replacer: void 0
});
function objectHash(object, options) {
  if (options) {
    options = { ...defaults, ...options };
  } else {
    options = defaults;
  }
  const hasher = createHasher(options);
  hasher.dispatch(object);
  return hasher.toString();
}
const defaultPrototypesKeys = Object.freeze([
  "prototype",
  "__proto__",
  "constructor"
]);
function createHasher(options) {
  let buff = "";
  let context = /* @__PURE__ */ new Map();
  const write = (str) => {
    buff += str;
  };
  return {
    toString() {
      return buff;
    },
    getContext() {
      return context;
    },
    dispatch(value) {
      if (options.replacer) {
        value = options.replacer(value);
      }
      const type = value === null ? "null" : typeof value;
      return this[type](value);
    },
    object(object) {
      if (object && typeof object.toJSON === "function") {
        return this.object(object.toJSON());
      }
      const objString = Object.prototype.toString.call(object);
      let objType = "";
      const objectLength = objString.length;
      if (objectLength < 10) {
        objType = "unknown:[" + objString + "]";
      } else {
        objType = objString.slice(8, objectLength - 1);
      }
      objType = objType.toLowerCase();
      let objectNumber = null;
      if ((objectNumber = context.get(object)) === void 0) {
        context.set(object, context.size);
      } else {
        return this.dispatch("[CIRCULAR:" + objectNumber + "]");
      }
      if (typeof Buffer !== "undefined" && Buffer.isBuffer && Buffer.isBuffer(object)) {
        write("buffer:");
        return write(object.toString("utf8"));
      }
      if (objType !== "object" && objType !== "function" && objType !== "asyncfunction") {
        if (this[objType]) {
          this[objType](object);
        } else if (!options.ignoreUnknown) {
          this.unkown(object, objType);
        }
      } else {
        let keys = Object.keys(object);
        if (options.unorderedObjects) {
          keys = keys.sort();
        }
        let extraKeys = [];
        if (options.respectType !== false && !isNativeFunction(object)) {
          extraKeys = defaultPrototypesKeys;
        }
        if (options.excludeKeys) {
          keys = keys.filter((key) => {
            return !options.excludeKeys(key);
          });
          extraKeys = extraKeys.filter((key) => {
            return !options.excludeKeys(key);
          });
        }
        write("object:" + (keys.length + extraKeys.length) + ":");
        const dispatchForKey = (key) => {
          this.dispatch(key);
          write(":");
          if (!options.excludeValues) {
            this.dispatch(object[key]);
          }
          write(",");
        };
        for (const key of keys) {
          dispatchForKey(key);
        }
        for (const key of extraKeys) {
          dispatchForKey(key);
        }
      }
    },
    array(arr, unordered) {
      unordered = unordered === void 0 ? options.unorderedArrays !== false : unordered;
      write("array:" + arr.length + ":");
      if (!unordered || arr.length <= 1) {
        for (const entry of arr) {
          this.dispatch(entry);
        }
        return;
      }
      const contextAdditions = /* @__PURE__ */ new Map();
      const entries = arr.map((entry) => {
        const hasher = createHasher(options);
        hasher.dispatch(entry);
        for (const [key, value] of hasher.getContext()) {
          contextAdditions.set(key, value);
        }
        return hasher.toString();
      });
      context = contextAdditions;
      entries.sort();
      return this.array(entries, false);
    },
    date(date) {
      return write("date:" + date.toJSON());
    },
    symbol(sym) {
      return write("symbol:" + sym.toString());
    },
    unkown(value, type) {
      write(type);
      if (!value) {
        return;
      }
      write(":");
      if (value && typeof value.entries === "function") {
        return this.array(
          Array.from(value.entries()),
          true
          /* ordered */
        );
      }
    },
    error(err) {
      return write("error:" + err.toString());
    },
    boolean(bool) {
      return write("bool:" + bool);
    },
    string(string) {
      write("string:" + string.length + ":");
      write(string);
    },
    function(fn) {
      write("fn:");
      if (isNativeFunction(fn)) {
        this.dispatch("[native]");
      } else {
        this.dispatch(fn.toString());
      }
      if (options.respectFunctionNames !== false) {
        this.dispatch("function-name:" + String(fn.name));
      }
      if (options.respectFunctionProperties) {
        this.object(fn);
      }
    },
    number(number) {
      return write("number:" + number);
    },
    xml(xml) {
      return write("xml:" + xml.toString());
    },
    null() {
      return write("Null");
    },
    undefined() {
      return write("Undefined");
    },
    regexp(regex) {
      return write("regex:" + regex.toString());
    },
    uint8array(arr) {
      write("uint8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint8clampedarray(arr) {
      write("uint8clampedarray:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int8array(arr) {
      write("int8array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint16array(arr) {
      write("uint16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int16array(arr) {
      write("int16array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    uint32array(arr) {
      write("uint32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    int32array(arr) {
      write("int32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float32array(arr) {
      write("float32array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    float64array(arr) {
      write("float64array:");
      return this.dispatch(Array.prototype.slice.call(arr));
    },
    arraybuffer(arr) {
      write("arraybuffer:");
      return this.dispatch(new Uint8Array(arr));
    },
    url(url) {
      return write("url:" + url.toString());
    },
    map(map) {
      write("map:");
      const arr = [...map];
      return this.array(arr, options.unorderedSets !== false);
    },
    set(set) {
      write("set:");
      const arr = [...set];
      return this.array(arr, options.unorderedSets !== false);
    },
    file(file) {
      write("file:");
      return this.dispatch([file.name, file.size, file.type, file.lastModfied]);
    },
    blob() {
      if (options.ignoreUnknown) {
        return write("[blob]");
      }
      throw new Error(
        'Hashing Blob objects is currently not supported\nUse "options.replacer" or "options.ignoreUnknown"\n'
      );
    },
    domwindow() {
      return write("domwindow");
    },
    bigint(number) {
      return write("bigint:" + number.toString());
    },
    /* Node.js standard native objects */
    process() {
      return write("process");
    },
    timer() {
      return write("timer");
    },
    pipe() {
      return write("pipe");
    },
    tcp() {
      return write("tcp");
    },
    udp() {
      return write("udp");
    },
    tty() {
      return write("tty");
    },
    statwatcher() {
      return write("statwatcher");
    },
    securecontext() {
      return write("securecontext");
    },
    connection() {
      return write("connection");
    },
    zlib() {
      return write("zlib");
    },
    context() {
      return write("context");
    },
    nodescript() {
      return write("nodescript");
    },
    httpparser() {
      return write("httpparser");
    },
    dataview() {
      return write("dataview");
    },
    signal() {
      return write("signal");
    },
    fsevent() {
      return write("fsevent");
    },
    tlswrap() {
      return write("tlswrap");
    }
  };
}
const nativeFunc = "[native code] }";
const nativeFuncLength = nativeFunc.length;
function isNativeFunction(f) {
  if (typeof f !== "function") {
    return false;
  }
  return Function.prototype.toString.call(f).slice(-nativeFuncLength) === nativeFunc;
}

function isEqual(object1, object2, hashOptions = {}) {
  if (object1 === object2) {
    return true;
  }
  if (objectHash(object1, hashOptions) === objectHash(object2, hashOptions)) {
    return true;
  }
  return false;
}

if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch$1.create({
    baseURL: baseURL()
  });
}
const appLayoutTransition = false;
const appPageTransition = false;
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const asyncDataDefaults = { "value": null, "errorValue": null, "deep": true };
const fetchDefaults = {};
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  var _a;
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.15.4";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...((_a = options.ssrContext) == null ? void 0 : _a.payload) || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin2) {
  if (plugin2.hooks) {
    nuxtApp.hooks.addHooks(plugin2.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin2) {
  if (typeof plugin2 === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin2(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  var _a, _b, _c, _d;
  const resolvedPlugins = [];
  const unresolvedPlugins = [];
  const parallels = [];
  const errors = [];
  let promiseDepth = 0;
  async function executePlugin(plugin2) {
    var _a2;
    const unresolvedPluginsForThisPlugin = ((_a2 = plugin2.dependsOn) == null ? void 0 : _a2.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.includes(name))) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin2]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin2).then(async () => {
        if (plugin2._name) {
          resolvedPlugins.push(plugin2._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin2._name)) {
              dependsOn.delete(plugin2._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      });
      if (plugin2.parallel) {
        parallels.push(promise.catch((e) => errors.push(e)));
      } else {
        await promise;
      }
    }
  }
  for (const plugin2 of plugins2) {
    if (((_a = nuxtApp.ssrContext) == null ? void 0 : _a.islandContext) && ((_b = plugin2.env) == null ? void 0 : _b.islands) === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin2);
  }
  for (const plugin2 of plugins2) {
    if (((_c = nuxtApp.ssrContext) == null ? void 0 : _c.islandContext) && ((_d = plugin2.env) == null ? void 0 : _d.islands) === false) {
      continue;
    }
    await executePlugin(plugin2);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin2) {
  if (typeof plugin2 === "function") {
    return plugin2;
  }
  const _name = plugin2._name || plugin2.name;
  delete plugin2.name;
  return Object.assign(plugin2.setup || (() => {
  }), plugin2, { [NuxtPluginIndicator]: true, _name });
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  var _a;
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = (_a = getCurrentInstance()) == null ? void 0 : _a.appContext.app.$nuxt;
  }
  nuxtAppInstance = nuxtAppInstance || getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const LayoutMetaSymbol = Symbol("layout-meta");
const PageRouteSymbol = Symbol("route");
const useRouter = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const addRouteMiddleware = (name, middleware, options = {}) => {
  const nuxtApp = useNuxtApp();
  const global2 = options.global || typeof name !== "string";
  const mw = middleware;
  if (!mw) {
    console.warn("[nuxt] No route middleware passed to `addRouteMiddleware`.", name);
    return;
  }
  if (global2) {
    nuxtApp._middleware.global.push(mw);
  } else {
    nuxtApp._middleware.named[name] = mw;
  }
};
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const URL_QUOTE_RE = /"/g;
const navigateTo = (to, options) => {
  if (!to) {
    to = "/";
  }
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = (options == null ? void 0 : options.external) || isExternalHost;
  if (isExternal) {
    if (!(options == null ? void 0 : options.external)) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(URL_QUOTE_RE, "%22");
        const encodedHeader = encodeURL(location2, isExternalHost);
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode((options == null ? void 0 : options.redirectCode) || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options == null ? void 0 : options.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return (options == null ? void 0 : options.replace) ? router.replace(to) : router.push(to);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const nuxtApp = useNuxtApp();
    const error2 = useError();
    if (false) ;
    error2.value = error2.value || nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};
version[0] === "3";
function resolveUnref(r) {
  return typeof r === "function" ? r() : unref(r);
}
function resolveUnrefHeadInput(ref2) {
  if (ref2 instanceof Promise || ref2 instanceof Date || ref2 instanceof RegExp)
    return ref2;
  const root = resolveUnref(ref2);
  if (!ref2 || !root)
    return root;
  if (Array.isArray(root))
    return root.map((r) => resolveUnrefHeadInput(r));
  if (typeof root === "object") {
    const resolved = {};
    for (const k in root) {
      if (!Object.prototype.hasOwnProperty.call(root, k)) {
        continue;
      }
      if (k === "titleTemplate" || k[0] === "o" && k[1] === "n") {
        resolved[k] = unref(root[k]);
        continue;
      }
      resolved[k] = resolveUnrefHeadInput(root[k]);
    }
    return resolved;
  }
  return root;
}
defineHeadPlugin({
  hooks: {
    "entries:resolve": (ctx) => {
      for (const entry2 of ctx.entries)
        entry2.resolvedInput = resolveUnrefHeadInput(entry2.input);
    }
  }
});
const headSymbol = "usehead";
const _global = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
const globalKey$1 = "__unhead_injection_handler__";
function setHeadInjectionHandler(handler) {
  _global[globalKey$1] = handler;
}
function injectHead() {
  if (globalKey$1 in _global) {
    return _global[globalKey$1]();
  }
  const head = inject(headSymbol);
  return head || getActiveHead();
}
function useHead(input, options = {}) {
  const head = options.head || injectHead();
  if (head) {
    if (!head.ssr)
      return clientUseHead(head, input, options);
    return head.push(input, options);
  }
}
function clientUseHead(head, input, options = {}) {
  const deactivated = ref(false);
  const resolvedInput = ref({});
  watchEffect(() => {
    resolvedInput.value = deactivated.value ? {} : resolveUnrefHeadInput(input);
  });
  const entry2 = head.push(resolvedInput.value, options);
  watch(resolvedInput, (e) => {
    entry2.patch(e);
  });
  getCurrentInstance();
  return entry2;
}
const coreComposableNames = [
  "injectHead"
];
({
  "@unhead/vue": [...coreComposableNames, ...composableNames]
});
[CapoPlugin({ track: true })];
const unhead_KgADcZ0jPj = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    setHeadInjectionHandler(
      // need a fresh instance of the nuxt app to avoid parallel requests interfering with each other
      () => useNuxtApp().vueApp._context.provides.usehead
    );
    nuxtApp.vueApp.use(head);
  }
});
function createContext(opts = {}) {
  let currentInstance;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  let als;
  if (opts.asyncContext) {
    const _AsyncLocalStorage = opts.AsyncLocalStorage || globalThis.AsyncLocalStorage;
    if (_AsyncLocalStorage) {
      als = new _AsyncLocalStorage();
    } else {
      console.warn("[unctx] `AsyncLocalStorage` is not provided.");
    }
  }
  const _getCurrentInstance = () => {
    if (als) {
      const instance = als.getStore();
      if (instance !== void 0) {
        return instance;
      }
    }
    return currentInstance;
  };
  return {
    use: () => {
      const _instance = _getCurrentInstance();
      if (_instance === void 0) {
        throw new Error("Context is not available");
      }
      return _instance;
    },
    tryUse: () => {
      return _getCurrentInstance();
    },
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = void 0;
      isSingleton = false;
    },
    call: (instance, callback) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return als ? als.run(instance, callback) : callback();
      } finally {
        if (!isSingleton) {
          currentInstance = void 0;
        }
      }
    },
    async callAsync(instance, callback) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = als ? als.run(instance, callback) : callback();
        if (!isSingleton) {
          currentInstance = void 0;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace(defaultOpts = {}) {
  const contexts = {};
  return {
    get(key, opts = {}) {
      if (!contexts[key]) {
        contexts[key] = createContext({ ...defaultOpts, ...opts });
      }
      return contexts[key];
    }
  };
}
const _globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey = "__unctx__";
_globalThis[globalKey] || (_globalThis[globalKey] = createNamespace());
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis[asyncHandlersKey] || (_globalThis[asyncHandlersKey] = /* @__PURE__ */ new Set());
function executeAsync(function_) {
  const restores = [];
  for (const leaveHandler of asyncHandlers) {
    const restore2 = leaveHandler();
    if (restore2) {
      restores.push(restore2);
    }
  }
  const restore = () => {
    for (const restore2 of restores) {
      restore2();
    }
  };
  let awaitable = function_();
  if (awaitable && typeof awaitable === "object" && "catch" in awaitable) {
    awaitable = awaitable.catch((error) => {
      restore();
      throw error;
    });
  }
  return [awaitable, restore];
}
const ROUTE_KEY_PARENTHESES_RE$1 = /(:\w+)\([^)]+\)/g;
const ROUTE_KEY_SYMBOLS_RE$1 = /(:\w+)[?+*]/g;
const ROUTE_KEY_NORMAL_RE$1 = /:\w+/g;
const interpolatePath = (route, match) => {
  return match.path.replace(ROUTE_KEY_PARENTHESES_RE$1, "$1").replace(ROUTE_KEY_SYMBOLS_RE$1, "$1").replace(ROUTE_KEY_NORMAL_RE$1, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
};
const generateRouteKey$1 = (routeProps, override) => {
  const matchedRoute = routeProps.route.matched.find((m) => {
    var _a;
    return ((_a = m.components) == null ? void 0 : _a.default) === routeProps.Component.type;
  });
  const source = override ?? (matchedRoute == null ? void 0 : matchedRoute.meta.key) ?? (matchedRoute && interpolatePath(routeProps.route, matchedRoute));
  return typeof source === "function" ? source(routeProps.route) : source;
};
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}
async function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  {
    useNuxtApp().ssrContext._preloadManifest = true;
    const _routeRulesMatcher = toRouteMatcher(
      createRouter$1({ routes: (/* @__PURE__ */ useRuntimeConfig()).nitro.routeRules })
    );
    return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
  }
}
const __nuxt_page_meta$D = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$C = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$B = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$A = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$z = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$y = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$x = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$w = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$v = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$u = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$t = { layout: "admin", middleware: ["auth", "role-partner"] };
const __nuxt_page_meta$s = { layout: false };
const __nuxt_page_meta$r = { layout: false };
const __nuxt_page_meta$q = { layout: false };
const __nuxt_page_meta$p = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$o = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$n = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$m = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$l = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$k = { layout: "customer", middleware: ["auth"] };
const __nuxt_page_meta$j = { layout: "customer", middleware: ["auth"] };
const __nuxt_page_meta$i = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$h = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$g = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$f = { layout: "customer", middleware: ["auth", "customer-onboarding"] };
const __nuxt_page_meta$e = { layout: false };
const __nuxt_page_meta$d = { layout: "platform", middleware: ["auth", "role-platform"] };
const __nuxt_page_meta$c = { layout: "platform", middleware: ["auth", "role-platform"] };
const __nuxt_page_meta$b = { layout: "platform", middleware: ["auth", "role-platform"] };
const __nuxt_page_meta$a = { layout: "platform", middleware: ["auth", "role-platform"] };
const __nuxt_page_meta$9 = { layout: "platform", middleware: ["auth", "role-platform"] };
const __nuxt_page_meta$8 = { layout: "platform", middleware: ["auth", "role-platform"] };
const __nuxt_page_meta$7 = { layout: false };
const __nuxt_page_meta$6 = { layout: false };
const __nuxt_page_meta$5 = { layout: false };
const __nuxt_page_meta$4 = { layout: false, middleware: ["auth"] };
const __nuxt_page_meta$3 = { layout: false, middleware: ["auth"] };
const __nuxt_page_meta$2 = { layout: false, middleware: ["auth"] };
const __nuxt_page_meta$1 = { layout: false };
const __nuxt_page_meta = { layout: false, middleware: ["auth"] };
function handleHotUpdate(_router, _generateRoutes) {
}
const _routes = [
  {
    name: "admin-communicatie",
    path: "/admin/communicatie",
    meta: __nuxt_page_meta$D || {},
    component: () => import('./communicatie-CSqIVrOg.mjs')
  },
  {
    name: "admin-customers-id",
    path: "/admin/customers/:id()",
    meta: __nuxt_page_meta$C || {},
    component: () => import('./_id_-Dx7IM7fr.mjs')
  },
  {
    name: "admin-customers",
    path: "/admin/customers",
    meta: __nuxt_page_meta$B || {},
    component: () => import('./index-O0Z0OSyG.mjs')
  },
  {
    name: "admin",
    path: "/admin",
    meta: __nuxt_page_meta$A || {},
    component: () => import('./index-GRsi0H0D.mjs')
  },
  {
    name: "admin-modules",
    path: "/admin/modules",
    meta: __nuxt_page_meta$z || {},
    component: () => import('./modules-DKPskyYJ.mjs')
  },
  {
    name: "admin-payments",
    path: "/admin/payments",
    meta: __nuxt_page_meta$y || {},
    component: () => import('./payments-Bl3Nwetc.mjs')
  },
  {
    name: "admin-service-id",
    path: "/admin/service/:id()",
    meta: __nuxt_page_meta$x || {},
    component: () => import('./_id_-XvrOSmjR.mjs')
  },
  {
    name: "admin-service",
    path: "/admin/service",
    meta: __nuxt_page_meta$w || {},
    component: () => import('./index-DOTV46hP.mjs')
  },
  {
    name: "admin-settings",
    path: "/admin/settings",
    meta: __nuxt_page_meta$v || {},
    component: () => import('./settings-BTIojTSM.mjs')
  },
  {
    name: "admin-uitnodigingen",
    path: "/admin/uitnodigingen",
    meta: __nuxt_page_meta$u || {},
    component: () => import('./uitnodigingen-DRufhkAM.mjs')
  },
  {
    name: "admin-users",
    path: "/admin/users",
    meta: __nuxt_page_meta$t || {},
    component: () => import('./users-CPkTYmUx.mjs')
  },
  {
    name: "auth-callback",
    path: "/auth/callback",
    meta: __nuxt_page_meta$s || {},
    component: () => import('./callback-B7vSnErU.mjs')
  },
  {
    name: "auth-reset-password",
    path: "/auth/reset-password",
    meta: __nuxt_page_meta$r || {},
    component: () => import('./reset-password-Dn2Sng7t.mjs')
  },
  {
    name: "index",
    path: "/",
    meta: __nuxt_page_meta$q || {},
    component: () => import('./index-COiJhJ1o.mjs')
  },
  {
    name: "klant-contracten",
    path: "/klant/contracten",
    meta: __nuxt_page_meta$p || {},
    component: () => import('./contracten-B6ZqW4H0.mjs')
  },
  {
    name: "klant-energie",
    path: "/klant/energie",
    meta: __nuxt_page_meta$o || {},
    component: () => import('./energie-KBQdu0ra.mjs')
  },
  {
    name: "klant-facturen",
    path: "/klant/facturen",
    meta: __nuxt_page_meta$n || {},
    component: () => import('./facturen-CacTVQlm.mjs')
  },
  {
    name: "klant-gegevens",
    path: "/klant/gegevens",
    meta: __nuxt_page_meta$m || {},
    component: () => import('./gegevens-D4xV_ogv.mjs')
  },
  {
    name: "klant",
    path: "/klant",
    meta: __nuxt_page_meta$l || {},
    component: () => import('./index-Kz7vyiiB.mjs')
  },
  {
    name: "klant-installaties-id",
    path: "/klant/installaties/:id()",
    meta: __nuxt_page_meta$k || {},
    component: () => import('./_id_-rfeUJrra.mjs')
  },
  {
    name: "klant-installaties",
    path: "/klant/installaties",
    meta: __nuxt_page_meta$j || {},
    component: () => import('./index-DgRcj-qr.mjs')
  },
  {
    name: "klant-laadpaal",
    path: "/klant/laadpaal",
    meta: __nuxt_page_meta$i || {},
    component: () => import('./laadpaal-DwUPOBxw.mjs')
  },
  {
    name: "klant-service",
    path: "/klant/service",
    meta: __nuxt_page_meta$h || {},
    component: () => import('./service-BySSvj_5.mjs')
  },
  {
    name: "klant-warmtepomp",
    path: "/klant/warmtepomp",
    meta: __nuxt_page_meta$g || {},
    component: () => import('./warmtepomp-BL2StXpM.mjs')
  },
  {
    name: "klant-zonnepanelen",
    path: "/klant/zonnepanelen",
    meta: __nuxt_page_meta$f || {},
    component: () => import('./zonnepanelen-BilCT30g.mjs')
  },
  {
    name: "login",
    path: "/login",
    meta: __nuxt_page_meta$e || {},
    component: () => import('./login-qzozohBt.mjs')
  },
  {
    name: "platform",
    path: "/platform",
    meta: __nuxt_page_meta$d || {},
    component: () => import('./index-Bs2pI4L3.mjs')
  },
  {
    name: "platform-integrations",
    path: "/platform/integrations",
    meta: __nuxt_page_meta$c || {},
    component: () => import('./integrations-CDby-d2N.mjs')
  },
  {
    name: "platform-partners-slug",
    path: "/platform/partners/:slug()",
    meta: __nuxt_page_meta$b || {},
    component: () => import('./_slug_-B5bhVfmT.mjs')
  },
  {
    name: "platform-partners",
    path: "/platform/partners",
    meta: __nuxt_page_meta$a || {},
    component: () => import('./index-CIyCQKRi.mjs')
  },
  {
    name: "platform-support-id",
    path: "/platform/support/:id()",
    meta: __nuxt_page_meta$9 || {},
    component: () => import('./_id_-ClW_x0ee.mjs')
  },
  {
    name: "platform-support",
    path: "/platform/support",
    meta: __nuxt_page_meta$8 || {},
    component: () => import('./index-BFhvt3r5.mjs')
  },
  {
    name: "support-slug",
    path: "/support/:slug()",
    meta: __nuxt_page_meta$7 || {},
    component: () => import('./_slug_-DrMkKZb6.mjs')
  },
  {
    name: "support",
    path: "/support",
    meta: __nuxt_page_meta$6 || {},
    component: () => import('./index-CE7XVejj.mjs')
  },
  {
    name: "voorwaarden-slug",
    path: "/voorwaarden/:slug()",
    meta: __nuxt_page_meta$5 || {},
    component: () => import('./_slug_-Oo3W3Zvj.mjs')
  },
  {
    name: "welkom-incasso",
    path: "/welkom/incasso",
    meta: __nuxt_page_meta$4 || {},
    component: () => import('./incasso-CMwj627o.mjs')
  },
  {
    name: "welkom",
    path: "/welkom",
    meta: __nuxt_page_meta$3 || {},
    component: () => import('./index-CKif1_HF.mjs')
  },
  {
    name: "welkom-klaar",
    path: "/welkom/klaar",
    meta: __nuxt_page_meta$2 || {},
    component: () => import('./klaar-CM7DWJ07.mjs')
  },
  {
    name: "welkom-verlopen",
    path: "/welkom/verlopen",
    meta: __nuxt_page_meta$1 || {},
    component: () => import('./verlopen-CpQLeYoK.mjs')
  },
  {
    name: "welkom-voorstel",
    path: "/welkom/voorstel",
    meta: __nuxt_page_meta || {},
    component: () => import('./voorstel-Cibh6qOO.mjs')
  }
];
const _wrapInTransition = (props, children) => {
  return { default: () => {
    var _a;
    return (_a = children.default) == null ? void 0 : _a.call(children);
  } };
};
const ROUTE_KEY_PARENTHESES_RE = /(:\w+)\([^)]+\)/g;
const ROUTE_KEY_SYMBOLS_RE = /(:\w+)[?+*]/g;
const ROUTE_KEY_NORMAL_RE = /:\w+/g;
function generateRouteKey(route) {
  const source = (route == null ? void 0 : route.meta.key) ?? route.path.replace(ROUTE_KEY_PARENTHESES_RE, "$1").replace(ROUTE_KEY_SYMBOLS_RE, "$1").replace(ROUTE_KEY_NORMAL_RE, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
  return typeof source === "function" ? source(route) : source;
}
function isChangingPage(to, from) {
  if (to === from || from === START_LOCATION) {
    return false;
  }
  if (generateRouteKey(to) !== generateRouteKey(from)) {
    return true;
  }
  const areComponentsSame = to.matched.every(
    (comp, index) => {
      var _a, _b;
      return comp.components && comp.components.default === ((_b = (_a = from.matched[index]) == null ? void 0 : _a.components) == null ? void 0 : _b.default);
    }
  );
  if (areComponentsSame) {
    return false;
  }
  return true;
}
const routerOptions0 = {
  scrollBehavior(to, from, savedPosition) {
    var _a;
    const nuxtApp = useNuxtApp();
    const behavior = ((_a = useRouter().options) == null ? void 0 : _a.scrollBehaviorType) ?? "auto";
    let position = savedPosition || void 0;
    const routeAllowsScrollToTop = typeof to.meta.scrollToTop === "function" ? to.meta.scrollToTop(to, from) : to.meta.scrollToTop;
    if (!position && from && to && routeAllowsScrollToTop !== false && isChangingPage(to, from)) {
      position = { left: 0, top: 0 };
    }
    if (to.path === from.path) {
      if (from.hash && !to.hash) {
        return { left: 0, top: 0 };
      }
      if (to.hash) {
        return { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
      }
      return false;
    }
    const hasTransition = (route) => !!(route.meta.pageTransition ?? appPageTransition);
    const hookToWait = hasTransition(from) && hasTransition(to) ? "page:transition:finish" : "page:finish";
    return new Promise((resolve) => {
      nuxtApp.hooks.hookOnce(hookToWait, async () => {
        await new Promise((resolve2) => setTimeout(resolve2, 0));
        if (to.hash) {
          position = { el: to.hash, top: _getHashElementScrollMarginTop(to.hash), behavior };
        }
        resolve(position);
      });
    });
  }
};
function _getHashElementScrollMarginTop(selector) {
  try {
    const elem = (void 0).querySelector(selector);
    if (elem) {
      return (Number.parseFloat(getComputedStyle(elem).scrollMarginTop) || 0) + (Number.parseFloat(getComputedStyle((void 0).documentElement).scrollPaddingTop) || 0);
    }
  } catch {
  }
  return 0;
}
const configRouterOptions = {
  hashMode: false,
  scrollBehaviorType: "auto"
};
const routerOptions = {
  ...configRouterOptions,
  ...routerOptions0
};
const validate = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  var _a;
  let __temp, __restore;
  if (!((_a = to.meta) == null ? void 0 : _a.validate)) {
    return;
  }
  const nuxtApp = useNuxtApp();
  const router = useRouter();
  const result = ([__temp, __restore] = executeAsync(() => Promise.resolve(to.meta.validate(to))), __temp = await __temp, __restore(), __temp);
  if (result === true) {
    return;
  }
  const error = createError({
    statusCode: result && result.statusCode || 404,
    statusMessage: result && result.statusMessage || `Page Not Found: ${to.fullPath}`,
    data: {
      path: to.fullPath
    }
  });
  const unsub = router.beforeResolve((final) => {
    unsub();
    if (final === to) {
      const unsub2 = router.afterEach(async () => {
        unsub2();
        await nuxtApp.runWithContext(() => showError(error));
      });
      return false;
    }
  });
});
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  validate,
  manifest_45route_45rule
];
const namedMiddleware = {
  auth: () => import('./auth-DuNIFa0I.mjs'),
  "customer-onboarding": () => import('./customer-onboarding-D0yIR8_z.mjs'),
  "role-partner": () => import('./role-partner-B-1Gf6fn.mjs'),
  "role-platform": () => import('./role-platform-DYe5uxS-.mjs')
};
const plugin = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  async setup(nuxtApp) {
    var _a, _b, _c;
    let __temp, __restore;
    let routerBase = (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const history = ((_a = routerOptions.history) == null ? void 0 : _a.call(routerOptions, routerBase)) ?? createMemoryHistory(routerBase);
    const routes = routerOptions.routes ? ([__temp, __restore] = executeAsync(() => routerOptions.routes(_routes)), __temp = await __temp, __restore(), __temp) ?? _routes : _routes;
    let startPosition;
    const router = createRouter({
      ...routerOptions,
      scrollBehavior: (to, from, savedPosition) => {
        if (from === START_LOCATION) {
          startPosition = savedPosition;
          return;
        }
        if (routerOptions.scrollBehavior) {
          router.options.scrollBehavior = routerOptions.scrollBehavior;
          if ("scrollRestoration" in (void 0).history) {
            const unsub = router.beforeEach(() => {
              unsub();
              (void 0).history.scrollRestoration = "manual";
            });
          }
          return routerOptions.scrollBehavior(to, START_LOCATION, startPosition || savedPosition);
        }
      },
      history,
      routes
    });
    handleHotUpdate(router, routerOptions.routes ? routerOptions.routes : (routes2) => routes2);
    nuxtApp.vueApp.use(router);
    const previousRoute = shallowRef(router.currentRoute.value);
    router.afterEach((_to, from) => {
      previousRoute.value = from;
    });
    Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
      get: () => previousRoute.value
    });
    const initialURL = nuxtApp.ssrContext.url;
    const _route = shallowRef(router.currentRoute.value);
    const syncCurrentRoute = () => {
      _route.value = router.currentRoute.value;
    };
    nuxtApp.hook("page:finish", syncCurrentRoute);
    router.afterEach((to, from) => {
      var _a2, _b2, _c2, _d;
      if (((_b2 = (_a2 = to.matched[0]) == null ? void 0 : _a2.components) == null ? void 0 : _b2.default) === ((_d = (_c2 = from.matched[0]) == null ? void 0 : _c2.components) == null ? void 0 : _d.default)) {
        syncCurrentRoute();
      }
    });
    const route = {};
    for (const key in _route.value) {
      Object.defineProperty(route, key, {
        get: () => _route.value[key],
        enumerable: true
      });
    }
    nuxtApp._route = shallowReactive(route);
    nuxtApp._middleware = nuxtApp._middleware || {
      global: [],
      named: {}
    };
    useError();
    if (!((_b = nuxtApp.ssrContext) == null ? void 0 : _b.islandContext)) {
      router.afterEach(async (to, _from, failure) => {
        delete nuxtApp._processingMiddleware;
        if (failure) {
          await nuxtApp.callHook("page:loading:end");
        }
        if ((failure == null ? void 0 : failure.type) === 4) {
          return;
        }
        if (to.redirectedFrom && to.fullPath !== initialURL) {
          await nuxtApp.runWithContext(() => navigateTo(to.fullPath || "/"));
        }
      });
    }
    try {
      if (true) {
        ;
        [__temp, __restore] = executeAsync(() => router.push(initialURL)), await __temp, __restore();
        ;
      }
      ;
      [__temp, __restore] = executeAsync(() => router.isReady()), await __temp, __restore();
      ;
    } catch (error2) {
      [__temp, __restore] = executeAsync(() => nuxtApp.runWithContext(() => showError(error2))), await __temp, __restore();
    }
    const resolvedInitialRoute = router.currentRoute.value;
    syncCurrentRoute();
    if ((_c = nuxtApp.ssrContext) == null ? void 0 : _c.islandContext) {
      return { provide: { router } };
    }
    const initialLayout = nuxtApp.payload.state._layout;
    router.beforeEach(async (to, from) => {
      var _a2, _b2;
      await nuxtApp.callHook("page:loading:start");
      to.meta = reactive(to.meta);
      if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
        to.meta.layout = initialLayout;
      }
      nuxtApp._processingMiddleware = true;
      if (!((_a2 = nuxtApp.ssrContext) == null ? void 0 : _a2.islandContext)) {
        const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
        for (const component of to.matched) {
          const componentMiddleware = component.meta.middleware;
          if (!componentMiddleware) {
            continue;
          }
          for (const entry2 of toArray(componentMiddleware)) {
            middlewareEntries.add(entry2);
          }
        }
        {
          const routeRules = await nuxtApp.runWithContext(() => getRouteRules({ path: to.path }));
          if (routeRules.appMiddleware) {
            for (const key in routeRules.appMiddleware) {
              if (routeRules.appMiddleware[key]) {
                middlewareEntries.add(key);
              } else {
                middlewareEntries.delete(key);
              }
            }
          }
        }
        for (const entry2 of middlewareEntries) {
          const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await ((_b2 = namedMiddleware[entry2]) == null ? void 0 : _b2.call(namedMiddleware).then((r) => r.default || r)) : entry2;
          if (!middleware) {
            throw new Error(`Unknown route middleware: '${entry2}'.`);
          }
          const result = await nuxtApp.runWithContext(() => middleware(to, from));
          {
            if (result === false || result instanceof Error) {
              const error2 = result || createError$1({
                statusCode: 404,
                statusMessage: `Page Not Found: ${initialURL}`
              });
              await nuxtApp.runWithContext(() => showError(error2));
              return false;
            }
          }
          if (result === true) {
            continue;
          }
          if (result || result === false) {
            return result;
          }
        }
      }
    });
    router.onError(async () => {
      delete nuxtApp._processingMiddleware;
      await nuxtApp.callHook("page:loading:end");
    });
    router.afterEach(async (to, _from) => {
      if (to.matched.length === 0) {
        await nuxtApp.runWithContext(() => showError(createError$1({
          statusCode: 404,
          fatal: false,
          statusMessage: `Page not found: ${to.fullPath}`,
          data: {
            path: to.fullPath
          }
        })));
      }
    });
    nuxtApp.hooks.hookOnce("app:created", async () => {
      try {
        if ("name" in resolvedInitialRoute) {
          resolvedInitialRoute.name = void 0;
        }
        await router.replace({
          ...resolvedInitialRoute,
          force: true
        });
        router.options.scrollBehavior = routerOptions.scrollBehavior;
      } catch (error2) {
        await nuxtApp.runWithContext(() => showError(error2));
      }
    });
    return { provide: { router } };
  }
});
async function fetchWithRetry(req, init) {
  var _a;
  const retries = 3;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetch(req, init);
    } catch (error) {
      if ((_a = init == null ? void 0 : init.signal) == null ? void 0 : _a.aborted) {
        throw error;
      }
      if (attempt === retries) {
        console.error(`Error fetching request ${req}`, error, init);
        throw error;
      }
      console.warn(`Retrying fetch attempt ${attempt + 1} for request: ${req}`);
      await new Promise((resolve) => setTimeout(resolve, 100 * attempt));
    }
  }
  throw new Error("Unreachable code");
}
function setCookies(event, cookies) {
  const response = event.node.res;
  const headersWritable = () => !response.headersSent && !response.writableEnded;
  if (!headersWritable()) {
    return;
  }
  for (const { name, value, options } of cookies) {
    if (!headersWritable()) {
      break;
    }
    setCookie(event, name, value, options);
  }
}
const serverSupabaseClient = async (event) => {
  if (!event.context._supabaseClient) {
    const { url, key, cookiePrefix, cookieOptions, clientOptions: { auth = {}, global: global2 = {} } } = (/* @__PURE__ */ useRuntimeConfig()).public.supabase;
    event.context._supabaseClient = createServerClient(url, key, {
      auth,
      cookies: {
        getAll: () => parseCookieHeader(getHeader(event, "Cookie") ?? ""),
        setAll: (cookies) => setCookies(event, cookies)
      },
      cookieOptions: {
        ...cookieOptions,
        name: cookiePrefix
      },
      global: {
        fetch: fetchWithRetry,
        ...global2
      }
    });
  }
  return event.context._supabaseClient;
};
const serverSupabaseUser = async (event) => {
  const client = await serverSupabaseClient(event);
  const { data, error } = await client.auth.getClaims();
  if (error) {
    throw createError$1({ statusMessage: error == null ? void 0 : error.message });
  }
  return (data == null ? void 0 : data.claims) ?? null;
};
const serverSupabaseSession = async (event) => {
  const client = await serverSupabaseClient(event);
  const { data: { session }, error } = await client.auth.getSession();
  if (error) {
    throw createError$1({ statusMessage: error == null ? void 0 : error.message });
  }
  session == null ? true : delete session.user;
  return session;
};
const useStateKeyPrefix = "$s";
function useState(...args) {
  const autoKey = typeof args[args.length - 1] === "string" ? args.pop() : void 0;
  if (typeof args[0] !== "string") {
    args.unshift(autoKey);
  }
  const [_key, init] = args;
  if (!_key || typeof _key !== "string") {
    throw new TypeError("[nuxt] [useState] key must be a string: " + _key);
  }
  if (init !== void 0 && typeof init !== "function") {
    throw new Error("[nuxt] [useState] init must be a function: " + init);
  }
  const key = useStateKeyPrefix + _key;
  const nuxtApp = useNuxtApp();
  const state = toRef(nuxtApp.payload.state, key);
  if (state.value === void 0 && init) {
    const initialValue = init();
    if (isRef(initialValue)) {
      nuxtApp.payload.state[key] = initialValue;
      return initialValue;
    }
    state.value = initialValue;
  }
  return state;
}
const useSupabaseSession = () => useState("supabase_session", () => null);
const useSupabaseUser = () => useState("supabase_user", () => null);
function useRequestEvent(nuxtApp = useNuxtApp()) {
  var _a;
  return (_a = nuxtApp.ssrContext) == null ? void 0 : _a.event;
}
function useRequestFetch() {
  var _a;
  return ((_a = useRequestEvent()) == null ? void 0 : _a.$fetch) || globalThis.$fetch;
}
const supabase_server_Oc4YhUSfyF = /* @__PURE__ */ defineNuxtPlugin({
  name: "supabase",
  enforce: "pre",
  async setup({ provide: provide2 }) {
    let __temp, __restore;
    const { url, key, cookiePrefix, useSsrCookies, cookieOptions, clientOptions } = (/* @__PURE__ */ useRuntimeConfig()).public.supabase;
    const event = useRequestEvent();
    const client = createServerClient(url, key, {
      ...clientOptions,
      cookies: {
        getAll: () => parseCookieHeader(getHeader(event, "Cookie") ?? ""),
        setAll: (cookies) => setCookies(event, cookies)
      },
      cookieOptions: {
        ...cookieOptions,
        name: cookiePrefix
      },
      global: {
        fetch: fetchWithRetry,
        ...clientOptions.global
      }
    });
    provide2("supabase", { client });
    if (useSsrCookies) {
      const [
        session,
        user
      ] = ([__temp, __restore] = executeAsync(() => Promise.all([
        serverSupabaseSession(event).catch(() => null),
        serverSupabaseUser(event).catch(() => null)
      ])), __temp = await __temp, __restore(), __temp);
      useSupabaseSession().value = session;
      useSupabaseUser().value = user;
    }
  }
});
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext._payloadReducers[name] = reduce;
  }
}
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_eJ33V7gbc6 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
const components_plugin_KR1HBZs4kY = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const CookieDefaults = {
  path: "/",
  watch: true,
  decode: (val) => destr(decodeURIComponent(val)),
  encode: (val) => encodeURIComponent(typeof val === "string" ? val : JSON.stringify(val))
};
function useCookie(name, _opts) {
  var _a;
  const opts = { ...CookieDefaults, ..._opts };
  opts.filter ?? (opts.filter = (key) => key === name);
  const cookies = readRawCookies(opts) || {};
  let delay;
  if (opts.maxAge !== void 0) {
    delay = opts.maxAge * 1e3;
  } else if (opts.expires) {
    delay = opts.expires.getTime() - Date.now();
  }
  const hasExpired = delay !== void 0 && delay <= 0;
  const cookieValue = klona(hasExpired ? void 0 : cookies[name] ?? ((_a = opts.default) == null ? void 0 : _a.call(opts)));
  const cookie = ref(cookieValue);
  {
    const nuxtApp = useNuxtApp();
    const writeFinalCookieValue = () => {
      if (opts.readonly || isEqual(cookie.value, cookies[name])) {
        return;
      }
      nuxtApp._cookies || (nuxtApp._cookies = {});
      if (name in nuxtApp._cookies) {
        if (isEqual(cookie.value, nuxtApp._cookies[name])) {
          return;
        }
      }
      nuxtApp._cookies[name] = cookie.value;
      writeServerCookie(useRequestEvent(nuxtApp), name, cookie.value, opts);
    };
    const unhook = nuxtApp.hooks.hookOnce("app:rendered", writeFinalCookieValue);
    nuxtApp.hooks.hookOnce("app:error", () => {
      unhook();
      return writeFinalCookieValue();
    });
  }
  return cookie;
}
function readRawCookies(opts = {}) {
  {
    return parse(getRequestHeader(useRequestEvent(), "cookie") || "", opts);
  }
}
function writeServerCookie(event, name, value, opts = {}) {
  if (event) {
    if (value !== null && value !== void 0) {
      return setCookie(event, name, value, opts);
    }
    if (getCookie(event, name) !== void 0) {
      return deleteCookie(event, name, opts);
    }
  }
}
const useSupabaseCookieRedirect = () => {
  const config = (/* @__PURE__ */ useRuntimeConfig()).public.supabase;
  const prefix = config.redirectOptions.saveRedirectToCookie ? config.cookiePrefix : config.cookieName;
  const cookie = useCookie(
    `${prefix}-redirect-path`,
    {
      ...config.cookieOptions,
      readonly: false
    }
  );
  return {
    path: cookie,
    pluck: () => {
      const value = cookie.value;
      cookie.value = null;
      return value;
    }
  };
};
function matchesAnyPattern(path, patterns) {
  return patterns.some((pattern) => {
    if (!pattern) return false;
    const regex = new RegExp(`^${pattern.replace(/\*/g, ".*")}$`);
    return regex.test(path);
  });
}
const auth_redirect_bWtzICY6fh = /* @__PURE__ */ defineNuxtPlugin({
  name: "auth-redirect",
  setup() {
    addRouteMiddleware(
      "global-auth",
      /* @__PURE__ */ defineNuxtRouteMiddleware((to) => {
        const config = (/* @__PURE__ */ useRuntimeConfig()).public.supabase;
        const { login, callback, include, exclude, cookieRedirect, saveRedirectToCookie } = config.redirectOptions;
        if (include && include.length > 0) {
          if (!matchesAnyPattern(to.path, include)) {
            return;
          }
        }
        const excludePatterns = [login, callback, ...exclude ?? []];
        if (matchesAnyPattern(to.path, excludePatterns)) {
          return;
        }
        const session = useSupabaseSession();
        if (!session.value) {
          if (cookieRedirect || saveRedirectToCookie) {
            const redirectInfo = useSupabaseCookieRedirect();
            redirectInfo.path.value = to.fullPath;
          }
          return navigateTo(login);
        }
      }),
      { global: true }
    );
  }
});
const load_branding_server_JQn98A6BIk = /* @__PURE__ */ defineNuxtPlugin(async (nuxtApp) => {
  var _a;
  let __temp, __restore;
  const config = /* @__PURE__ */ useRuntimeConfig();
  if (config.public.demoMode) return;
  const event = useRequestEvent();
  const tenant = (_a = event == null ? void 0 : event.context) == null ? void 0 : _a.tenant;
  if (tenant) {
    useState("currentPartner", () => tenant);
    useState("partnerBrandingLoaded", () => true);
  } else {
    try {
      const data = ([__temp, __restore] = executeAsync(() => $fetch("/api/tenant/branding")), __temp = await __temp, __restore(), __temp);
      if (data) {
        useState("currentPartner", () => data);
        useState("partnerBrandingLoaded", () => true);
      }
    } catch {
    }
  }
});
const plugins = [
  unhead_KgADcZ0jPj,
  plugin,
  supabase_server_Oc4YhUSfyF,
  revive_payload_server_eJ33V7gbc6,
  components_plugin_KR1HBZs4kY,
  auth_redirect_bWtzICY6fh,
  load_branding_server_JQn98A6BIk
];
const layouts = {
  admin: defineAsyncComponent(() => import('./admin-CDIqPWcg.mjs').then((m) => m.default || m)),
  customer: defineAsyncComponent(() => import('./customer-Ch5pUWfE.mjs').then((m) => m.default || m)),
  default: defineAsyncComponent(() => import('./default-vYuesSct.mjs').then((m) => m.default || m)),
  platform: defineAsyncComponent(() => import('./platform-BZ6uP55v.mjs').then((m) => m.default || m))
};
const LayoutLoader = defineComponent({
  name: "LayoutLoader",
  inheritAttrs: false,
  props: {
    name: String,
    layoutProps: Object
  },
  setup(props, context) {
    return () => h(layouts[props.name], props.layoutProps, context.slots);
  }
});
const __nuxt_component_0 = defineComponent({
  name: "NuxtLayout",
  inheritAttrs: false,
  props: {
    name: {
      type: [String, Boolean, Object],
      default: null
    },
    fallback: {
      type: [String, Object],
      default: null
    }
  },
  setup(props, context) {
    const nuxtApp = useNuxtApp();
    const injectedRoute = inject(PageRouteSymbol);
    const route = injectedRoute === useRoute() ? useRoute$1() : injectedRoute;
    const layout = computed(() => {
      let layout2 = unref(props.name) ?? route.meta.layout ?? "default";
      if (layout2 && !(layout2 in layouts)) {
        if (props.fallback) {
          layout2 = unref(props.fallback);
        }
      }
      return layout2;
    });
    const layoutRef = ref();
    context.expose({ layoutRef });
    const done = nuxtApp.deferHydration();
    return () => {
      const hasLayout = layout.value && layout.value in layouts;
      const transitionProps = route.meta.layoutTransition ?? appLayoutTransition;
      return _wrapInTransition(hasLayout && transitionProps, {
        default: () => h(Suspense, { suspensible: true, onResolve: () => {
          nextTick(done);
        } }, {
          default: () => h(
            LayoutProvider,
            {
              layoutProps: mergeProps(context.attrs, { ref: layoutRef }),
              key: layout.value || void 0,
              name: layout.value,
              shouldProvide: !props.name,
              hasTransition: !!transitionProps
            },
            context.slots
          )
        })
      }).default();
    };
  }
});
const LayoutProvider = defineComponent({
  name: "NuxtLayoutProvider",
  inheritAttrs: false,
  props: {
    name: {
      type: [String, Boolean]
    },
    layoutProps: {
      type: Object
    },
    hasTransition: {
      type: Boolean
    },
    shouldProvide: {
      type: Boolean
    }
  },
  setup(props, context) {
    const name = props.name;
    if (props.shouldProvide) {
      provide(LayoutMetaSymbol, {
        isCurrent: (route) => name === (route.meta.layout ?? "default")
      });
    }
    return () => {
      var _a, _b;
      if (!name || typeof name === "string" && !(name in layouts)) {
        return (_b = (_a = context.slots).default) == null ? void 0 : _b.call(_a);
      }
      return h(
        LayoutLoader,
        { key: name, layoutProps: props.layoutProps, name },
        context.slots
      );
    };
  }
});
const RouteProvider = defineComponent({
  props: {
    vnode: {
      type: Object,
      required: true
    },
    route: {
      type: Object,
      required: true
    },
    vnodeRef: Object,
    renderKey: String,
    trackRootNodes: Boolean
  },
  setup(props) {
    const previousKey = props.renderKey;
    const previousRoute = props.route;
    const route = {};
    for (const key in props.route) {
      Object.defineProperty(route, key, {
        get: () => previousKey === props.renderKey ? props.route[key] : previousRoute[key],
        enumerable: true
      });
    }
    provide(PageRouteSymbol, shallowReactive(route));
    return () => {
      return h(props.vnode, { ref: props.vnodeRef });
    };
  }
});
const __nuxt_component_1 = defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    transition: {
      type: [Boolean, Object],
      default: void 0
    },
    keepalive: {
      type: [Boolean, Object],
      default: void 0
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs, slots, expose }) {
    const nuxtApp = useNuxtApp();
    const pageRef = ref();
    const forkRoute = inject(PageRouteSymbol, null);
    let previousPageKey;
    expose({ pageRef });
    inject(LayoutMetaSymbol, null);
    let vnode;
    const done = nuxtApp.deferHydration();
    if (props.pageKey) {
      watch(() => props.pageKey, (next, prev) => {
        if (next !== prev) {
          nuxtApp.callHook("page:loading:start");
        }
      });
    }
    return () => {
      return h(RouterView, { name: props.name, route: props.route, ...attrs }, {
        default: (routeProps) => {
          if (!routeProps.Component) {
            done();
            return;
          }
          const key = generateRouteKey$1(routeProps, props.pageKey);
          if (!nuxtApp.isHydrating && !hasChildrenRoutes(forkRoute, routeProps.route, routeProps.Component) && previousPageKey === key) {
            nuxtApp.callHook("page:loading:end");
          }
          previousPageKey = key;
          {
            vnode = h(Suspense, {
              suspensible: true
            }, {
              default: () => {
                const providerVNode = h(RouteProvider, {
                  key: key || void 0,
                  vnode: slots.default ? h(Fragment, void 0, slots.default(routeProps)) : routeProps.Component,
                  route: routeProps.route,
                  renderKey: key || void 0,
                  vnodeRef: pageRef
                });
                return providerVNode;
              }
            });
            return vnode;
          }
        }
      });
    };
  }
});
function hasChildrenRoutes(fork, newRoute, Component) {
  if (!fork) {
    return false;
  }
  const index = newRoute.matched.findIndex((m) => {
    var _a;
    return ((_a = m.components) == null ? void 0 : _a.default) === (Component == null ? void 0 : Component.type);
  });
  return index < newRoute.matched.length - 1;
}
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "AppIcon",
  __ssrInlineRender: true,
  props: {
    name: {},
    size: {}
  },
  setup(__props) {
    const props = __props;
    const s = props.size ?? 20;
    const icons = {
      // Navigation
      "dashboard": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
      "users": "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m9 5.197V21",
      "puzzle": "M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z",
      "credit-card": "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
      "settings": "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
      // Module types
      "solar": "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
      "heat-pump": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      "ev-charger": "M13 10V3L4 14h7v7l9-11h-7z",
      // Status & actions
      "check": "M5 13l4 4L19 7",
      "check-circle": "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      "warning": "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
      "x": "M6 18L18 6M6 6l12 12",
      "x-circle": "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
      "plus": "M12 4v16m8-8H4",
      "minus": "M20 12H4",
      "arrow-left": "M10 19l-7-7m0 0l7-7m-7 7h18",
      "arrow-right": "M14 5l7 7m0 0l-7 7m7-7H3",
      "chevron-right": "M9 5l7 7-7 7",
      // UI elements
      "search": "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
      "map-pin": "M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z",
      "chart": "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      "logout": "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
      "external": "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
      "clock": "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
      "home": "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4",
      "euro": "M14.121 15.536c-1.171 1.952-3.07 1.952-4.242 0-1.172-1.953-1.172-5.119 0-7.072 1.171-1.952 3.07-1.952 4.242 0M8 10.5h4m-4 3h4",
      "building": "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0H5m14 0h2M5 21H3m4-10h2m4 0h2m-6 4h2m4 0h2",
      "switch": "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4",
      "globe": "M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9",
      "chevron-down": "M19 9l-7 7-7-7",
      "chevron-up": "M5 15l7-7 7 7",
      "mail": "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
      "bell": "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      // Consumer dashboard icons
      "thermometer": "M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M12 2a8 8 0 00-8 8v4a8 8 0 0016 0v-4a8 8 0 00-8-8z",
      "droplet": "M12 21c-4.97 0-9-4.03-9-9 0-3.314 3.686-8.314 9-12 5.314 3.686 9 8.686 9 12 0 4.97-4.03 9-9 9z",
      "zap": "M13 10V3L4 14h7v7l9-11h-7z",
      "battery": "M17 6H3a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2zm4 4v4",
      "play": "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      "pause": "M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z",
      "phone": "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
      "help-circle": "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01 M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      "tool": "M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.121 2.121 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z",
      "shield": "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
      "calendar": "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
      "send": "M12 19l9 2-9-18-9 18 9-2zm0 0v-8",
      "message": "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
      "activity": "M22 12h-4l-3 9L9 3l-3 9H2",
      "file-text": "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z M14 2v6h6 M16 13H8m8 4H8m2-8H8",
      "refresh": "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
      "trending-up": "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
      "arrow-down": "M19 14l-7 7m0 0l-7-7m7 7V3",
      "arrow-up": "M5 10l7-7m0 0l7 7m-7-7v18",
      "grid": "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z",
      "menu": "M4 6h16M4 12h16M4 18h16",
      "user": "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
      "document": "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      "upload": "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
      "download": "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
      "trash": "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
      "folder": "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
      "package": "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
      "info": "M13 16h-1v-4h-1m1-4h.01 M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      "tag": "M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-5 5a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 014 9V4a1 1 0 011-1z"
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<svg${ssrRenderAttrs(mergeProps({
        xmlns: "http://www.w3.org/2000/svg",
        width: unref(s),
        height: unref(s),
        viewBox: `0 0 24 24`,
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "1.5",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        class: "shrink-0"
      }, _attrs))}><!--[-->`);
      ssrRenderList((icons[__props.name] || "").split(" M").map((p, j) => j === 0 ? p : "M" + p), (d, i) => {
        _push(`<path${ssrRenderAttr("d", d)}></path>`);
      });
      _push(`<!--]--></svg>`);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/AppIcon.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
let nextId = 0;
function useConfirmState() {
  return useState("confirmDialog", () => null);
}
function useConfirm() {
  const state = useConfirmState();
  return (options) => {
    return new Promise((resolve) => {
      const opts = typeof options === "string" ? { message: options } : options;
      state.value = {
        id: ++nextId,
        title: opts.title,
        message: opts.message,
        confirmLabel: opts.confirmLabel || "Bevestigen",
        cancelLabel: opts.cancelLabel || "Annuleren",
        dangerous: !!opts.dangerous,
        resolve
      };
    });
  };
}
function generateAiResponse(message, moduleType, ctx) {
  const msg = message.toLowerCase();
  if (matchesAny(msg, ["opbrengst", "productie", "panelen", "zonnepaneel", "solar", "weinig opgewekt", "minder stroom"])) {
    const status = ctx.solarData.status === "online" ? "online en functioneert normaal" : "offline. Dit kan de oorzaak zijn";
    return {
      content: `Ik heb je zonnepanelen gecheckt. Je systeem is ${status}. Op dit moment wordt er ${formatW(ctx.solarData.currentProductionW)} geproduceerd. Vandaag is de totale opbrengst ${ctx.solarData.todayKwh.toFixed(1)} kWh, goed voor een besparing van €${(ctx.solarData.todayEuro / 100).toFixed(2)}.

De piek vandaag was ${formatW(ctx.solarData.peakTodayW)} om ${ctx.solarData.peakTodayTime}. ${ctx.solarData.selfConsumptionPercent}% van de opgewekte energie gebruik je zelf.

Op basis van deze gegevens werkt je systeem naar verwachting. Als je toch een verschil merkt, kan het komen door bewolking of schaduw.`,
      systemCheck: true,
      dataPoints: [
        { label: "Huidige productie", value: formatW(ctx.solarData.currentProductionW) },
        { label: "Vandaag opgewekt", value: `${ctx.solarData.todayKwh.toFixed(1)} kWh` },
        { label: "Status", value: ctx.solarData.status },
        { label: "Eigen verbruik", value: `${ctx.solarData.selfConsumptionPercent}%` }
      ],
      shouldEscalate: ctx.solarData.status !== "online"
    };
  }
  if (matchesAny(msg, ["warmtepomp", "verwarming", "temperatuur", "koud", "warm", "storing", "geluid", "tikt", "bromm"])) {
    const hasIssue = matchesAny(msg, ["storing", "geluid", "tikt", "bromm", "kapot", "fout", "werkt niet"]);
    const statusText = ctx.heatPumpData.status === "storing" ? "Er is een storing gedetecteerd." : `Status: ${ctx.heatPumpData.status}. Geen storingen gedetecteerd.`;
    if (hasIssue && ctx.heatPumpData.status !== "storing") {
      return {
        content: `Ik heb je warmtepomp gecontroleerd. ${statusText} De COP is ${ctx.heatPumpData.copCurrent.toFixed(1)} (${ctx.heatPumpData.copRating}), wat betekent dat het systeem efficiënt draait.

Binnentemperatuur: ${ctx.heatPumpData.actualTemperature}°C (ingesteld: ${ctx.heatPumpData.setTemperature}°C).
Warmwater: ${ctx.heatPumpData.hotWaterStatus === "gereed" ? "gereed" : "wordt opgewarmd"} (${ctx.heatPumpData.hotWaterTemp}°C).

Technisch lijkt alles in orde. Omdat je aangeeft dat er een probleem is, raad ik aan om dit te laten nakijken door een monteur. Zal ik dit doorsturen naar ${ctx.partnerName}?`,
        systemCheck: true,
        dataPoints: [
          { label: "Status", value: ctx.heatPumpData.status },
          { label: "COP", value: `${ctx.heatPumpData.copCurrent.toFixed(1)} (${ctx.heatPumpData.copRating})` },
          { label: "Binnen", value: `${ctx.heatPumpData.actualTemperature}°C` },
          { label: "Ingesteld", value: `${ctx.heatPumpData.setTemperature}°C` }
        ],
        shouldEscalate: false
        // Bied optie, escaleer niet automatisch
      };
    }
    return {
      content: `Ik heb je warmtepomp gecheckt. ${statusText}

Binnentemperatuur: ${ctx.heatPumpData.actualTemperature}°C (ingesteld: ${ctx.heatPumpData.setTemperature}°C). Buitentemperatuur: ${ctx.heatPumpData.outsideTemperature}°C. Modus: ${ctx.heatPumpData.mode}.

Je warmtepomp werkt normaal.`,
      systemCheck: true,
      dataPoints: [
        { label: "Status", value: ctx.heatPumpData.status },
        { label: "Binnen", value: `${ctx.heatPumpData.actualTemperature}°C` },
        { label: "Buiten", value: `${ctx.heatPumpData.outsideTemperature}°C` },
        { label: "Modus", value: ctx.heatPumpData.mode }
      ],
      shouldEscalate: ctx.heatPumpData.status === "storing"
    };
  }
  if (matchesAny(msg, ["laadpaal", "laden", "auto", "opladen", "charger", "easee", "laadsessie"])) {
    const statusText = ctx.evChargerData.status === "laden" ? `Je auto wordt momenteel geladen met ${formatW(ctx.evChargerData.currentPowerW)}.` : "Je laadpaal staat op stand-by en is klaar om te laden.";
    return {
      content: `${statusText}

Vandaag is er ${ctx.evChargerData.chargedTodayKwh.toFixed(1)} kWh geladen (€${(ctx.evChargerData.chargedTodayEuro / 100).toFixed(2)}). Deze maand: ${ctx.evChargerData.chargedMonthKwh} kWh.

Je laadmodus staat op "${ctx.evChargerData.chargeMode}". ${ctx.evChargerData.chargeMode === "slim" ? "Dit betekent dat er zoveel mogelijk op zonne-energie wordt geladen." : ""}`,
      systemCheck: true,
      dataPoints: [
        { label: "Status", value: ctx.evChargerData.status },
        { label: "Vandaag geladen", value: `${ctx.evChargerData.chargedTodayKwh.toFixed(1)} kWh` },
        { label: "Laadmodus", value: ctx.evChargerData.chargeMode }
      ],
      shouldEscalate: ctx.evChargerData.status === "storing"
    };
  }
  if (matchesAny(msg, ["factuur", "betaling", "incasso", "kosten", "prijs", "bedrag", "rekening"])) {
    const modules = ctx.activeModules.map(
      (m) => m === "solar" ? "Zonnepanelen" : m === "heat_pump" ? "Warmtepomp" : "Laadpaal"
    ).join(" + ");
    return {
      content: `Je facturen vind je op de pagina "Facturen" in je account. Je huidige servicecontract dekt: ${modules}.

De betaling verloopt via automatische incasso. Als je een afwijking ziet, controleer dan de factuurpagina voor details. Klopt er iets niet? Dan help ik je graag verder.`,
      systemCheck: false,
      dataPoints: [],
      shouldEscalate: false
    };
  }
  if (matchesAny(msg, ["opzeggen", "stoppen", "annuleren", "beëindigen"])) {
    return {
      content: `Ik begrijp dat je je servicecontract wilt wijzigen of opzeggen. Dit kan ik niet zelf voor je regelen. Ik stuur je vraag door naar ${ctx.partnerName} zodat zij je persoonlijk kunnen helpen met de mogelijkheden.`,
      systemCheck: false,
      dataPoints: [],
      shouldEscalate: true,
      escalateReason: "Klant wil servicecontract opzeggen of wijzigen"
    };
  }
  if (matchesAny(msg, ["afspraak", "monteur", "langskomen", "bezoek", "inspectie", "onderhoud"])) {
    return {
      content: `Ik plan graag een afspraak voor je in. Ik stuur je verzoek door naar ${ctx.partnerName}. Zij nemen contact op om een geschikt moment af te spreken.`,
      systemCheck: false,
      dataPoints: [],
      shouldEscalate: true,
      escalateReason: "Klant wil een afspraak inplannen"
    };
  }
  if (matchesAny(msg, ["bedankt", "dankjewel", "top", "opgelost", "helder", "duidelijk", "geholpen"])) {
    return {
      content: `Graag gedaan! Fijn dat ik je kon helpen. Mocht je later nog vragen hebben, dan ben ik er altijd. Een fijne dag!`,
      systemCheck: false,
      dataPoints: [],
      shouldEscalate: false
    };
  }
  return {
    content: `Bedankt voor je bericht. Ik kan je hier niet direct mee helpen. Ik stuur je vraag door naar ${ctx.partnerName} zodat zij je persoonlijk kunnen helpen. Ze reageren meestal binnen 1 werkdag.`,
    systemCheck: false,
    dataPoints: [],
    shouldEscalate: true,
    escalateReason: "Vraag niet automatisch te beantwoorden"
  };
}
function generateAiSummary(messages, moduleType) {
  const customerMessages = messages.filter((m) => m.role === "customer").map((m) => m.content).join(" ");
  const msg = customerMessages.toLowerCase();
  if (matchesAny(msg, ["storing", "geluid", "kapot", "werkt niet", "fout"])) {
    const module = moduleType === "solar" ? "zonnepanelen" : moduleType === "heat_pump" ? "warmtepomp" : moduleType === "ev_charger" ? "laadpaal" : "systeem";
    return `Klant meldt een probleem met ${module}. Systeem is automatisch gecontroleerd, geen technische storing gedetecteerd. Mogelijk fysiek probleem dat inspectie vereist.`;
  }
  if (matchesAny(msg, ["opzeggen", "stoppen"])) {
    return "Klant overweegt opzegging van servicecontract. Persoonlijk gesprek aanbevolen.";
  }
  if (matchesAny(msg, ["factuur", "betaling", "kosten"])) {
    return "Klant heeft een vraag over facturatie. AI heeft verwezen naar factuurpagina.";
  }
  return "Klantvraag die niet automatisch kon worden beantwoord. Menselijke reactie vereist.";
}
function matchesAny(text, keywords) {
  return keywords.some((kw) => text.includes(kw));
}
function formatW(watts) {
  return `${(watts / 1e3).toFixed(1).replace(".", ",")} kW`;
}
const PARTNERS = reactive([
  {
    id: "partner-1",
    name: "Volt4U",
    slug: "volt4u",
    custom_domain: null,
    logo_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%23f97316'/%3E%3Cpath d='M20 6l-8 18h6l-2 10 12-16h-7l5-12z' fill='white'/%3E%3C/svg%3E",
    primary_color: "#f97316",
    secondary_color: "#fff7ed",
    terms_url: "https://volt4u.nl/servicevoorwaarden",
    terms_placeholders: {
      bedrijfsnaam: "Volt4U B.V.",
      kvk: "12345678",
      adres: "Energieweg 10, 3011 AB Rotterdam",
      email: "info@volt4u.nl",
      telefoon: "088-DEMO123"
    },
    terms_content: `Servicevoorwaarden {{bedrijfsnaam}}

Laatst bijgewerkt: maart 2026

1. Algemeen

Deze servicevoorwaarden zijn van toepassing op alle servicecontracten afgesloten bij {{bedrijfsnaam}}, gevestigd te {{adres}}, ingeschreven bij de Kamer van Koophandel onder nummer {{kvk}}.

2. Definities

Serviceprovider: {{bedrijfsnaam}}, bereikbaar via {{email}} en {{telefoon}}.
Klant: de natuurlijke persoon die een servicecontract heeft afgesloten.
Installatie: het energiesysteem (zonnepanelen, warmtepomp en/of laadpaal) waarop het servicecontract betrekking heeft.

3. Servicecontract

3.1 Het servicecontract omvat monitoring, storingsanalyse en indien van toepassing proactief onderhoud van de installatie.
3.2 De exacte diensten zijn afhankelijk van het gekozen servicepakket (Start, Slim of Max).
3.3 {{bedrijfsnaam}} spant zich in om storingen binnen de afgesproken termijn te analyseren en op te lossen.

4. Looptijd en opzegging

4.1 Het servicecontract heeft een minimale looptijd zoals vermeld bij het afsluiten van het contract.
4.2 Na afloop van de minimale looptijd is het contract maandelijks opzegbaar met een opzegtermijn van 1 maand.
4.3 Opzegging kan via het klantportaal of per e-mail naar {{email}}.

5. Betaling

5.1 Betaling geschiedt maandelijks via automatische incasso.
5.2 Bij het uitblijven van betaling wordt de klant per e-mail herinnerd.
5.3 Na twee mislukte incasso's kan {{bedrijfsnaam}} het servicecontract opschorten.

6. Monitoring en data

6.1 {{bedrijfsnaam}} monitort de installatie via het UPsol-platform in samenwerking met gespecialiseerde monitoringpartners.
6.2 Klantgegevens worden verwerkt conform de AVG en zijn uitsluitend toegankelijk voor {{bedrijfsnaam}} en de klant zelf.
6.3 Gegevens van klanten van {{bedrijfsnaam}} zijn nooit zichtbaar voor andere installateurs of derden.

7. Aansprakelijkheid

7.1 {{bedrijfsnaam}} is niet aansprakelijk voor schade als gevolg van storingen in de installatie, tenzij sprake is van grove nalatigheid.
7.2 De aansprakelijkheid van {{bedrijfsnaam}} is beperkt tot het bedrag van het servicecontract over de voorafgaande 12 maanden.

8. Wijzigingen

8.1 {{bedrijfsnaam}} behoudt zich het recht voor deze voorwaarden te wijzigen. Klanten worden hiervan minimaal 30 dagen van tevoren per e-mail op de hoogte gesteld.
8.2 Bij ingrijpende wijzigingen heeft de klant het recht het contract kosteloos op te zeggen.

9. Contact

Voor vragen over deze voorwaarden kunt u contact opnemen met:
{{bedrijfsnaam}}
{{adres}}
{{email}}
{{telefoon}}
KvK: {{kvk}}`,
    support_email: "info@volt4u.nl",
    support_phone: "085-1234567",
    is_active: true,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z"
  },
  {
    id: "partner-2",
    name: "SolarWise",
    slug: "solarwise",
    custom_domain: null,
    logo_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%23059669'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-size='20' font-weight='bold' fill='white' font-family='Arial'%3ES%3C/text%3E%3C/svg%3E",
    primary_color: "#059669",
    secondary_color: "#ecfdf5",
    terms_url: "https://solarwise.nl/voorwaarden",
    terms_content: "",
    terms_placeholders: {
      bedrijfsnaam: "SolarWise Nederland B.V.",
      kvk: "87654321",
      adres: "Zonnebloemstraat 5, 2011 CD Haarlem",
      email: "info@solarwise.nl",
      telefoon: "020-1234567"
    },
    support_email: "info@solarwise.nl",
    support_phone: "030-9876543",
    is_active: true,
    created_at: "2025-02-15T00:00:00Z",
    updated_at: "2025-02-15T00:00:00Z"
  },
  {
    id: "partner-3",
    name: "GreenCharge",
    slug: "greencharge",
    custom_domain: null,
    logo_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%237c3aed'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-size='20' font-weight='bold' fill='white' font-family='Arial'%3EG%3C/text%3E%3C/svg%3E",
    primary_color: "#7c3aed",
    secondary_color: "#f5f3ff",
    terms_url: "https://greencharge.nl/voorwaarden",
    terms_content: "",
    terms_placeholders: {
      bedrijfsnaam: "GreenCharge B.V.",
      kvk: "11223344",
      adres: "Laadplein 1, 9711 AB Groningen",
      email: "info@greencharge.nl",
      telefoon: "050-9876543"
    },
    support_email: "support@greencharge.nl",
    support_phone: "050-5551234",
    is_active: true,
    created_at: "2025-04-01T00:00:00Z",
    updated_at: "2025-04-01T00:00:00Z"
  }
]);
const MODULE_DEFINITIONS = [
  {
    id: "mod-solar",
    type: "solar",
    name: "Zonnepanelen",
    description: "Realtime inzicht in de opbrengst van je zonnepanelen",
    icon: "solar",
    integration_type: "sundata",
    default_price_monthly: 499,
    default_price_yearly: 4990,
    is_active: true,
    sort_order: 1,
    created_at: "2025-01-01T00:00:00Z"
  },
  {
    id: "mod-heatpump",
    type: "heat_pump",
    name: "Warmtepomp",
    description: "Monitor de status en prestaties van je warmtepomp",
    icon: "heatpump",
    integration_type: "weheat",
    default_price_monthly: 499,
    default_price_yearly: 4990,
    is_active: true,
    sort_order: 2,
    created_at: "2025-01-01T00:00:00Z"
  },
  {
    id: "mod-ev",
    type: "ev_charger",
    name: "Laadpaal",
    description: "Overzicht van laadsessies en energieverbruik",
    icon: "ev",
    integration_type: "easee",
    default_price_monthly: 499,
    default_price_yearly: 4990,
    is_active: true,
    sort_order: 3,
    created_at: "2025-01-01T00:00:00Z"
  }
];
const PMC_VOLTVIA = MODULE_DEFINITIONS.map((md, i) => ({
  id: `pmc-${i + 1}`,
  partner_id: "partner-1",
  module_definition_id: md.id,
  is_enabled: true,
  price_monthly: md.default_price_monthly,
  price_yearly: md.default_price_yearly,
  min_contract_months: 12,
  custom_terms: null,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  module_definition: md
}));
const PMC_SOLARWISE = MODULE_DEFINITIONS.map((md, i) => ({
  id: `pmc-sw-${i + 1}`,
  partner_id: "partner-2",
  module_definition_id: md.id,
  is_enabled: i < 2,
  // only solar + heat_pump enabled
  price_monthly: 549,
  price_yearly: 5490,
  min_contract_months: 12,
  custom_terms: null,
  created_at: "2025-02-15T00:00:00Z",
  updated_at: "2025-02-15T00:00:00Z",
  module_definition: md
}));
const PMC_GREENCHARGE = MODULE_DEFINITIONS.map((md, i) => ({
  id: `pmc-gc-${i + 1}`,
  partner_id: "partner-3",
  module_definition_id: md.id,
  is_enabled: i !== 1,
  // solar + ev_charger enabled (not heat_pump)
  price_monthly: 399,
  price_yearly: 3990,
  min_contract_months: 12,
  custom_terms: null,
  created_at: "2025-04-01T00:00:00Z",
  updated_at: "2025-04-01T00:00:00Z",
  module_definition: md
}));
const ALL_PARTNER_MODULE_CONFIGS = [...PMC_VOLTVIA, ...PMC_SOLARWISE, ...PMC_GREENCHARGE];
const CUSTOMERS_VOLTVIA = reactive([
  { id: "cust-1", auth_user_id: "auth-1", partner_id: "partner-1", email: "jan.devries@gmail.com", full_name: "Jan de Vries", phone: "06-12345678", mollie_customer_id: null, street: "Kerkstraat", house_number: "12", postal_code: "1234 AB", city: "Amsterdam", created_at: "2025-03-15T10:00:00Z", updated_at: "2025-03-15T10:00:00Z" },
  { id: "cust-2", auth_user_id: "auth-2", partner_id: "partner-1", email: "lisa.bakker@outlook.com", full_name: "Lisa Bakker", phone: "06-98765432", mollie_customer_id: null, street: "Dorpsweg", house_number: "45a", postal_code: "5678 CD", city: "Utrecht", created_at: "2025-04-20T14:00:00Z", updated_at: "2025-04-20T14:00:00Z" },
  { id: "cust-3", auth_user_id: "auth-3", partner_id: "partner-1", email: "piet.janssen@hotmail.com", full_name: "Piet Janssen", phone: "06-55512345", mollie_customer_id: null, street: "Hoofdstraat", house_number: "78", postal_code: "9012 EF", city: "Rotterdam", created_at: "2025-05-10T09:00:00Z", updated_at: "2025-05-10T09:00:00Z" },
  { id: "cust-4", auth_user_id: "auth-4", partner_id: "partner-1", email: "maria.vandijk@gmail.com", full_name: "Maria van Dijk", phone: "06-44498765", mollie_customer_id: null, street: "Molenweg", house_number: "3", postal_code: "3456 GH", city: "Den Haag", created_at: "2025-06-01T11:00:00Z", updated_at: "2025-06-01T11:00:00Z" },
  { id: "cust-5", auth_user_id: "auth-5", partner_id: "partner-1", email: "tom.smit@ziggo.nl", full_name: "Tom Smit", phone: "06-33345678", mollie_customer_id: null, street: "Lindelaan", house_number: "22", postal_code: "7890 IJ", city: "Eindhoven", created_at: "2025-07-12T16:00:00Z", updated_at: "2025-07-12T16:00:00Z" },
  { id: "cust-new-demo", auth_user_id: "auth-demo", partner_id: "partner-1", email: "henk.vanderberg@gmail.com", full_name: "Henk van der Berg", phone: "06-28394756", mollie_customer_id: null, street: "Eikenlaan", house_number: "7", postal_code: "3511 KZ", city: "Utrecht", created_at: new Date(Date.now() - 36e5).toISOString(), updated_at: new Date(Date.now() - 36e5).toISOString() }
]);
const CUSTOMERS_SOLARWISE = reactive([
  { id: "cust-6", auth_user_id: "auth-6", partner_id: "partner-2", email: "erik.vanberg@gmail.com", full_name: "Erik van Berg", phone: "06-11122233", mollie_customer_id: null, street: "Zonnelaan", house_number: "8", postal_code: "2011 AB", city: "Haarlem", created_at: "2025-03-01T10:00:00Z", updated_at: "2025-03-01T10:00:00Z" },
  { id: "cust-7", auth_user_id: "auth-7", partner_id: "partner-2", email: "anna.dewit@outlook.com", full_name: "Anna de Wit", phone: "06-44455566", mollie_customer_id: null, street: "Parkstraat", house_number: "15", postal_code: "2312 CD", city: "Leiden", created_at: "2025-04-10T14:00:00Z", updated_at: "2025-04-10T14:00:00Z" },
  { id: "cust-8", auth_user_id: "auth-8", partner_id: "partner-2", email: "marco.visser@gmail.com", full_name: "Marco Visser", phone: "06-77788899", mollie_customer_id: null, street: "Waterweg", house_number: "32", postal_code: "2600 EF", city: "Delft", created_at: "2025-05-20T09:00:00Z", updated_at: "2025-05-20T09:00:00Z" },
  { id: "cust-9", auth_user_id: "auth-9", partner_id: "partner-2", email: "sophie.mulder@ziggo.nl", full_name: "Sophie Mulder", phone: "06-22233344", mollie_customer_id: null, street: "Boslaan", house_number: "6", postal_code: "1324 GH", city: "Almere", created_at: "2025-06-15T11:00:00Z", updated_at: "2025-06-15T11:00:00Z" }
]);
const CUSTOMERS_GREENCHARGE = reactive([
  { id: "cust-10", auth_user_id: "auth-10", partner_id: "partner-3", email: "daan.hendricks@gmail.com", full_name: "Daan Hendricks", phone: "06-55566677", mollie_customer_id: null, street: "Stationsweg", house_number: "44", postal_code: "9711 AB", city: "Groningen", created_at: "2025-05-01T10:00:00Z", updated_at: "2025-05-01T10:00:00Z" },
  { id: "cust-11", auth_user_id: "auth-11", partner_id: "partner-3", email: "floor.dejong@outlook.com", full_name: "Floor de Jong", phone: "06-88899900", mollie_customer_id: null, street: "Markstraat", house_number: "17", postal_code: "4811 CD", city: "Breda", created_at: "2025-06-01T14:00:00Z", updated_at: "2025-06-01T14:00:00Z" },
  { id: "cust-12", auth_user_id: "auth-12", partner_id: "partner-3", email: "niels.vermeer@hotmail.com", full_name: "Niels Vermeer", phone: "06-11100022", mollie_customer_id: null, street: "Rijnkade", house_number: "9", postal_code: "6811 EF", city: "Arnhem", created_at: "2025-07-01T09:00:00Z", updated_at: "2025-07-01T09:00:00Z" }
]);
const ALL_CUSTOMERS = reactive([...CUSTOMERS_VOLTVIA, ...CUSTOMERS_SOLARWISE, ...CUSTOMERS_GREENCHARGE]);
const INSTALLATIONS_VOLTVIA = reactive([
  { id: "inst-1", customer_id: "cust-1", partner_id: "partner-1", name: "Woning Kerkstraat", address_street: "Kerkstraat", address_house_number: "12", address_postal_code: "1234 AB", address_city: "Amsterdam", created_at: "2025-03-15T10:00:00Z", updated_at: "2025-03-15T10:00:00Z" },
  { id: "inst-2", customer_id: "cust-2", partner_id: "partner-1", name: "Woning Dorpsweg", address_street: "Dorpsweg", address_house_number: "45a", address_postal_code: "5678 CD", address_city: "Utrecht", created_at: "2025-04-20T14:00:00Z", updated_at: "2025-04-20T14:00:00Z" },
  { id: "inst-3", customer_id: "cust-3", partner_id: "partner-1", name: "Woning Hoofdstraat", address_street: "Hoofdstraat", address_house_number: "78", address_postal_code: "9012 EF", address_city: "Rotterdam", created_at: "2025-05-10T09:00:00Z", updated_at: "2025-05-10T09:00:00Z" }
]);
const INSTALLATIONS_SOLARWISE = [
  { id: "inst-4", customer_id: "cust-6", partner_id: "partner-2", name: "Woning Zonnelaan", address_street: "Zonnelaan", address_house_number: "8", address_postal_code: "2011 AB", address_city: "Haarlem", created_at: "2025-03-01T10:00:00Z", updated_at: "2025-03-01T10:00:00Z" },
  { id: "inst-5", customer_id: "cust-7", partner_id: "partner-2", name: "Woning Parkstraat", address_street: "Parkstraat", address_house_number: "15", address_postal_code: "2312 CD", address_city: "Leiden", created_at: "2025-04-10T14:00:00Z", updated_at: "2025-04-10T14:00:00Z" },
  { id: "inst-6", customer_id: "cust-8", partner_id: "partner-2", name: "Woning Waterweg", address_street: "Waterweg", address_house_number: "32", address_postal_code: "2600 EF", address_city: "Delft", created_at: "2025-05-20T09:00:00Z", updated_at: "2025-05-20T09:00:00Z" },
  { id: "inst-7", customer_id: "cust-9", partner_id: "partner-2", name: "Woning Boslaan", address_street: "Boslaan", address_house_number: "6", address_postal_code: "1324 GH", address_city: "Almere", created_at: "2025-06-15T11:00:00Z", updated_at: "2025-06-15T11:00:00Z" }
];
const INSTALLATIONS_GREENCHARGE = [
  { id: "inst-8", customer_id: "cust-10", partner_id: "partner-3", name: "Woning Stationsweg", address_street: "Stationsweg", address_house_number: "44", address_postal_code: "9711 AB", address_city: "Groningen", created_at: "2025-05-01T10:00:00Z", updated_at: "2025-05-01T10:00:00Z" },
  { id: "inst-9", customer_id: "cust-11", partner_id: "partner-3", name: "Woning Markstraat", address_street: "Markstraat", address_house_number: "17", address_postal_code: "4811 CD", address_city: "Breda", created_at: "2025-06-01T14:00:00Z", updated_at: "2025-06-01T14:00:00Z" },
  { id: "inst-10", customer_id: "cust-12", partner_id: "partner-3", name: "Woning Rijnkade", address_street: "Rijnkade", address_house_number: "9", address_postal_code: "6811 EF", address_city: "Arnhem", created_at: "2025-07-01T09:00:00Z", updated_at: "2025-07-01T09:00:00Z" }
];
const ALL_INSTALLATIONS = reactive([...INSTALLATIONS_VOLTVIA, ...INSTALLATIONS_SOLARWISE, ...INSTALLATIONS_GREENCHARGE]);
const SUBSCRIPTIONS_VOLTVIA = [
  { id: "sub-1", customer_id: "cust-1", installation_id: "inst-1", partner_module_config_id: "pmc-1", status: "active", billing_interval: "monthly", price_cents: 499, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "sundata-plant-101", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-03-15T10:05:00Z", terms_version: "1.0", activated_at: "2025-03-15T10:10:00Z", cancelled_at: null, expires_at: null, created_at: "2025-03-15T10:05:00Z", updated_at: "2025-03-15T10:10:00Z", partner_module_config: PMC_VOLTVIA[0] },
  { id: "sub-2", customer_id: "cust-1", installation_id: "inst-1", partner_module_config_id: "pmc-2", status: "active", billing_interval: "yearly", price_cents: 4990, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "weheat-hp-201", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-04-01T12:00:00Z", terms_version: "1.0", activated_at: "2025-04-01T12:05:00Z", cancelled_at: null, expires_at: null, created_at: "2025-04-01T12:00:00Z", updated_at: "2025-04-01T12:05:00Z", partner_module_config: PMC_VOLTVIA[1] },
  { id: "sub-3", customer_id: "cust-2", installation_id: "inst-2", partner_module_config_id: "pmc-1", status: "active", billing_interval: "monthly", price_cents: 499, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "sundata-plant-102", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-04-20T14:05:00Z", terms_version: "1.0", activated_at: "2025-04-20T14:10:00Z", cancelled_at: null, expires_at: null, created_at: "2025-04-20T14:05:00Z", updated_at: "2025-04-20T14:10:00Z", partner_module_config: PMC_VOLTVIA[0] },
  { id: "sub-4", customer_id: "cust-3", installation_id: "inst-3", partner_module_config_id: "pmc-3", status: "active", billing_interval: "monthly", price_cents: 499, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "easee-charger-301", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-05-10T09:05:00Z", terms_version: "1.0", activated_at: "2025-05-10T09:10:00Z", cancelled_at: null, expires_at: null, created_at: "2025-05-10T09:05:00Z", updated_at: "2025-05-10T09:10:00Z", partner_module_config: PMC_VOLTVIA[2] }
];
const SUBSCRIPTIONS_SOLARWISE = [
  { id: "sub-sw-1", customer_id: "cust-6", installation_id: "inst-4", partner_module_config_id: "pmc-sw-1", status: "active", billing_interval: "monthly", price_cents: 549, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "sundata-plant-201", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-03-01T10:05:00Z", terms_version: "1.0", activated_at: "2025-03-01T10:10:00Z", cancelled_at: null, expires_at: null, created_at: "2025-03-01T10:05:00Z", updated_at: "2025-03-01T10:10:00Z", partner_module_config: PMC_SOLARWISE[0] },
  { id: "sub-sw-2", customer_id: "cust-6", installation_id: "inst-4", partner_module_config_id: "pmc-sw-2", status: "active", billing_interval: "yearly", price_cents: 5490, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "weheat-hp-301", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-03-15T12:00:00Z", terms_version: "1.0", activated_at: "2025-03-15T12:05:00Z", cancelled_at: null, expires_at: null, created_at: "2025-03-15T12:00:00Z", updated_at: "2025-03-15T12:05:00Z", partner_module_config: PMC_SOLARWISE[1] },
  { id: "sub-sw-3", customer_id: "cust-7", installation_id: "inst-5", partner_module_config_id: "pmc-sw-1", status: "active", billing_interval: "monthly", price_cents: 549, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "sundata-plant-202", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-04-10T14:05:00Z", terms_version: "1.0", activated_at: "2025-04-10T14:10:00Z", cancelled_at: null, expires_at: null, created_at: "2025-04-10T14:05:00Z", updated_at: "2025-04-10T14:10:00Z", partner_module_config: PMC_SOLARWISE[0] },
  { id: "sub-sw-4", customer_id: "cust-8", installation_id: "inst-6", partner_module_config_id: "pmc-sw-1", status: "active", billing_interval: "monthly", price_cents: 549, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "sundata-plant-203", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-05-20T09:05:00Z", terms_version: "1.0", activated_at: "2025-05-20T09:10:00Z", cancelled_at: null, expires_at: null, created_at: "2025-05-20T09:05:00Z", updated_at: "2025-05-20T09:10:00Z", partner_module_config: PMC_SOLARWISE[0] }
];
const SUBSCRIPTIONS_GREENCHARGE = [
  { id: "sub-gc-1", customer_id: "cust-10", installation_id: "inst-8", partner_module_config_id: "pmc-gc-3", status: "active", billing_interval: "monthly", price_cents: 399, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "easee-charger-401", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-05-01T10:05:00Z", terms_version: "1.0", activated_at: "2025-05-01T10:10:00Z", cancelled_at: null, expires_at: null, created_at: "2025-05-01T10:05:00Z", updated_at: "2025-05-01T10:10:00Z", partner_module_config: PMC_GREENCHARGE[2] },
  { id: "sub-gc-2", customer_id: "cust-10", installation_id: "inst-8", partner_module_config_id: "pmc-gc-1", status: "active", billing_interval: "monthly", price_cents: 399, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "sundata-plant-301", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-05-15T12:00:00Z", terms_version: "1.0", activated_at: "2025-05-15T12:05:00Z", cancelled_at: null, expires_at: null, created_at: "2025-05-15T12:00:00Z", updated_at: "2025-05-15T12:05:00Z", partner_module_config: PMC_GREENCHARGE[0] },
  { id: "sub-gc-3", customer_id: "cust-11", installation_id: "inst-9", partner_module_config_id: "pmc-gc-3", status: "active", billing_interval: "monthly", price_cents: 399, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: "easee-charger-402", integration_status: "active", integration_meta: {}, terms_accepted_at: "2025-06-01T14:05:00Z", terms_version: "1.0", activated_at: "2025-06-01T14:10:00Z", cancelled_at: null, expires_at: null, created_at: "2025-06-01T14:05:00Z", updated_at: "2025-06-01T14:10:00Z", partner_module_config: PMC_GREENCHARGE[2] }
];
const PAYMENTS_VOLTVIA = [
  { id: "pay-1", partner_id: "partner-1", customer_id: "cust-1", customer_name: "Jan de Vries", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 499, status: "paid", paid_at: "2025-07-01T10:00:00Z", created_at: "2025-07-01T09:00:00Z" },
  { id: "pay-2", partner_id: "partner-1", customer_id: "cust-1", customer_name: "Jan de Vries", module_name: "Warmtepomp", module_type: "heat_pump", amount_cents: 4990, status: "paid", paid_at: "2025-07-01T10:01:00Z", created_at: "2025-07-01T09:00:00Z" },
  { id: "pay-3", partner_id: "partner-1", customer_id: "cust-2", customer_name: "Lisa Bakker", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 499, status: "paid", paid_at: "2025-07-01T12:00:00Z", created_at: "2025-07-01T09:00:00Z" },
  { id: "pay-4", partner_id: "partner-1", customer_id: "cust-3", customer_name: "Piet Janssen", module_name: "Laadpaal", module_type: "ev_charger", amount_cents: 499, status: "paid", paid_at: "2025-07-02T08:30:00Z", created_at: "2025-07-02T08:00:00Z" },
  { id: "pay-5", partner_id: "partner-1", customer_id: "cust-4", customer_name: "Maria van Dijk", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 499, status: "failed", paid_at: null, created_at: "2025-07-03T09:00:00Z" },
  { id: "pay-6", partner_id: "partner-1", customer_id: "cust-5", customer_name: "Tom Smit", module_name: "Warmtepomp", module_type: "heat_pump", amount_cents: 499, status: "pending", paid_at: null, created_at: "2025-07-04T14:00:00Z" },
  { id: "pay-7", partner_id: "partner-1", customer_id: "cust-1", customer_name: "Jan de Vries", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 499, status: "paid", paid_at: "2025-06-01T10:00:00Z", created_at: "2025-06-01T09:00:00Z" },
  { id: "pay-8", partner_id: "partner-1", customer_id: "cust-2", customer_name: "Lisa Bakker", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 499, status: "paid", paid_at: "2025-06-01T12:00:00Z", created_at: "2025-06-01T09:00:00Z" },
  { id: "pay-9", partner_id: "partner-1", customer_id: "cust-3", customer_name: "Piet Janssen", module_name: "Laadpaal", module_type: "ev_charger", amount_cents: 499, status: "refunded", paid_at: "2025-06-02T08:30:00Z", created_at: "2025-06-02T08:00:00Z" }
];
const PAYMENTS_SOLARWISE = [
  { id: "pay-sw-1", partner_id: "partner-2", customer_id: "cust-6", customer_name: "Erik van Berg", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 549, status: "paid", paid_at: "2025-07-01T10:00:00Z", created_at: "2025-07-01T09:00:00Z" },
  { id: "pay-sw-2", partner_id: "partner-2", customer_id: "cust-7", customer_name: "Anna de Wit", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 549, status: "paid", paid_at: "2025-07-01T12:00:00Z", created_at: "2025-07-01T09:00:00Z" },
  { id: "pay-sw-3", partner_id: "partner-2", customer_id: "cust-8", customer_name: "Marco Visser", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 549, status: "pending", paid_at: null, created_at: "2025-07-02T09:00:00Z" },
  { id: "pay-sw-4", partner_id: "partner-2", customer_id: "cust-6", customer_name: "Erik van Berg", module_name: "Warmtepomp", module_type: "heat_pump", amount_cents: 5490, status: "paid", paid_at: "2025-07-01T10:01:00Z", created_at: "2025-07-01T09:00:00Z" }
];
const PAYMENTS_GREENCHARGE = [
  { id: "pay-gc-1", partner_id: "partner-3", customer_id: "cust-10", customer_name: "Daan Hendricks", module_name: "Laadpaal", module_type: "ev_charger", amount_cents: 399, status: "paid", paid_at: "2025-07-01T10:00:00Z", created_at: "2025-07-01T09:00:00Z" },
  { id: "pay-gc-2", partner_id: "partner-3", customer_id: "cust-10", customer_name: "Daan Hendricks", module_name: "Zonnepanelen", module_type: "solar", amount_cents: 399, status: "paid", paid_at: "2025-07-01T10:01:00Z", created_at: "2025-07-01T09:00:00Z" },
  { id: "pay-gc-3", partner_id: "partner-3", customer_id: "cust-11", customer_name: "Floor de Jong", module_name: "Laadpaal", module_type: "ev_charger", amount_cents: 399, status: "paid", paid_at: "2025-07-02T14:00:00Z", created_at: "2025-07-02T09:00:00Z" },
  { id: "pay-gc-4", partner_id: "partner-3", customer_id: "cust-12", customer_name: "Niels Vermeer", module_name: "Laadpaal", module_type: "ev_charger", amount_cents: 399, status: "failed", paid_at: null, created_at: "2025-07-03T09:00:00Z" }
];
const ALL_PAYMENTS = reactive([...PAYMENTS_VOLTVIA, ...PAYMENTS_SOLARWISE, ...PAYMENTS_GREENCHARGE]);
const _reactiveSubscriptions = reactive([...SUBSCRIPTIONS_VOLTVIA]);
const _allReactiveSubscriptions = reactive([...SUBSCRIPTIONS_VOLTVIA, ...SUBSCRIPTIONS_SOLARWISE, ...SUBSCRIPTIONS_GREENCHARGE]);
const INVOICES = reactive([
  { id: "inv-1", invoice_number: "V4U-2025-001", customer_id: "cust-1", description: "Servicecontract Zonnepanelen — januari 2025", amount_cents: 499, status: "paid", payment_method: "automatische_incasso", invoice_date: "2025-01-01T00:00:00Z", due_date: "2025-01-15T00:00:00Z", paid_at: "2025-01-03T10:00:00Z" },
  { id: "inv-2", invoice_number: "V4U-2025-002", customer_id: "cust-1", description: "Servicecontract Zonnepanelen — februari 2025", amount_cents: 499, status: "paid", payment_method: "automatische_incasso", invoice_date: "2025-02-01T00:00:00Z", due_date: "2025-02-15T00:00:00Z", paid_at: "2025-02-03T10:00:00Z" },
  { id: "inv-3", invoice_number: "V4U-2025-003", customer_id: "cust-1", description: "Servicecontract Zonnepanelen — maart 2025", amount_cents: 499, status: "paid", payment_method: "automatische_incasso", invoice_date: "2025-03-01T00:00:00Z", due_date: "2025-03-15T00:00:00Z", paid_at: "2025-03-04T10:00:00Z" },
  { id: "inv-4", invoice_number: "V4U-2025-004", customer_id: "cust-1", description: "Servicecontract Warmtepomp — maart 2025", amount_cents: 4990, status: "paid", payment_method: "automatische_incasso", invoice_date: "2025-03-15T00:00:00Z", due_date: "2025-03-29T00:00:00Z", paid_at: "2025-03-17T10:00:00Z" },
  { id: "inv-5", invoice_number: "V4U-2025-005", customer_id: "cust-1", description: "Servicecontract Zonnepanelen — april 2025", amount_cents: 499, status: "paid", payment_method: "automatische_incasso", invoice_date: "2025-04-01T00:00:00Z", due_date: "2025-04-15T00:00:00Z", paid_at: "2025-04-02T10:00:00Z" },
  { id: "inv-6", invoice_number: "V4U-2025-006", customer_id: "cust-1", description: "Servicecontract Zonnepanelen + Warmtepomp — mei 2025", amount_cents: 998, status: "open", payment_method: "automatische_incasso", invoice_date: "2025-05-01T00:00:00Z", due_date: "2025-05-15T00:00:00Z", paid_at: null }
]);
const NOTIFICATIONS = [
  { id: "notif-1", type: "factuur_verzonden", recipient_name: "Jan de Vries", recipient_email: "jan.devries@gmail.com", subject: "Factuur V4U-2025-006 — mei 2025", channel: "email", status: "verzonden", created_at: "2025-05-01T08:00:00Z" },
  { id: "notif-2", type: "verhuizing_melding", recipient_name: "Servicedesk Volt4U", recipient_email: "servicedesk@volt4u.nl", subject: "Adreswijziging Jan de Vries — Kerkstraat 12 → nieuw adres", channel: "email", status: "verzonden", created_at: "2025-04-28T14:30:00Z" },
  { id: "notif-3", type: "contract_bevestiging", recipient_name: "Jan de Vries", recipient_email: "jan.devries@gmail.com", subject: "Bevestiging servicecontract Warmtepomp", channel: "email", status: "verzonden", created_at: "2025-04-01T12:05:00Z" },
  { id: "notif-4", type: "factuur_verzonden", recipient_name: "Lisa Bakker", recipient_email: "lisa.bakker@outlook.com", subject: "Factuur V4U-2025-005 — april 2025", channel: "email", status: "verzonden", created_at: "2025-04-01T08:00:00Z" },
  { id: "notif-5", type: "welkomstmail", recipient_name: "Piet Janssen", recipient_email: "piet.janssen@hotmail.com", subject: "Welkom bij Volt4U — je account is aangemaakt", channel: "email", status: "verzonden", created_at: "2025-05-10T09:00:00Z" },
  { id: "notif-6", type: "incasso_alert", recipient_name: "Servicedesk Volt4U", recipient_email: "servicedesk@volt4u.nl", subject: "Automatische incasso geweigerd — Maria van Dijk", channel: "email", status: "verzonden", created_at: "2025-04-16T10:00:00Z" },
  { id: "notif-7", type: "factuur_verzonden", recipient_name: "Jan de Vries", recipient_email: "jan.devries@gmail.com", subject: "Factuur V4U-2025-004 — maart 2025", channel: "email", status: "verzonden", created_at: "2025-03-15T08:00:00Z" },
  { id: "notif-8", type: "opzegging_bevestiging", recipient_name: "Tom Smit", recipient_email: "tom.smit@ziggo.nl", subject: "Bevestiging opzegging servicecontract Laadpaal", channel: "email", status: "verzonden", created_at: "2025-03-20T16:00:00Z" },
  { id: "notif-9", type: "factuur_verzonden", recipient_name: "Piet Janssen", recipient_email: "piet.janssen@hotmail.com", subject: "Factuur V4U-2025-003 — maart 2025", channel: "email", status: "mislukt", created_at: "2025-03-01T08:00:00Z" },
  { id: "notif-10", type: "welkomstmail", recipient_name: "Jan de Vries", recipient_email: "jan.devries@gmail.com", subject: "Welkom bij Volt4U — je account is aangemaakt", channel: "email", status: "verzonden", created_at: "2025-03-15T10:00:00Z" }
];
const SERVICE_TIERS = [
  {
    id: "tier-start",
    name: "Start",
    slug: "start",
    price_cents: 0,
    recommended: false,
    features: [
      { label: "Monitoring portal", included: true },
      { label: "Proactieve monitoring 24/7", included: false },
      { label: "Storingsanalyse", included: false },
      { label: "Rapportages", included: false },
      { label: "Oplosservice", included: false },
      { label: "Jaarlijkse inspectie (APK)", included: false },
      { label: "Super Service", included: false }
    ]
  },
  {
    id: "tier-slim",
    name: "Slim",
    slug: "slim",
    price_cents: 350,
    recommended: true,
    features: [
      { label: "Monitoring portal", included: true },
      { label: "Proactieve monitoring 24/7", included: true },
      { label: "Storingsanalyse", included: true },
      { label: "Rapportages", included: true, detail: "Jaarlijks" },
      { label: "Oplosservice", included: true, detail: "Binnen 3 werkdagen" },
      { label: "Jaarlijkse inspectie (APK)", included: false },
      { label: "Super Service", included: false }
    ]
  },
  {
    id: "tier-max",
    name: "Max",
    slug: "max",
    price_cents: 950,
    recommended: false,
    features: [
      { label: "Monitoring portal", included: true },
      { label: "Proactieve monitoring 24/7", included: true },
      { label: "Storingsanalyse", included: true },
      { label: "Rapportages", included: true, detail: "Maandelijks" },
      { label: "Oplosservice", included: true, detail: "Binnen 1 werkdag" },
      { label: "Jaarlijkse inspectie (APK)", included: true },
      { label: "Super Service", included: true, detail: "Geen extra kosten bij veelvoorkomende storingen" }
    ]
  }
];
const ONBOARDING_RECORDS = reactive([
  {
    token: "demo-welkom",
    partner_id: "partner-1",
    customer_id: "cust-new-demo",
    module_type: "solar",
    gripp_project_id: "GRP-2024-0912",
    service_tier: "slim",
    status: "pending",
    created_at: new Date(Date.now() - 36e5).toISOString(),
    activated_at: null
  }
]);
const ENERGY_FLOW = reactive({
  solarProductionW: 2140,
  houseConsumptionW: 1380,
  gridImportW: -760,
  // exporting to grid
  evChargingW: 0,
  heatPumpW: 820,
  savingsToday: 485,
  savingsMonth: 6820,
  savingsYear: 82400,
  selfConsumptionPercent: 67,
  feedInPercent: 33
});
const SOLAR_DATA = reactive({
  currentProductionW: 2140,
  status: "online",
  todayKwh: 12.4,
  monthKwh: 286,
  yearKwh: 3240,
  todayEuro: 485,
  monthEuro: 6820,
  yearEuro: 82400,
  selfConsumptionPercent: 67,
  feedInPercent: 33,
  peakTodayW: 3200,
  peakTodayTime: "12:45",
  panelCount: 12,
  inverterBrand: "SolarEdge SE5000H",
  inverterStatus: "Optimaal",
  alerts: []
});
const HEATPUMP_DATA = reactive({
  status: "verwarmen",
  setTemperature: 21,
  actualTemperature: 20.4,
  outsideTemperature: 8,
  hotWaterStatus: "gereed",
  hotWaterTemp: 52,
  mode: "comfort",
  copCurrent: 4.2,
  copRating: "uitstekend",
  consumptionTodayKwh: 6.8,
  consumptionMonthKwh: 142,
  nextScheduledAction: "Nachtverwarming om 23:00",
  alerts: []
});
const EVCHARGER_DATA = reactive({
  status: "standby",
  currentPowerW: 0,
  chargedTodayKwh: 18.4,
  chargedTodayEuro: 460,
  chargedMonthKwh: 156,
  chargedMonthEuro: 3900,
  estimatedCompletion: null,
  chargeMode: "slim",
  batteryPercent: 82,
  sessions: [
    { id: "ses-1", date: "2026-03-25T06:30:00Z", durationMin: 195, kwh: 18.4, costCents: 460, mode: "slim" },
    { id: "ses-2", date: "2026-03-23T22:00:00Z", durationMin: 240, kwh: 22.1, costCents: 553, mode: "gepland" },
    { id: "ses-3", date: "2026-03-21T19:15:00Z", durationMin: 90, kwh: 11.2, costCents: 280, mode: "direct" },
    { id: "ses-4", date: "2026-03-19T07:00:00Z", durationMin: 180, kwh: 16.8, costCents: 420, mode: "slim" },
    { id: "ses-5", date: "2026-03-17T23:00:00Z", durationMin: 300, kwh: 28.5, costCents: 713, mode: "gepland" }
  ],
  alerts: []
});
const SERVICE_TICKETS = reactive([
  { id: "ticket-1", subject: "Warmtepomp maakt geluid", description: "Sinds vorige week maakt de buitenunit een tikkend geluid bij het opstarten.", status: "in_behandeling", urgency: "normaal", created_at: "2026-03-20T10:00:00Z", updated_at: "2026-03-21T14:00:00Z", module_type: "heat_pump", response: "We hebben uw melding ontvangen. Een monteur neemt binnen 2 werkdagen contact op." },
  { id: "ticket-2", subject: "Vraag over factuur februari", description: "Het bedrag op de factuur van februari lijkt hoger dan verwacht.", status: "opgelost", urgency: "laag", created_at: "2026-03-10T09:00:00Z", updated_at: "2026-03-12T16:00:00Z", module_type: null, response: "Het verschil komt door de jaarlijkse indexering per 1 februari. Dit is conform uw servicecontract." },
  { id: "ticket-3", subject: "Zonnepanelen opbrengst lager dan verwacht", description: "De opbrengst van mijn zonnepanelen is de afgelopen week 30% lager dan normaal.", status: "opgelost", urgency: "normaal", created_at: "2026-02-15T11:00:00Z", updated_at: "2026-02-18T10:00:00Z", module_type: "solar", response: "Na inspectie bleek er sneeuw op de panelen te liggen. Na het smelten is de opbrengst weer normaal." }
]);
const CONVERSATIONS = reactive([
  {
    id: "conv-1",
    customer_id: "cust-1",
    customer_name: "Jan de Vries",
    subject: "Warmtepomp maakt geluid",
    status: "geescaleerd",
    started_at: "2026-03-20T10:00:00Z",
    updated_at: "2026-03-21T14:00:00Z",
    module_type: "heat_pump",
    requires_visit: true,
    ai_summary: "Klant meldt tikkend geluid bij opstarten buitenunit. Systeem automatisch gecontroleerd: geen technische storing. COP normaal (4.2). Mogelijk mechanisch probleem dat fysieke inspectie vereist.",
    ai_resolution: null,
    messages: [
      { id: "msg-1a", role: "customer", content: "Sinds vorige week maakt de buitenunit van mijn warmtepomp een tikkend geluid bij het opstarten.", timestamp: "2026-03-20T10:00:00Z" },
      { id: "msg-1b", role: "ai", content: "Ik heb je warmtepomp gecontroleerd. Status: verwarmen. Geen storingen gedetecteerd. De COP is 4.2 (uitstekend), wat betekent dat het systeem efficiënt draait.\n\nBinnentemperatuur: 20,4°C (ingesteld: 21°C). Warmwater: gereed (52°C).\n\nTechnisch lijkt alles in orde. Omdat je aangeeft dat er een geluid is, raad ik aan om dit te laten nakijken door een monteur. Zal ik dit doorsturen naar Volt4U?", timestamp: "2026-03-20T10:00:05Z", metadata: { systemCheck: true, dataPoints: [{ label: "Status", value: "verwarmen" }, { label: "COP", value: "4.2 (uitstekend)" }, { label: "Binnen", value: "20,4°C" }] } },
      { id: "msg-1c", role: "customer", content: "Ja graag, het geluid wordt steeds erger.", timestamp: "2026-03-20T10:02:00Z" },
      { id: "msg-1d", role: "ai", content: "Ik heb je melding doorgestuurd naar Volt4U. Op basis van mijn analyse adviseer ik een inspectie ter plaatse. Ze nemen zo snel mogelijk contact op om een afspraak in te plannen.", timestamp: "2026-03-20T10:02:05Z" },
      { id: "msg-1e", role: "installer", content: "Hoi Jan, we hebben je melding ontvangen. Een monteur neemt morgen contact op om een afspraak in te plannen. Bij twijfel kun je de warmtepomp tijdelijk op eco-modus zetten.", timestamp: "2026-03-21T14:00:00Z" }
    ]
  },
  {
    id: "conv-2",
    customer_id: "cust-1",
    customer_name: "Jan de Vries",
    subject: "Vraag over factuur",
    status: "ai_opgelost",
    started_at: "2026-03-10T09:00:00Z",
    updated_at: "2026-03-10T09:01:00Z",
    module_type: null,
    requires_visit: false,
    ai_summary: "Klant had vraag over factuurbedrag. AI heeft uitleg gegeven over servicecontract en verwezen naar factuurpagina.",
    ai_resolution: "Vraag beantwoord over facturatie. Klant verwezen naar factuurpagina met uitleg over automatische incasso.",
    messages: [
      { id: "msg-2a", role: "customer", content: "Het bedrag op mijn factuur van februari lijkt hoger dan normaal. Klopt dit?", timestamp: "2026-03-10T09:00:00Z" },
      { id: "msg-2b", role: "ai", content: 'Je facturen vind je op de pagina "Facturen" in je account. Je huidige servicecontract dekt: Zonnepanelen + Warmtepomp.\n\nDe betaling verloopt via automatische incasso. Als je een afwijking ziet, controleer dan de factuurpagina voor details. Het kan zijn dat er een jaarlijkse indexering heeft plaatsgevonden per 1 februari.', timestamp: "2026-03-10T09:00:05Z" },
      { id: "msg-2c", role: "customer", content: "Ah oke, dat kan kloppen dan. Bedankt!", timestamp: "2026-03-10T09:01:00Z" },
      { id: "msg-2d", role: "ai", content: "Graag gedaan! Fijn dat ik je kon helpen. Mocht je later nog vragen hebben, dan ben ik er altijd. Een fijne dag!", timestamp: "2026-03-10T09:01:05Z" }
    ]
  },
  {
    id: "conv-3",
    customer_id: "cust-1",
    customer_name: "Jan de Vries",
    subject: "Opbrengst check zonnepanelen",
    status: "ai_opgelost",
    started_at: "2026-02-15T11:00:00Z",
    updated_at: "2026-02-15T11:02:00Z",
    module_type: "solar",
    requires_visit: false,
    ai_summary: "Klant vroeg naar lagere opbrengst. AI heeft systeem gecheckt en bevestigd dat alles normaal werkt. Opbrengstverschil verklaard door seizoensinvloeden.",
    ai_resolution: "Systeem automatisch gecheckt. Alle waarden normaal. Klant gerustgesteld met data.",
    messages: [
      { id: "msg-3a", role: "customer", content: "Mijn zonnepanelen lijken minder op te wekken dan vorige maand. Is er iets mis?", timestamp: "2026-02-15T11:00:00Z" },
      { id: "msg-3b", role: "ai", content: "Ik heb je zonnepanelen gecheckt. Je systeem is online en functioneert normaal. Op dit moment wordt er 1,8 kW geproduceerd. Vandaag is de totale opbrengst 8,2 kWh.\n\nJe panelen presteren normaal voor deze tijd van het jaar. In de winter is de opbrengst lager door kortere dagen en een lagere zonnestand. In het voorjaar stijgt de opbrengst weer.", timestamp: "2026-02-15T11:00:05Z", metadata: { systemCheck: true, dataPoints: [{ label: "Status", value: "online" }, { label: "Productie", value: "1,8 kW" }, { label: "Vandaag", value: "8,2 kWh" }] } },
      { id: "msg-3c", role: "customer", content: "Top, dan is het normaal. Dankjewel!", timestamp: "2026-02-15T11:02:00Z" },
      { id: "msg-3d", role: "ai", content: "Graag gedaan! Fijn dat ik je kon helpen. Mocht je later nog vragen hebben, dan ben ik er altijd. Een fijne dag!", timestamp: "2026-02-15T11:02:05Z" }
    ]
  }
]);
const MAINTENANCE_RECORDS = [
  { id: "maint-1", date: "2026-01-15T10:00:00Z", description: "Jaarlijkse inspectie warmtepomp — filters gereinigd, koelmiddel gecontroleerd", technician: "Peter van Dalen", type: "onderhoud", module_type: "heat_pump" },
  { id: "maint-2", date: "2025-11-20T14:00:00Z", description: "Zonnepanelen schoongemaakt en bekabeling gecontroleerd", technician: "Mark Hendriks", type: "onderhoud", module_type: "solar" },
  { id: "maint-3", date: "2025-09-05T09:00:00Z", description: "Firmware update laadpaal naar versie 4.2.1", technician: "Easee Service", type: "onderhoud", module_type: "ev_charger" },
  { id: "maint-4", date: "2025-06-12T11:00:00Z", description: "Installatiecheck na oplevering — alle systemen correct werkend", technician: "Peter van Dalen", type: "inspectie", module_type: null }
];
const SYSTEM_STATUS = reactive({
  overall: "ok",
  modules: [
    { type: "solar", status: "ok", message: "Zonnepanelen werken normaal" },
    { type: "heat_pump", status: "ok", message: "Warmtepomp draait normaal" },
    { type: "ev_charger", status: "ok", message: "Laadpaal stand-by" }
  ],
  lastChecked: (/* @__PURE__ */ new Date()).toISOString()
});
const DEFAULT_EMAIL_TEMPLATES = [
  { type: "welkomstmail", label: "Welkomstmail", description: "Wordt verstuurd wanneer een nieuwe klant wordt aangemaakt.", enabled: true, subject: "Welkom bij {{bedrijfsnaam}} — activeer je account", heading: "Welkom, {{voornaam}}!", body: "{{bedrijfsnaam}} heeft een account voor je aangemaakt. Hiermee kun je de status van je installatie volgen en beheren.", buttonText: "Account activeren" },
  { type: "activatie_bevestiging", label: "Activatiebevestiging", description: "Wordt verstuurd wanneer een klant zijn account activeert.", enabled: true, subject: "Je account bij {{bedrijfsnaam}} is actief", heading: "Je account is actief!", body: "Hallo {{voornaam}}, je account bij {{bedrijfsnaam}} is succesvol geactiveerd. Je kunt nu inloggen op je persoonlijke dashboard.", buttonText: "Naar mijn dashboard" },
  { type: "wachtwoord_reset", label: "Wachtwoord herstellen", description: "Wordt verstuurd wanneer een klant een nieuw wachtwoord aanvraagt.", enabled: true, subject: "Wachtwoord herstellen", heading: "Wachtwoord herstellen", body: "Hallo {{voornaam}}, we hebben een verzoek ontvangen om je wachtwoord te wijzigen. Klik op de knop hieronder om een nieuw wachtwoord in te stellen.", buttonText: "Nieuw wachtwoord instellen" },
  { type: "factuur", label: "Factuur per e-mail", description: "Wordt verstuurd bij het aanmaken van een nieuwe factuur.", enabled: true, subject: "Nieuwe factuur van {{bedrijfsnaam}}", heading: "Nieuwe factuur", body: "Hallo {{voornaam}}, er staat een nieuwe factuur voor je klaar. Je kunt deze bekijken en downloaden via je dashboard.", buttonText: "Factuur bekijken" },
  { type: "contract_bevestiging", label: "Contractbevestiging", description: "Wordt verstuurd bij het afsluiten van een nieuw servicecontract.", enabled: true, subject: "Bevestiging servicecontract {{bedrijfsnaam}}", heading: "Contractbevestiging", body: "Hallo {{voornaam}}, je servicecontract bij {{bedrijfsnaam}} is succesvol afgesloten. Hieronder vind je de details.", buttonText: "Contract bekijken" },
  { type: "opzegging_bevestiging", label: "Opzeggingsbevestiging", description: "Wordt verstuurd wanneer een klant zijn contract opzegt.", enabled: true, subject: "Bevestiging opzegging {{bedrijfsnaam}}", heading: "Opzegging bevestigd", body: "Hallo {{voornaam}}, we bevestigen de opzegging van je servicecontract. Je contract loopt door tot het einde van de lopende periode.", buttonText: "Naar mijn account" }
];
function createEmailTemplates() {
  return DEFAULT_EMAIL_TEMPLATES.map((t, i) => ({ ...t, id: `tmpl-${i + 1}` }));
}
const EMAIL_TEMPLATES = reactive(createEmailTemplates());
const INTEGRATION_CREDENTIALS = reactive([]);
const ALL_SMART_METERS = reactive([
  { id: "meter-1", customer_id: "cust-1", partner_id: "partner-1", postcode: "1234 AB", meter_id: "482156", status: "active", error_message: null, linked_at: "2025-03-16T10:00:00Z", created_at: "2025-03-15T10:00:00Z", updated_at: "2025-03-16T10:00:00Z" },
  { id: "meter-2", customer_id: "cust-2", partner_id: "partner-1", postcode: "5678 CD", meter_id: "339871", status: "active", error_message: null, linked_at: "2025-04-21T14:00:00Z", created_at: "2025-04-20T14:00:00Z", updated_at: "2025-04-21T14:00:00Z" }
]);
function generateMockReadings() {
  const readings = [];
  const now = /* @__PURE__ */ new Date();
  for (let d = 6; d >= 0; d--) {
    for (let h2 = 0; h2 < 24; h2++) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      date.setHours(h2, 0, 0, 0);
      if (date > now) continue;
      const hourFactor = h2 >= 7 && h2 <= 9 ? 1.8 : h2 >= 17 && h2 <= 21 ? 2.2 : h2 >= 0 && h2 <= 5 ? 0.4 : 1;
      const baseConsumption = 400 + Math.random() * 200;
      const consumption = Math.round(baseConsumption * hourFactor);
      let production = 0;
      if (h2 >= 7 && h2 <= 20) {
        const solarPeak = 12;
        const spread = 4;
        const factor = Math.exp(-Math.pow(h2 - solarPeak, 2) / (2 * spread * spread));
        production = Math.round(factor * (3e3 + Math.random() * 1500));
      }
      const gasBase = 0.05 + Math.random() * 0.03;
      const gasFactor = h2 >= 6 && h2 <= 8 || h2 >= 18 && h2 <= 22 ? 2.5 : 0.5;
      const gas = Math.round(gasBase * gasFactor * 100) / 100;
      readings.push({
        timestamp: date.toISOString(),
        consumption_wh: consumption,
        production_wh: production,
        gas_m3: gas
      });
    }
  }
  return readings;
}
const MOCK_METER_READINGS = generateMockReadings();
const ALL_CUSTOMER_PRODUCTS = reactive([
  // Jan de Vries (cust-1) - zonnepanelen + warmtepomp
  { id: "prod-1", customer_id: "cust-1", partner_id: "partner-1", name: "Longi Hi-MO 6 480Wp", brand: "Longi", model: "Hi-MO 6 LR5-66HTH-480M", category: "solar_panel", serial_number: "LG480-2024-00142", installation_date: "2025-03-10", notes: "16 panelen, zuidwest-oriëntatie", created_at: "2025-03-15T10:00:00Z", updated_at: "2025-03-15T10:00:00Z" },
  { id: "prod-2", customer_id: "cust-1", partner_id: "partner-1", name: "Solis S6-GR1P5K", brand: "Solis", model: "S6-GR1P5K", category: "inverter", serial_number: "SOL-5K-2024-08821", installation_date: "2025-03-10", notes: "5kW 1-fase omvormer", created_at: "2025-03-15T10:00:00Z", updated_at: "2025-03-15T10:00:00Z" },
  { id: "prod-3", customer_id: "cust-1", partner_id: "partner-1", name: "Weheat Blackbird", brand: "Weheat", model: "Blackbird 8kW", category: "heat_pump", serial_number: "WH-BB8-2025-0034", installation_date: "2025-06-20", notes: "Lucht-water, COP 5.2", created_at: "2025-06-20T10:00:00Z", updated_at: "2025-06-20T10:00:00Z" },
  // Lisa Bakker (cust-2) - zonnepanelen
  { id: "prod-4", customer_id: "cust-2", partner_id: "partner-1", name: "JA Solar JAM72S30-545", brand: "JA Solar", model: "JAM72S30-545/MR", category: "solar_panel", serial_number: null, installation_date: "2025-04-15", notes: "12 panelen, plat dak oost-west", created_at: "2025-04-20T14:00:00Z", updated_at: "2025-04-20T14:00:00Z" },
  { id: "prod-5", customer_id: "cust-2", partner_id: "partner-1", name: "Huawei SUN2000-5KTL-L1", brand: "Huawei", model: "SUN2000-5KTL-L1", category: "inverter", serial_number: "HW-5KTL-2025-11204", installation_date: "2025-04-15", notes: "5kW hybride omvormer", created_at: "2025-04-20T14:00:00Z", updated_at: "2025-04-20T14:00:00Z" },
  { id: "prod-6", customer_id: "cust-2", partner_id: "partner-1", name: "Huawei LUNA2000-10-S0", brand: "Huawei", model: "LUNA2000-10-S0", category: "battery", serial_number: "HW-LN10-2025-0087", installation_date: "2025-04-15", notes: "10kWh thuisbatterij", created_at: "2025-04-20T14:00:00Z", updated_at: "2025-04-20T14:00:00Z" },
  // Piet Janssen (cust-3) - laadpaal
  { id: "prod-7", customer_id: "cust-3", partner_id: "partner-1", name: "Easee Home", brand: "Easee", model: "Home 22kW", category: "ev_charger", serial_number: "EASEE-H-2025-44210", installation_date: "2025-05-08", notes: "3-fase, 22kW, wit", created_at: "2025-05-10T09:00:00Z", updated_at: "2025-05-10T09:00:00Z" },
  // Maria van Dijk (cust-4) - warmtepomp
  { id: "prod-8", customer_id: "cust-4", partner_id: "partner-1", name: "Weheat Hummingbird", brand: "Weheat", model: "Hummingbird 4kW", category: "heat_pump", serial_number: "WH-HB4-2025-0112", installation_date: "2025-05-25", notes: "Lucht-water, compact model", created_at: "2025-06-01T11:00:00Z", updated_at: "2025-06-01T11:00:00Z" }
]);
const ALL_CUSTOMER_DOCUMENTS = reactive([
  // Jan de Vries (cust-1)
  { id: "doc-1", customer_id: "cust-1", partner_id: "partner-1", name: "Factuur zonnepanelen installatie", category: "factuur", file_path: "customer-documents/partner-1/cust-1/factuur-2025-001.pdf", file_size_bytes: 245e3, mime_type: "application/pdf", notes: null, uploaded_at: "2025-03-15T10:00:00Z", created_at: "2025-03-15T10:00:00Z" },
  { id: "doc-2", customer_id: "cust-1", partner_id: "partner-1", name: "Opleverdocument PV-installatie", category: "opleverdocument", file_path: "customer-documents/partner-1/cust-1/oplevering-pv-2025.pdf", file_size_bytes: 189e4, mime_type: "application/pdf", notes: "Incl. foto's en meetrapporten", uploaded_at: "2025-03-16T14:00:00Z", created_at: "2025-03-16T14:00:00Z" },
  { id: "doc-3", customer_id: "cust-1", partner_id: "partner-1", name: "Datasheet Longi Hi-MO 6", category: "datasheet", file_path: "customer-documents/partner-1/cust-1/datasheet-longi-himo6.pdf", file_size_bytes: 52e4, mime_type: "application/pdf", notes: null, uploaded_at: "2025-03-15T10:00:00Z", created_at: "2025-03-15T10:00:00Z" },
  { id: "doc-4", customer_id: "cust-1", partner_id: "partner-1", name: "Garantiebewijs Solis omvormer", category: "garantiebewijs", file_path: "customer-documents/partner-1/cust-1/garantie-solis.pdf", file_size_bytes: 18e4, mime_type: "application/pdf", notes: "10 jaar fabrieksgarantie", uploaded_at: "2025-03-15T10:00:00Z", created_at: "2025-03-15T10:00:00Z" },
  { id: "doc-5", customer_id: "cust-1", partner_id: "partner-1", name: "Factuur warmtepomp installatie", category: "factuur", file_path: "customer-documents/partner-1/cust-1/factuur-2025-042.pdf", file_size_bytes: 312e3, mime_type: "application/pdf", notes: null, uploaded_at: "2025-06-20T10:00:00Z", created_at: "2025-06-20T10:00:00Z" },
  // Lisa Bakker (cust-2)
  { id: "doc-6", customer_id: "cust-2", partner_id: "partner-1", name: "Offerte zonnepanelen + batterij", category: "offerte", file_path: "customer-documents/partner-1/cust-2/offerte-2025-018.pdf", file_size_bytes: 42e4, mime_type: "application/pdf", notes: "Getekend op 2025-04-01", uploaded_at: "2025-03-25T10:00:00Z", created_at: "2025-03-25T10:00:00Z" },
  { id: "doc-7", customer_id: "cust-2", partner_id: "partner-1", name: "Factuur installatie", category: "factuur", file_path: "customer-documents/partner-1/cust-2/factuur-2025-019.pdf", file_size_bytes: 275e3, mime_type: "application/pdf", notes: null, uploaded_at: "2025-04-20T14:00:00Z", created_at: "2025-04-20T14:00:00Z" },
  { id: "doc-8", customer_id: "cust-2", partner_id: "partner-1", name: "Opleverdocument", category: "opleverdocument", file_path: "customer-documents/partner-1/cust-2/oplevering-2025.pdf", file_size_bytes: 21e5, mime_type: "application/pdf", notes: null, uploaded_at: "2025-04-21T09:00:00Z", created_at: "2025-04-21T09:00:00Z" },
  // Piet Janssen (cust-3)
  { id: "doc-9", customer_id: "cust-3", partner_id: "partner-1", name: "Factuur Easee Home", category: "factuur", file_path: "customer-documents/partner-1/cust-3/factuur-2025-027.pdf", file_size_bytes: 198e3, mime_type: "application/pdf", notes: null, uploaded_at: "2025-05-10T09:00:00Z", created_at: "2025-05-10T09:00:00Z" },
  { id: "doc-10", customer_id: "cust-3", partner_id: "partner-1", name: "Datasheet Easee Home", category: "datasheet", file_path: "customer-documents/partner-1/cust-3/datasheet-easee-home.pdf", file_size_bytes: 64e4, mime_type: "application/pdf", notes: null, uploaded_at: "2025-05-10T09:00:00Z", created_at: "2025-05-10T09:00:00Z" }
]);
function useMockData() {
  return {
    // --- Backward compatible: scoped to Volt4U (partner-1) ---
    partner: PARTNERS[0],
    customers: CUSTOMERS_VOLTVIA,
    installations: INSTALLATIONS_VOLTVIA,
    moduleDefinitions: MODULE_DEFINITIONS,
    partnerModuleConfigs: PMC_VOLTVIA,
    subscriptions: _reactiveSubscriptions,
    payments: PAYMENTS_VOLTVIA,
    // --- Platform-level: all partners ---
    partners: PARTNERS,
    allCustomers: ALL_CUSTOMERS,
    allInstallations: ALL_INSTALLATIONS,
    allSubscriptions: _allReactiveSubscriptions,
    allPayments: ALL_PAYMENTS,
    allPartnerModuleConfigs: ALL_PARTNER_MODULE_CONFIGS,
    // Helper: get partner by slug
    getPartnerBySlug(slug) {
      return PARTNERS.find((p) => p.slug === slug) || null;
    },
    // Helper: get customer installations
    getCustomerInstallations(customerId) {
      return ALL_INSTALLATIONS.filter((i) => i.customer_id === customerId);
    },
    // Helper: get installation subscriptions
    getInstallationSubscriptions(installationId) {
      return _reactiveSubscriptions.filter((s) => s.installation_id === installationId);
    },
    // Helper: get active module count for Voltvia
    getActiveModuleCount() {
      return _reactiveSubscriptions.filter((s) => s.status === "active").length;
    },
    // Helper: calculate monthly revenue for Voltvia
    getMonthlyRevenue() {
      return _reactiveSubscriptions.filter((s) => s.status === "active").reduce((sum, s) => {
        if (s.billing_interval === "monthly") return sum + s.price_cents;
        return sum + Math.round(s.price_cents / 12);
      }, 0);
    },
    // Helper: get payment stats for Voltvia
    getPaymentStats() {
      const thisMonth = PAYMENTS_VOLTVIA.filter((p) => p.created_at >= "2025-07-01");
      return {
        totalThisMonth: thisMonth.reduce((sum, p) => p.status === "paid" ? sum + p.amount_cents : sum, 0),
        pendingCount: thisMonth.filter((p) => p.status === "pending").length,
        pendingAmount: thisMonth.filter((p) => p.status === "pending").reduce((sum, p) => sum + p.amount_cents, 0),
        failedCount: thisMonth.filter((p) => p.status === "failed").length,
        failedAmount: thisMonth.filter((p) => p.status === "failed").reduce((sum, p) => sum + p.amount_cents, 0)
      };
    },
    // Helper: get recent payments for Voltvia
    getRecentPayments(limit = 10) {
      return [...PAYMENTS_VOLTVIA].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
    },
    // Demo action: cancel subscription
    cancelSubscription(id) {
      const sub = _reactiveSubscriptions.find((s) => s.id === id);
      if (sub) {
        sub.status = "cancelled";
        sub.cancelled_at = (/* @__PURE__ */ new Date()).toISOString();
      }
    },
    // Demo action: add subscription
    addSubscription(installationId, configId) {
      const config = PMC_VOLTVIA.find((c) => c.id === configId);
      if (!config) return;
      const installation = INSTALLATIONS_VOLTVIA.find((i) => i.id === installationId);
      if (!installation) return;
      const newSub = {
        id: `sub-${Date.now()}`,
        customer_id: installation.customer_id,
        installation_id: installationId,
        partner_module_config_id: configId,
        status: "active",
        billing_interval: "monthly",
        price_cents: config.price_monthly,
        mollie_subscription_id: null,
        mollie_mandate_id: null,
        external_device_id: `demo-device-${Date.now()}`,
        integration_status: "active",
        integration_meta: {},
        terms_accepted_at: (/* @__PURE__ */ new Date()).toISOString(),
        terms_version: "1.0",
        activated_at: (/* @__PURE__ */ new Date()).toISOString(),
        cancelled_at: null,
        expires_at: null,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        partner_module_config: config
      };
      _reactiveSubscriptions.push(newSub);
    },
    // Current "logged in" customer (for demo) — reactive for edits
    currentCustomer: reactive({ ...CUSTOMERS_VOLTVIA[0] }),
    currentCustomerInstallations: INSTALLATIONS_VOLTVIA.filter((i) => i.customer_id === "cust-1"),
    // Mock invoices for customer portal
    invoices: INVOICES,
    getCustomerInvoices(customerId) {
      return INVOICES.filter((i) => i.customer_id === customerId).sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
    },
    // Mock notifications / communication log
    notifications: NOTIFICATIONS,
    getNotifications() {
      return [...NOTIFICATIONS].sort((a, b) => b.created_at.localeCompare(a.created_at));
    },
    // Demo action: update customer details (for address change)
    updateCurrentCustomer(data) {
      const customer = this.currentCustomer;
      Object.assign(customer, data, { updated_at: (/* @__PURE__ */ new Date()).toISOString() });
    },
    // --- Platform-level helpers ---
    getPartnerCustomers(partnerId) {
      return ALL_CUSTOMERS.filter((c) => c.partner_id === partnerId);
    },
    getPartnerInstallations(partnerId) {
      return ALL_INSTALLATIONS.filter((i) => i.partner_id === partnerId);
    },
    getPartnerSubscriptions(partnerId) {
      const partnerCustomerIds = ALL_CUSTOMERS.filter((c) => c.partner_id === partnerId).map((c) => c.id);
      return _allReactiveSubscriptions.filter((s) => partnerCustomerIds.includes(s.customer_id));
    },
    getPartnerActiveModuleCount(partnerId) {
      const partnerCustomerIds = ALL_CUSTOMERS.filter((c) => c.partner_id === partnerId).map((c) => c.id);
      return _allReactiveSubscriptions.filter((s) => partnerCustomerIds.includes(s.customer_id) && s.status === "active").length;
    },
    getPartnerMonthlyRevenue(partnerId) {
      const partnerCustomerIds = ALL_CUSTOMERS.filter((c) => c.partner_id === partnerId).map((c) => c.id);
      return _allReactiveSubscriptions.filter((s) => partnerCustomerIds.includes(s.customer_id) && s.status === "active").reduce((sum, s) => {
        if (s.billing_interval === "monthly") return sum + s.price_cents;
        return sum + Math.round(s.price_cents / 12);
      }, 0);
    },
    getPartnerPayments(partnerId) {
      return ALL_PAYMENTS.filter((p) => p.partner_id === partnerId);
    },
    getPlatformStats() {
      const activePartners = PARTNERS.filter((p) => p.is_active).length;
      const totalCustomers = ALL_CUSTOMERS.length;
      const totalActiveSubscriptions = _allReactiveSubscriptions.filter((s) => s.status === "active").length;
      const totalMRR = _allReactiveSubscriptions.filter((s) => s.status === "active").reduce((sum, s) => {
        if (s.billing_interval === "monthly") return sum + s.price_cents;
        return sum + Math.round(s.price_cents / 12);
      }, 0);
      const thisMonth = ALL_PAYMENTS.filter((p) => p.created_at >= "2025-07-01");
      const revenueThisMonth = thisMonth.reduce((sum, p) => p.status === "paid" ? sum + p.amount_cents : sum, 0);
      return { activePartners, totalCustomers, totalActiveSubscriptions, totalMRR, revenueThisMonth };
    },
    // --- Partner CRUD ---
    updatePartner(id, data) {
      const partner = PARTNERS.find((p) => p.id === id);
      if (partner) {
        Object.assign(partner, data, { updated_at: (/* @__PURE__ */ new Date()).toISOString() });
      }
    },
    addPartner(data) {
      const letter = data.name.charAt(0).toUpperCase();
      const color = encodeURIComponent(data.primary_color);
      const newPartner = {
        id: `partner-${Date.now()}`,
        name: data.name,
        slug: data.slug,
        custom_domain: null,
        logo_url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='${color}'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-size='20' font-weight='bold' fill='white' font-family='Arial'%3E${letter}%3C/text%3E%3C/svg%3E`,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        terms_url: null,
        support_email: data.support_email || null,
        support_phone: data.support_phone || null,
        is_active: true,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      PARTNERS.push(newPartner);
      return newPartner;
    },
    // --- Consumer Dashboard Data ---
    energyFlow: ENERGY_FLOW,
    solarData: SOLAR_DATA,
    heatPumpData: HEATPUMP_DATA,
    evChargerData: EVCHARGER_DATA,
    serviceTickets: SERVICE_TICKETS,
    maintenanceRecords: MAINTENANCE_RECORDS,
    systemStatus: SYSTEM_STATUS,
    conversations: CONVERSATIONS,
    // AI Conversatie functies
    startConversation(subject, message, moduleType = null) {
      const conv = {
        id: `conv-${Date.now()}`,
        customer_id: "cust-1",
        customer_name: CUSTOMERS_VOLTVIA[0].full_name || "Klant",
        subject,
        status: "actief",
        started_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        module_type: moduleType,
        messages: [],
        ai_summary: null,
        ai_resolution: null,
        requires_visit: false
      };
      conv.messages.push({
        id: `msg-${Date.now()}-c`,
        role: "customer",
        content: message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      const aiResp = generateAiResponse(message, moduleType, {
        solarData: SOLAR_DATA,
        heatPumpData: HEATPUMP_DATA,
        evChargerData: EVCHARGER_DATA,
        partnerName: PARTNERS[0].name,
        activeModules: _reactiveSubscriptions.filter((s) => s.customer_id === "cust-1" && s.status === "active").map((s) => {
          var _a, _b;
          return (_b = (_a = s.partner_module_config) == null ? void 0 : _a.module_definition) == null ? void 0 : _b.type;
        }).filter(Boolean)
      });
      conv.messages.push({
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        content: aiResp.content,
        timestamp: new Date(Date.now() + 2e3).toISOString(),
        metadata: aiResp.systemCheck ? { systemCheck: true, dataPoints: aiResp.dataPoints } : void 0
      });
      if (aiResp.shouldEscalate) {
        conv.status = "geescaleerd";
        conv.ai_summary = aiResp.escalateReason || "Geescaleerd naar installateur";
      }
      CONVERSATIONS.unshift(conv);
      return conv;
    },
    sendMessage(conversationId, message) {
      const conv = CONVERSATIONS.find((c) => c.id === conversationId);
      if (!conv) return;
      conv.messages.push({
        id: `msg-${Date.now()}-c`,
        role: "customer",
        content: message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      conv.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      const aiResp = generateAiResponse(message, conv.module_type, {
        solarData: SOLAR_DATA,
        heatPumpData: HEATPUMP_DATA,
        evChargerData: EVCHARGER_DATA,
        partnerName: PARTNERS[0].name,
        activeModules: _reactiveSubscriptions.filter((s) => s.customer_id === "cust-1" && s.status === "active").map((s) => {
          var _a, _b;
          return (_b = (_a = s.partner_module_config) == null ? void 0 : _a.module_definition) == null ? void 0 : _b.type;
        }).filter(Boolean)
      });
      conv.messages.push({
        id: `msg-${Date.now()}-ai`,
        role: "ai",
        content: aiResp.content,
        timestamp: new Date(Date.now() + 2e3).toISOString(),
        metadata: aiResp.systemCheck ? { systemCheck: true, dataPoints: aiResp.dataPoints } : void 0
      });
      if (aiResp.shouldEscalate && conv.status === "actief") {
        conv.status = "geescaleerd";
        conv.ai_summary = generateAiSummary(conv.messages, conv.module_type);
        conv.requires_visit = message.toLowerCase().includes("monteur") || message.toLowerCase().includes("afspraak") || message.toLowerCase().includes("langskomen");
      }
      if (!aiResp.shouldEscalate && (message.toLowerCase().includes("bedankt") || message.toLowerCase().includes("opgelost") || message.toLowerCase().includes("duidelijk"))) {
        conv.status = "ai_opgelost";
        conv.ai_resolution = "Vraag beantwoord door AI-assistent.";
      }
    },
    sendInstallerMessage(conversationId, message) {
      const conv = CONVERSATIONS.find((c) => c.id === conversationId);
      if (!conv) return;
      conv.messages.push({
        id: `msg-${Date.now()}-inst`,
        role: "installer",
        content: message,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      });
      conv.updated_at = (/* @__PURE__ */ new Date()).toISOString();
    },
    resolveConversation(conversationId) {
      const conv = CONVERSATIONS.find((c) => c.id === conversationId);
      if (conv) {
        conv.status = "gesloten";
        conv.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      }
    },
    escalateConversation(conversationId) {
      const conv = CONVERSATIONS.find((c) => c.id === conversationId);
      if (conv) {
        conv.status = "geescaleerd";
        conv.updated_at = (/* @__PURE__ */ new Date()).toISOString();
        conv.messages.push({
          id: `msg-${Date.now()}-ai-esc`,
          role: "ai",
          content: `Ik heb je vraag doorgestuurd naar ${PARTNERS[0].name}. Ze nemen zo snel mogelijk contact op.`,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
      }
    },
    // Get active module types for current customer
    getActiveModuleTypes() {
      const customerSubs = _reactiveSubscriptions.filter((s) => s.customer_id === "cust-1" && s.status === "active");
      return customerSubs.map((s) => {
        var _a, _b;
        return (_b = (_a = s.partner_module_config) == null ? void 0 : _a.module_definition) == null ? void 0 : _b.type;
      }).filter(Boolean);
    },
    // Demo action: update heat pump mode
    updateHeatPumpMode(mode) {
      HEATPUMP_DATA.mode = mode;
      if (mode === "eco") {
        HEATPUMP_DATA.setTemperature = 19;
      } else if (mode === "vakantie") {
        HEATPUMP_DATA.setTemperature = 15;
        HEATPUMP_DATA.status = "standby";
      } else {
        HEATPUMP_DATA.setTemperature = 21;
        HEATPUMP_DATA.status = "verwarmen";
      }
    },
    // Demo action: toggle EV charging
    toggleEvCharging() {
      if (EVCHARGER_DATA.status === "laden") {
        EVCHARGER_DATA.status = "standby";
        EVCHARGER_DATA.currentPowerW = 0;
        EVCHARGER_DATA.estimatedCompletion = null;
        ENERGY_FLOW.evChargingW = 0;
      } else {
        EVCHARGER_DATA.status = "laden";
        EVCHARGER_DATA.currentPowerW = 7400;
        EVCHARGER_DATA.estimatedCompletion = "18:30";
        ENERGY_FLOW.evChargingW = 7400;
      }
    },
    // Demo action: add service ticket
    addServiceTicket(ticket) {
      SERVICE_TICKETS.unshift({
        id: `ticket-${Date.now()}`,
        ...ticket,
        status: "open",
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString(),
        response: null
      });
    },
    // --- Service tiers ---
    serviceTiers: SERVICE_TIERS,
    // --- Onboarding functies ---
    onboardingRecords: ONBOARDING_RECORDS,
    onboardCustomer(data) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const partnerId = data.partner_id;
      const pmc = ALL_PARTNER_MODULE_CONFIGS.find(
        (p) => {
          var _a;
          return p.partner_id === partnerId && ((_a = p.module_definition) == null ? void 0 : _a.type) === data.module_type && p.is_enabled;
        }
      );
      if (!pmc) return null;
      const partnerCustomers = partnerId === "partner-1" ? CUSTOMERS_VOLTVIA : partnerId === "partner-2" ? CUSTOMERS_SOLARWISE : CUSTOMERS_GREENCHARGE;
      const partnerInstallations = partnerId === "partner-1" ? INSTALLATIONS_VOLTVIA : partnerId === "partner-2" ? INSTALLATIONS_SOLARWISE : INSTALLATIONS_GREENCHARGE;
      const existingCustomer = ALL_CUSTOMERS.find((c) => c.email === data.email && c.partner_id === partnerId);
      if (existingCustomer) {
        const installation = ALL_INSTALLATIONS.find((i) => i.customer_id === existingCustomer.id);
        if (!installation) return null;
        const alreadyHas = _allReactiveSubscriptions.find(
          (s) => {
            var _a, _b;
            return s.customer_id === existingCustomer.id && ((_b = (_a = s.partner_module_config) == null ? void 0 : _a.module_definition) == null ? void 0 : _b.type) === data.module_type && s.status === "active";
          }
        );
        if (alreadyHas) return { customer: existingCustomer, token: null, isExisting: true, alreadyHasModule: true };
        const subId2 = `sub-onb-${Date.now()}`;
        const newSub2 = {
          id: subId2,
          customer_id: existingCustomer.id,
          installation_id: installation.id,
          partner_module_config_id: pmc.id,
          status: "active",
          billing_interval: "monthly",
          price_cents: pmc.price_monthly,
          mollie_subscription_id: null,
          mollie_mandate_id: null,
          external_device_id: null,
          integration_status: "pending",
          integration_meta: {},
          terms_accepted_at: now,
          terms_version: "1.0",
          activated_at: now,
          cancelled_at: null,
          expires_at: null,
          created_at: now,
          updated_at: now,
          partner_module_config: pmc
        };
        _allReactiveSubscriptions.push(newSub2);
        if (partnerId === "partner-1") _reactiveSubscriptions.push(newSub2);
        const moduleName = data.module_type === "solar" ? "Zonnepanelen" : data.module_type === "heat_pump" ? "Warmtepomp" : "Laadpaal";
        NOTIFICATIONS.unshift({
          id: `notif-onb-${Date.now()}`,
          customer_id: existingCustomer.id,
          type: "info",
          subject: `${moduleName} toegevoegd aan je account`,
          message: `${moduleName} is gekoppeld aan je woning. Bekijk de status op je dashboard.`,
          is_read: false,
          created_at: now
        });
        return { customer: existingCustomer, token: null, isExisting: true, alreadyHasModule: false };
      }
      const custId = `cust-${Date.now()}`;
      const newCustomer = {
        id: custId,
        auth_user_id: `auth-${Date.now()}`,
        partner_id: partnerId,
        email: data.email,
        full_name: data.full_name,
        phone: data.phone,
        mollie_customer_id: null,
        street: data.street,
        house_number: data.house_number,
        postal_code: data.postal_code,
        city: data.city,
        created_at: now,
        updated_at: now
      };
      partnerCustomers.push(newCustomer);
      ALL_CUSTOMERS.push(newCustomer);
      const instId = `inst-${Date.now()}`;
      const newInstallation = {
        id: instId,
        customer_id: custId,
        partner_id: partnerId,
        name: `Woning ${data.street}`,
        address_street: data.street,
        address_house_number: data.house_number,
        address_postal_code: data.postal_code,
        address_city: data.city,
        created_at: now,
        updated_at: now
      };
      partnerInstallations.push(newInstallation);
      ALL_INSTALLATIONS.push(newInstallation);
      const subId = `sub-onb-${Date.now()}`;
      const newSub = {
        id: subId,
        customer_id: custId,
        installation_id: instId,
        partner_module_config_id: pmc.id,
        status: "active",
        billing_interval: "monthly",
        price_cents: pmc.price_monthly,
        mollie_subscription_id: null,
        mollie_mandate_id: null,
        external_device_id: null,
        integration_status: "pending",
        integration_meta: {},
        terms_accepted_at: null,
        terms_version: "1.0",
        activated_at: null,
        cancelled_at: null,
        expires_at: null,
        created_at: now,
        updated_at: now,
        partner_module_config: pmc
      };
      _allReactiveSubscriptions.push(newSub);
      if (partnerId === "partner-1") _reactiveSubscriptions.push(newSub);
      const token = `onb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      ONBOARDING_RECORDS.push({
        token,
        partner_id: partnerId,
        customer_id: custId,
        module_type: data.module_type,
        gripp_project_id: data.gripp_project_id || null,
        service_tier: "slim",
        status: "pending",
        created_at: now,
        activated_at: null
      });
      return { customer: newCustomer, token, isExisting: false, alreadyHasModule: false };
    },
    getOnboardingData(token) {
      const record = ONBOARDING_RECORDS.find((r) => r.token === token);
      if (!record) return null;
      const customer = ALL_CUSTOMERS.find((c) => c.id === record.customer_id);
      const partner = PARTNERS.find((p) => p.id === record.partner_id);
      const installation = ALL_INSTALLATIONS.find((i) => i.customer_id === record.customer_id);
      const subscription = _allReactiveSubscriptions.find(
        (s) => {
          var _a, _b;
          return s.customer_id === record.customer_id && ((_b = (_a = s.partner_module_config) == null ? void 0 : _a.module_definition) == null ? void 0 : _b.type) === record.module_type;
        }
      );
      if (!customer || !partner) return null;
      const serviceTier = SERVICE_TIERS.find((t) => t.slug === record.service_tier) || SERVICE_TIERS[1];
      return { record, customer, partner, installation, subscription, moduleType: record.module_type, serviceTier };
    },
    activateOnboarding(token, updatedCustomer) {
      const record = ONBOARDING_RECORDS.find((r) => r.token === token);
      if (!record || record.status === "activated") return false;
      record.status = "activated";
      record.activated_at = (/* @__PURE__ */ new Date()).toISOString();
      if (updatedCustomer) {
        const customer = ALL_CUSTOMERS.find((c) => c.id === record.customer_id);
        if (customer) Object.assign(customer, updatedCustomer, { updated_at: (/* @__PURE__ */ new Date()).toISOString() });
      }
      const sub = _allReactiveSubscriptions.find(
        (s) => {
          var _a, _b;
          return s.customer_id === record.customer_id && ((_b = (_a = s.partner_module_config) == null ? void 0 : _a.module_definition) == null ? void 0 : _b.type) === record.module_type;
        }
      );
      if (sub) {
        sub.status = "active";
        sub.activated_at = (/* @__PURE__ */ new Date()).toISOString();
        sub.terms_accepted_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      const moduleName = record.module_type === "solar" ? "Zonnepanelen" : record.module_type === "heat_pump" ? "Warmtepomp" : "Laadpaal";
      NOTIFICATIONS.unshift({
        id: `notif-welcome-${Date.now()}`,
        customer_id: record.customer_id,
        type: "info",
        subject: `Welkom! Je ${moduleName} account is actief`,
        message: `Je account is succesvol geactiveerd. Bekijk je ${moduleName.toLowerCase()} op het dashboard.`,
        is_read: false,
        created_at: (/* @__PURE__ */ new Date()).toISOString()
      });
      return true;
    },
    // --- Email Templates ---
    emailTemplates: EMAIL_TEMPLATES,
    getEmailTemplate(type) {
      return EMAIL_TEMPLATES.find((t) => t.type === type) || null;
    },
    updateEmailTemplate(type, updates) {
      const tmpl = EMAIL_TEMPLATES.find((t) => t.type === type);
      if (tmpl) Object.assign(tmpl, updates);
    },
    resetEmailTemplate(type) {
      const tmpl = EMAIL_TEMPLATES.find((t) => t.type === type);
      const def = DEFAULT_EMAIL_TEMPLATES.find((t) => t.type === type);
      if (tmpl && def) Object.assign(tmpl, { subject: def.subject, heading: def.heading, body: def.body, buttonText: def.buttonText });
    },
    // --- Integration Credentials ---
    integrationCredentials: INTEGRATION_CREDENTIALS,
    getIntegrationCredentials(partnerId, type) {
      return INTEGRATION_CREDENTIALS.find((c) => c.partner_id === partnerId && c.type === type) || null;
    },
    isIntegrationConnected(partnerId, type) {
      const cred = INTEGRATION_CREDENTIALS.find((c) => c.partner_id === partnerId && c.type === type);
      return (cred == null ? void 0 : cred.is_connected) || false;
    },
    saveIntegrationCredentials(partnerId, type, credentials, details = null) {
      const existing = INTEGRATION_CREDENTIALS.find((c) => c.partner_id === partnerId && c.type === type);
      if (existing) {
        existing.credentials = credentials;
        existing.is_connected = true;
        existing.details = details;
        existing.last_tested_at = (/* @__PURE__ */ new Date()).toISOString();
        return existing;
      }
      const entry2 = {
        id: `intcred-${Date.now()}`,
        partner_id: partnerId,
        type,
        credentials,
        is_connected: true,
        details,
        last_tested_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      INTEGRATION_CREDENTIALS.push(entry2);
      return entry2;
    },
    disconnectIntegration(partnerId, type) {
      const idx = INTEGRATION_CREDENTIALS.findIndex((c) => c.partner_id === partnerId && c.type === type);
      if (idx !== -1) INTEGRATION_CREDENTIALS.splice(idx, 1);
    },
    // --- Smart Meter ---
    allSmartMeters: ALL_SMART_METERS,
    getCustomerMeter(customerId) {
      return ALL_SMART_METERS.find((m) => m.customer_id === customerId) || null;
    },
    getMeterReadings(_meterId) {
      return MOCK_METER_READINGS;
    },
    linkSmartMeter(customerId, partnerId, postcode, meterId) {
      const existing = ALL_SMART_METERS.find((m) => m.customer_id === customerId);
      if (existing) {
        existing.postcode = postcode;
        existing.meter_id = meterId;
        existing.status = "pending";
        existing.error_message = null;
        existing.updated_at = (/* @__PURE__ */ new Date()).toISOString();
        setTimeout(() => {
          existing.status = "active";
          existing.linked_at = (/* @__PURE__ */ new Date()).toISOString();
          existing.updated_at = (/* @__PURE__ */ new Date()).toISOString();
        }, 2e3);
        return existing;
      }
      const meter = {
        id: `meter-${Date.now()}`,
        customer_id: customerId,
        partner_id: partnerId,
        postcode,
        meter_id: meterId,
        status: "pending",
        error_message: null,
        linked_at: null,
        created_at: (/* @__PURE__ */ new Date()).toISOString(),
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      };
      ALL_SMART_METERS.push(meter);
      setTimeout(() => {
        meter.status = "active";
        meter.linked_at = (/* @__PURE__ */ new Date()).toISOString();
        meter.updated_at = (/* @__PURE__ */ new Date()).toISOString();
      }, 2e3);
      return meter;
    },
    unlinkSmartMeter(customerId) {
      const idx = ALL_SMART_METERS.findIndex((m) => m.customer_id === customerId);
      if (idx !== -1) ALL_SMART_METERS.splice(idx, 1);
    },
    // --- Customer Dossier: Products ---
    allCustomerProducts: ALL_CUSTOMER_PRODUCTS,
    customerProducts: computed(() => ALL_CUSTOMER_PRODUCTS.filter((p) => p.partner_id === "partner-1")),
    getCustomerProducts(customerId) {
      return ALL_CUSTOMER_PRODUCTS.filter((p) => p.customer_id === customerId);
    },
    addCustomerProduct(data) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const product = {
        ...data,
        id: `prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        created_at: now,
        updated_at: now
      };
      ALL_CUSTOMER_PRODUCTS.push(product);
      return product;
    },
    updateCustomerProduct(id, data) {
      const product = ALL_CUSTOMER_PRODUCTS.find((p) => p.id === id);
      if (product) Object.assign(product, data, { updated_at: (/* @__PURE__ */ new Date()).toISOString() });
      return product;
    },
    removeCustomerProduct(id) {
      const idx = ALL_CUSTOMER_PRODUCTS.findIndex((p) => p.id === id);
      if (idx !== -1) ALL_CUSTOMER_PRODUCTS.splice(idx, 1);
    },
    // --- Customer Dossier: Documents ---
    allCustomerDocuments: ALL_CUSTOMER_DOCUMENTS,
    customerDocuments: computed(() => ALL_CUSTOMER_DOCUMENTS.filter((d) => d.partner_id === "partner-1")),
    getCustomerDocuments(customerId) {
      return ALL_CUSTOMER_DOCUMENTS.filter((d) => d.customer_id === customerId);
    },
    addCustomerDocument(data) {
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const doc = {
        ...data,
        id: `doc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        created_at: now
      };
      ALL_CUSTOMER_DOCUMENTS.push(doc);
      return doc;
    },
    removeCustomerDocument(id) {
      const idx = ALL_CUSTOMER_DOCUMENTS.findIndex((d) => d.id === id);
      if (idx !== -1) ALL_CUSTOMER_DOCUMENTS.splice(idx, 1);
    },
    deletePartner(id) {
      const idx = PARTNERS.findIndex((p) => p.id === id);
      if (idx !== -1) PARTNERS.splice(idx, 1);
      const customerIds = ALL_CUSTOMERS.filter((c) => c.partner_id === id).map((c) => c.id);
      for (let i = ALL_CUSTOMERS.length - 1; i >= 0; i--) {
        if (ALL_CUSTOMERS[i].partner_id === id) ALL_CUSTOMERS.splice(i, 1);
      }
      for (let i = ALL_INSTALLATIONS.length - 1; i >= 0; i--) {
        if (ALL_INSTALLATIONS[i].partner_id === id) ALL_INSTALLATIONS.splice(i, 1);
      }
      for (let i = _allReactiveSubscriptions.length - 1; i >= 0; i--) {
        if (customerIds.includes(_allReactiveSubscriptions[i].customer_id)) _allReactiveSubscriptions.splice(i, 1);
      }
      for (let i = ALL_PAYMENTS.length - 1; i >= 0; i--) {
        if (ALL_PAYMENTS[i].partner_id === id) ALL_PAYMENTS.splice(i, 1);
      }
    }
  };
}
const useSupabaseClient = () => {
  return useNuxtApp().$supabase.client;
};
const EMPTY_PARTNER = {
  id: "",
  name: "",
  slug: "",
  custom_domain: null,
  logo_url: null,
  primary_color: "#1a56db",
  secondary_color: "#f3f4f6",
  terms_url: null,
  terms_content: "",
  terms_placeholders: {},
  support_email: null,
  support_phone: null,
  is_active: true,
  created_at: "",
  updated_at: ""
};
function usePartner() {
  const config = /* @__PURE__ */ useRuntimeConfig();
  if (config.public.demoMode) {
    const { partner: partner2 } = useMockData();
    return {
      partner: ref(partner2),
      isLoading: ref(false),
      save: async () => {
      }
    };
  }
  const partner = useState("currentPartner", () => ({ ...EMPTY_PARTNER }));
  const isLoading = ref(false);
  const _fullLoaded = useState("partnerFullLoaded", () => false);
  async function loadFullPartner() {
    if (_fullLoaded.value || true) return;
  }
  async function save() {
    isLoading.value = true;
    try {
      const supabase = useSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!(session == null ? void 0 : session.access_token)) return;
      const result = await $fetch("/api/partners/me", {
        method: "PUT",
        headers: { Authorization: `Bearer ${session.access_token}` },
        body: {
          name: partner.value.name,
          slug: partner.value.slug,
          logo_url: partner.value.logo_url,
          primary_color: partner.value.primary_color,
          secondary_color: partner.value.secondary_color,
          support_email: partner.value.support_email,
          support_phone: partner.value.support_phone,
          terms_url: partner.value.terms_url,
          terms_content: partner.value.terms_content,
          terms_placeholders: partner.value.terms_placeholders
        }
      });
      if (result) Object.assign(partner.value, result);
    } finally {
      isLoading.value = false;
    }
  }
  return {
    partner,
    isLoading,
    save,
    loadFullPartner
  };
}
function useBackdropClose(close) {
  const armed = ref(false);
  return {
    onMouseDown(e) {
      armed.value = e.target === e.currentTarget;
    },
    onClick(e) {
      if (armed.value && e.target === e.currentTarget) {
        close();
      }
      armed.value = false;
    }
  };
}
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "ConfirmDialog",
  __ssrInlineRender: true,
  setup(__props) {
    const dialog = useConfirmState();
    const { partner } = usePartner();
    function close(ok) {
      if (!dialog.value) return;
      dialog.value.resolve(ok);
      dialog.value = null;
    }
    useBackdropClose(() => close(false));
    const confirmBtn = ref(null);
    watch(() => {
      var _a;
      return (_a = dialog.value) == null ? void 0 : _a.id;
    }, (id) => {
      if (id) nextTick(() => {
        var _a;
        return (_a = confirmBtn.value) == null ? void 0 : _a.focus();
      });
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      ssrRenderTeleport(_push, (_push2) => {
        var _a;
        if (unref(dialog)) {
          _push2(`<div class="confirm-overlay" style="${ssrRenderStyle(((_a = unref(partner)) == null ? void 0 : _a.primary_color) ? `--brand: ${unref(partner).primary_color}` : "")}" data-v-6f7d4f2f><div class="confirm-backdrop" data-v-6f7d4f2f></div><div class="confirm-card" role="dialog" aria-modal="true" data-v-6f7d4f2f><div class="${ssrRenderClass([unref(dialog).dangerous ? "danger" : "neutral", "confirm-icon"])}" data-v-6f7d4f2f>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: unref(dialog).dangerous ? "alert-circle" : "help-circle",
            size: 22
          }, null, _parent));
          _push2(`</div>`);
          if (unref(dialog).title) {
            _push2(`<h2 class="confirm-title" data-v-6f7d4f2f>${ssrInterpolate(unref(dialog).title)}</h2>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<p class="confirm-message" data-v-6f7d4f2f>${ssrInterpolate(unref(dialog).message)}</p><div class="confirm-actions" data-v-6f7d4f2f><button class="btn-secondary" data-v-6f7d4f2f>${ssrInterpolate(unref(dialog).cancelLabel)}</button><button class="${ssrRenderClass([{ "btn-danger": unref(dialog).dangerous }, "btn-primary"])}" data-v-6f7d4f2f>${ssrInterpolate(unref(dialog).confirmLabel)}</button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/ConfirmDialog.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["__scopeId", "data-v-6f7d4f2f"]]);
function useAuth() {
  const config = /* @__PURE__ */ useRuntimeConfig();
  const userRole = useState("userRole", () => null);
  const isLoading = useState("authLoading", () => false);
  if (config.public.demoMode) {
    if (!userRole.value) userRole.value = "platform_admin";
    return {
      user: ref({ id: "demo-user", email: "demo@upsol.nl" }),
      userRole,
      isLoading,
      resolveRole: async () => userRole.value ?? "platform_admin",
      signInWithMagicLink: async (_email) => {
      },
      signOut: async () => navigateTo("/"),
      switchRole: (role) => {
        userRole.value = role;
      },
      isCustomer: computed(() => userRole.value === "customer"),
      isPartnerAdmin: computed(() => userRole.value === "partner_admin"),
      isPlatformAdmin: computed(() => userRole.value === "platform_admin"),
      isAdmin: computed(() => userRole.value === "partner_admin" || userRole.value === "platform_admin")
    };
  }
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  async function resolveRole() {
    if (!user.value) {
      userRole.value = null;
      return null;
    }
    isLoading.value = true;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers = {};
      if (session == null ? void 0 : session.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }
      const data = await $fetch("/api/auth/role", { headers });
      userRole.value = (data == null ? void 0 : data.role) ?? null;
      return userRole.value;
    } finally {
      isLoading.value = false;
    }
  }
  async function signInWithMagicLink(email) {
    await $fetch("/api/auth/magic-link", {
      method: "POST",
      body: { email }
    });
  }
  async function signInWithPassword(email, password) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
  }
  async function resetPassword(email) {
    const redirectTo = `${(void 0).location.origin}/auth/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });
    if (error) throw error;
  }
  async function updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!(session == null ? void 0 : session.access_token)) return;
      $fetch("/api/auth/password-changed", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` }
      }).catch(() => {
      });
    });
  }
  async function signOut() {
    await supabase.auth.signOut();
    userRole.value = null;
    navigateTo("/login");
  }
  const isCustomer = computed(() => userRole.value === "customer");
  const isPartnerAdmin = computed(() => userRole.value === "partner_admin");
  const isPlatformAdmin = computed(() => userRole.value === "platform_admin");
  const isAdmin = computed(() => isPartnerAdmin.value || isPlatformAdmin.value);
  return {
    user,
    userRole,
    isLoading,
    resolveRole,
    signInWithMagicLink,
    signInWithPassword,
    resetPassword,
    updatePassword,
    signOut,
    switchRole: (_role) => {
    },
    // no-op in production
    isCustomer,
    isPartnerAdmin,
    isPlatformAdmin,
    isAdmin
  };
}
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "RoleSwitcher",
  __ssrInlineRender: true,
  setup(__props) {
    const config = /* @__PURE__ */ useRuntimeConfig();
    const { userRole, switchRole } = useAuth();
    const isOpen = ref(false);
    const roles = [
      { role: "platform_admin", label: "Platform beheer", color: "#111827", path: "/platform", icon: "globe" },
      { role: "partner_admin", label: "Installateur", color: "#1a56db", path: "/admin", icon: "settings" },
      { role: "customer", label: "Klant", color: "#059669", path: "/klant", icon: "home" }
    ];
    const currentRole = computed(() => roles.find((r) => r.role === userRole.value) || roles[0]);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5;
      if (unref(config).public.demoMode) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "role-switcher fixed bottom-5 right-5 z-50" }, _attrs))}>`);
        if (unref(isOpen)) {
          _push(`<div class="mb-2 overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-200"><div class="px-3 py-2 text-xs font-medium text-gray-400"> Wissel van rol </div><!--[-->`);
          ssrRenderList(roles, (r) => {
            _push(`<button class="${ssrRenderClass([r.role === unref(userRole) ? "bg-gray-50 font-medium" : "text-gray-600", "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50"])}"><span class="flex h-5 w-5 items-center justify-center rounded-full" style="${ssrRenderStyle({ backgroundColor: r.color })}">`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: r.icon,
              size: 12,
              class: "text-white"
            }, null, _parent));
            _push(`</span> ${ssrInterpolate(r.label)} `);
            if (r.role === unref(userRole)) {
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "check",
                size: 14,
                class: "ml-auto text-gray-400"
              }, null, _parent));
            } else {
              _push(`<!---->`);
            }
            _push(`</button>`);
          });
          _push(`<!--]--></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<button class="flex items-center gap-2.5 rounded-full bg-white px-4 py-2.5 shadow-lg ring-1 ring-gray-200 transition-all hover:shadow-xl"><span class="flex h-6 w-6 items-center justify-center rounded-full" style="${ssrRenderStyle({ backgroundColor: unref(currentRole).color })}">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(currentRole).icon,
          size: 13,
          class: "text-white"
        }, null, _parent));
        _push(`</span><span class="text-sm font-medium text-gray-700">${ssrInterpolate(unref(currentRole).label)}</span>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: unref(isOpen) ? "chevron-up" : "chevron-down",
          size: 14,
          class: "text-gray-400"
        }, null, _parent));
        _push(`</button></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ui/RoleSwitcher.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const { partner } = usePartner();
    useHead({
      title: computed(() => {
        var _a;
        return ((_a = partner.value) == null ? void 0 : _a.name) || "UPsol";
      }),
      meta: [
        { name: "description", content: computed(() => {
          var _a;
          return ((_a = partner.value) == null ? void 0 : _a.name) ? `Klantportaal van ${partner.value.name}` : "Modulair klantportaal voor installateurs";
        }) },
        { name: "theme-color", content: computed(() => {
          var _a;
          return ((_a = partner.value) == null ? void 0 : _a.primary_color) || "#111827";
        }) }
      ],
      link: [
        {
          rel: "icon",
          type: "image/png",
          href: computed(() => {
            var _a;
            return ((_a = partner.value) == null ? void 0 : _a.logo_url) || "/favicon.svg";
          })
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLayout = __nuxt_component_0;
      const _component_NuxtPage = __nuxt_component_1;
      const _component_ConfirmDialog = __nuxt_component_2;
      const _component_RoleSwitcher = _sfc_main$3;
      _push(`<!--[-->`);
      _push(ssrRenderComponent(_component_NuxtLayout, null, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(ssrRenderComponent(_component_NuxtPage, null, null, _parent2, _scopeId));
          } else {
            return [
              createVNode(_component_NuxtPage)
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_ConfirmDialog, null, null, _parent));
      if (("useRuntimeConfig" in _ctx ? _ctx.useRuntimeConfig : unref(useRuntimeConfig))().public.demoMode) {
        _push(ssrRenderComponent(_component_RoleSwitcher, null, null, _parent));
      } else {
        _push(`<!---->`);
      }
      _push(`<!--]-->`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    _error.stack ? _error.stack.split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n") : "";
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404-DcfdKzKo.mjs'));
    const _Error = defineAsyncComponent(() => import('./error-500-P7hOtBJc.mjs'));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(_sfc_main$2), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error = nuxt.payload.error || createError(error);
    }
    if (ssrContext == null ? void 0 : ssrContext._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry_default = (ssrContext) => entry(ssrContext);

const server = /*#__PURE__*/Object.freeze({
  __proto__: null,
  _: _export_sfc,
  a: useMockData,
  b: usePartner,
  c: useConfirm,
  d: _sfc_main$5,
  default: entry_default,
  e: useRouter,
  f: useNuxtApp,
  g: useRuntimeConfig,
  h: nuxtLinkDefaults,
  i: useBackdropClose,
  j: useState,
  k: useSupabaseClient,
  l: useRoute,
  m: useAuth,
  n: navigateTo,
  o: asyncDataDefaults,
  p: createError,
  q: fetchDefaults,
  r: resolveRouteObject,
  s: useRequestFetch,
  t: defineNuxtRouteMiddleware,
  u: useHead,
  v: useSupabaseUser,
  w: executeAsync
});

export { _sfc_main$5 as _, useConfirm as a, useMockData as b, _export_sfc as c, useRoute as d, useRouter as e, useSupabaseClient as f, useState as g, useBackdropClose as h, useNuxtApp as i, useRuntimeConfig as j, nuxtLinkDefaults as k, useAuth as l, useHead as m, navigateTo as n, objectHash as o, fetchDefaults as p, asyncDataDefaults as q, resolveRouteObject as r, useRequestFetch as s, createError as t, usePartner as u, defineNuxtRouteMiddleware as v, useSupabaseUser as w, executeAsync as x, server as y };
//# sourceMappingURL=server.mjs.map
