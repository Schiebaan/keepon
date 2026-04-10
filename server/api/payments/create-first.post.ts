export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  const { subscription_id, return_url } = body

  if (!subscription_id || !return_url) {
    throw createError({ statusCode: 400, message: 'subscription_id en return_url zijn verplicht' })
  }

  const tenant = event.context.tenant
  if (!tenant) {
    throw createError({ statusCode: 400, message: 'Geen partner omgeving' })
  }

  const supabase = getServiceRoleClient(event)

  // Load subscription with customer and module config
  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('*, customer:customers(*), partner_module_config:partner_module_configs(*, module_definition:module_definitions(*))')
    .eq('id', subscription_id)
    .single()

  if (subError || !subscription) {
    throw createError({ statusCode: 404, message: 'Abonnement niet gevonden' })
  }

  // Verify the subscription belongs to the current user
  if (subscription.customer.auth_user_id !== user.id) {
    throw createError({ statusCode: 403, message: 'Geen toegang' })
  }

  const mollieClient = await getPartnerMollieClient(event)

  // Create or get Mollie customer
  let mollieCustomerId = subscription.customer.mollie_customer_id
  if (!mollieCustomerId) {
    const mollieCustomer = await mollieClient.customers.create({
      name: subscription.customer.full_name || subscription.customer.email,
      email: subscription.customer.email,
    })
    mollieCustomerId = mollieCustomer.id

    await supabase
      .from('customers')
      .update({ mollie_customer_id: mollieCustomerId })
      .eq('id', subscription.customer.id)
  }

  // Determine webhook URL
  const host = getHeader(event, 'host') || `${tenant.slug}.upsol.nl`
  const protocol = process.dev ? 'http' : 'https'
  const webhookUrl = `${protocol}://${host}/api/webhooks/mollie`

  // Create first payment (mandate creation)
  const payment = await mollieClient.payments.create({
    amount: {
      currency: 'EUR',
      value: formatMollieAmount(subscription.price_cents),
    },
    customerId: mollieCustomerId,
    sequenceType: 'first',
    description: `${tenant.name} - ${subscription.partner_module_config.module_definition.name}`,
    redirectUrl: return_url,
    webhookUrl,
    metadata: {
      subscription_id: subscription.id,
      partner_id: tenant.id,
    },
  })

  // Record the payment
  await supabase.from('payments').insert({
    subscription_id: subscription.id,
    customer_id: subscription.customer.id,
    mollie_payment_id: payment.id,
    amount_cents: subscription.price_cents,
    status: payment.status,
    is_first_payment: true,
  })

  return { checkoutUrl: payment.getCheckoutUrl() }
})
