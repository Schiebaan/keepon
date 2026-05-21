/**
 * Ticket threading — stored as JSON in the `response` TEXT column of
 * `service_tickets`. Avoids a schema migration. Backward compatible with
 * legacy single-string responses (wrapped as one installer message).
 */

export interface TicketMessage {
  id: string
  role: 'customer' | 'installer'
  text: string
  at: string                 // ISO timestamp
  author_name?: string | null
}

/** Parse whatever is in service_tickets.response into a message list. */
export function parseMessages(raw: string | null | undefined): TicketMessage[] {
  if (!raw) return []
  const trimmed = raw.trim()
  if (!trimmed) return []

  // New-format: JSON array
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed)
      if (Array.isArray(arr)) {
        return arr
          .filter(m => m && typeof m.text === 'string')
          .map((m, i) => ({
            id: m.id || `legacy-${i}`,
            role: m.role === 'customer' ? 'customer' : 'installer',
            text: String(m.text),
            at: m.at || new Date().toISOString(),
            author_name: m.author_name || null,
          }))
      }
    } catch {
      // fall through to legacy
    }
  }

  // Legacy plain-text response = one installer message
  return [{
    id: 'legacy-0',
    role: 'installer',
    text: trimmed,
    at: new Date().toISOString(),
    author_name: null,
  }]
}

/** Serialize a message list back into the storage format. */
export function serializeMessages(messages: TicketMessage[]): string | null {
  if (!messages || messages.length === 0) return null
  return JSON.stringify(messages)
}

/** Append a new message to the existing thread and return the new storage string. */
export function appendMessage(
  existingRaw: string | null | undefined,
  msg: Omit<TicketMessage, 'id' | 'at'> & { id?: string; at?: string },
): { raw: string; messages: TicketMessage[]; added: TicketMessage } {
  const messages = parseMessages(existingRaw)
  const added: TicketMessage = {
    id: msg.id || `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    role: msg.role,
    text: msg.text,
    at: msg.at || new Date().toISOString(),
    author_name: msg.author_name || null,
  }
  messages.push(added)
  return { raw: JSON.stringify(messages), messages, added }
}

/** Return the latest message in the thread (for previews). */
export function latestMessage(raw: string | null | undefined): TicketMessage | null {
  const msgs = parseMessages(raw)
  return msgs.length ? msgs[msgs.length - 1] : null
}

/** How many messages are in the thread. */
export function messageCount(raw: string | null | undefined): number {
  return parseMessages(raw).length
}
