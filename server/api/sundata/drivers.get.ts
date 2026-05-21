import { getServiceRoleClient } from '~~/server/utils/supabase'

const BASE_URL = 'https://api.sundata.nl/api/v0'

// Per-driver help article on Sundata's Nederlandse support site.
// Fallback for drivers without a dedicated article is the support home page.
const HELP_URLS: Record<string, string> = {
  solaredge: 'https://support.sundata.nl/nl/articles/5695178-solaredge-installatie-aanmelden-op-sundata',
  sma: 'https://support.sundata.nl/nl/articles/5148193-sma-installatie-aanmelden-op-sundata',
  solarweb: 'https://support.sundata.nl/nl/articles/5139981-fronius-installatie-aanmelden-op-sundata',
  fronius: 'https://support.sundata.nl/nl/articles/5139981-fronius-installatie-aanmelden-op-sundata',
  enphase: 'https://support.sundata.nl/nl/articles/5139942-enphase-installatie-aanmelden-op-sundata',
  solis: 'https://support.sundata.nl/nl/articles/5695320-solis-installatie-aanmelden-op-sundata',
  huawei: 'https://support.sundata.nl/nl/articles/5140055-huawei-fusionsolar-installatie-aanmelden-op-sundata',
  huawei_neteco: 'https://support.sundata.nl/nl/articles/6211747-huawei-neteco-installatie-aanmelden-op-sundata',
  solax: 'https://support.sundata.nl/nl/articles/5775774-solax-installatie-aanmelden-op-sundata',
  sundata_cast4all: 'https://support.sundata.nl/nl/articles/5794722-installatie-sungate',
  // Sundata has no dedicated article for these — fall back to the support homepage
  growatt: 'https://support.sundata.nl/',
  goodwe: 'https://support.sundata.nl/',
  fox_ess: 'https://support.sundata.nl/',
}

// Return the credential compositions actually enabled for this partner's Sundata account.
// Each composition = one clickable "brand option" in the wizard (so SolarWeb may return 2: device+system).
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)

  const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
    partnerId = fp?.id
  }
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  const { data: cred } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', partnerId)
    .eq('integration_type', 'sundata')
    .eq('is_active', true)
    .single()

  if (!cred?.credentials?.email) {
    throw createError({ statusCode: 400, message: 'Sundata is niet gekoppeld. Ga naar Instellingen om de koppeling in te stellen.' })
  }

  const signin = await $fetch<{ access_token: string }>(`${BASE_URL}/sign-in`, {
    method: 'POST',
    body: { email: cred.credentials.email, password: cred.credentials.password },
  })
  const token = signin.access_token
  const headers = { Authorization: `Bearer ${token}` }

  const companies = await $fetch<any[]>(`${BASE_URL}/users/me/companies`, { headers })
  if (!companies?.length) return []
  const companyId = companies[0].id

  const driverAccounts = await $fetch<any[]>(`${BASE_URL}/companies/${companyId}/driver-accounts`, { headers })

  // For each driver account, fetch its credential compositions
  const result: any[] = []
  for (const da of driverAccounts) {
    try {
      const compositions = await $fetch<any[]>(
        `${BASE_URL}/companies/${companyId}/driver-accounts/${da.id}/credential-compositions`,
        { headers },
      )

      for (const comp of compositions || []) {
        // Skip compositions that can't be used to create meters
        if (!comp.creation_enabled) continue

        result.push({
          id: comp.alias, // unique per composition
          driver_name: da.driver_name,
          driver_account_id: da.id,
          driver_account_name: da.name,
          composition_alias: comp.alias,
          // Prefer composition display_name (e.g. "SolarWeb: Device"), fall back to driver display_name
          name: comp.display_name || da.display_name || da.driver_name,
          fields: (comp.credential_fields || [])
            .filter((f: any) => f.editable !== false)
            .sort((a: any, b: any) => (a.nr ?? 0) - (b.nr ?? 0))
            .map((f: any) => ({ name: f.name, label: f.display_name || f.name })),
          helpUrl: HELP_URLS[da.driver_name] || '',
        })
      }
    } catch {
      // Skip driver accounts we can't inspect
    }
  }

  return result
})
