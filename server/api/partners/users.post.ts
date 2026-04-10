import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  const { email, partner_id } = body
  if (!email) throw createError({ statusCode: 400, message: 'E-mailadres is verplicht' })

  // Determine partner
  const { data: role } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', user.id)
    .single()

  let partnerId = partner_id || role?.partner_id
  if (role?.role === 'platform_admin' && partner_id) {
    partnerId = partner_id
  }

  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  // Create auth user with temporary password
  const tempPassword = 'Welkom' + Math.random().toString(36).slice(2, 8) + '!'
  let authUserId: string

  const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (authError) {
    // User might already exist
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === email)
    if (!existing) {
      throw createError({ statusCode: 500, message: `Fout: ${authError.message}` })
    }
    authUserId = existing.id

    // Check if already a partner_admin for this partner
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', authUserId)
      .eq('partner_id', partnerId)
      .eq('role', 'partner_admin')
      .single()

    if (existingRole) {
      throw createError({ statusCode: 409, message: 'Deze gebruiker is al een beheerder van deze partner' })
    }
  } else {
    authUserId = newUser.user.id
  }

  // Assign partner_admin role
  const { error: roleError } = await supabase.from('user_roles').upsert({
    user_id: authUserId,
    partner_id: partnerId,
    role: 'partner_admin',
  }, { onConflict: 'user_id' })

  if (roleError) throw createError({ statusCode: 500, message: roleError.message })

  await auditLog(event, 'partner_user.created', 'user_role', authUserId, { email, partner_id: partnerId })

  // Send welcome email to new partner user
  const { data: partnerData } = await supabase
    .from('partners')
    .select('name, slug, primary_color, logo_url, support_email')
    .eq('id', partnerId)
    .single()

  if (partnerData) {
    const { sendEmail, buildFromCustomTemplate } = await import('~~/server/utils/email')
    const loginUrl = `https://${partnerData.slug}.upsol.nl/login`
    const { subject, html } = buildFromCustomTemplate({
      subject: `Je hebt toegang tot het ${partnerData.name} portaal`,
      heading: 'Welkom als beheerder!',
      body: `Je hebt een account gekregen voor het ${partnerData.name} beheerportaal. Log in met je e-mailadres en het tijdelijke wachtwoord dat je van je collega hebt ontvangen. Wijzig je wachtwoord na het eerste inloggen.`,
      buttonText: 'Inloggen',
      buttonUrl: loginUrl,
      customerName: email.split('@')[0],
      customerEmail: email,
      partner: partnerData || undefined,
    })

    await sendEmail({ to: email, subject, html }).catch(() => {})
  }

  return {
    id: authUserId,
    email,
    temporary_password: tempPassword,
    message: `Gebruiker ${email} is aangemaakt als partner beheerder`,
  }
})
