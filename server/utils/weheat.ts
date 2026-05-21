import type { IntegrationConnector } from './connectors'
import { getServiceRoleClient } from './supabase'
import type { H3Event } from 'h3'

const TOKEN_URL = 'https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/token'
const API_URL = 'https://api.weheat.nl/third_party/api/v1'
const CLIENT_ID = 'weheat-backend'

/**
 * Weheat token management.
 *
 * The third-party API rejects password-grant tokens — it requires real
 * browser-auth-context claims (auth_time, acr, sid). So we use the OAuth 2.0
 * authorization-code flow with PKCE (same as the Weheat API debugger).
 *
 * After connecting, we have a refresh_token stored on the partner's
 * `integration_credentials` row. We use that to mint fresh access tokens.
 *
 * The credentials shape:
 *   {
 *     refresh_token: string,
 *     access_token: string,
 *     access_token_expires_at: ISO string,
 *     connected_at: ISO string,
 *   }
 */

interface WeheatCreds {
  refresh_token?: string
  access_token?: string
  access_token_expires_at?: string
  // Stored so we can transparently re-login when refresh_token expires.
  // Weheat's refresh tokens only live ~1 hour, so this happens often.
  username?: string
  password?: string
}

async function exchangeRefreshToken(refreshToken: string): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: CLIENT_ID,
    refresh_token: refreshToken,
  })
  return await $fetch<any>(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
}

/**
 * Get a valid access token. If the cached one is still fresh, returns it.
 * Otherwise refreshes via refresh_token and persists the rotated token back
 * onto the integration_credentials row.
 *
 * Optionally takes the H3 event so we can persist; if omitted (e.g. called
 * from a non-event context) we just refresh in-memory.
 */
async function persistCreds(event: H3Event | undefined, partnerId: string | undefined, next: WeheatCreds) {
  if (!event || !partnerId) return
  try {
    const supabase = getServiceRoleClient(event)
    await supabase
      .from('integration_credentials')
      .update({ credentials: next })
      .eq('partner_id', partnerId)
      .eq('integration_type', 'weheat')
  } catch {
    // Non-fatal; the in-memory token still works for this request.
  }
}

async function getAccessToken(credentials: WeheatCreds, event?: H3Event, partnerId?: string): Promise<string> {
  if (!credentials.refresh_token && !(credentials.username && credentials.password)) {
    throw new Error('Weheat is nog niet verbonden. Klik in /admin/settings op "Verbinden via Weheat".')
  }

  // Use cached access_token if still valid (with 60s safety margin)
  const exp = credentials.access_token_expires_at ? new Date(credentials.access_token_expires_at).getTime() : 0
  if (credentials.access_token && exp > Date.now() + 60_000) {
    return credentials.access_token
  }

  // 1) Try the refresh-token grant first. Cheapest path when still valid.
  if (credentials.refresh_token) {
    try {
      const resp = await exchangeRefreshToken(credentials.refresh_token)
      const next: WeheatCreds = {
        ...credentials,
        access_token: resp.access_token,
        // Keycloak rotates refresh tokens — use the new one if returned
        refresh_token: resp.refresh_token || credentials.refresh_token,
        access_token_expires_at: new Date(Date.now() + (resp.expires_in - 60) * 1000).toISOString(),
      }
      await persistCreds(event, partnerId, next)
      return next.access_token!
    } catch (e: any) {
      // Refresh tokens at Weheat live ~1 hour. If expired, fall through to
      // the headless re-login (only possible if we have password on file).
      if (!credentials.username || !credentials.password) {
        throw new Error('Weheat-verbinding verlopen. Klik in /admin/settings op "Verbinden via Weheat" om opnieuw in te loggen.')
      }
    }
  }

  // 2) Refresh failed (or no refresh_token at all) — do a fresh headless login.
  if (credentials.username && credentials.password) {
    const { loginWeheatHeadless } = await import('./weheat-headless')
    const tokens = await loginWeheatHeadless(credentials.username, credentials.password)
    const next: WeheatCreds = {
      ...credentials,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      access_token_expires_at: new Date(Date.now() + (tokens.expires_in - 60) * 1000).toISOString(),
    }
    await persistCreds(event, partnerId, next)
    return next.access_token
  }

  throw new Error('Weheat-verbinding verlopen. Klik in /admin/settings op "Verbinden via Weheat".')
}

export const weheatConnector: IntegrationConnector = {
  type: 'weheat',

  async verifyCredentials(credentials) {
    try {
      const token = await getAccessToken(credentials as WeheatCreds)
      const res = await $fetch(`${API_URL}/heat-pumps`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      return Array.isArray(res)
    } catch {
      return false
    }
  },

  async listDevices(credentials) {
    const token = await getAccessToken(credentials as WeheatCreds)

    // Weheat returns paginated results: { metadata: { totalPages }, data: [...] }
    // We walk all pages so the UI can show the full installer base in one go.
    const all: any[] = []
    let page = 1
    let totalPages = 1
    do {
      const resp = await $fetch<any>(`${API_URL}/heat-pumps?page=${page}&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const list = Array.isArray(resp) ? resp : (resp?.data || [])
      for (const hp of list) all.push(hp)
      totalPages = resp?.metadata?.totalPages ?? 1
      page++
    } while (page <= totalPages && page < 20 /* safety cap */)

    return all.map((hp: any) => {
      const serial = hp.serialNumber || hp.serial_number || hp.id
      return {
        id: hp.id,
        name: hp.name?.trim() || `Warmtepomp ${serial}`,
        serial,
        // Extra fields used by the WeheatWizard. Not part of the standard
        // IntegrationConnector contract but harmless to include.
        model: hp.model,
        partNumber: hp.partNumber || hp.part_number,
        commissionedAt: hp.commissionedAt || hp.commissioned_at,
        type: 'weheat' as const,
      } as any
    })
  },

  async linkDevice(credentials, deviceId) {
    const token = await getAccessToken(credentials as WeheatCreds)
    await $fetch(`${API_URL}/heat-pumps/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, device_id: deviceId }
  },

  async getDeviceStatus(credentials, deviceId) {
    const token = await getAccessToken(credentials as WeheatCreds)
    const status = await $fetch<any>(`${API_URL}/heat-pumps/${deviceId}/status`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return {
      state: status.heat_pump_state || 'unknown',
      metrics: {
        output_power: status.output_power || 0,
        cop: status.cop || 0,
        water_temperature: status.dhw_temperature || 0,
        compressor_rpm: status.compressor_percentage || 0,
      },
    }
  },

  async getDeviceData(credentials, deviceId, from, to) {
    const token = await getAccessToken(credentials as WeheatCreds)
    const data = await $fetch<any[]>(
      `${API_URL}/heat-pumps/${deviceId}/energy?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } },
    )

    return (data || []).map((d: any) => ({
      timestamp: d.timestamp,
      value: d.energy_output || 0,
      unit: 'kWh',
    }))
  },
}

// Exported so endpoints elsewhere can pull a fresh token + persist rotation.
export async function getWeheatAccessToken(credentials: WeheatCreds, event: H3Event, partnerId: string): Promise<string> {
  return getAccessToken(credentials, event, partnerId)
}

registerConnector(weheatConnector)
