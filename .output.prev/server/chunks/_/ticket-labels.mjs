async function labelsByTicket(supabase, ticketIds) {
  const map = /* @__PURE__ */ new Map();
  if (!ticketIds.length) return map;
  const { data } = await supabase.from("service_ticket_labels").select("ticket_id, ticket_labels(id, name, color, sort_order)").in("ticket_id", ticketIds);
  for (const row of data || []) {
    const lbl = row.ticket_labels;
    if (!lbl) continue;
    const arr = map.get(row.ticket_id) || [];
    arr.push({ id: lbl.id, name: lbl.name, color: lbl.color });
    map.set(row.ticket_id, arr);
  }
  return map;
}

export { labelsByTicket as l };
//# sourceMappingURL=ticket-labels.mjs.map
