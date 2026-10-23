function formatDate(date) {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(date));
}
function formatTicketRef(ticket) {
  if (!ticket) return null;
  if (typeof ticket.ticket_number === "number" && ticket.ticket_number > 0) {
    return String(ticket.ticket_number);
  }
  return null;
}

export { formatDate as a, formatTicketRef as f };
//# sourceMappingURL=formatters-BMgUYP7c.mjs.map
