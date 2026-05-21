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

/**
 * Format a ticket reference as a short, easy-to-say-on-the-phone number.
 * Returns the bare number (e.g. "7", "42", "143"). Use with a prefix word
 * in the UI like "Ticket 7" or "#7" depending on the surrounding context.
 * Returns null when the ticket has no `ticket_number` yet (migration not
 * run, or row pre-dates the trigger) so callers can hide the ref entirely.
 */
export function formatTicketRef(ticket: { ticket_number?: number | null } | null | undefined): string | null {
  if (!ticket) return null
  if (typeof ticket.ticket_number === 'number' && ticket.ticket_number > 0) {
    return String(ticket.ticket_number)
  }
  return null
}
