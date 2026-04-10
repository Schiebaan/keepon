import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { email, full_name, phone, street, house_number, postal_code, city, modules } = body

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

  await auditLog(event, 'customer.created', 'customer', customer.id, { email, full_name, partner_id: partnerId })

  // Send welcome email with magic link
  try {
    const { sendEmail, buildWelcomeEmail, buildFromCustomTemplate, getPartnerTemplate } = await import('~~/server/utils/email')

    const { data: partnerData } = await supabase
      .from('partners')
      .select('name, slug, primary_color, logo_url, support_email')
      .eq('id', partnerId)
      .single()

    const baseUrl = `https://${partnerData?.slug ? partnerData.slug + '.' : ''}upsol.nl`

    // Generate a magic link so the customer can login with one click
    const { data: linkData } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: `${baseUrl}/auth/welcome` },
    })

    const magicLinkUrl = linkData?.properties?.action_link || `${baseUrl}/login`

    // Build module names
    const moduleLabels: Record<string, string> = { solar: 'Zonnepanelen', heat_pump: 'Warmtepomp', ev_charger: 'Laadpaal' }
    const selectedModules: string[] = modules || []
    const moduleNames = selectedModules.map(m => moduleLabels[m] || m).join(' & ') || 'je installatie'

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
        partner: partnerData || undefined,
      })
    }

    await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      replyTo: partnerData?.support_email || undefined,
    })
  } catch (e) {
    console.error('[email] Failed to send welcome email:', e)
  }

  return customer
})
