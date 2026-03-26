export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatEnergy(wh: number): string {
  if (wh >= 1_000_000) return `${(wh / 1_000_000).toFixed(1)} MWh`
  if (wh >= 1_000) return `${(wh / 1_000).toFixed(1)} kWh`
  return `${wh} Wh`
}

export function formatMollieAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}
