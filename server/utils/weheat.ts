import type { IntegrationConnector } from './connectors'
import { getServiceRoleClient } from './supabase'
import type { H3Event } from 'h3'
import {
  WEHEAT_TOKEN_URL, WEHEAT_API_URL, weheatClientParams,
  WeheatAccessBlockedError, isWeheatBlocked,
} from './weheat-config'

const API_URL = WEHEAT_API_URL

/**
 * Tokenbeheer voor Weheat.
 *
 * Dit ging structureel mis. De vernieuwde tokens werden alleen opgeslagen als
 * de aanroeper een H3-event én partner-id meegaf, en geen enkele
 * connector-methode deed dat. Gevolg: de credentials stonden sinds 15 mei
 * stil, elke aanroep probeerde eerst een refresh-token van mei, en logde daarna
 * volledig opnieuw in via het inlogscherm. Per storingscontrole vijf logins,
 * plus één per keer dat een klant zijn warmtepomppagina opende.
 *
 * Nu:
 *   1. Een token in het geheugen, zolang hij geldig is.
 *   2. Single-flight: gelijktijdige aanroepen voor hetzelfde account wachten op
 *      dezelfde vernieuwing in plaats van elk apart in te loggen.
 *   3. Opslaan werkt altijd — met partner-id als die er is, anders op het
 *      Weheat-account zelf.
 *   4. Een verlopen refresh-token wordt direct opgeruimd, zodat de volgende
 *      keer niet eerst een zinloze poging volgt.
 */

interface WeheatCreds {
  refresh_token?: string
  refresh_token_expires_at?: string
  access_token?: string
  access_token_expires_at?: string
  connected_at?: string
  // Voor een nieuwe login als de refresh-token verlopen is.
  username?: string
  password?: string
}

interface TokenSet {
  access_token: string
  refresh_token?: string
  access_expires_at: number
  refresh_expires_at?: number
}

const tokenCache = new Map<string, TokenSet>()
const inFlight = new Map<string, Promise<string>>()
const MARGE_MS = 60_000

function cacheKey(c: WeheatCreds): string {
  return c.username || c.refresh_token?.slice(-24) || 'weheat'
}

async function exchangeRefreshToken(refreshToken: string) {
  return await $fetch<any>(WEHEAT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      ...weheatClientParams(),
      refresh_token: refreshToken,
    }).toString(),
  })
}

/**
 * Schrijf de nieuwe tokens terug. Zonder partner-id zoeken we de rij op het
 * Weheat-account: in de storingscontrole is er geen event, en juist daar
 * werden de tokens nooit bewaard.
 */
async function persistCreds(event: H3Event | undefined, partnerId: string | undefined, next: WeheatCreds) {
  try {
    const supabase = getServiceRoleClient(event as H3Event)
    let q = supabase.from('integration_credentials').update({ credentials: next }).eq('integration_type', 'weheat')
    if (partnerId) q = q.eq('partner_id', partnerId)
    else if (next.username) q = q.eq('credentials->>username', next.username)
    else return
    const { error } = await q
    if (error) console.error('[weheat] tokens opslaan mislukt:', error.message)
  } catch (e: any) {
    // Niet fataal: de token in het geheugen werkt voor deze aanroep.
    console.error('[weheat] tokens opslaan mislukt:', e?.message)
  }
}

function toCreds(base: WeheatCreds, t: TokenSet): WeheatCreds {
  return {
    ...base,
    access_token: t.access_token,
    access_token_expires_at: new Date(t.access_expires_at).toISOString(),
    refresh_token: t.refresh_token,
    refresh_token_expires_at: t.refresh_expires_at ? new Date(t.refresh_expires_at).toISOString() : undefined,
  }
}

