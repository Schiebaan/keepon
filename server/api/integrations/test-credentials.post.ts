import { getServiceRoleClient } from '~~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  // Require partner_admin or platform_admin
  await requireRole(event, 'partner_admin')

  const body = await readBody(event)
  const { type, credentials } = body

  if (!type || !credentials) {
    throw createError({ statusCode: 400, message: 'type and credentials are required' })
  }

  if (type === 'sundata') {
    // Test Sundata credentials
    try {
      const response = await $fetch<{ access_token: string }>('https://api.sundata.nl/api/v0/sign-in', {
        method: 'POST',
        body: {
          email: credentials.email,
          password: credentials.password,
        },
      })

      if (!response.access_token) {
        return { success: false, error: 'Geen access token ontvangen' }
      }

      // Fetch companies to verify full access
      const companies = await $fetch<any[]>('https://api.sundata.nl/api/v0/users/me/companies', {
        headers: { Authorization: `Bearer ${response.access_token}` },
      })

      // Count total plants across companies
      let totalPlants = 0
      for (const company of companies) {
        try {
          const plants = await $fetch<any[]>(`https://api.sundata.nl/api/v0/companies/${company.id}/plants`, {
            headers: { Authorization: `Bearer ${response.access_token}` },
          })
          totalPlants += plants.length
        } catch {
          // Skip companies we can't access
        }
      }

      return {
        success: true,
        details: {
          companies: companies.length,
          plants: totalPlants,
          email: credentials.email,
        },
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Verbinding mislukt'
      return {
        success: false,
        error: message.includes('401') || message.includes('Unauthorized')
          ? 'Ongeldige inloggegevens. Controleer je e-mail en wachtwoord.'
          : `Verbinding mislukt: ${message}`,
      }
    }
  }

  if (type === 'weheat') {
    try {
      const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: credentials.client_id,
        client_secret: credentials.client_secret,
      })
      const tokenResp = await $fetch<{ access_token: string }>('https://auth.weheat.nl/auth/realms/Weheat/protocol/openid-connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      if (!tokenResp.access_token) {
        return { success: false, error: 'Geen access token ontvangen' }
      }

      const heatPumps = await $fetch<any[]>('https://api.weheat.nl/third_party/heat-pumps', {
        headers: { Authorization: `Bearer ${tokenResp.access_token}` },
      })

      return {
        success: true,
        details: {
          heatPumps: heatPumps.length,
        },
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Verbinding mislukt'
      return {
        success: false,
        error: message.includes('401') || message.includes('Unauthorized') || message.includes('invalid_client')
          ? 'Ongeldige Client ID of Client Secret.'
          : `Verbinding mislukt: ${message}`,
      }
    }
  }

  if (type === 'easee') {
    try {
      const tokenResp = await $fetch<{ accessToken: string }>('https://api.easee.com/api/accounts/login', {
        method: 'POST',
        body: {
          userName: credentials.username,
          password: credentials.password,
        },
      })

      if (!tokenResp.accessToken) {
        return { success: false, error: 'Geen access token ontvangen' }
      }

      const chargers = await $fetch<any[]>('https://api.easee.com/api/chargers', {
        headers: { Authorization: `Bearer ${tokenResp.accessToken}` },
      })

      return {
        success: true,
        details: {
          chargers: chargers.length,
        },
      }
    } catch (err: any) {
      const message = err?.data?.message || err?.message || 'Verbinding mislukt'
      return {
        success: false,
        error: message.includes('401') || message.includes('Unauthorized')
          ? 'Ongeldige gebruikersnaam of wachtwoord.'
          : `Verbinding mislukt: ${message}`,
      }
    }
  }

  // Not yet implemented
  return { success: false, error: `Integratie type "${type}" wordt nog niet ondersteund` }
})
