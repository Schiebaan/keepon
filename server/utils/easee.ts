import type { IntegrationConnector } from './connectors'
import type { DeviceSummary, DeviceStatus, DeviceDataPoint, LinkResult } from '~~/shared/types/modules'

const API_URL = 'https://api.easee.com/api'
const TOKEN_URL = 'https://auth.easee.com/realms/easee/protocol/openid-connect/token'
const KEYCLOAK_CLIENT = 'easee'

/**
 * Easee uses Keycloak for auth. The legacy `/api/accounts/login` endpoint is
 * being phased out and only works for older accounts; modern accounts (including
 * installer accounts created via portal.easee.com) authenticate against
 * `auth.easee.com/realms/easee` with the public client `easee` via password grant.
 *
 * We get a short-lived access token (1h) plus a refresh token (~24h, rotates).
 */
async function getToken(credentials: Record<string, string>): Promise<string> {
  const username = (credentials.username || credentials.email || '').trim()
  const password = (credentials.password || '').trim()

  // If the partner stored a refresh token from a previous session, prefer that
  if (credentials.refresh_token) {
    try {
      return await refreshToken(credentials.refresh_token)
    } catch {
      // Fall through to password grant
    }
  }

  if (!username || !password) {
    throw new Error('Easee: gebruikersnaam en wachtwoord zijn verplicht')
  }

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: KEYCLOAK_CLIENT,
    username,
    password,
    scope: 'email offline_access',
  })

  try {
    const resp = await $fetch<{ access_token: string; refresh_token?: string; expires_in: number }>(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    return resp.access_token
  } catch (err: any) {
    const code = err?.data?.error
    const desc = err?.data?.error_description || err?.message
    let nice = 'Inloggen bij Easee mislukt.'
    if (code === 'invalid_grant') nice = 'Wachtwoord of gebruikersnaam onjuist. Gebruik het account waarmee je in de Easee app inlogt.'
    else if (code === 'unauthorized_client') nice = 'Easee weigert deze auth-client. Neem contact op met support.'
    else if (desc) nice = `Easee: ${desc}`
    const e: any = new Error(nice)
    e.cause = err
    e.easeeCode = code
    throw e
  }
}

async function refreshToken(refresh_token: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: KEYCLOAK_CLIENT,
    refresh_token,
  })
  const resp = await $fetch<{ access_token: string }>(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return resp.access_token
}

export const easeeConnector: IntegrationConnector = {
  type: 'easee',

  async verifyCredentials(credentials) {
    try {
      await getToken(credentials)
      return true
    } catch {
      return false
    }
  },

  async listDevices(credentials) {
    const token = await getToken(credentials)
    const chargers = await $fetch<any[]>(`${API_URL}/chargers`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return chargers.map((c: any) => ({
      id: c.id,
      name: c.name || `Laadpaal ${c.serialNumber}`,
      serial: c.serialNumber,
      type: 'easee' as const,
    }))
  },

  async linkDevice(credentials, deviceId) {
    const token = await getToken(credentials)
    await $fetch(`${API_URL}/chargers/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, device_id: deviceId }
  },

  async getDeviceStatus(credentials, deviceId) {
    const token = await getToken(credentials)
    const state = await $fetch<any>(`${API_URL}/chargers/${deviceId}/state`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return {
      state: state.chargerOpMode?.toString() || 'unknown',
      metrics: {
        power: state.totalPower || 0,
        energy_session: state.sessionEnergy || 0,
        voltage: state.voltage || 0,
      },
    }
  },

  async getDeviceData(credentials, deviceId, from, to) {
    const token = await getToken(credentials)
    const sessions = await $fetch<any[]>(
      `${API_URL}/chargers/${deviceId}/sessions?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    return (sessions || []).map((s: any) => ({
      timestamp: s.startTime,
      value: s.energyUsed || 0,
      unit: 'kWh',
      duration: s.duration,
    }))
  },
}

registerConnector(easeeConnector)
