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
    // Weheat now uses OAuth 2.0 / PKCE — credentials are a refresh_token, not
    // a username/password. Verifying is: try to fetch /heat-pumps with a fresh
    // access token (which our connector mints from the stored refresh_token).
    try {
      if (!credentials.refresh_token) {
        return { success: false, error: 'Nog niet verbonden. Klik op "Verbinden via Weheat" om in te loggen.' }
      }
      const tokenResp = await $fetch<{ access_token: string }>('https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: 'weheat-backend',
          refresh_token: credentials.refresh_token,
        }).toString(),
      })
      if (!tokenResp.access_token) return { success: false, error: 'Geen access token ontvangen' }

      const heatPumps = await $fetch<any[]>('https://api.weheat.nl/third_party/api/v1/heat-pumps', {
        headers: { Authorization: `Bearer ${tokenResp.access_token}` },
      })
      return { success: true, details: { heatPumps: heatPumps.length } }
    } catch (err: any) {
      const code = err?.data?.error
      const desc = err?.data?.error_description || err?.data?.message || err?.message || ''
      const status = err?.statusCode || err?.response?.status
      let nice = `Verbinding mislukt: ${desc}`
      if (code === 'invalid_grant') nice = 'Refresh token verlopen. Klik op "Verbinden via Weheat" om opnieuw in te loggen.'
      else if (status === 403) nice = 'Weheat weigert de API-toegang. Neem contact op met Weheat support.'
      return { success: false, error: nice }
    }
  }

  if (type === 'easee') {
    try {
      const userName = (credentials.username || credentials.email || '').trim()
      const password = (credentials.password || '').trim()
      // Easee migrated to Keycloak. Use password-grant against auth.easee.com.
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: 'easee',
        username: userName,
        password,
        scope: 'email offline_access',
      })
      const tokenResp = await $fetch<{ access_token: string; refresh_token?: string }>('https://auth.easee.com/realms/easee/protocol/openid-connect/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      if (!tokenResp.access_token) return { success: false, error: 'Geen access token ontvangen' }

      const chargers = await $fetch<any[]>('https://api.easee.com/api/chargers', {
        headers: { Authorization: `Bearer ${tokenResp.access_token}` },
      })

      return {
        success: true,
        details: { chargers: chargers.length },
        // Hand the refresh token back so the credentials-save endpoint can persist it
        refresh_token: tokenResp.refresh_token,
      }
    } catch (err: any) {
      const code = err?.data?.error
      const desc = err?.data?.error_description || err?.message || ''
      let nice = `Verbinding mislukt: ${desc}`
      if (code === 'invalid_grant') {
        nice = 'Wachtwoord of gebruikersnaam onjuist. Probeer het account waarmee je in de Easee app inlogt.'
      } else if (code === 'unauthorized_client') {
        nice = 'Auth-fout (interne configuratie). Probeer opnieuw — of neem contact op met support.'
      } else if (desc.toLowerCase().includes('account is not fully set up')) {
        nice = 'Account heeft een verplichte actie open (bv. wachtwoord wijzigen). Log in op portal.easee.com en handel die af.'
      }
      return { success: false, error: nice }
    }
  }

  // Not yet implemented
  return { success: false, error: `Integratie type "${type}" wordt nog niet ondersteund` }
})
