import { c as _export_sfc, d as useRoute, u as usePartner, a as useConfirm, e as useRouter, _ as _sfc_main$5$1, f as useSupabaseClient, g as useState, h as useBackdropClose } from './server.mjs';
import { _ as __nuxt_component_0 } from './nuxt-link-DjY7r90I.mjs';
import { defineComponent, ref, watch, computed, unref, withCtx, createTextVNode, createVNode, isRef, nextTick, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderStyle, ssrInterpolate, ssrIncludeBooleanAttr, ssrRenderAttr, ssrRenderClass, ssrRenderList, ssrRenderTeleport, ssrLooseContain, ssrLooseEqual, ssrRenderDynamicModel } from 'vue/server-renderer';
import { g as getModuleTheme } from './module-theme-8XLQDN8U.mjs';
import { u as useCustomers } from './useCustomers-B2wkzFun.mjs';
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

const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "ProductFormModal",
  __ssrInlineRender: true,
  props: {
    modelValue: { type: Boolean },
    editProduct: {}
  },
  emits: ["update:modelValue", "save"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const form = ref({
      category: "solar_panel",
      brand: "",
      model: "",
      name: "",
      capacity_wp: "",
      orientation: "",
      tilt: "",
      installation_date: "",
      notes: ""
    });
    const categories = [
      { value: "solar_panel", label: "Zonnepanelen" },
      { value: "heat_pump", label: "Warmtepomp" },
      { value: "ev_charger", label: "Laadpaal" },
      { value: "battery", label: "Batterij" },
      { value: "other", label: "Overig" }
    ];
    const CATEGORY_DEFAULTS = {
      solar_panel: { brand: "", model: "", brandPlaceholder: "Bijv. Longi", modelPlaceholder: "Bijv. Hi-MO 6 480Wp" },
      heat_pump: { brand: "Weheat", model: "ATLAS", brandPlaceholder: "Weheat", modelPlaceholder: "ATLAS" },
      ev_charger: { brand: "Easee", model: "Home", brandPlaceholder: "Easee", modelPlaceholder: "Home" },
      battery: { brand: "", model: "", brandPlaceholder: "Bijv. Tesla", modelPlaceholder: "Bijv. Powerwall 3" },
      other: { brand: "", model: "", brandPlaceholder: "Merk", modelPlaceholder: "Model" }
    };
    const defaultsForCategory = computed(() => CATEGORY_DEFAULTS[form.value.category] || CATEGORY_DEFAULTS.other);
    let previousCategoryDefaults = CATEGORY_DEFAULTS.solar_panel;
    watch(() => form.value.category, (newCat) => {
      const next = CATEGORY_DEFAULTS[newCat] || CATEGORY_DEFAULTS.other;
      if (!form.value.brand || form.value.brand === previousCategoryDefaults.brand) {
        form.value.brand = next.brand;
      }
      if (!form.value.model || form.value.model === previousCategoryDefaults.model) {
        form.value.model = next.model;
      }
      previousCategoryDefaults = next;
    });
    const orientationOptions = [
      { value: "north", label: "Noord" },
      { value: "north-east", label: "Noordoost" },
      { value: "east", label: "Oost" },
      { value: "south-east", label: "Zuidoost" },
      { value: "south", label: "Zuid" },
      { value: "south-west", label: "Zuidwest" },
      { value: "west", label: "West" },
      { value: "north-west", label: "Noordwest" }
    ];
    const isSolar = computed(() => form.value.category === "solar_panel");
    const isEditing = computed(() => !!props.editProduct);
    watch(() => props.modelValue, (open) => {
      var _a, _b, _c, _d, _e, _f;
      if (open && props.editProduct) {
        form.value = {
          category: props.editProduct.category || "solar_panel",
          brand: props.editProduct.brand || "",
          model: props.editProduct.model || "",
          name: props.editProduct.name || "",
          capacity_wp: ((_b = (_a = props.editProduct.notes) == null ? void 0 : _a.match(/(\d+)\s*Wp/)) == null ? void 0 : _b[1]) || "",
          orientation: ((_d = (_c = props.editProduct.notes) == null ? void 0 : _c.match(/oriëntatie:\s*(\S+)/i)) == null ? void 0 : _d[1]) || "",
          tilt: ((_f = (_e = props.editProduct.notes) == null ? void 0 : _e.match(/helling:\s*(\d+)/i)) == null ? void 0 : _f[1]) || "",
          installation_date: props.editProduct.installation_date || "",
          notes: (props.editProduct.notes || "").replace(/\d+\s*Wp.*?(·|$)/, "").trim()
        };
        previousCategoryDefaults = CATEGORY_DEFAULTS[form.value.category] || CATEGORY_DEFAULTS.other;
      } else if (open) {
        resetForm();
      }
    });
    useBackdropClose(() => close());
    function close() {
      emit("update:modelValue", false);
      setTimeout(resetForm, 300);
    }
    function resetForm() {
      const defaults = CATEGORY_DEFAULTS.solar_panel;
      form.value = { category: "solar_panel", brand: defaults.brand, model: defaults.model, name: "", capacity_wp: "", orientation: "", tilt: "", installation_date: "", notes: "" };
      previousCategoryDefaults = defaults;
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5$1;
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.modelValue) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-29b604ad><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-29b604ad></div><div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden" data-v-29b604ad><div class="border-b border-gray-100 px-6 py-4" data-v-29b604ad><div class="flex items-center justify-between" data-v-29b604ad><h3 class="text-lg font-semibold text-gray-900" data-v-29b604ad>${ssrInterpolate(unref(isEditing) ? "Product bewerken" : "Product toevoegen")}</h3><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" data-v-29b604ad>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div></div><form class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto" data-v-29b604ad><div data-v-29b604ad><label class="label" data-v-29b604ad>Type product</label><select class="input" data-v-29b604ad><!--[-->`);
          ssrRenderList(categories, (cat) => {
            _push2(`<option${ssrRenderAttr("value", cat.value)} data-v-29b604ad${ssrIncludeBooleanAttr(Array.isArray(unref(form).category) ? ssrLooseContain(unref(form).category, cat.value) : ssrLooseEqual(unref(form).category, cat.value)) ? " selected" : ""}>${ssrInterpolate(cat.label)}</option>`);
          });
          _push2(`<!--]--></select></div><div class="grid grid-cols-2 gap-3" data-v-29b604ad><div data-v-29b604ad><label class="label" data-v-29b604ad>Merk <span class="text-red-400" data-v-29b604ad>*</span></label><input${ssrRenderAttr("value", unref(form).brand)} type="text" class="input"${ssrRenderAttr("placeholder", unref(defaultsForCategory).brandPlaceholder)} required data-v-29b604ad></div><div data-v-29b604ad><label class="label" data-v-29b604ad>Model</label><input${ssrRenderAttr("value", unref(form).model)} type="text" class="input"${ssrRenderAttr("placeholder", unref(defaultsForCategory).modelPlaceholder)} data-v-29b604ad></div></div><div data-v-29b604ad><label class="label" data-v-29b604ad>Label <span class="text-gray-400 font-normal" data-v-29b604ad>(optioneel)</span></label><input${ssrRenderAttr("value", unref(form).name)} type="text" class="input" placeholder="Bijv. Schuur, Voorkant" data-v-29b604ad></div>`);
          if (unref(isSolar)) {
            _push2(`<div class="border-t border-gray-100 pt-3" data-v-29b604ad><p class="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider" data-v-29b604ad>Installatie details \u2014 nodig voor Sundata koppeling</p><div class="grid grid-cols-3 gap-3" data-v-29b604ad><div data-v-29b604ad><label class="label" data-v-29b604ad>Vermogen (Wp) <span class="text-red-400" data-v-29b604ad>*</span></label><input${ssrRenderAttr("value", unref(form).capacity_wp)} type="number" step="1" class="input" placeholder="8400" required data-v-29b604ad></div><div data-v-29b604ad><label class="label" data-v-29b604ad>Ori\xEBntatie <span class="text-red-400" data-v-29b604ad>*</span></label><select class="input" required data-v-29b604ad><option value="" data-v-29b604ad${ssrIncludeBooleanAttr(Array.isArray(unref(form).orientation) ? ssrLooseContain(unref(form).orientation, "") : ssrLooseEqual(unref(form).orientation, "")) ? " selected" : ""}>Kies...</option><!--[-->`);
            ssrRenderList(orientationOptions, (o) => {
              _push2(`<option${ssrRenderAttr("value", o.value)} data-v-29b604ad${ssrIncludeBooleanAttr(Array.isArray(unref(form).orientation) ? ssrLooseContain(unref(form).orientation, o.value) : ssrLooseEqual(unref(form).orientation, o.value)) ? " selected" : ""}>${ssrInterpolate(o.label)}</option>`);
            });
            _push2(`<!--]--></select></div><div data-v-29b604ad><label class="label" data-v-29b604ad>Helling (\xB0) <span class="text-red-400" data-v-29b604ad>*</span></label><input${ssrRenderAttr("value", unref(form).tilt)} type="number" step="1" min="0" max="90" class="input" placeholder="35" required data-v-29b604ad></div></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`<div data-v-29b604ad><label class="label" data-v-29b604ad>Installatiedatum</label><input${ssrRenderAttr("value", unref(form).installation_date)} type="date" class="input" data-v-29b604ad></div><div data-v-29b604ad><label class="label" data-v-29b604ad>Notities</label><textarea class="input" rows="2" placeholder="Optioneel" data-v-29b604ad>${ssrInterpolate(unref(form).notes)}</textarea></div></form><div class="border-t border-gray-100 px-6 py-4 flex justify-end gap-3" data-v-29b604ad><button class="btn-secondary" data-v-29b604ad>Annuleren</button><button${ssrIncludeBooleanAttr(!unref(form).brand) ? " disabled" : ""} class="${ssrRenderClass([{ "opacity-50 cursor-not-allowed": !unref(form).brand }, "btn-primary"])}" data-v-29b604ad>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 16
          }, null, _parent));
          _push2(` ${ssrInterpolate(unref(isEditing) ? "Opslaan" : "Toevoegen")}</button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dossier/ProductFormModal.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_1$1 = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["__scopeId", "data-v-29b604ad"]]);
function useCustomerDossier(customerId) {
  const products = useState(`dossier-products-${customerId}`, () => []);
  const documents = useState(`dossier-documents-${customerId}`, () => []);
  const isLoading = useState(`dossier-loading-${customerId}`, () => true);
  const _loaded = useState(`dossier-loaded-${customerId}`, () => false);
  async function getAuthHeaders() {
    const supabase = useSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();
    return (session == null ? void 0 : session.access_token) ? { Authorization: `Bearer ${session.access_token}` } : {};
  }
  async function loadData() {
    const headers = await getAuthHeaders();
    if (!headers.Authorization) return;
    isLoading.value = true;
    try {
      const [prods, docs] = await Promise.all([
        $fetch(`/api/customers/${customerId}/products`, { headers }).catch(() => []),
        $fetch(`/api/customers/${customerId}/documents`, { headers }).catch(() => [])
      ]);
      products.value = prods || [];
      documents.value = docs || [];
      _loaded.value = true;
    } finally {
      isLoading.value = false;
    }
  }
  return {
    products: computed(() => products.value),
    documents: computed(() => documents.value),
    isLoading,
    async refresh() {
      await loadData();
    },
    async addProduct(data) {
      const headers = await getAuthHeaders();
      const product = await $fetch(`/api/customers/${customerId}/products`, {
        method: "POST",
        headers,
        body: data
      });
      products.value.push(product);
      return product;
    },
    async removeProduct(id) {
      const headers = await getAuthHeaders();
      await $fetch(`/api/customers/${customerId}/products/${id}`, {
        method: "DELETE",
        headers
      }).catch(() => {
      });
      const idx = products.value.findIndex((p) => p.id === id);
      if (idx !== -1) products.value.splice(idx, 1);
    },
    async addDocument(data) {
      const headers = await getAuthHeaders();
      const doc = await $fetch(`/api/customers/${customerId}/documents`, {
        method: "POST",
        headers,
        body: data
      }).catch(() => {
        return { ...data, id: `doc-${Date.now()}`, created_at: (/* @__PURE__ */ new Date()).toISOString() };
      });
      documents.value.push(doc);
      return doc;
    },
    async removeDocument(id) {
      const idx = documents.value.findIndex((d) => d.id === id);
      if (idx !== -1) documents.value.splice(idx, 1);
    }
  };
}
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "ProductList",
  __ssrInlineRender: true,
  props: {
    customerId: {},
    partnerId: {},
    customerName: {}
  },
  emits: ["open-connector"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { products, addProduct, refresh } = useCustomerDossier(props.customerId);
    function getSundataLink(product) {
      const s = product == null ? void 0 : product.serial_number;
      if (!s || typeof s !== "string" || !s.startsWith("sundata:")) return null;
      const [companyId, plantId, meterId] = s.slice("sundata:".length).split("/").map(Number);
      if (!companyId || !plantId || !meterId) return null;
      return { companyId, plantId, meterId };
    }
    function getEaseeLink(product) {
      const s = product == null ? void 0 : product.serial_number;
      if (!s || typeof s !== "string" || !s.startsWith("easee:")) return null;
      const chargerId = s.slice("easee:".length).trim();
      return chargerId ? { chargerId } : null;
    }
    function getWeheatLink(product) {
      const s = product == null ? void 0 : product.serial_number;
      if (!s || typeof s !== "string" || !s.startsWith("weheat:")) return null;
      const heatpumpId = s.slice("weheat:".length).trim();
      return heatpumpId ? { heatpumpId } : null;
    }
    __expose({ refresh });
    const showAddModal = ref(false);
    const editingProduct = ref(null);
    const categoryLabels = {
      solar_panel: "Zonnepanelen",
      inverter: "Omvormer",
      heat_pump: "Warmtepomp",
      ev_charger: "Laadpaal",
      battery: "Batterij",
      other: "Overig"
    };
    function categoryIcon(cat) {
      return getModuleTheme(cat).icon;
    }
    function categoryColor(cat) {
      return getModuleTheme(cat).accent;
    }
    async function handleAdd(data) {
      var _a;
      if (!props.partnerId) {
        alert("Partner gegevens nog niet geladen, even wachten...");
        return;
      }
      const wasNew = !data.id;
      const isSolar = data.category === "solar_panel";
      try {
        await addProduct({ ...data, customer_id: props.customerId, partner_id: props.partnerId });
      } catch (e) {
        alert(((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message) || (e == null ? void 0 : e.message) || "Product toevoegen mislukt");
        showAddModal.value = false;
        editingProduct.value = null;
        return;
      }
      showAddModal.value = false;
      editingProduct.value = null;
      if (wasNew && isSolar) {
        await nextTick();
        setTimeout(() => emit("open-connector", "solar"), 350);
      }
    }
    useConfirm();
    function formatDate(d) {
      if (!d) return "\u2014";
      return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5$1;
      const _component_ProductFormModal = __nuxt_component_1$1;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="flex items-center justify-between mb-4"><h3 class="text-sm font-semibold text-gray-900"> Producten <span class="text-gray-400 font-normal">(${ssrInterpolate(unref(products).length)})</span></h3><button class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "plus",
        size: 14
      }, null, _parent));
      _push(` Product toevoegen </button></div>`);
      if (unref(products).length === 0) {
        _push(`<div class="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "package",
          size: 32,
          class: "mx-auto text-gray-300 mb-3"
        }, null, _parent));
        _push(`<p class="text-sm text-gray-500">Nog geen producten toegevoegd</p><button class="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900"> + Eerste product toevoegen </button></div>`);
      } else {
        _push(`<div class="space-y-3"><!--[-->`);
        ssrRenderList(unref(products), (product) => {
          _push(`<div class="group flex items-start gap-4 rounded-xl border border-gray-100 bg-white p-4 hover:border-gray-200 transition-colors"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style="${ssrRenderStyle({ backgroundColor: categoryColor(product.category) + "15", color: categoryColor(product.category) })}">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: categoryIcon(product.category),
            size: 20
          }, null, _parent));
          _push(`</div><div class="flex-1 min-w-0"><div class="flex items-center gap-2"><p class="font-medium text-gray-900 text-sm">${ssrInterpolate(product.brand)} ${ssrInterpolate(product.model)}</p><span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style="${ssrRenderStyle({ backgroundColor: categoryColor(product.category) + "15", color: categoryColor(product.category) })}">${ssrInterpolate(categoryLabels[product.category])}</span></div><div class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">`);
          if (product.name && product.name !== `${product.brand} ${product.model}`.trim()) {
            _push(`<span>${ssrInterpolate(product.name)}</span>`);
          } else {
            _push(`<!---->`);
          }
          if (product.installation_date) {
            _push(`<span>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "calendar",
              size: 12,
              class: "inline -mt-0.5"
            }, null, _parent));
            _push(` ${ssrInterpolate(formatDate(product.installation_date))}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (product.notes) {
            _push(`<p class="mt-1.5 text-xs text-gray-400">${ssrInterpolate(product.notes)}</p>`);
          } else {
            _push(`<!---->`);
          }
          if (product.category === "solar_panel") {
            _push(`<!--[-->`);
            if (getSundataLink(product)) {
              _push(`<div class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "check-circle",
                size: 12
              }, null, _parent));
              _push(` Gekoppeld met Sundata <span class="font-mono text-green-500/70"> \xB7 plant #${ssrInterpolate(getSundataLink(product).plantId)}</span></div>`);
            } else {
              _push(`<button type="button" class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "zap",
                size: 12
              }, null, _parent));
              _push(` Koppel monitoring via Sundata </button>`);
            }
            _push(`<!--]-->`);
          } else {
            _push(`<!---->`);
          }
          if (product.category === "ev_charger") {
            _push(`<!--[-->`);
            if (getEaseeLink(product)) {
              _push(`<div class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "check-circle",
                size: 12
              }, null, _parent));
              _push(` Gekoppeld met Easee <span class="font-mono text-green-500/70"> \xB7 ${ssrInterpolate(getEaseeLink(product).chargerId)}</span></div>`);
            } else {
              _push(`<button class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "zap",
                size: 12
              }, null, _parent));
              _push(` Koppel laadpaal via Easee </button>`);
            }
            _push(`<!--]-->`);
          } else {
            _push(`<!---->`);
          }
          if (product.category === "heat_pump") {
            _push(`<!--[-->`);
            if (getWeheatLink(product)) {
              _push(`<div class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "check-circle",
                size: 12
              }, null, _parent));
              _push(` Gekoppeld met Weheat <span class="font-mono text-green-500/70"> \xB7 ${ssrInterpolate(getWeheatLink(product).heatpumpId.slice(0, 12))}</span></div>`);
            } else {
              _push(`<button class="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: "zap",
                size: 12
              }, null, _parent));
              _push(` Koppel warmtepomp via Weheat </button>`);
            }
            _push(`<!--]-->`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="flex items-center gap-1 shrink-0"><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors" title="Bewerken">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "settings",
            size: 14
          }, null, _parent));
          _push(`</button><button class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Verwijderen">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "trash",
            size: 14
          }, null, _parent));
          _push(`</button></div></div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(ssrRenderComponent(_component_ProductFormModal, {
        modelValue: unref(showAddModal),
        "onUpdate:modelValue": ($event) => isRef(showAddModal) ? showAddModal.value = $event : null,
        "edit-product": unref(editingProduct),
        onSave: handleAdd
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dossier/ProductList.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "DocumentUploadModal",
  __ssrInlineRender: true,
  props: {
    modelValue: { type: Boolean }
  },
  emits: ["update:modelValue", "save"],
  setup(__props, { emit: __emit }) {
    const emit = __emit;
    const form = ref({
      name: "",
      category: "overig",
      notes: ""
    });
    const selectedFile = ref(null);
    ref();
    const categories = [
      { value: "factuur", label: "Factuur" },
      { value: "datasheet", label: "Datasheet" },
      { value: "opleverdocument", label: "Opleverdocument" },
      { value: "garantiebewijs", label: "Garantiebewijs" },
      { value: "offerte", label: "Offerte" },
      { value: "overig", label: "Overig" }
    ];
    function close() {
      emit("update:modelValue", false);
      setTimeout(resetForm, 300);
    }
    useBackdropClose(close);
    function resetForm() {
      form.value = { name: "", category: "overig", notes: "" };
      selectedFile.value = null;
    }
    function formatFileSize(bytes) {
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
      return (bytes / 1048576).toFixed(1) + " MB";
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5$1;
      ssrRenderTeleport(_push, (_push2) => {
        if (__props.modelValue) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-055be1ec><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-055be1ec></div><div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden" data-v-055be1ec><div class="border-b border-gray-100 px-6 py-4" data-v-055be1ec><div class="flex items-center justify-between" data-v-055be1ec><h3 class="text-lg font-semibold text-gray-900" data-v-055be1ec>Document uploaden</h3><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" data-v-055be1ec>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div></div><form class="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto" data-v-055be1ec><div data-v-055be1ec><label class="label" data-v-055be1ec>Bestand</label><div class="${ssrRenderClass([unref(selectedFile) ? "border-green-300 bg-green-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50", "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 transition-colors cursor-pointer"])}" data-v-055be1ec><input type="file" class="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif" data-v-055be1ec>`);
          if (unref(selectedFile)) {
            _push2(`<!--[-->`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 24,
              class: "text-green-500 mb-2"
            }, null, _parent));
            _push2(`<p class="text-sm font-medium text-green-700" data-v-055be1ec>${ssrInterpolate(unref(selectedFile).name)}</p><p class="text-xs text-green-600 mt-0.5" data-v-055be1ec>${ssrInterpolate(formatFileSize(unref(selectedFile).size))}</p><!--]-->`);
          } else {
            _push2(`<!--[-->`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "upload",
              size: 24,
              class: "text-gray-400 mb-2"
            }, null, _parent));
            _push2(`<p class="text-sm text-gray-600" data-v-055be1ec>Klik om een bestand te selecteren</p><p class="text-xs text-gray-400 mt-0.5" data-v-055be1ec>PDF, Word, Excel, afbeeldingen</p><!--]-->`);
          }
          _push2(`</div></div><div data-v-055be1ec><label class="label" data-v-055be1ec>Categorie</label><select class="input" data-v-055be1ec><!--[-->`);
          ssrRenderList(categories, (cat) => {
            _push2(`<option${ssrRenderAttr("value", cat.value)} data-v-055be1ec${ssrIncludeBooleanAttr(Array.isArray(unref(form).category) ? ssrLooseContain(unref(form).category, cat.value) : ssrLooseEqual(unref(form).category, cat.value)) ? " selected" : ""}>${ssrInterpolate(cat.label)}</option>`);
          });
          _push2(`<!--]--></select></div><div data-v-055be1ec><label class="label" data-v-055be1ec>Naam <span class="text-red-400" data-v-055be1ec>*</span></label><input${ssrRenderAttr("value", unref(form).name)} type="text" class="input" placeholder="Bijv. Factuur installatie 2025" required data-v-055be1ec></div><div data-v-055be1ec><label class="label" data-v-055be1ec>Notities</label><textarea class="input" rows="2" placeholder="Optioneel" data-v-055be1ec>${ssrInterpolate(unref(form).notes)}</textarea></div></form><div class="border-t border-gray-100 px-6 py-4 flex justify-end gap-3" data-v-055be1ec><button class="btn-secondary" data-v-055be1ec>Annuleren</button><button${ssrIncludeBooleanAttr(!unref(form).name) ? " disabled" : ""} class="${ssrRenderClass([{ "opacity-50 cursor-not-allowed": !unref(form).name }, "btn-primary"])}" data-v-055be1ec>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "upload",
            size: 16
          }, null, _parent));
          _push2(` Uploaden </button></div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dossier/DocumentUploadModal.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["__scopeId", "data-v-055be1ec"]]);
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "DocumentList",
  __ssrInlineRender: true,
  props: {
    customerId: {},
    partnerId: {}
  },
  setup(__props) {
    const props = __props;
    const { documents, addDocument } = useCustomerDossier(props.customerId);
    const showUploadModal = ref(false);
    const categoryLabels = {
      factuur: "Factuur",
      datasheet: "Datasheet",
      opleverdocument: "Opleverdocument",
      garantiebewijs: "Garantiebewijs",
      offerte: "Offerte",
      overig: "Overig"
    };
    const categoryColors = {
      factuur: "bg-blue-50 text-blue-700",
      datasheet: "bg-gray-100 text-gray-700",
      opleverdocument: "bg-green-50 text-green-700",
      garantiebewijs: "bg-yellow-50 text-yellow-700",
      offerte: "bg-indigo-50 text-indigo-700",
      overig: "bg-gray-100 text-gray-600"
    };
    function formatDate(d) {
      return new Date(d).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
    }
    function formatFileSize(bytes) {
      if (!bytes) return "";
      if (bytes < 1024) return bytes + " B";
      if (bytes < 1048576) return Math.round(bytes / 1024) + " KB";
      return (bytes / 1048576).toFixed(1) + " MB";
    }
    function handleUpload(data) {
      addDocument({
        ...data,
        customer_id: props.customerId,
        partner_id: props.partnerId
      });
      showUploadModal.value = false;
    }
    useConfirm();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5$1;
      const _component_DocumentUploadModal = __nuxt_component_1;
      _push(`<div${ssrRenderAttrs(_attrs)}><div class="flex items-center justify-between mb-4"><h3 class="text-sm font-semibold text-gray-900"> Documenten <span class="text-gray-400 font-normal">(${ssrInterpolate(unref(documents).length)})</span></h3><button class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors">`);
      _push(ssrRenderComponent(_component_AppIcon, {
        name: "upload",
        size: 14
      }, null, _parent));
      _push(` Document uploaden </button></div>`);
      if (unref(documents).length === 0) {
        _push(`<div class="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center">`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "folder",
          size: 32,
          class: "mx-auto text-gray-300 mb-3"
        }, null, _parent));
        _push(`<p class="text-sm text-gray-500">Nog geen documenten ge\xFCpload</p><button class="mt-3 text-sm font-medium text-gray-600 hover:text-gray-900"> + Eerste document uploaden </button></div>`);
      } else {
        _push(`<div class="grid grid-cols-1 sm:grid-cols-2 gap-3"><!--[-->`);
        ssrRenderList(unref(documents), (doc) => {
          _push(`<div class="group relative flex flex-col rounded-xl border border-gray-100 bg-white p-4 hover:border-gray-200 transition-colors"><div class="flex items-start gap-3"><div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-400">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "file-text",
            size: 20
          }, null, _parent));
          _push(`</div><div class="flex-1 min-w-0"><p class="font-medium text-sm text-gray-900 truncate">${ssrInterpolate(doc.name)}</p><div class="mt-1 flex items-center gap-2"><span class="${ssrRenderClass([categoryColors[doc.category], "rounded-full px-2 py-0.5 text-[10px] font-medium"])}">${ssrInterpolate(categoryLabels[doc.category])}</span><span class="text-[11px] text-gray-400">${ssrInterpolate(formatFileSize(doc.file_size_bytes))}</span></div></div></div><div class="mt-3 flex items-center justify-between"><span class="text-[11px] text-gray-400">${ssrInterpolate(formatDate(doc.uploaded_at))}</span><div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button class="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Downloaden">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "download",
            size: 14
          }, null, _parent));
          _push(`</button><button class="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors" title="Verwijderen">`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "trash",
            size: 14
          }, null, _parent));
          _push(`</button></div></div>`);
          if (doc.notes) {
            _push(`<p class="mt-2 text-xs text-gray-400 border-t border-gray-50 pt-2">${ssrInterpolate(doc.notes)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></div>`);
      }
      _push(ssrRenderComponent(_component_DocumentUploadModal, {
        modelValue: unref(showUploadModal),
        "onUpdate:modelValue": ($event) => isRef(showUploadModal) ? showUploadModal.value = $event : null,
        onSave: handleUpload
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/dossier/DocumentList.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "SundataWizard",
  __ssrInlineRender: true,
  props: {
    modelValue: { type: Boolean },
    customerId: {},
    customerName: {},
    productData: {}
  },
  emits: ["update:modelValue", "completed"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const { partner } = usePartner();
    const step = ref("brand");
    const errorMessage = ref("");
    const drivers = ref([]);
    const driversLoading = ref(true);
    const selectedDriver = ref(null);
    const searchBrand = ref("");
    const plantName = ref("");
    const capacityWp = ref("");
    const orientation = ref("");
    const tilt = ref("");
    const driverCredentials = ref({});
    const orientationOptions = [
      { value: "north", label: "Noord" },
      { value: "north-east", label: "Noordoost" },
      { value: "east", label: "Oost" },
      { value: "south-east", label: "Zuidoost" },
      { value: "south", label: "Zuid" },
      { value: "south-west", label: "Zuidwest" },
      { value: "west", label: "West" },
      { value: "north-west", label: "Noordwest" }
    ];
    const createResult = ref(null);
    const verifyResult = ref(null);
    const existingPlantId = ref(null);
    const existingCompanyId = ref(null);
    const isSubmitting = ref(false);
    const filteredDrivers = computed(() => {
      if (!searchBrand.value) return drivers.value;
      const q = searchBrand.value.toLowerCase();
      return drivers.value.filter((d) => d.name.toLowerCase().includes(q));
    });
    async function getAuthHeaders() {
      const supabase = useSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      return (session == null ? void 0 : session.access_token) ? { Authorization: `Bearer ${session.access_token}` } : {};
    }
    watch(() => props.modelValue, async (open) => {
      var _a;
      if (!open) return;
      reset();
      driversLoading.value = true;
      try {
        const headers = await getAuthHeaders();
        drivers.value = await $fetch("/api/sundata/drivers", { headers });
      } catch (e) {
        errorMessage.value = ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message) || "Kan merken niet ophalen. Is Sundata gekoppeld?";
        step.value = "error";
      } finally {
        driversLoading.value = false;
      }
    });
    function reset() {
      var _a, _b, _c;
      step.value = "brand";
      errorMessage.value = "";
      selectedDriver.value = null;
      searchBrand.value = "";
      plantName.value = props.customerName || "";
      capacityWp.value = ((_a = props.productData) == null ? void 0 : _a.capacityWp) || "";
      orientation.value = ((_b = props.productData) == null ? void 0 : _b.orientation) || "";
      tilt.value = ((_c = props.productData) == null ? void 0 : _c.tilt) || "";
      driverCredentials.value = {};
      createResult.value = null;
      verifyResult.value = null;
      existingPlantId.value = null;
      existingCompanyId.value = null;
    }
    const addressForm = ref({ street: "", house_number: "", postal_code: "", city: "" });
    const addressSaving = ref(false);
    const addressError = ref("");
    const addressComplete = computed(
      () => !!(addressForm.value.street.trim() && addressForm.value.house_number.trim() && addressForm.value.postal_code.trim() && addressForm.value.city.trim())
    );
    function close() {
      emit("update:modelValue", false);
    }
    useBackdropClose(close);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5$1;
      ssrRenderTeleport(_push, (_push2) => {
        var _a, _b, _c;
        if (__props.modelValue) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-fe50f99b><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-fe50f99b></div><div class="relative w-full max-w-lg rounded-2xl bg-white shadow-xl overflow-hidden" data-v-fe50f99b><div class="px-6 pt-5 pb-4 bg-gradient-to-r from-amber-50 to-orange-50" data-v-fe50f99b><div class="flex items-center justify-between" data-v-fe50f99b><div class="flex items-center gap-3" data-v-fe50f99b><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600" data-v-fe50f99b>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "solar",
            size: 22
          }, null, _parent));
          _push2(`</div><div data-v-fe50f99b><h3 class="text-lg font-semibold text-gray-900" data-v-fe50f99b>Zonnepanelen koppelen</h3><p class="text-sm text-gray-500" data-v-fe50f99b>${ssrInterpolate(__props.customerName)} \xB7 via Sundata</p></div></div><button class="rounded-lg p-1.5 text-gray-400 hover:bg-white/60 hover:text-gray-600" data-v-fe50f99b>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div><div class="mt-4 flex gap-1" data-v-fe50f99b><!--[-->`);
          ssrRenderList(["brand", "credentials", "creating", "done"], (s) => {
            _push2(`<div class="${ssrRenderClass([["brand", "credentials", "creating", "verifying", "done"].indexOf(unref(step)) >= ["brand", "credentials", "creating", "done"].indexOf(s) ? "bg-amber-500" : "bg-amber-200", "h-1 flex-1 rounded-full transition-colors"])}" data-v-fe50f99b></div>`);
          });
          _push2(`<!--]--></div></div><div class="px-6 py-5 max-h-[60vh] overflow-y-auto" data-v-fe50f99b>`);
          if (unref(step) === "brand") {
            _push2(`<!--[--><p class="text-sm text-gray-600 mb-4" data-v-fe50f99b>Selecteer het merk van de omvormer of het monitoringplatform.</p><div class="mb-3" data-v-fe50f99b><input${ssrRenderAttr("value", unref(searchBrand))} type="text" class="input" placeholder="Zoek merk..." autofocus data-v-fe50f99b></div>`);
            if (unref(driversLoading)) {
              _push2(`<div class="py-8 text-center" data-v-fe50f99b><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-amber-500" data-v-fe50f99b></div></div>`);
            } else {
              _push2(`<div class="grid grid-cols-2 gap-2" data-v-fe50f99b><!--[-->`);
              ssrRenderList(unref(filteredDrivers), (driver) => {
                var _a2;
                _push2(`<button class="flex items-center gap-3 rounded-xl border-2 border-gray-200 p-3 text-left transition-all hover:border-amber-300 hover:bg-amber-50" data-v-fe50f99b><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-600 text-xs font-bold" data-v-fe50f99b>${ssrInterpolate((_a2 = driver.name) == null ? void 0 : _a2.substring(0, 2).toUpperCase())}</div><span class="text-sm font-medium text-gray-900" data-v-fe50f99b>${ssrInterpolate(driver.name)}</span></button>`);
              });
              _push2(`<!--]--></div>`);
            }
            if (!unref(driversLoading) && unref(drivers).length === 0) {
              _push2(`<p class="rounded-xl bg-amber-50 p-4 text-center text-sm text-amber-700" data-v-fe50f99b> Er zijn nog geen merken actief in jullie Sundata account. Neem contact op met Sundata om merken te activeren. </p>`);
            } else if (!unref(driversLoading) && unref(filteredDrivers).length === 0) {
              _push2(`<p class="py-4 text-center text-sm text-gray-400" data-v-fe50f99b> Geen merken gevonden voor &quot;${ssrInterpolate(unref(searchBrand))}&quot; </p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<!--]-->`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(step) === "credentials") {
            _push2(`<!--[--><button class="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700" data-v-fe50f99b>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "chevron-right",
              size: 14,
              class: "rotate-180"
            }, null, _parent));
            _push2(` Ander merk kiezen </button><div class="flex items-center gap-3 mb-4 rounded-xl bg-amber-50 p-3" data-v-fe50f99b><div class="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 text-xs font-bold" data-v-fe50f99b>${ssrInterpolate((_a = unref(selectedDriver).name) == null ? void 0 : _a.substring(0, 2).toUpperCase())}</div><div data-v-fe50f99b><p class="text-sm font-semibold text-gray-900" data-v-fe50f99b>${ssrInterpolate(unref(selectedDriver).name)}</p><p class="text-xs text-gray-500" data-v-fe50f99b>${ssrInterpolate((unref(selectedDriver).fields || []).length)} gegevens nodig</p></div></div><form class="space-y-3" data-v-fe50f99b><div data-v-fe50f99b><label class="label" data-v-fe50f99b>Naam installatie <span class="text-red-400" data-v-fe50f99b>*</span></label><input${ssrRenderAttr("value", unref(plantName))} type="text" class="input" placeholder="Bijv. Zonnepanelen Fam. Jansen" required data-v-fe50f99b></div><div class="border-t border-gray-100 pt-3" data-v-fe50f99b><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2" data-v-fe50f99b>Installatie details</p><div class="grid grid-cols-3 gap-3" data-v-fe50f99b><div data-v-fe50f99b><label class="label" data-v-fe50f99b>Vermogen (Wp) <span class="text-red-400" data-v-fe50f99b>*</span></label><input${ssrRenderAttr("value", unref(capacityWp))} type="number" step="1" min="0" class="input" placeholder="8400" required data-v-fe50f99b></div><div data-v-fe50f99b><label class="label" data-v-fe50f99b>Ori\xEBntatie <span class="text-red-400" data-v-fe50f99b>*</span></label><select class="input" required data-v-fe50f99b><option value="" data-v-fe50f99b${ssrIncludeBooleanAttr(Array.isArray(unref(orientation)) ? ssrLooseContain(unref(orientation), "") : ssrLooseEqual(unref(orientation), "")) ? " selected" : ""}>Kies...</option><!--[-->`);
            ssrRenderList(orientationOptions, (o) => {
              _push2(`<option${ssrRenderAttr("value", o.value)} data-v-fe50f99b${ssrIncludeBooleanAttr(Array.isArray(unref(orientation)) ? ssrLooseContain(unref(orientation), o.value) : ssrLooseEqual(unref(orientation), o.value)) ? " selected" : ""}>${ssrInterpolate(o.label)}</option>`);
            });
            _push2(`<!--]--></select></div><div data-v-fe50f99b><label class="label" data-v-fe50f99b>Helling (\xB0) <span class="text-red-400" data-v-fe50f99b>*</span></label><input${ssrRenderAttr("value", unref(tilt))} type="number" step="1" min="0" max="90" class="input" placeholder="35" required data-v-fe50f99b></div></div></div>`);
            if ((_b = unref(selectedDriver).fields) == null ? void 0 : _b.length) {
              _push2(`<div class="border-t border-gray-100 pt-3" data-v-fe50f99b><div class="flex items-center justify-between mb-2" data-v-fe50f99b><p class="text-xs font-semibold text-gray-500 uppercase tracking-wider" data-v-fe50f99b>${ssrInterpolate(unref(selectedDriver).name)} gegevens</p>`);
              if (unref(selectedDriver).helpUrl) {
                _push2(`<a${ssrRenderAttr("href", unref(selectedDriver).helpUrl)} target="_blank" class="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700" data-v-fe50f99b>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "external",
                  size: 11
                }, null, _parent));
                _push2(` Hulp bij instellen </a>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="space-y-3" data-v-fe50f99b><!--[-->`);
              ssrRenderList(unref(selectedDriver).fields, (field) => {
                _push2(`<div data-v-fe50f99b><label class="label" data-v-fe50f99b>${ssrInterpolate(typeof field === "string" ? field : field.label)}</label><input${ssrRenderDynamicModel((typeof field === "string" ? field : field.name).toLowerCase().includes("password") ? "password" : "text", unref(driverCredentials)[typeof field === "string" ? field : field.name], null)}${ssrRenderAttr("type", (typeof field === "string" ? field : field.name).toLowerCase().includes("password") ? "password" : "text")} class="input"${ssrRenderAttr("placeholder", typeof field === "string" ? field : field.label)} required data-v-fe50f99b></div>`);
              });
              _push2(`<!--]--></div></div>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(errorMessage)) {
              _push2(`<p class="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700" role="alert" data-v-fe50f99b>${ssrInterpolate(unref(errorMessage))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<button type="submit"${ssrIncludeBooleanAttr(unref(isSubmitting)) ? " disabled" : ""} class="mt-4 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed" data-v-fe50f99b>`);
            if (unref(isSubmitting)) {
              _push2(`<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" data-v-fe50f99b><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-fe50f99b></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" data-v-fe50f99b></path></svg>`);
            } else {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "zap",
                size: 16
              }, null, _parent));
            }
            _push2(` ${ssrInterpolate(unref(isSubmitting) ? "Koppelen..." : "Koppelen met Sundata")}</button></form><!--]-->`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(step) === "creating") {
            _push2(`<div class="py-8 text-center" data-v-fe50f99b><div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-amber-200 border-t-amber-500" data-v-fe50f99b></div><p class="text-sm font-medium text-gray-900" data-v-fe50f99b>Plant aanmaken in Sundata...</p><p class="mt-1 text-xs text-gray-500" data-v-fe50f99b>Even geduld, we koppelen ${ssrInterpolate((_c = unref(selectedDriver)) == null ? void 0 : _c.name)}</p></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(step) === "verifying") {
            _push2(`<div class="py-8 text-center" data-v-fe50f99b><div class="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-green-200 border-t-green-500" data-v-fe50f99b></div><p class="text-sm font-medium text-gray-900" data-v-fe50f99b>Verbinding verifi\xEBren...</p><p class="mt-1 text-xs text-gray-500" data-v-fe50f99b>We controleren of de data binnenkomt</p></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(step) === "done") {
            _push2(`<div class="py-4 text-center" data-v-fe50f99b><div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50" data-v-fe50f99b>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 28,
              class: "text-green-500"
            }, null, _parent));
            _push2(`</div><p class="text-lg font-semibold text-gray-900" data-v-fe50f99b>Gekoppeld!</p><p class="mt-1 text-sm text-gray-500" data-v-fe50f99b>${ssrInterpolate(unref(plantName))} is aangemeld bij Sundata.</p>`);
            if (unref(verifyResult)) {
              _push2(`<div class="mt-4 rounded-xl bg-gray-50 p-4 text-left" data-v-fe50f99b><div class="grid grid-cols-2 gap-3 text-sm" data-v-fe50f99b><div data-v-fe50f99b><p class="text-xs text-gray-400" data-v-fe50f99b>Status</p><p class="${ssrRenderClass([unref(verifyResult).connected ? "text-green-600" : "text-amber-600", "font-medium"])}" data-v-fe50f99b>${ssrInterpolate(unref(verifyResult).connected ? "Verbonden" : "In afwachting van data")}</p></div><div data-v-fe50f99b><p class="text-xs text-gray-400" data-v-fe50f99b>Meters</p><p class="font-medium text-gray-900" data-v-fe50f99b>${ssrInterpolate(unref(verifyResult).meters)}</p></div>`);
              if (unref(verifyResult).capacity_kwp) {
                _push2(`<div data-v-fe50f99b><p class="text-xs text-gray-400" data-v-fe50f99b>Capaciteit</p><p class="font-medium text-gray-900" data-v-fe50f99b>${ssrInterpolate(unref(verifyResult).capacity_kwp)} kWp</p></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div></div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<button class="mt-6 w-full rounded-xl bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800" data-v-fe50f99b> Sluiten </button></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(step) === "address") {
            _push2(`<div class="py-2" data-v-fe50f99b><div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50" data-v-fe50f99b>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "map-pin",
              size: 24,
              class: "text-amber-600"
            }, null, _parent));
            _push2(`</div><p class="text-center text-lg font-semibold text-gray-900" data-v-fe50f99b>Adres ontbreekt nog</p><p class="mx-auto mt-2 max-w-sm text-center text-sm text-gray-500" data-v-fe50f99b> Sundata legt de installatie vast op een fysiek adres. Vul het hieronder aan \u2014 we slaan het op bij de klant en gaan daarna automatisch verder met koppelen. </p><div class="mt-5 space-y-3" data-v-fe50f99b><div data-v-fe50f99b><label class="label" data-v-fe50f99b>Straat</label><input${ssrRenderAttr("value", unref(addressForm).street)} type="text" class="input" placeholder="bv. Lange Viestraat" autofocus data-v-fe50f99b></div><div class="grid grid-cols-3 gap-3" data-v-fe50f99b><div data-v-fe50f99b><label class="label" data-v-fe50f99b>Huisnr.</label><input${ssrRenderAttr("value", unref(addressForm).house_number)} type="text" class="input" placeholder="2b" data-v-fe50f99b></div><div data-v-fe50f99b><label class="label" data-v-fe50f99b>Postcode</label><input${ssrRenderAttr("value", unref(addressForm).postal_code)} type="text" class="input" placeholder="3511 BK" data-v-fe50f99b></div><div data-v-fe50f99b><label class="label" data-v-fe50f99b>Plaats</label><input${ssrRenderAttr("value", unref(addressForm).city)} type="text" class="input" placeholder="Utrecht" data-v-fe50f99b></div></div></div>`);
            if (unref(addressError)) {
              _push2(`<p class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" data-v-fe50f99b>${ssrInterpolate(unref(addressError))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="mt-6 flex justify-between gap-3" data-v-fe50f99b><button class="btn-secondary"${ssrIncludeBooleanAttr(unref(addressSaving)) ? " disabled" : ""} data-v-fe50f99b>Annuleren</button><button class="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(addressComplete) || unref(addressSaving)) ? " disabled" : ""} data-v-fe50f99b>`);
            if (unref(addressSaving)) {
              _push2(`<span class="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent align-middle" data-v-fe50f99b></span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(unref(addressSaving) ? "Opslaan..." : "Opslaan en doorgaan")}</button></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          if (unref(step) === "error") {
            _push2(`<div class="py-4 text-center" data-v-fe50f99b><div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50" data-v-fe50f99b>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "x-circle",
              size: 28,
              class: "text-red-500"
            }, null, _parent));
            _push2(`</div><p class="text-lg font-semibold text-gray-900" data-v-fe50f99b>${ssrInterpolate(unref(existingPlantId) ? "Meter koppelen mislukt" : "Koppeling mislukt")}</p><p class="mt-2 text-sm text-red-600" data-v-fe50f99b>${ssrInterpolate(unref(errorMessage))}</p>`);
            if (unref(existingPlantId)) {
              _push2(`<p class="mt-3 text-xs text-gray-500" data-v-fe50f99b> De plant is aangemaakt in Sundata (#${ssrInterpolate(unref(existingPlantId))}). Bij opnieuw proberen hergebruiken we deze \u2014 er worden geen dubbele plants aangemaakt. </p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="mt-6 flex justify-center gap-3" data-v-fe50f99b><button class="btn-secondary" data-v-fe50f99b>Sluiten</button><button class="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800" data-v-fe50f99b>${ssrInterpolate(unref(existingPlantId) ? "Meter opnieuw koppelen" : "Opnieuw proberen")}</button></div></div>`);
          } else {
            _push2(`<!---->`);
          }
          _push2(`</div></div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/onboard/SundataWizard.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const __nuxt_component_4 = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["__scopeId", "data-v-fe50f99b"]]);
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "WeheatWizard",
  __ssrInlineRender: true,
  props: {
    modelValue: { type: Boolean },
    customerId: {},
    customerName: {}
  },
  emits: ["update:modelValue", "completed"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isOpen = computed({
      get: () => props.modelValue,
      set: (v) => emit("update:modelValue", v)
    });
    const heatPumps = ref([]);
    const loading = ref(false);
    const loadError = ref("");
    const search = ref("");
    const selectedId = ref(null);
    const linking = ref(false);
    const linkError = ref("");
    const done = ref(false);
    const filteredPumps = computed(() => {
      const q = search.value.trim().toLowerCase();
      if (!q) return heatPumps.value;
      return heatPumps.value.filter(
        (hp) => {
          var _a, _b, _c, _d;
          return ((_a = hp.serial) == null ? void 0 : _a.toLowerCase().includes(q)) || ((_b = hp.name) == null ? void 0 : _b.toLowerCase().includes(q)) || ((_c = hp.partNumber) == null ? void 0 : _c.toLowerCase().includes(q)) || ((_d = hp.id) == null ? void 0 : _d.toLowerCase().startsWith(q));
        }
      );
    });
    const selectedPump = computed(() => heatPumps.value.find((hp) => hp.id === selectedId.value) || null);
    async function loadDevices() {
      var _a;
      loading.value = true;
      loadError.value = "";
      try {
        const supabase = useSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!(session == null ? void 0 : session.access_token)) throw new Error("Niet ingelogd");
        const data = await $fetch("/api/integrations/weheat/devices", {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        heatPumps.value = data || [];
      } catch (e) {
        loadError.value = ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message) || (e == null ? void 0 : e.message) || "Kan lijst niet laden";
      } finally {
        loading.value = false;
      }
    }
    watch(() => props.modelValue, (open) => {
      if (open) {
        selectedId.value = null;
        search.value = "";
        linkError.value = "";
        done.value = false;
        loadDevices();
      }
    });
    function formatDate(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
      } catch {
        return "";
      }
    }
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5$1;
      ssrRenderTeleport(_push, (_push2) => {
        var _a;
        if (unref(isOpen)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-d5d66959><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-d5d66959></div><div class="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col" style="${ssrRenderStyle({ "max-height": "85vh" })}" data-v-d5d66959><div class="border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0" data-v-d5d66959><div class="flex items-center gap-3" data-v-d5d66959><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600" data-v-d5d66959>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "heat-pump",
            size: 20
          }, null, _parent));
          _push2(`</div><div data-v-d5d66959><h3 class="text-base font-semibold text-gray-900" data-v-d5d66959>Warmtepomp koppelen via Weheat</h3><p class="text-xs text-gray-500" data-v-d5d66959>Kies de juiste warmtepomp voor ${ssrInterpolate(__props.customerName || "deze klant")}.</p></div></div><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" data-v-d5d66959>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div>`);
          if (unref(done)) {
            _push2(`<div class="px-6 py-10 text-center" data-v-d5d66959><div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600" data-v-d5d66959>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 28
            }, null, _parent));
            _push2(`</div><h4 class="text-base font-semibold text-gray-900 mb-1" data-v-d5d66959>Gekoppeld</h4><p class="text-sm text-gray-500" data-v-d5d66959><strong data-v-d5d66959>${ssrInterpolate((_a = unref(selectedPump)) == null ? void 0 : _a.serial)}</strong> staat nu aan ${ssrInterpolate(__props.customerName || "deze klant")} gekoppeld. <br data-v-d5d66959>De klant ziet z&#39;n warmtepomp direct in z&#39;n portaal. </p><button class="btn-primary mt-5" data-v-d5d66959>Sluiten</button></div>`);
          } else if (unref(loading)) {
            _push2(`<div class="px-6 py-16 text-center" data-v-d5d66959><div class="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-gray-200 border-t-gray-500" data-v-d5d66959></div><p class="mt-3 text-sm text-gray-500" data-v-d5d66959>Warmtepompen van Weheat ophalen...</p></div>`);
          } else if (unref(loadError)) {
            _push2(`<div class="px-6 py-10 text-center" data-v-d5d66959>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "alert-circle",
              size: 32,
              class: "mx-auto text-amber-400 mb-3"
            }, null, _parent));
            _push2(`<p class="text-sm text-gray-700" data-v-d5d66959>${ssrInterpolate(unref(loadError))}</p><button class="btn-secondary mt-4" data-v-d5d66959>Probeer opnieuw</button></div>`);
          } else {
            _push2(`<!--[--><div class="px-6 py-3 border-b border-gray-100 shrink-0" data-v-d5d66959><div class="relative" data-v-d5d66959>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "search",
              size: 14,
              class: "absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
            }, null, _parent));
            _push2(`<input${ssrRenderAttr("value", unref(search))} type="search" class="input pl-8 text-sm"${ssrRenderAttr("placeholder", `Zoek in ${unref(heatPumps).length} warmtepompen op serial, partnummer...`)} data-v-d5d66959></div>`);
            if (unref(search) && unref(filteredPumps).length === 0) {
              _push2(`<p class="mt-2 text-xs text-gray-400" data-v-d5d66959> Geen resultaten. </p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="flex-1 overflow-y-auto px-6 py-3 space-y-1.5" data-v-d5d66959><!--[-->`);
            ssrRenderList(unref(filteredPumps), (hp) => {
              _push2(`<button class="${ssrRenderClass([unref(selectedId) === hp.id ? "border-orange-300 bg-orange-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50", "w-full text-left flex items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors"])}" data-v-d5d66959><div class="${ssrRenderClass([unref(selectedId) === hp.id ? "border-orange-500 bg-orange-500" : "border-gray-300", "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2"])}" data-v-d5d66959>`);
              if (unref(selectedId) === hp.id) {
                _push2(`<div class="h-1.5 w-1.5 rounded-full bg-white" data-v-d5d66959></div>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><div class="flex-1 min-w-0" data-v-d5d66959><div class="flex items-baseline gap-2" data-v-d5d66959><p class="font-mono text-sm font-semibold text-gray-900" data-v-d5d66959>${ssrInterpolate(hp.serial)}</p>`);
              if (hp.model) {
                _push2(`<span class="text-[11px] text-gray-500" data-v-d5d66959>Model ${ssrInterpolate(hp.model)}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div><p class="mt-0.5 text-xs text-gray-500 flex flex-wrap gap-x-3" data-v-d5d66959>`);
              if (hp.partNumber) {
                _push2(`<span class="font-mono" data-v-d5d66959>${ssrInterpolate(hp.partNumber)}</span>`);
              } else {
                _push2(`<!---->`);
              }
              if (hp.commissionedAt) {
                _push2(`<span data-v-d5d66959>Ge\xEFnstalleerd ${ssrInterpolate(formatDate(hp.commissionedAt))}</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</p></div></button>`);
            });
            _push2(`<!--]--></div><div class="border-t border-gray-100 px-6 py-3 flex items-center justify-between gap-3 shrink-0" data-v-d5d66959>`);
            if (unref(linkError)) {
              _push2(`<p class="text-xs text-red-600" data-v-d5d66959>${ssrInterpolate(unref(linkError))}</p>`);
            } else if (unref(selectedPump)) {
              _push2(`<p class="text-xs text-gray-500" data-v-d5d66959> Geselecteerd: <span class="font-mono font-semibold" data-v-d5d66959>${ssrInterpolate(unref(selectedPump).serial)}</span></p>`);
            } else {
              _push2(`<p class="text-xs text-gray-400" data-v-d5d66959>${ssrInterpolate(unref(heatPumps).length)} warmtepompen beschikbaar.</p>`);
            }
            _push2(`<div class="flex gap-2 shrink-0" data-v-d5d66959><button class="btn-secondary" data-v-d5d66959>Annuleren</button><button class="btn-primary"${ssrIncludeBooleanAttr(!unref(selectedPump) || unref(linking)) ? " disabled" : ""} data-v-d5d66959>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check",
              size: 14
            }, null, _parent));
            _push2(` ${ssrInterpolate(unref(linking) ? "Koppelen..." : "Koppel aan klant")}</button></div></div><!--]-->`);
          }
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/onboard/WeheatWizard.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const __nuxt_component_5 = /* @__PURE__ */ _export_sfc(_sfc_main$2, [["__scopeId", "data-v-d5d66959"]]);
const _sfc_main$1 = /* @__PURE__ */ defineComponent({
  __name: "EaseeWizard",
  __ssrInlineRender: true,
  props: {
    modelValue: { type: Boolean },
    customerId: {},
    customerName: {}
  },
  emits: ["update:modelValue", "completed"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const emit = __emit;
    const isOpen = computed({
      get: () => props.modelValue,
      set: (v) => emit("update:modelValue", v)
    });
    const sites = ref([]);
    const chargers = ref([]);
    const loading = ref(false);
    const loadingChargers = ref(false);
    const loadError = ref("");
    const search = ref("");
    const selectedSite = ref(null);
    const selectedId = ref(null);
    const linking = ref(false);
    const linkError = ref("");
    const done = ref(false);
    const filteredSites = computed(() => {
      const q = search.value.trim().toLowerCase();
      if (!q) return sites.value.slice(0, 60);
      return sites.value.filter(
        (s) => {
          var _a, _b, _c;
          return ((_a = s.name) == null ? void 0 : _a.toLowerCase().includes(q)) || ((_b = s.address) == null ? void 0 : _b.toLowerCase().includes(q)) || ((_c = s.installerAlias) == null ? void 0 : _c.toLowerCase().includes(q));
        }
      ).slice(0, 60);
    });
    const selectedCharger = computed(() => chargers.value.find((c) => c.id === selectedId.value) || null);
    async function authHeaders() {
      const supabase = useSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!(session == null ? void 0 : session.access_token)) throw new Error("Niet ingelogd");
      return { Authorization: `Bearer ${session.access_token}` };
    }
    async function loadDevices() {
      var _a;
      loading.value = true;
      loadError.value = "";
      try {
        sites.value = await $fetch("/api/integrations/easee/sites", {
          headers: await authHeaders()
        }) || [];
      } catch (e) {
        loadError.value = ((_a = e == null ? void 0 : e.data) == null ? void 0 : _a.message) || (e == null ? void 0 : e.message) || "Kan de installaties niet laden";
      } finally {
        loading.value = false;
      }
    }
    watch(() => props.modelValue, (open) => {
      if (open) {
        selectedId.value = null;
        selectedSite.value = null;
        chargers.value = [];
        search.value = "";
        linkError.value = "";
        done.value = false;
        loadDevices();
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_AppIcon = _sfc_main$5$1;
      ssrRenderTeleport(_push, (_push2) => {
        if (unref(isOpen)) {
          _push2(`<div class="fixed inset-0 z-50 flex items-center justify-center p-4" data-v-cd58850a><div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-v-cd58850a></div><div class="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col" style="${ssrRenderStyle({ "max-height": "85vh" })}" data-v-cd58850a><div class="border-b border-gray-100 px-6 py-4 flex items-center justify-between shrink-0" data-v-cd58850a><div class="flex items-center gap-3" data-v-cd58850a><div class="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600" data-v-cd58850a>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "ev-charger",
            size: 20
          }, null, _parent));
          _push2(`</div><div data-v-cd58850a><h3 class="text-base font-semibold text-gray-900" data-v-cd58850a>Laadpaal koppelen via Easee</h3><p class="text-xs text-gray-500" data-v-cd58850a>Kies de juiste laadpaal voor ${ssrInterpolate(__props.customerName || "deze klant")}.</p></div></div><button class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" data-v-cd58850a>`);
          _push2(ssrRenderComponent(_component_AppIcon, {
            name: "x",
            size: 18
          }, null, _parent));
          _push2(`</button></div>`);
          if (unref(done)) {
            _push2(`<div class="px-6 py-10 text-center" data-v-cd58850a><div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600" data-v-cd58850a>`);
            _push2(ssrRenderComponent(_component_AppIcon, {
              name: "check-circle",
              size: 28
            }, null, _parent));
            _push2(`</div><h4 class="text-base font-semibold text-gray-900 mb-1" data-v-cd58850a>Gekoppeld</h4><p class="text-sm text-gray-500" data-v-cd58850a> De laadpaal is gekoppeld. ${ssrInterpolate(__props.customerName || "De klant")} ziet vanaf nu laadsessies en verbruik in het portaal. </p><button class="btn-primary mt-6" data-v-cd58850a>Sluiten</button></div>`);
          } else {
            _push2(`<!--[--><div class="flex-1 overflow-y-auto px-6 py-4" data-v-cd58850a>`);
            if (unref(loading)) {
              _push2(`<div class="py-12 text-center" data-v-cd58850a><div class="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-cd58850a></div><p class="mt-3 text-sm text-gray-500" data-v-cd58850a>Installaties ophalen bij Easee...</p></div>`);
            } else if (unref(loadError)) {
              _push2(`<div class="rounded-xl border border-red-200 bg-red-50 p-4" data-v-cd58850a><div class="flex items-start gap-2" data-v-cd58850a>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "warning",
                size: 16,
                class: "mt-0.5 shrink-0 text-red-600"
              }, null, _parent));
              _push2(`<div class="min-w-0" data-v-cd58850a><p class="text-sm font-medium text-red-900" data-v-cd58850a>Kan de installaties niet ophalen</p><p class="mt-1 text-sm text-red-800/90" data-v-cd58850a>${ssrInterpolate(unref(loadError))}</p><button class="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900" data-v-cd58850a> Opnieuw proberen </button></div></div></div>`);
            } else if (!unref(sites).length) {
              _push2(`<div class="rounded-xl border-2 border-dashed border-gray-200 py-10 text-center" data-v-cd58850a>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "ev-charger",
                size: 32,
                class: "mx-auto mb-3 text-gray-300"
              }, null, _parent));
              _push2(`<p class="text-sm text-gray-600" data-v-cd58850a>Geen installaties gevonden op je Easee-account.</p><p class="mx-auto mt-2 max-w-sm text-xs text-gray-500" data-v-cd58850a> Wij tonen de installaties waar jouw Easee-account toegang op heeft. Zie je hier niets terwijl je in de Easee-app wel klanten hebt? Dan hangen die aan een ander account. </p></div>`);
            } else if (unref(selectedSite)) {
              _push2(`<!--[--><button type="button" class="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800" data-v-cd58850a>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 14,
                class: "rotate-180"
              }, null, _parent));
              _push2(` Andere installatie kiezen </button><div class="mb-3 rounded-xl bg-sky-50 px-3 py-2" data-v-cd58850a><p class="text-sm font-medium text-sky-900" data-v-cd58850a>${ssrInterpolate(unref(selectedSite).name)}</p>`);
              if (unref(selectedSite).address) {
                _push2(`<p class="text-xs text-sky-700/80" data-v-cd58850a>${ssrInterpolate(unref(selectedSite).address)}</p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
              if (unref(loadingChargers)) {
                _push2(`<div class="py-8 text-center" data-v-cd58850a><div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-cd58850a></div><p class="mt-2 text-sm text-gray-500" data-v-cd58850a>Laadpalen ophalen...</p></div>`);
              } else if (!unref(chargers).length) {
                _push2(`<div class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-v-cd58850a> Op deze installatie staat geen laadpaal geregistreerd bij Easee. </div>`);
              } else {
                _push2(`<div class="space-y-2" data-v-cd58850a><!--[-->`);
                ssrRenderList(unref(chargers), (c) => {
                  _push2(`<button type="button" class="${ssrRenderClass([unref(selectedId) === c.id ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50", "flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors"])}" data-v-cd58850a><span class="${ssrRenderClass([unref(selectedId) === c.id ? "border-sky-500 bg-sky-500" : "border-gray-300", "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"])}" data-v-cd58850a>`);
                  if (unref(selectedId) === c.id) {
                    _push2(ssrRenderComponent(_component_AppIcon, {
                      name: "check",
                      size: 12,
                      class: "text-white"
                    }, null, _parent));
                  } else {
                    _push2(`<!---->`);
                  }
                  _push2(`</span><div class="min-w-0 flex-1" data-v-cd58850a><p class="text-sm font-medium text-gray-900" data-v-cd58850a>${ssrInterpolate(c.name)}</p><p class="mt-0.5 font-mono text-xs text-gray-500" data-v-cd58850a>${ssrInterpolate(c.id)}</p></div></button>`);
                });
                _push2(`<!--]--></div>`);
              }
              _push2(`<!--]-->`);
            } else {
              _push2(`<!--[--><div class="relative mb-3" data-v-cd58850a>`);
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "search",
                size: 15,
                class: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              }, null, _parent));
              _push2(`<input${ssrRenderAttr("value", unref(search))} type="search" class="input pl-9 text-sm" placeholder="Zoek op naam of adres van de klant..." data-v-cd58850a></div><p class="mb-2 text-xs text-gray-500" data-v-cd58850a>${ssrInterpolate(unref(sites).length)} installaties op je Easee-account`);
              if (unref(search)) {
                _push2(`<span data-v-cd58850a> \xB7 ${ssrInterpolate(unref(filteredSites).length)} gevonden</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</p><div class="space-y-1.5" data-v-cd58850a><!--[-->`);
              ssrRenderList(unref(filteredSites), (s) => {
                _push2(`<button type="button" class="flex w-full items-center gap-3 rounded-xl border border-gray-200 p-3 text-left transition-colors hover:border-gray-300 hover:bg-gray-50" data-v-cd58850a><div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600" data-v-cd58850a>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "ev-charger",
                  size: 16
                }, null, _parent));
                _push2(`</div><div class="min-w-0 flex-1" data-v-cd58850a><p class="truncate text-sm font-medium text-gray-900" data-v-cd58850a>${ssrInterpolate(s.name)}</p>`);
                if (s.address) {
                  _push2(`<p class="truncate text-xs text-gray-500" data-v-cd58850a>${ssrInterpolate(s.address)}</p>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</div>`);
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "chevron-right",
                  size: 15,
                  class: "shrink-0 text-gray-300"
                }, null, _parent));
                _push2(`</button>`);
              });
              _push2(`<!--]--></div>`);
              if (!unref(search) && unref(sites).length > 60) {
                _push2(`<p class="mt-3 text-center text-xs text-gray-400" data-v-cd58850a> Eerste 60 getoond \u2014 zoek om de rest te vinden. </p>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`<!--]-->`);
            }
            _push2(`</div><div class="shrink-0 border-t border-gray-100 px-6 py-4" data-v-cd58850a>`);
            if (unref(linkError)) {
              _push2(`<p class="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" data-v-cd58850a>${ssrInterpolate(unref(linkError))}</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`<div class="flex items-center justify-between gap-3" data-v-cd58850a><button class="btn-secondary"${ssrIncludeBooleanAttr(unref(linking)) ? " disabled" : ""} data-v-cd58850a>Annuleren</button><button class="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"${ssrIncludeBooleanAttr(!unref(selectedCharger) || unref(linking)) ? " disabled" : ""} data-v-cd58850a>`);
            if (unref(linking)) {
              _push2(`<span class="mr-1.5 inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent align-middle" data-v-cd58850a></span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(` ${ssrInterpolate(unref(linking) ? "Koppelen..." : "Koppel deze laadpaal")}</button></div></div><!--]-->`);
          }
          _push2(`</div></div>`);
        } else {
          _push2(`<!---->`);
        }
      }, "body", false, _parent);
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/onboard/EaseeWizard.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_6 = /* @__PURE__ */ _export_sfc(_sfc_main$1, [["__scopeId", "data-v-cd58850a"]]);
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[id]",
  __ssrInlineRender: true,
  setup(__props) {
    const route = useRoute();
    const customerId = route.params.id;
    const { partner } = usePartner();
    const { customers, updateCustomer } = useCustomers({ autoLoad: false });
    const customer = ref(customers.value.find((c) => c.id === customerId));
    const customersLoading = ref(!customer.value);
    const activeTab = ref("producten");
    const mailEvents = ref([]);
    const mailLoading = ref(false);
    async function loadMailLog() {
      mailLoading.value = true;
      try {
        const supabase = useSupabaseClient();
        const { data: { session } } = await supabase.auth.getSession();
        if (!(session == null ? void 0 : session.access_token)) return;
        const res = await $fetch(`/api/customers/${customerId}/mail-log`, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        mailEvents.value = res.events;
      } catch {
        mailEvents.value = [];
      } finally {
        mailLoading.value = false;
      }
    }
    watch(activeTab, (t) => {
      if (t === "mails" && !mailEvents.value.length) loadMailLog();
    });
    function fmtMailDate(iso) {
      try {
        return new Date(iso).toLocaleString("nl-NL", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch {
        return iso;
      }
    }
    const onboarding = computed(() => {
      var _a;
      return ((_a = customer.value) == null ? void 0 : _a.onboarding) || null;
    });
    const onboardingTimeline = computed(() => {
      var _a;
      const o = onboarding.value;
      const created = (_a = customer.value) == null ? void 0 : _a.created_at;
      return [
        {
          key: "invite",
          label: "Welkomstmail verstuurd",
          done: !!created,
          at: created || null
        },
        {
          key: "akkoord",
          label: "Akkoord gegeven",
          done: !!(o == null ? void 0 : o.accepted_at),
          at: (o == null ? void 0 : o.accepted_at) || null,
          pending: !(o == null ? void 0 : o.accepted_at)
        },
        {
          key: "incasso",
          // Drie staten: skipped → "Incasso later regelen" · done → "Incasso geregeld"
          // · anders (geen mandate_at én niet expliciet geskipt) → "Incasso instellen"
          // — voorheen stond hier "Incasso geregeld" + "Wacht op klant" wat lezers
          // verwart omdat het tegelijk wel en niet geregeld lijkt.
          label: (o == null ? void 0 : o.mandate_skipped) ? "Incasso later regelen" : (o == null ? void 0 : o.mandate_at) ? "Incasso geregeld" : "Incasso instellen",
          done: !!(o == null ? void 0 : o.mandate_at),
          pending: !(o == null ? void 0 : o.mandate_at) && !(o == null ? void 0 : o.mandate_skipped),
          skipped: !!(o == null ? void 0 : o.mandate_skipped),
          at: (o == null ? void 0 : o.mandate_at) || null
        }
      ];
    });
    function formatStatusDate(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleString("nl-NL", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit"
        });
      } catch {
        return "";
      }
    }
    const isEditingCustomer = ref(false);
    const customerSaving = ref(false);
    const customerForm = ref({ full_name: "", phone: "", street: "", house_number: "", postal_code: "", city: "" });
    const customerSaveError = ref("");
    const showSundataWizard = ref(false);
    const showWeheatWizard = ref(false);
    const showEaseeWizard = ref(false);
    const sundataProductData = ref({});
    function openSundataWizard() {
      var _a, _b, _c;
      try {
        const { products } = useCustomerDossier(customerId);
        const list = Array.isArray(products.value) ? products.value : [];
        const solars = list.filter((p) => (p == null ? void 0 : p.category) === "solar_panel");
        const solarProduct = solars[solars.length - 1];
        if (solarProduct == null ? void 0 : solarProduct.notes) {
          sundataProductData.value = {
            capacityWp: ((_a = solarProduct.notes.match(/(\d+)\s*Wp/)) == null ? void 0 : _a[1]) || "",
            orientation: ((_b = solarProduct.notes.match(/oriëntatie:\s*(\S+)/i)) == null ? void 0 : _b[1]) || "",
            tilt: ((_c = solarProduct.notes.match(/helling:\s*(\d+)/i)) == null ? void 0 : _c[1]) || ""
          };
        } else {
          sundataProductData.value = {};
        }
      } catch (e) {
        console.error("[sundata-open] pre-fill faalde:", e);
        sundataProductData.value = {};
      }
      showSundataWizard.value = true;
    }
    function openConnector(type) {
      if (type === "solar") openSundataWizard();
      else if (type === "weheat") showWeheatWizard.value = true;
      else if (type === "easee") showEaseeWizard.value = true;
    }
    async function handleWeheatCompleted(_r) {
      var _a, _b;
      await ((_b = (_a = productListRef.value) == null ? void 0 : _a.refresh) == null ? void 0 : _b.call(_a));
    }
    async function handleEaseeCompleted(_r) {
      var _a, _b;
      await ((_b = (_a = productListRef.value) == null ? void 0 : _a.refresh) == null ? void 0 : _b.call(_a));
    }
    const productListRef = ref(null);
    async function handleSundataCompleted(_result) {
      var _a, _b;
      await ((_b = (_a = productListRef.value) == null ? void 0 : _a.refresh) == null ? void 0 : _b.call(_a));
    }
    useConfirm();
    const { deleteCustomer } = useCustomers({ autoLoad: false });
    useRouter();
    const pricing = ref(null);
    const pricingLoading = ref(false);
    const isEditingPricing = ref(false);
    const pricingSaving = ref(false);
    const pricingError = ref("");
    const pricingForm = ref({
      billing_interval: "monthly",
      yearly_discount_months: 0,
      trial_months: 0,
      // module_type → { price (euro-string) | null, reason }
      overrides: {}
    });
    function euros(cents) {
      if (!cents) return "\u20AC 0,00";
      return "\u20AC " + (cents / 100).toFixed(2).replace(".", ",");
    }
    const overrideCandidates = computed(() => {
      if (!pricing.value) return [];
      const accepted = new Set(pricing.value.accepted_modules);
      return pricing.value.partner_defaults.filter((d) => accepted.has(d.module_type)).map((d) => ({ module_type: d.module_type, name: d.name, default_cents: d.price_monthly_cents }));
    });
    function fmtDateNl(iso) {
      if (!iso) return "";
      try {
        return new Date(iso).toLocaleDateString("nl-NL", { day: "numeric", month: "short", year: "numeric" });
      } catch {
        return "";
      }
    }
    const openingPortal = ref(false);
    const portalError = ref("");
    const deletingCustomer = ref(false);
    const actionError = ref("");
    const charging = ref(false);
    const chargeResult = ref(null);
    function loadNotes() {
      return {};
    }
    function saveNotes(notes) {
    }
    const allNotes = ref(loadNotes());
    const customerNotes = computed({
      get: () => allNotes.value[customerId] || "",
      set: (val) => {
        allNotes.value[customerId] = val;
        saveNotes(allNotes.value);
      }
    });
    const notesSaved = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d, _e;
      const _component_AppIcon = _sfc_main$5$1;
      const _component_NuxtLink = __nuxt_component_0;
      const _component_ProductList = _sfc_main$6;
      const _component_DocumentList = _sfc_main$4;
      const _component_SundataWizard = __nuxt_component_4;
      const _component_WeheatWizard = __nuxt_component_5;
      const _component_EaseeWizard = __nuxt_component_6;
      _push(`<div${ssrRenderAttrs(_attrs)} data-v-1e1b568d>`);
      if (unref(customersLoading)) {
        _push(`<div class="py-16 text-center" data-v-1e1b568d><div class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-1e1b568d></div></div>`);
      } else if (!unref(customer)) {
        _push(`<div class="section" data-v-1e1b568d><div class="card py-12 text-center" data-v-1e1b568d>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "x-circle",
          size: 40,
          class: "mx-auto text-gray-300 mb-4"
        }, null, _parent));
        _push(`<h2 class="text-lg font-semibold text-gray-900 mb-2" data-v-1e1b568d>Klant niet gevonden</h2>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/admin/customers",
          class: "text-sm text-gray-500 hover:text-gray-700 underline"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Terug naar klantenoverzicht `);
            } else {
              return [
                createTextVNode(" Terug naar klantenoverzicht ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!--[--><div class="section" data-v-1e1b568d><div class="mb-4" data-v-1e1b568d>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: "/admin/customers",
          class: "inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_AppIcon, {
                name: "chevron-right",
                size: 14,
                class: "rotate-180"
              }, null, _parent2, _scopeId));
              _push2(` Klanten `);
            } else {
              return [
                createVNode(_component_AppIcon, {
                  name: "chevron-right",
                  size: 14,
                  class: "rotate-180"
                }),
                createTextVNode(" Klanten ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div><div class="card" data-v-1e1b568d>`);
        if (!unref(isEditingCustomer)) {
          _push(`<div class="flex items-start gap-5" data-v-1e1b568d><div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style="${ssrRenderStyle({ backgroundColor: unref(partner).primary_color })}" data-v-1e1b568d>${ssrInterpolate(((_a = unref(customer).full_name) == null ? void 0 : _a.charAt(0)) || "?")}</div><div class="flex-1 min-w-0" data-v-1e1b568d><h1 class="text-xl font-bold text-gray-900" data-v-1e1b568d>${ssrInterpolate(unref(customer).full_name || unref(customer).email)}</h1><div class="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500" data-v-1e1b568d><span class="flex items-center gap-1.5" data-v-1e1b568d>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "mail",
            size: 14
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(customer).email)}</span>`);
          if (unref(customer).phone) {
            _push(`<span class="flex items-center gap-1.5" data-v-1e1b568d>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "phone",
              size: 14
            }, null, _parent));
            _push(` ${ssrInterpolate(unref(customer).phone)}</span>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(customer).street) {
            _push(`<span class="flex items-center gap-1.5" data-v-1e1b568d>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "map-pin",
              size: 14
            }, null, _parent));
            _push(` ${ssrInterpolate(unref(customer).street)} ${ssrInterpolate(unref(customer).house_number)}, ${ssrInterpolate(unref(customer).postal_code)} ${ssrInterpolate(unref(customer).city)}</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div><div class="mt-4 flex flex-wrap items-center gap-2" data-v-1e1b568d><button class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors" data-v-1e1b568d>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "settings",
            size: 14
          }, null, _parent));
          _push(` Bewerken </button><button class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"${ssrIncludeBooleanAttr(unref(openingPortal)) ? " disabled" : ""} title="Bekijk wat de klant ziet (opent in nieuw tabblad)" data-v-1e1b568d>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "external",
            size: 14
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(openingPortal) ? "Openen..." : "Klantportaal openen")}</button>`);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/admin/service?customer=${unref(customerId)}`,
            class: "inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(ssrRenderComponent(_component_AppIcon, {
                  name: "tool",
                  size: 14
                }, null, _parent2, _scopeId));
                _push2(` Ticket `);
              } else {
                return [
                  createVNode(_component_AppIcon, {
                    name: "tool",
                    size: 14
                  }),
                  createTextVNode(" Ticket ")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`<button class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"${ssrIncludeBooleanAttr(unref(charging) || !unref(customer).mollie_customer_id) ? " disabled" : ""}${ssrRenderAttr("title", !unref(customer).mollie_customer_id ? "Klant heeft nog geen incasso ingesteld" : "Stuur servicekosten naar deze klant")} data-v-1e1b568d>`);
          if (unref(charging)) {
            _push(`<svg class="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" data-v-1e1b568d><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" data-v-1e1b568d></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" data-v-1e1b568d></path></svg>`);
          } else {
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "credit-card",
              size: 14
            }, null, _parent));
          }
          _push(` ${ssrInterpolate(unref(charging) ? "Incasseren..." : "Stuur factuur")}</button><div class="ml-auto" data-v-1e1b568d><button class="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"${ssrIncludeBooleanAttr(unref(deletingCustomer)) ? " disabled" : ""} data-v-1e1b568d>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "trash",
            size: 14
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(deletingCustomer) ? "Verwijderen..." : "Verwijderen")}</button></div></div>`);
          if (unref(chargeResult)) {
            _push(`<div class="${ssrRenderClass([unref(chargeResult).type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800", "mt-3 rounded-xl border px-3 py-2.5 text-xs"])}" data-v-1e1b568d><div class="flex items-start gap-2" data-v-1e1b568d>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: unref(chargeResult).type === "success" ? "check-circle" : "alert-circle",
              size: 14,
              class: "mt-0.5 shrink-0"
            }, null, _parent));
            _push(`<div class="flex-1 min-w-0" data-v-1e1b568d><p class="font-medium" data-v-1e1b568d>${ssrInterpolate(unref(chargeResult).text)}</p>`);
            if (unref(chargeResult).type === "success") {
              _push(`<p class="mt-1 text-green-700/90" data-v-1e1b568d> De SEPA-incasso loopt nu via Mollie \u2014 definitieve status verschijnt zodra de bank reageert. </p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><button class="shrink-0 text-gray-400 hover:text-gray-600" title="Sluiten" data-v-1e1b568d>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "x",
              size: 14
            }, null, _parent));
            _push(`</button></div></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(portalError)) {
            _push(`<div class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800" role="alert" data-v-1e1b568d>${ssrInterpolate(unref(portalError))}</div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(actionError)) {
            _push(`<div class="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-800" role="alert" data-v-1e1b568d>${ssrInterpolate(unref(actionError))}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2" data-v-1e1b568d><!--[-->`);
          ssrRenderList(unref(onboardingTimeline), (step) => {
            _push(`<div class="${ssrRenderClass([{
              "border-green-200 bg-green-50": step.done,
              "border-amber-200 bg-amber-50": step.pending && !step.done,
              "border-gray-200 bg-gray-50": step.skipped && !step.done
            }, "flex items-start gap-2 rounded-lg border px-3 py-2"])}" data-v-1e1b568d>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: step.done ? "check-circle" : step.skipped ? "clock" : "circle",
              size: 14,
              class: ["mt-0.5 shrink-0", {
                "text-green-600": step.done,
                "text-amber-600": step.pending && !step.done,
                "text-gray-400": step.skipped && !step.done
              }]
            }, null, _parent));
            _push(`<div class="min-w-0" data-v-1e1b568d><p class="${ssrRenderClass([{
              "text-green-900": step.done,
              "text-amber-900": step.pending && !step.done,
              "text-gray-600": step.skipped && !step.done
            }, "text-xs font-medium"])}" data-v-1e1b568d>${ssrInterpolate(step.label)}</p>`);
            if (step.at) {
              _push(`<p class="text-[11px] text-gray-500 mt-0.5" data-v-1e1b568d>${ssrInterpolate(formatStatusDate(step.at))}</p>`);
            } else if (step.pending && !step.done) {
              _push(`<p class="text-[11px] text-amber-700 mt-0.5" data-v-1e1b568d>Wacht op klant</p>`);
            } else if (step.skipped && !step.done) {
              _push(`<p class="text-[11px] text-gray-500 mt-0.5" data-v-1e1b568d>Reminder volgt</p>`);
            } else {
              _push(`<!---->`);
            }
            if (step.key === "incasso" && step.done && unref(customer).mollie_mandate_id) {
              _push(`<p class="text-[11px] text-green-700/90 mt-0.5 truncate"${ssrRenderAttr("title", unref(customer).mollie_mandate_id)} data-v-1e1b568d> Mandaat actief </p>`);
            } else if (step.key === "incasso" && step.done && unref(customer).mollie_customer_id && !unref(customer).mollie_mandate_id) {
              _push(`<p class="text-[11px] text-amber-700 mt-0.5" data-v-1e1b568d> Mandaat in afwachting </p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></div>`);
          });
          _push(`<!--]--></div></div></div>`);
        } else {
          _push(`<!--[--><div class="flex items-center justify-between mb-4" data-v-1e1b568d><h2 class="text-base font-semibold text-gray-900" data-v-1e1b568d>Klantgegevens bewerken</h2><div class="flex gap-2" data-v-1e1b568d><button class="btn-primary text-sm"${ssrIncludeBooleanAttr(unref(customerSaving)) ? " disabled" : ""} data-v-1e1b568d>${ssrInterpolate(unref(customerSaving) ? "Opslaan..." : "Opslaan")}</button><button class="btn-secondary text-sm" data-v-1e1b568d>Annuleren</button></div></div>`);
          if (unref(customerSaveError)) {
            _push(`<div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert" data-v-1e1b568d>${ssrInterpolate(unref(customerSaveError))}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-v-1e1b568d><div data-v-1e1b568d><label class="label" data-v-1e1b568d>Naam</label><input${ssrRenderAttr("value", unref(customerForm).full_name)} type="text" class="input" data-v-1e1b568d></div><div data-v-1e1b568d><label class="label" data-v-1e1b568d>Telefoon</label><input${ssrRenderAttr("value", unref(customerForm).phone)} type="tel" class="input" data-v-1e1b568d></div><div data-v-1e1b568d><label class="label" data-v-1e1b568d>Straat + huisnummer</label><div class="flex gap-2" data-v-1e1b568d><input${ssrRenderAttr("value", unref(customerForm).street)} type="text" class="input flex-1" placeholder="Straat" data-v-1e1b568d><input${ssrRenderAttr("value", unref(customerForm).house_number)} type="text" class="input w-20" placeholder="Nr." data-v-1e1b568d></div></div><div data-v-1e1b568d><label class="label" data-v-1e1b568d>Postcode + woonplaats</label><div class="flex gap-2" data-v-1e1b568d><input${ssrRenderAttr("value", unref(customerForm).postal_code)} type="text" class="input w-28" placeholder="1234 AB" data-v-1e1b568d><input${ssrRenderAttr("value", unref(customerForm).city)} type="text" class="input flex-1" placeholder="Woonplaats" data-v-1e1b568d></div></div></div><!--]-->`);
        }
        _push(`</div></div><div class="section" data-v-1e1b568d><div class="card" data-v-1e1b568d>`);
        if (!unref(isEditingPricing)) {
          _push(`<!--[--><div class="flex items-start justify-between gap-4 mb-4" data-v-1e1b568d><div data-v-1e1b568d><h2 class="text-base font-semibold text-gray-900" data-v-1e1b568d>Tarief</h2><p class="text-xs text-gray-500 mt-0.5" data-v-1e1b568d>Termijn, kortingen en eventuele afwijkende modulen-prijzen.</p></div>`);
          if (unref(pricing)) {
            _push(`<button class="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50" data-v-1e1b568d>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "settings",
              size: 14
            }, null, _parent));
            _push(` Aanpassen </button>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (unref(pricingLoading)) {
            _push(`<div class="py-6 text-center" data-v-1e1b568d><div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-1e1b568d></div></div>`);
          } else if (!unref(pricing)) {
            _push(`<div class="text-sm text-gray-400" data-v-1e1b568d>Geen tariefinformatie beschikbaar.</div>`);
          } else {
            _push(`<!--[--><div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4" data-v-1e1b568d><div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3" data-v-1e1b568d><p class="text-[11px] text-gray-500 uppercase tracking-wider" data-v-1e1b568d>Termijn</p><p class="text-sm font-semibold text-gray-900 mt-0.5" data-v-1e1b568d>${ssrInterpolate(unref(pricing).billing_interval === "yearly" ? "Per jaar" : "Per maand")}</p>`);
            if (unref(pricing).billing_interval === "yearly" && unref(pricing).yearly_discount_months > 0) {
              _push(`<p class="text-[11px] text-gray-500 mt-0.5" data-v-1e1b568d>${ssrInterpolate(unref(pricing).yearly_discount_months === 1 ? "1 maand" : `${unref(pricing).yearly_discount_months} maanden`)} korting </p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3" data-v-1e1b568d><p class="text-[11px] text-gray-500 uppercase tracking-wider" data-v-1e1b568d>${ssrInterpolate(unref(pricing).billing_interval === "yearly" ? "Jaarbedrag" : "Maandbedrag")}</p><p class="text-sm font-semibold text-gray-900 mt-0.5 tabular-nums" data-v-1e1b568d>${ssrInterpolate(euros(unref(pricing).billing_interval === "yearly" ? unref(pricing).yearly_total_cents : unref(pricing).monthly_total_cents))}</p>`);
            if (unref(pricing).billing_interval === "yearly") {
              _push(`<p class="text-[11px] text-gray-500 mt-0.5 tabular-nums" data-v-1e1b568d>${ssrInterpolate(euros(unref(pricing).monthly_total_cents))} per maand </p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div><div class="${ssrRenderClass([((_b = unref(pricing).trial) == null ? void 0 : _b.active) ? "border-emerald-200 bg-emerald-50/70" : "border-gray-100 bg-gray-50", "rounded-xl border px-4 py-3"])}" data-v-1e1b568d><p class="${ssrRenderClass([((_c = unref(pricing).trial) == null ? void 0 : _c.active) ? "text-emerald-700" : "text-gray-500", "text-[11px] uppercase tracking-wider"])}" data-v-1e1b568d> Proefperiode </p>`);
            if ((_d = unref(pricing).trial) == null ? void 0 : _d.active) {
              _push(`<!--[--><p class="text-sm font-semibold text-emerald-900 mt-0.5" data-v-1e1b568d>Loopt tot ${ssrInterpolate(fmtDateNl(unref(pricing).trial.ends_at))}</p><p class="text-[11px] text-emerald-800/80 mt-0.5" data-v-1e1b568d>${ssrInterpolate(unref(pricing).trial_months)} maanden gratis</p><!--]-->`);
            } else if (unref(pricing).trial_months > 0 && !((_e = unref(pricing).trial) == null ? void 0 : _e.started_at)) {
              _push(`<!--[--><p class="text-sm font-semibold text-gray-700 mt-0.5" data-v-1e1b568d>${ssrInterpolate(unref(pricing).trial_months)} maanden ingesteld</p><p class="text-[11px] text-gray-500 mt-0.5" data-v-1e1b568d>Start zodra incasso actief is.</p><!--]-->`);
            } else if (unref(pricing).trial_months > 0) {
              _push(`<!--[--><p class="text-sm font-semibold text-gray-700 mt-0.5" data-v-1e1b568d>Voorbij</p><p class="text-[11px] text-gray-500 mt-0.5" data-v-1e1b568d>Klant betaalt nu het volle bedrag.</p><!--]-->`);
            } else {
              _push(`<p class="text-sm text-gray-500 mt-0.5" data-v-1e1b568d>Geen</p>`);
            }
            _push(`</div></div>`);
            if (unref(pricing).lines.length) {
              _push(`<div class="rounded-xl border border-gray-100 overflow-hidden" data-v-1e1b568d><table class="w-full text-sm" data-v-1e1b568d><thead class="bg-gray-50" data-v-1e1b568d><tr class="text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider" data-v-1e1b568d><th class="px-4 py-2" data-v-1e1b568d>Module</th><th class="px-4 py-2 text-right" data-v-1e1b568d>Tarief / mnd</th><th class="px-4 py-2" data-v-1e1b568d>Standaardprijs</th><th class="px-4 py-2" data-v-1e1b568d>Reden override</th></tr></thead><tbody class="divide-y divide-gray-100" data-v-1e1b568d><!--[-->`);
              ssrRenderList(unref(pricing).lines, (line) => {
                _push(`<tr data-v-1e1b568d><td class="px-4 py-2.5 text-gray-900" data-v-1e1b568d>${ssrInterpolate(line.name)}</td><td class="px-4 py-2.5 text-right font-semibold text-gray-900 tabular-nums" data-v-1e1b568d>${ssrInterpolate(euros(line.price_monthly_cents))}</td><td class="px-4 py-2.5 text-gray-500 tabular-nums" data-v-1e1b568d>`);
                if (line.default_price_monthly_cents !== null) {
                  _push(`<!--[-->${ssrInterpolate(euros(line.default_price_monthly_cents))} <span class="text-[10px] text-blue-700 ml-1" data-v-1e1b568d>override</span><!--]-->`);
                } else {
                  _push(`<!--[-->standaard<!--]-->`);
                }
                _push(`</td><td class="px-4 py-2.5 text-xs text-gray-500" data-v-1e1b568d>${ssrInterpolate(line.override_reason || "\u2014")}</td></tr>`);
              });
              _push(`<!--]--></tbody></table></div>`);
            } else {
              _push(`<div class="text-sm text-gray-500" data-v-1e1b568d>Klant heeft nog geen modules geaccepteerd.</div>`);
            }
            _push(`<!--]-->`);
          }
          _push(`<!--]-->`);
        } else {
          _push(`<!--[--><div class="flex items-center justify-between mb-4" data-v-1e1b568d><h2 class="text-base font-semibold text-gray-900" data-v-1e1b568d>Tarief aanpassen</h2><div class="flex gap-2" data-v-1e1b568d><button class="btn-primary text-sm"${ssrIncludeBooleanAttr(unref(pricingSaving)) ? " disabled" : ""} data-v-1e1b568d>${ssrInterpolate(unref(pricingSaving) ? "Opslaan..." : "Opslaan")}</button><button class="btn-secondary text-sm"${ssrIncludeBooleanAttr(unref(pricingSaving)) ? " disabled" : ""} data-v-1e1b568d>Annuleren</button></div></div>`);
          if (unref(pricingError)) {
            _push(`<div class="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert" data-v-1e1b568d>${ssrInterpolate(unref(pricingError))}</div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<div class="space-y-5" data-v-1e1b568d><div data-v-1e1b568d><label class="label" data-v-1e1b568d>Termijn</label><div class="mt-1 grid grid-cols-2 gap-2 max-w-md" data-v-1e1b568d><button type="button" class="${ssrRenderClass([unref(pricingForm).billing_interval === "monthly" ? "border-gray-900 bg-gray-50 text-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50", "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors"])}" data-v-1e1b568d>Per maand</button><button type="button" class="${ssrRenderClass([unref(pricingForm).billing_interval === "yearly" ? "border-gray-900 bg-gray-50 text-gray-900" : "border-gray-200 text-gray-600 hover:bg-gray-50", "rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors"])}" data-v-1e1b568d>Per jaar</button></div></div><div data-v-1e1b568d><label class="label" data-v-1e1b568d>Korting bij jaarbetaling (maanden gratis)</label><input${ssrRenderAttr("value", unref(pricingForm).yearly_discount_months)} type="number" min="0" max="12" step="0.5" class="input max-w-[8rem]" data-v-1e1b568d><p class="mt-1 text-[11px] text-gray-500" data-v-1e1b568d>Bv. 1 = bij jaarbetaling betaalt klant 11 maanden i.p.v. 12.</p></div><div data-v-1e1b568d><label class="label" data-v-1e1b568d>Proefperiode (maanden gratis na incasso-activatie)</label><input${ssrRenderAttr("value", unref(pricingForm).trial_months)} type="number" min="0" max="60" step="1" class="input max-w-[8rem]" data-v-1e1b568d><p class="mt-1 text-[11px] text-gray-500" data-v-1e1b568d>Telt vanaf het moment dat de klant z&#39;n IBAN heeft afgegeven.</p></div><div data-v-1e1b568d><label class="label" data-v-1e1b568d>Afwijkend tarief per module</label><p class="mt-1 mb-2 text-[11px] text-gray-500" data-v-1e1b568d>Laat het veld leeg om de standaardprijs aan te houden.</p>`);
          if (unref(overrideCandidates).length === 0) {
            _push(`<div class="text-xs text-gray-400" data-v-1e1b568d> Klant heeft nog geen modules geaccepteerd, of er staan geen partner-tarieven. </div>`);
          } else {
            _push(`<div class="space-y-2" data-v-1e1b568d><!--[-->`);
            ssrRenderList(unref(overrideCandidates), (cand) => {
              var _a2, _b2;
              _push(`<div class="grid grid-cols-[1fr_auto_2fr_auto] gap-2 items-center" data-v-1e1b568d><div data-v-1e1b568d><p class="text-sm text-gray-900" data-v-1e1b568d>${ssrInterpolate(cand.name)}</p><p class="text-[11px] text-gray-400" data-v-1e1b568d>Standaard ${ssrInterpolate(euros(cand.default_cents))}/mnd</p></div><div class="relative" data-v-1e1b568d><span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" data-v-1e1b568d>\u20AC</span><input${ssrRenderAttr("value", ((_a2 = unref(pricingForm).overrides[cand.module_type]) == null ? void 0 : _a2.price_eur) || "")} type="text" class="input pl-6 w-24 text-sm tabular-nums" placeholder="\u2014" data-v-1e1b568d></div><input${ssrRenderAttr("value", ((_b2 = unref(pricingForm).overrides[cand.module_type]) == null ? void 0 : _b2.reason) || "")} type="text" class="input text-sm" placeholder="Reden (intern, optioneel)" maxlength="200" data-v-1e1b568d>`);
              if (unref(pricingForm).overrides[cand.module_type]) {
                _push(`<button type="button" class="rounded-lg p-2 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors" title="Override verwijderen" data-v-1e1b568d>`);
                _push(ssrRenderComponent(_component_AppIcon, {
                  name: "x",
                  size: 14
                }, null, _parent));
                _push(`</button>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</div>`);
            });
            _push(`<!--]--></div>`);
          }
          _push(`</div></div><!--]-->`);
        }
        _push(`</div></div><div class="section" data-v-1e1b568d><div class="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6" data-v-1e1b568d><button class="${ssrRenderClass([unref(activeTab) === "producten" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"])}" data-v-1e1b568d>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "package",
          size: 16
        }, null, _parent));
        _push(` Producten </button><button class="${ssrRenderClass([unref(activeTab) === "documenten" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"])}" data-v-1e1b568d>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "folder",
          size: 16
        }, null, _parent));
        _push(` Documenten </button><button class="${ssrRenderClass([unref(activeTab) === "mails" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"])}" data-v-1e1b568d>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "mail",
          size: 16
        }, null, _parent));
        _push(` E-mails </button><button class="${ssrRenderClass([unref(activeTab) === "notities" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700", "flex-1 flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"])}" data-v-1e1b568d>`);
        _push(ssrRenderComponent(_component_AppIcon, {
          name: "file-text",
          size: 16
        }, null, _parent));
        _push(` Notities </button></div><div class="card" data-v-1e1b568d>`);
        if (unref(activeTab) === "producten") {
          _push(ssrRenderComponent(_component_ProductList, {
            ref_key: "productListRef",
            ref: productListRef,
            "customer-id": unref(customerId),
            "partner-id": unref(customer).partner_id,
            "customer-name": unref(customer).full_name || unref(customer).email,
            onOpenConnector: openConnector
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(activeTab) === "documenten") {
          _push(ssrRenderComponent(_component_DocumentList, {
            "customer-id": unref(customerId),
            "partner-id": unref(customer).partner_id
          }, null, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(activeTab) === "mails") {
          _push(`<div data-v-1e1b568d><div class="flex items-center justify-between mb-3" data-v-1e1b568d><h3 class="text-sm font-semibold text-gray-900" data-v-1e1b568d> E-mailhistorie `);
          if (unref(mailEvents).length) {
            _push(`<span class="ml-1 text-gray-400 font-normal" data-v-1e1b568d>(${ssrInterpolate(unref(mailEvents).length)})</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</h3><button class="text-xs text-gray-500 hover:text-gray-800"${ssrIncludeBooleanAttr(unref(mailLoading)) ? " disabled" : ""} data-v-1e1b568d>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "refresh",
            size: 12,
            class: "inline-block mr-1"
          }, null, _parent));
          _push(` ${ssrInterpolate(unref(mailLoading) ? "Laden..." : "Verversen")}</button></div>`);
          if (unref(mailLoading) && !unref(mailEvents).length) {
            _push(`<div class="py-8 text-center" data-v-1e1b568d><div class="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" data-v-1e1b568d></div></div>`);
          } else if (!unref(mailEvents).length) {
            _push(`<div class="rounded-xl border border-gray-100 bg-gray-50 py-8 text-center" data-v-1e1b568d>`);
            _push(ssrRenderComponent(_component_AppIcon, {
              name: "mail",
              size: 24,
              class: "mx-auto text-gray-300 mb-2"
            }, null, _parent));
            _push(`<p class="text-sm text-gray-500" data-v-1e1b568d>Er zijn nog geen e-mails naar deze klant verstuurd.</p></div>`);
          } else {
            _push(`<div class="divide-y divide-gray-100 rounded-xl border border-gray-100" data-v-1e1b568d><!--[-->`);
            ssrRenderList(unref(mailEvents), (ev) => {
              _push(`<div class="flex items-start gap-3 px-4 py-3" data-v-1e1b568d><div class="${ssrRenderClass([ev.success ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600", "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"])}" data-v-1e1b568d>`);
              _push(ssrRenderComponent(_component_AppIcon, {
                name: ev.success ? "check" : "x",
                size: 14
              }, null, _parent));
              _push(`</div><div class="min-w-0 flex-1" data-v-1e1b568d><div class="flex items-baseline justify-between gap-2" data-v-1e1b568d><p class="text-sm font-medium text-gray-900" data-v-1e1b568d>${ssrInterpolate(ev.label)}</p><span class="shrink-0 text-[11px] text-gray-400 whitespace-nowrap" data-v-1e1b568d>${ssrInterpolate(fmtMailDate(ev.at))}</span></div>`);
              if (ev.subject) {
                _push(`<p class="mt-0.5 text-xs text-gray-500 truncate" data-v-1e1b568d>&quot;${ssrInterpolate(ev.subject)}&quot;</p>`);
              } else {
                _push(`<!---->`);
              }
              _push(`<p class="mt-0.5 text-[11px] text-gray-400" data-v-1e1b568d>`);
              if (ev.to) {
                _push(`<span data-v-1e1b568d>Naar ${ssrInterpolate(ev.to)}</span>`);
              } else {
                _push(`<!---->`);
              }
              if (!ev.success) {
                _push(`<span class="ml-1 text-red-600 font-medium" data-v-1e1b568d>\xB7 mislukt</span>`);
              } else {
                _push(`<!---->`);
              }
              _push(`</p></div></div>`);
            });
            _push(`<!--]--></div>`);
          }
          _push(`<p class="mt-3 text-[11px] text-gray-400" data-v-1e1b568d> Toont wat w\xEDj hebben verstuurd. Voor aflevering, opening en bounces is een Resend-webhook nodig (op de roadmap). </p></div>`);
        } else {
          _push(`<!---->`);
        }
        if (unref(activeTab) === "notities") {
          _push(`<div data-v-1e1b568d><div class="flex items-center justify-between mb-3" data-v-1e1b568d><h3 class="text-sm font-semibold text-gray-900" data-v-1e1b568d>Interne notities</h3><div class="flex items-center gap-2" data-v-1e1b568d>`);
          if (unref(notesSaved)) {
            _push(`<span class="text-xs text-green-600 font-medium" data-v-1e1b568d>Opgeslagen!</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`<button class="flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 transition-colors" data-v-1e1b568d>`);
          _push(ssrRenderComponent(_component_AppIcon, {
            name: "check",
            size: 14
          }, null, _parent));
          _push(` Opslaan </button></div></div><textarea class="input font-mono text-sm" rows="10" placeholder="Persoonlijke aantekeningen, zichtbaar in deze browser." data-v-1e1b568d>${ssrInterpolate(unref(customerNotes))}</textarea><p class="mt-2 text-xs text-gray-400" data-v-1e1b568d> Tijdelijke aantekening, alleen opgeslagen op dit apparaat. Synchronisatie met je team volgt later. </p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
        _push(ssrRenderComponent(_component_SundataWizard, {
          modelValue: unref(showSundataWizard),
          "onUpdate:modelValue": ($event) => isRef(showSundataWizard) ? showSundataWizard.value = $event : null,
          "customer-id": unref(customerId),
          "customer-name": unref(customer).full_name || unref(customer).email,
          "product-data": unref(sundataProductData),
          onCompleted: handleSundataCompleted
        }, null, _parent));
        _push(ssrRenderComponent(_component_WeheatWizard, {
          modelValue: unref(showWeheatWizard),
          "onUpdate:modelValue": ($event) => isRef(showWeheatWizard) ? showWeheatWizard.value = $event : null,
          "customer-id": unref(customerId),
          "customer-name": unref(customer).full_name || unref(customer).email,
          onCompleted: handleWeheatCompleted
        }, null, _parent));
        _push(ssrRenderComponent(_component_EaseeWizard, {
          modelValue: unref(showEaseeWizard),
          "onUpdate:modelValue": ($event) => isRef(showEaseeWizard) ? showEaseeWizard.value = $event : null,
          "customer-id": unref(customerId),
          "customer-name": unref(customer).full_name || unref(customer).email,
          onCompleted: handleEaseeCompleted
        }, null, _parent));
        _push(`<!--]-->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/admin/customers/[id].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _id_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-1e1b568d"]]);

export { _id_ as default };
//# sourceMappingURL=_id_-Dx7IM7fr.mjs.map
