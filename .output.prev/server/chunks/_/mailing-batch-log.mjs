async function logIndividualInvitation(args) {
  const { supabase, partnerId, customerId, customerLabel, actorUserId } = args;
  try {
    const now = /* @__PURE__ */ new Date();
    const dateStr = now.toLocaleString("nl-NL", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
    const name = `Individueel \u2014 ${customerLabel} (${dateStr})`;
    const { data: batch, error: batchErr } = await supabase.from("mailing_batches").insert({
      partner_id: partnerId,
      name,
      description: "Individuele uitnodiging via portaal",
      customer_count: 1,
      // segment_filter krijgt een marker zodat we later in de UI deze
      // single-sends apart kunnen filteren als ze de batchlijst vervuilen.
      segment_filter: { kind: "individual_send" },
      created_by: actorUserId || null
    }).select("id").single();
    if (batchErr || !batch) {
      console.error("[mailing-batch-log] batch insert faalde:", batchErr == null ? void 0 : batchErr.message);
      return;
    }
    const { error: joinErr } = await supabase.from("mailing_batch_customers").insert({ batch_id: batch.id, customer_id: customerId });
    if (joinErr) {
      await supabase.from("mailing_batches").delete().eq("id", batch.id);
      console.error("[mailing-batch-log] join insert faalde:", joinErr.message);
    }
  } catch (e) {
    console.error("[mailing-batch-log] onverwachte fout:", (e == null ? void 0 : e.message) || e);
  }
}

export { logIndividualInvitation as l };
//# sourceMappingURL=mailing-batch-log.mjs.map