async function vernieuw(credentials: WeheatCreds, event?: H3Event, partnerId?: string): Promise<string> {
  const key = cacheKey(credentials)
  const bekend = tokenCache.get(key)
  const refresh = bekend?.refresh_token || credentials.refresh_token
  const refreshExp = bekend?.refresh_expires_at
    ?? (credentials.refresh_token_expires_at ? new Date(credentials.refresh_token_expires_at).getTime() : undefined)

  // 1) Refresh-token, als die er is en niet aantoonbaar verlopen.
  if (refresh && (!refreshExp || refreshExp > Date.now() + MARGE_MS)) {
    try {
      const r = await exchangeRefreshToken(refresh)
      const t: TokenSet = {
        access_token: r.access_token,
        refresh_token: r.refresh_token || refresh,
        access_expires_at: Date.now() + (r.expires_in || 300) * 1000,
        refresh_expires_at: r.refresh_expires_in ? Date.now() + r.refresh_expires_in * 1000 : refreshExp,
      }
      tokenCache.set(key, t)
      await persistCreds(event, partnerId, toCreds(credentials, t))
      return t.access_token
    } catch {
      // Verlopen of ingetrokken. Niet bewaren, anders proberen we hem volgende
      // keer weer.
      tokenCache.delete(key)
    }
  }

  // 2) Nieuwe login met gebruikersnaam en wachtwoord.
  if (credentials.username && credentials.password) {
    const { loginWeheatHeadless } = await import('./weheat-headless')
    const r: any = await loginWeheatHeadless(credentials.username, credentials.password)
    const t: TokenSet = {
      access_token: r.access_token,
      refresh_token: r.refresh_token,
      access_expires_at: Date.now() + (r.expires_in || 300) * 1000,
      refresh_expires_at: r.refresh_expires_in ? Date.now() + r.refresh_expires_in * 1000 : undefined,
    }
    tokenCache.set(key, t)
    await persistCreds(event, partnerId, toCreds(credentials, t))
    console.log('[weheat] nieuwe login uitgevoerd')
    return t.access_token
  }

  throw new Error('Weheat-verbinding verlopen. Klik in /admin/settings op "Verbinden via Weheat" om opnieuw in te loggen.')
}

async function getAccessToken(credentials: WeheatCreds, event?: H3Event, partnerId?: string): Promise<string> {
  if (!credentials.refresh_token && !(credentials.username && credentials.password)) {
    throw new Error('Weheat is nog niet verbonden. Klik in /admin/settings op "Verbinden via Weheat".')
  }
  const key = cacheKey(credentials)

  // Geheugen eerst, dan de opgeslagen token.
  const bekend = tokenCache.get(key)
  if (bekend && bekend.access_expires_at > Date.now() + MARGE_MS) return bekend.access_token
  const opgeslagenExp = credentials.access_token_expires_at ? new Date(credentials.access_token_expires_at).getTime() : 0
  if (credentials.access_token && opgeslagenExp > Date.now() + MARGE_MS) return credentials.access_token

  // Loopt er al een vernieuwing voor dit account? Dan meeliften.
  const lopend = inFlight.get(key)
  if (lopend) return lopend

  const p = vernieuw(credentials, event, partnerId).finally(() => inFlight.delete(key))
  inFlight.set(key, p)
  return p
}

/** $fetch naar Weheat, met herkenning van hun blokkade voor externe clients. */
async function weheatGet<T = any>(path: string, token: string): Promise<T> {
  try {
    return await $fetch<T>(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } })
  } catch (e: any) {
    if (isWeheatBlocked(e)) throw new WeheatAccessBlockedError()
    throw e
  }
}

export const weheatConnector: IntegrationConnector = {
  type: 'weheat',

  async verifyCredentials(credentials) {
    try {
      const token = await getAccessToken(credentials as WeheatCreds)
      const res = await weheatGet(`/heat-pumps`, token)
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
      const resp = await weheatGet<any>(`/heat-pumps?page=${page}&pageSize=50`, token)
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
    await weheatGet(`/heat-pumps/${deviceId}`, token)
    return { success: true, device_id: deviceId }
  },

  /**
   * Er bestaat geen /status-endpoint bij Weheat; de actuele toestand komt uit
   * de laatste logregel. De veldnamen hierboven (heat_pump_state, output_power,
   * cop, dhw_temperature) bestonden evenmin — die hadden stilzwijgend nullen
   * opgeleverd zodra de aanroep ooit wél was geslaagd.
   */
  async getDeviceStatus(credentials, deviceId) {
    const token = await getAccessToken(credentials as WeheatCreds)
    const log = await weheatGet<any>(`/heat-pumps/${deviceId}/logs/latest`, token)

    return {
      state: log?.state !== undefined && log?.state !== null ? String(log.state) : 'unknown',
      metrics: {
        water_in: log?.tWaterIn ?? 0,
        water_out: log?.tWaterOut ?? 0,
        air_in: log?.tAirIn ?? 0,
        compressor_rpm: log?.rpm ?? 0,
        signal_strength: log?.signalStrength ?? 0,
      },
      // Hoe oud is deze meting? Een pomp die offline gaat houdt zijn laatste
      // logregel; alleen de tijdstempel verraadt dat er niets meer binnenkomt.
      measured_at: log?.timestamp || null,
    } as any
  },

  async getDeviceData(credentials, deviceId, from, to) {
    const token = await getAccessToken(credentials as WeheatCreds)
    const data = await weheatGet<any[]>(`/heat-pumps/${deviceId}/energy?from=${from}&to=${to}`, token)

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
