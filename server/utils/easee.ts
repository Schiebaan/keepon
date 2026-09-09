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

/**
 * Alle sites waar dit account bij kan — de installaties van klanten dus.
 *
 * Easee pagineert met `offset`, niet met `page`: dat laatste wordt genegeerd
 * en geeft telkens dezelfde eerste honderd terug. Bij Volt4U scheelde dat
 * 15 installaties die anders onzichtbaar bleven.
 */
export interface EaseeSite {
  id: number
  name: string
  address: string | null
  installerAlias: string | null
  levelOfAccess: number | null
}

export async function listEaseeSites(credentials: Record<string, string>): Promise<EaseeSite[]> {
  const token = await getToken(credentials)
  const alles: EaseeSite[] = []
  const PAGINA = 100

  for (let offset = 0; offset < 5000; offset += PAGINA) {
    const batch = await $fetch<any[]>(`${API_URL}/sites?offset=${offset}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!Array.isArray(batch) || !batch.length) break

    for (const s of batch) {
      alles.push({
        id: s.id,
        name: s.name || `Site ${s.id}`,
        address: formatAddress(s.address),
        installerAlias: s.installerAlias || null,
        levelOfAccess: s.levelOfAccess ?? null,
      })
    }
    if (batch.length < PAGINA) break
  }
  return alles
}

/** De laadpalen die onder één site hangen. Meestal precies één. */
export async function listEaseeSiteChargers(
  credentials: Record<string, string>,
  siteId: number | string,
): Promise<{ id: string; name: string }[]> {
  const token = await getToken(credentials)
  const site = await $fetch<any>(`${API_URL}/sites/${siteId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const palen = (site?.circuits || []).flatMap((c: any) => c.chargers || [])
  return palen.map((p: any) => ({
    id: p.id,
    // Easee laat de naam vaak leeg of op "1" staan; dan is het id herkenbaarder.
    name: p.name && String(p.name).length > 2 ? p.name : `Laadpaal ${p.id}`,
  }))
}

/** Easee geeft het adres als object; hier tot één leesbare regel. */
function formatAddress(a: any): string | null {
  if (!a) return null
  if (typeof a === 'string') return a
  const delen = [a.street, a.buildingNumber, a.postCode, a.city].filter(Boolean)
  return delen.length ? delen.join(' ') : null
}

/**
 * Wat we van een laadpaal te weten kunnen komen.
 *
 * /state geeft de live laadtoestand, maar vereist een hoger toegangsniveau dan
 * levelOfAccess 1 — en op dat niveau staat elke paal bij Volt4U. Daar krijgen
 * we dus een 404, ook op palen die het account zélf bezit.
 *
 * Wat op niveau 1 wél werkt is de laatste laadsessie. Dat is geen live status,
 * maar wel bruikbaar: een paal die maanden geen sessie meer had verdient een
 * blik. En belangrijker: het voorkomt dat we de hele koppeling als "stuk"
 * bestempelen terwijl er alleen een rechtenbeperking is.
 */
export interface EaseeSignal {
  state: string | null
  lastSessionEnd: string | null
  stateAvailable: boolean
}

export async function getEaseeSignal(
  credentials: Record<string, string>,
  chargerId: string,
): Promise<EaseeSignal> {
  const token = await getToken(credentials)
  const H = { Authorization: `Bearer ${token}` }

  let state: string | null = null
  let stateAvailable = true
  try {
    const s = await $fetch<any>(`${API_URL}/chargers/${chargerId}/state`, { headers: H })
    state = s?.chargerOpMode?.toString() ?? null
  } catch (e: any) {
    // 404 hier betekent "niet beschikbaar op dit toegangsniveau", niet "paal weg".
    if (e?.status === 404 || e?.statusCode === 404 || /404/.test(String(e?.message))) {
      stateAvailable = false
    } else {
      throw e
    }
  }

  let lastSessionEnd: string | null = null
  try {
    const sess = await $fetch<any>(`${API_URL}/chargers/${chargerId}/sessions/latest`, { headers: H })
    lastSessionEnd = sess?.sessionEnd || sess?.sessionStart || null
  } catch {
    // Nog nooit geladen is geen storing.
  }

  return { state, lastSessionEnd, stateAvailable }
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
