// Centralized module type styling — used across the entire application
// Ensures consistent colors and icons for each module type

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
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    icon: 'heat-pump',
    accent: '#e11d48',
    label: 'Warmtepomp',
    gradientFrom: 'from-rose-500',
    gradientTo: 'to-pink-500',
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
} as const

export type ModuleThemeType = keyof typeof moduleTheme

export function getModuleTheme(type: string) {
  return moduleTheme[type as ModuleThemeType] ?? moduleTheme.solar
}
