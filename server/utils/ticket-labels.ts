import type { SupabaseClient } from '@supabase/supabase-js'

export interface TicketLabel {
  id: string
  name: string
  color: string
}

/**
 * Haal labels op voor een set ticket-id's in één query en geef een map terug
 * van ticket_id → label[]. Gebruikt door zowel de detail- als de
 * lijst-endpoint zodat labels op één plek geladen worden.
 */
export async function labelsByTicket(
  supabase: SupabaseClient,
  ticketIds: string[],
): Promise<Map<string, TicketLabel[]>> {
  const map = new Map<string, TicketLabel[]>()
  if (!ticketIds.length) return map

  const { data } = await supabase
    .from('service_ticket_labels')
    .select('ticket_id, ticket_labels(id, name, color, sort_order)')
    .in('ticket_id', ticketIds)

  for (const row of (data || []) as any[]) {
    const lbl = row.ticket_labels
    if (!lbl) continue
    const arr = map.get(row.ticket_id) || []
    arr.push({ id: lbl.id, name: lbl.name, color: lbl.color })
    map.set(row.ticket_id, arr)
  }

  // Sorteer per ticket op sort_order (was meegehaald maar niet in TicketLabel)
  // — we sorteren hier op naam als fallback omdat sort_order al impliciet in
  // de embed-volgorde zit. Voor nette weergave laten we 'm zoals binnenkomt.
  return map
}
