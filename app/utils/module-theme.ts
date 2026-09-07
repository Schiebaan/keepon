// Centrale module-styling — de enige bron voor kleur en icoon per moduletype.
//
// ────────────────────────────────────────────────────────────────────────────
// KLEURREGEL: groen en rood zijn GERESERVEERD voor status, nooit voor
// identiteit.
//
//   groen  = gekoppeld / actief / betaald
//   rood   = probleem, actie nodig
//   amber  = wacht op actie
//   grijs  = nog niet van toepassing
//
// Een moduletype mag dus nooit groen of rood zijn, want dan leest een
// warmtepomp als "kapot" en een laadpaal als "in orde" — ongeacht de
// werkelijke status. Dat gebeurde eerder: heat_pump was rose/rood en
// ev_charger was groen in ProductList.
//
// Voor identiteit gebruiken we: amber (zon), oranje (warmte), sky (elektrisch),
// violet (opslag), slate (techniek), grijs (overig).
// ────────────────────────────────────────────────────────────────────────────

export const moduleTheme = {
  solar: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'solar',
    accent: '#f59e0b',
    label: 'Zonnepanelen',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
  },
  heat_pump: {
    // Was rose (#e11d48) — te dicht bij de rode statuskleur, waardoor elke
    // warmtepomp eruitzag alsof er iets mis was. Nu oranje: nog steeds
    // "warmte", maar niet te verwarren met een foutmelding.
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'heat-pump',
    accent: '#ea580c',
    label: 'Warmtepomp',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-500',
  },
  ev_charger: {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    icon: 'ev-charger',
    accent: '#0284c7',
    label: 'Laadpaal',
    gradientFrom: 'from-sky-500',
    gradientTo: 'to-blue-500',
  },
  battery: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    icon: 'battery',
    accent: '#7c3aed',
    label: 'Thuisbatterij',
    gradientFrom: 'from-violet-500',
    gradientTo: 'to-purple-500',
  },
  inverter: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: 'zap',
    accent: '#64748b',
    label: 'Omvormer',
    gradientFrom: 'from-slate-500',
    gradientTo: 'to-gray-500',
  },
  other: {
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    icon: 'package',
    accent: '#6b7280',
    label: 'Overig',
    gradientFrom: 'from-gray-400',
    gradientTo: 'to-gray-500',
  },
} as const

export type ModuleThemeType = keyof typeof moduleTheme

/**
 * Vertaalt de product-categorieën uit de database (`customer_products.category`)
 * naar de module-sleutels hierboven. De DB gebruikt `solar_panel`, de rest van
 * de app `solar` — deze map houdt dat verschil op één plek.
 */
const CATEGORY_ALIASES: Record<string, ModuleThemeType> = {
  solar_panel: 'solar',
  solar: 'solar',
  heat_pump: 'heat_pump',
  ev_charger: 'ev_charger',
  battery: 'battery',
  inverter: 'inverter',
  other: 'other',
}

export function getModuleTheme(type: string) {
  const key = CATEGORY_ALIASES[type] ?? (type as ModuleThemeType)
  return moduleTheme[key] ?? moduleTheme.other
}
