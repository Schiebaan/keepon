import { getServiceRoleClient } from '~~/server/utils/supabase'
import { logIndividualInvitation } from '~~/server/utils/mailing-batch-log'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { email, full_name, phone, street, house_number, postal_code, city, modules } = body

  // Pricing-flexibility velden — admin kan ze bij uitnodiging al meegeven
  const billing_interval: 'monthly' | 'yearly' =
    body?.billing_interval === 'yearly' ? 'yearly' : 'monthly'
  const yearly_discount_months = Math.max(0, Math.min(60, Number(body?.yearly_discount_months) || 0))
  const trial_months = Math.max(0, Math.min(60, Number(body?.trial_months) || 0))
  const moduleOverrides: { module_type: string; price_monthly_cents: number; reason?: string }[] =
    Array.isArray(body?.module_price_overrides) ? body.module_price_overrides : []

  if (!email || !full_name) {
    throw createError({ statusCode: 400, message: 'email and full_name are required' })
  }

  // Get partner ID
  const { data: role } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single()

  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const tenant = event.context.tenant
    if (tenant?.id) partnerId = tenant.id
    else {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }

  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  // Check if customer with this email already exists for this partner
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .eq('email', email)
    .eq('partner_id', partnerId)
    .single()

  if (existing) {
    throw createError({ statusCode: 409, message: 'Een klant met dit e-mailadres bestaat al' })
  }

  // Create auth user (so they can login later)
  const tempPassword = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) {
    // User might already exist in auth (from another partner)
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingAuth = existingUsers?.users?.find(u => u.email === email)
    if (!existingAuth) {
      throw createError({ statusCode: 500, message: `Auth error: ${authError.message}` })
    }
    // Use existing auth user
    var authUserId = existingAuth.id
  } else {
    var authUserId = authUser.user.id
  }

  // Create customer record
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .insert({
      auth_user_id: authUserId,
      partner_id: partnerId,
      email,
      full_name,
      phone: phone || null,
      street: street || null,
      house_number: house_number || null,
      postal_code: postal_code || null,
      city: city || null,
      billing_interval,
      yearly_discount_months,
      trial_months,
    })
    .select()
    .single()

  if (custError) throw createError({ statusCode: 500, message: custError.message })

  // Assign customer role
  await supabase.from('user_roles').upsert({
    user_id: authUserId,
    partner_id: partnerId,
    role: 'customer',
    customer_id: customer.id,
  }, { onConflict: 'user_id' })

  // Provision customer_products rows for the modules the installer selected.
  // `name` is NOT NULL in the DB. For heat_pump + ev_charger we pre-fill
  // brand/model with the platform's only supported vendor (Weheat / Easee)
  // since those are the only integrations we wire — installer can edit if
  // they ever stock a different brand.
  const MODULE_INFO: Record<string, { category: string; name: string; brand: string | null; model: string | null }> = {
    solar:      { category: 'solar_panel', name: 'Zonnepanelen',  brand: null,     model: null    },
    heat_pump:  { category: 'heat_pump',   name: 'Warmtepomp',    brand: 'Weheat', model: 'ATLAS' },
    ev_charger: { category: 'ev_charger',  name: 'Laadpaal',      brand: 'Easee',  model: 'Home'  },
    battery:    { category: 'battery',     name: 'Thuisbatterij', brand: null,     model: null    },
  }
  const selectedModules: string[] = Array.isArray(body.modules) ? body.modules : []
  const productRows = selectedModules
    .map(m => MODULE_INFO[m])
    .filter(Boolean)
    .map(info => ({
      customer_id: customer.id,
      partner_id: partnerId,
      category: info.category,
      name: info.name,
      brand: info.brand,
      model: info.model,
    }))
  if (productRows.length) {
    const { error: insertErr } = await supabase.from('customer_products').insert(productRows)
    if (insertErr) console.error('[customers] product insert failed:', insertErr.message)
  }

  // Per-module prijsoverrides (alleen voor modules die de klant ook krijgt;
  // andere worden genegeerd). De UI levert ze in MODULE_INFO-naam → moeten
  // hier vertaald naar het canonieke type uit module_definitions
  // (solar_panel, heat_pump, ev_charger, battery).
  const TYPE_MAP: Record<string, string> = {
    solar: 'solar_panel',
    heat_pump: 'heat_pump',
    ev_charger: 'ev_charger',
    battery: 'battery',
  }
  const overrideRows = moduleOverrides
    .map(o => {
      const mod_type = TYPE_MAP[o.module_type] || o.module_type
      if (!selectedModules.some(sel => TYPE_MAP[sel] === mod_type || sel === o.module_type)) return null
      const price = Math.max(0, Math.floor(Number(o.price_monthly_cents) || 0))
      if (!price) return null
      return {
        customer_id: customer.id,
        module_type: mod_type,
        price_monthly_cents: price,
        reason: typeof o.reason === 'string' ? o.reason.trim().slice(0, 200) || null : null,
      }
    })
    .filter(Boolean) as any[]
  if (overrideRows.length) {
    const { error: ovErr } = await supabase.from('customer_module_prices').insert(overrideRows)
    if (ovErr) console.error('[customers] price override insert failed:', ovErr.message)
  }

  // Initialize onboarding state on the auth user metadata so we can resume
  // where the customer left off across sessions.
  await supabase.auth.admin.updateUserById(authUserId, {
    user_metadata: {
      onboarding: {
        step: 'hero',
        accepted_at: null,
        mandate_at: null,
        mandate_skipped: false,
      },
    },
  }).catch(() => { /* non-fatal */ })

  await auditLog(event, 'customer.created', 'customer', customer.id, { email, full_name, partner_id: partnerId, modules: selectedModules })

  // Send welcome email with magic link
  try {
    const { sendEmail, buildWelcomeEmail, buildFromCustomTemplate, getPartnerTemplate } = await import('~~/server/utils/email')

    const { data: partnerData } = await supabase
      .from('partners')
      .select('name, slug, primary_color, logo_url, support_email, support_phone')
      .eq('id', partnerId)
      .single()

    const baseUrl = `https://${partnerData?.slug ? partnerData.slug + '.' : ''}upsol.nl`

    // Don't put the raw Supabase magic link in the email — it expires after 1 hour
    // and customers often click days later. Instead we mail a long-lived welcome-token
    // URL on our own domain. When clicked, the server generates a fresh magic link
    // and redirects within seconds, so the 1-hour TTL is never an issue.
    const { createWelcomeToken } = await import('~~/server/utils/welcome-token')
    const welcomeToken = createWelcomeToken(customer.id, 30) // 30 days
    const magicLinkUrl = `${baseUrl}/api/welkom/start?token=${welcomeToken}`

    // Build module names + machine-readable list (used by the welcome email for tailored bullets)
    const moduleLabels: Record<string, string> = {
      solar: 'Zonnepanelen', heat_pump: 'Warmtepomp', ev_charger: 'Laadpaal', battery: 'Thuisbatterij',
    }
    const modulesForEmail: string[] = Array.isArray(modules) ? modules : []
    const moduleNames = modulesForEmail.map(m => moduleLabels[m] || m).join(' & ') || 'installatie'

    // Try custom template first
    const customTemplate = await getPartnerTemplate(supabase, partnerId, 'welkomstmail')

    let emailContent: { subject: string; html: string }

    if (customTemplate && customTemplate.enabled) {
      emailContent = buildFromCustomTemplate({
        subject: customTemplate.subject,
        heading: customTemplate.heading,
        body: customTemplate.body,
        buttonText: customTemplate.button_text,
        buttonUrl: magicLinkUrl,
        customerName: full_name,
        customerEmail: email,
        moduleName: moduleNames,
        partner: partnerData || undefined,
      })
    } else {
      emailContent = buildWelcomeEmail({
        customerName: full_name,
        customerEmail: email,
        onboardingUrl: magicLinkUrl,
        moduleName: moduleNames,
        modules: modulesForEmail,
        partner: partnerData || undefined,
      })
    }

    const mailRes = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      fromName: partnerData?.name,
      // Geen replyTo — klant-replies worden niet in de partner-inbox verwacht.
      // De mail-CTA wijst rechtstreeks naar het portaal.
    })

    await auditLog(event, 'email.welcome_sent', 'customer', customer.id, {
      to: email,
      success: mailRes.success,
      subject: emailContent.subject,
    })

    // Stempel in mailing_batches zodat /admin/uitnodigingen de eerste mail
    // ook ziet (in plaats van "Nooit gemaild" voor net-uitgenodigde klanten).
    if (mailRes.success) {
      await logIndividualInvitation({
        supabase,
        partnerId,
        customerId: customer.id,
        customerLabel: full_name || email,
        actorUserId: user.id,
      })
    }
  } catch (e) {
    console.error('[email] Failed to send welcome email:', e)
  }

  return customer
})
