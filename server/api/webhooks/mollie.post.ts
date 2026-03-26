export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const paymentId = body.id

  if (!paymentId) {
    throw createError({ statusCode: 400, message: 'Payment ID ontbreekt' })
  }

  const tenant = event.context.tenant
  if (!tenant) {
    throw createError({ statusCode: 400, message: 'Geen partner omgeving' })
  }

  const supabase = getServiceRoleClient(event)
  const mollieClient = await getPartnerMollieClient(event)

  // Get payment details from Mollie
  const payment = await mollieClient.payments.get(paymentId)

  // Update payment record
  await supabase
    .from('payments')
    .update({
      status: payment.status,
      paid_at: payment.paidAt || null,
      payment_method: payment.method || null,
    })
    .eq('mollie_payment_id', payment.id)

  if (payment.status === 'paid' && payment.metadata?.subscription_id) {
    const subscriptionId = payment.metadata.subscription_id as string

    // Load subscription details
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('*, partner_module_config:partner_module_configs(*, module_definition:module_definitions(*))')
      .eq('id', subscriptionId)
      .single()

    if (!sub) return { received: true }

    // If first payment, create recurring Mollie subscription
    if (payment.sequenceType === 'first') {
      const interval = sub.billing_interval === 'monthly' ? '1 month' : '12 months'

      const host = getHeader(event, 'host') || `${tenant.slug}.keepon.nl`
      const protocol = process.dev ? 'http' : 'https'

      try {
        const mollieSub = await mollieClient.customerSubscriptions.create({
          customerId: payment.customerId!,
          amount: {
            currency: 'EUR',
            value: formatMollieAmount(sub.price_cents),
          },
          interval,
          description: `${tenant.name} - ${sub.partner_module_config.module_definition.name}`,
          webhookUrl: `${protocol}://${host}/api/webhooks/mollie`,
          metadata: {
            subscription_id: subscriptionId,
            partner_id: tenant.id,
          },
        })

        // Activate subscription
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            mollie_subscription_id: mollieSub.id,
            mollie_mandate_id: payment.mandateId || null,
            activated_at: new Date().toISOString(),
            integration_status: 'linking',
          })
          .eq('id', subscriptionId)

        // Log audit
        await supabase.from('audit_log').insert({
          partner_id: tenant.id,
          action: 'module.activated',
          entity_type: 'subscription',
          entity_id: subscriptionId,
          meta: { payment_id: payment.id, module: sub.partner_module_config.module_definition.type },
        })
      } catch (err: any) {
        // Mollie subscription creation failed - still mark payment as received
        await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            activated_at: new Date().toISOString(),
            integration_status: 'error',
            integration_meta: { error: 'Mollie subscription creation failed', details: err.message },
          })
          .eq('id', subscriptionId)
      }
    }
  }

  return { received: true }
})
