// Public endpoint - returns partner branding based on subdomain or auth context
export default defineEventHandler(async (event) => {
  // 1. Tenant from subdomain (set by tenant middleware)
  const tenant = event.context.tenant
  if (tenant) return tenant

  const supabase = getServiceRoleClient(event)

  // 2. Try to get partner from authenticated user's role
  const authHeader = getHeader(event, 'authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const { data: { user } } = await supabase.auth.getUser(authHeader.slice(7))
    if (user) {
      const { data: role } = await supabase
        .from('user_roles')
        .select('partner_id')
        .eq('user_id', user.id)
        .not('partner_id', 'is', null)
        .limit(1)
        .single()

      if (role?.partner_id) {
        const { data: partner } = await supabase
          .from('partners')
          .select('id, name, slug, logo_url, primary_color, secondary_color, terms_url, support_email')
          .eq('id', role.partner_id)
          .single()
        if (partner) return partner
      }
    }
  }

  // 3. No tenant and no auth — return generic UPsol branding rather than leaking some random
  //    partner's name as "Demo Installateur". This prevents the flash of the wrong partner name
  //    when the client briefly hits this endpoint without proper context.
  return {
    id: null,
    name: 'UPsol',
    slug: null,
    logo_url: null,
    primary_color: '#1a56db',
    secondary_color: '#f3f4f6',
    terms_url: null,
    support_email: null,
  }
})
