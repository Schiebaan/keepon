// Kleur-tokens voor ticketlabels → Tailwind-klassen. Eén bron zodat chips
// overal (ticketdetail, lijst, settings) identiek renderen.

export interface TicketLabel {
  id: string
  name: string
  color: string
  sort_order?: number
  is_active?: boolean
}

export const LABEL_COLORS = [
  'gray', 'blue', 'green', 'amber', 'orange', 'red', 'purple', 'sky', 'pink', 'teal',
] as const

export type LabelColor = typeof LABEL_COLORS[number]

interface ChipStyle { bg: string; text: string; dot: string; ring: string }

const STYLES: Record<string, ChipStyle> = {
  gray:   { bg: 'bg-gray-100',   text: 'text-gray-700',   dot: 'bg-gray-400',   ring: 'ring-gray-300' },
  blue:   { bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-500',   ring: 'ring-blue-300' },
  green:  { bg: 'bg-green-50',   text: 'text-green-700',  dot: 'bg-green-500',  ring: 'ring-green-300' },
  amber:  { bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-500',  ring: 'ring-amber-300' },
  orange: { bg: 'bg-orange-50',  text: 'text-orange-700', dot: 'bg-orange-500', ring: 'ring-orange-300' },
  red:    { bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-500',    ring: 'ring-red-300' },
  purple: { bg: 'bg-purple-50',  text: 'text-purple-700', dot: 'bg-purple-500', ring: 'ring-purple-300' },
  sky:    { bg: 'bg-sky-50',     text: 'text-sky-700',    dot: 'bg-sky-500',    ring: 'ring-sky-300' },
  pink:   { bg: 'bg-pink-50',    text: 'text-pink-700',   dot: 'bg-pink-500',   ring: 'ring-pink-300' },
  teal:   { bg: 'bg-teal-50',    text: 'text-teal-700',   dot: 'bg-teal-500',   ring: 'ring-teal-300' },
}

export function labelChip(color: string | undefined): ChipStyle {
  return STYLES[color || 'gray'] || STYLES.gray
}
