import type { IntegrationConnector } from './connectors'
import type { DeviceSummary, DeviceStatus, DeviceDataPoint, LinkResult } from '~~/shared/types/modules'
import { getServiceRoleClient } from './supabase'
import type { H3Event } from 'h3'

const BASE_URL = 'https://api.sundata.nl/api/v0'
export const SUNDATA_BASE_URL = BASE_URL

async function getToken(credentials: Record<string, string>): Promise<string> {
  const response = await $fetch<{ access_token: string }>(`${BASE_URL}/sign-in`, {
    method: 'POST',
    body: {
      email: credentials.api_email,
      password: credentials.api_password,
    },
  })
  return response.access_token
}

export const sundataConnector: IntegrationConnector = {
  type: 'sundata',

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
    const companies = await $fetch<any[]>(`${BASE_URL}/users/me/companies`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    const devices: DeviceSummary[] = []
    for (const company of companies) {
      const plants = await $fetch<any[]>(`${BASE_URL}/companies/${company.id}/plants`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      for (const plant of plants) {
        devices.push({
          id: `${company.id}:${plant.id}`,
          name: plant.name || `Plant ${plant.id}`,
          type: 'sundata',
        })
      }
    }
    return devices
  },

  async linkDevice(credentials, deviceId) {
    // Verify device exists
    const token = await getToken(credentials)
    const [companyId, plantId] = deviceId.split(':')
    await $fetch(`${BASE_URL}/companies/${companyId}/plants/${plantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, device_id: deviceId }
  },

  async getDeviceStatus(credentials, deviceId) {
    const token = await getToken(credentials)
    const [companyId, plantId] = deviceId.split(':')
    const plant = await $fetch<any>(`${BASE_URL}/companies/${companyId}/plants/${plantId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return {
      state: 'active',
      metrics: {
        name: plant.name,
        capacity: plant.capacity_kwp || 0,
      },
    }
  },

  async getDeviceData(credentials, deviceId, from, to) {
    const token = await getToken(credentials)
    const [companyId, plantId] = deviceId.split(':')

    // Get meters for this plant
    const meters = await $fetch<any[]>(
      `${BASE_URL}/companies/${companyId}/plants/${plantId}/meters`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!meters.length) return []

    const meterId = meters[0].id
    const yieldData = await $fetch<{ data: any[] }>(
      `${BASE_URL}/companies/${companyId}/plants/${plantId}/meters/${meterId}/yield?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    return (yieldData.data || []).map((d: any) => ({
      timestamp: d.date,
      value: d.yield_in_wh,
      unit: 'Wh',
    }))
  },
}

registerConnector(sundataConnector)

// ----------------------------------------------------------------------------
// Helpers used by the onboarding wizard endpoints (create-plant, create-meter).
// ----------------------------------------------------------------------------

/** Resolve partner id from tenant subdomain > user role > platform_admin fallback. */
export async function resolvePartnerId(event: H3Event, userId: string): Promise<string> {
  const supabase = getServiceRoleClient(event)
  const tenant = (event.context as any).tenant
  if (tenant?.id) return tenant.id

  const { data: role } = await supabase
    .from('user_roles')
    .select('partner_id, role')
    .eq('user_id', userId)
    .single()

  let partnerId = role?.partner_id
  if (role?.role === 'platform_admin' && !partnerId) {
    const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
    partnerId = fp?.id
  }
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })
  return partnerId
}

/** Sign in to Sundata with the partner's stored credentials. Returns headers + companyId. */
export async function sundataSession(event: H3Event, partnerId: string) {
  const supabase = getServiceRoleClient(event)
  const { data: cred } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', partnerId)
    .eq('integration_type', 'sundata')
    .eq('is_active', true)
    .single()

  if (!cred?.credentials?.email) {
    throw createError({ statusCode: 400, message: 'Sundata is niet gekoppeld' })
  }

  const signin = await $fetch<{ access_token: string }>(`${BASE_URL}/sign-in`, {
    method: 'POST',
    body: { email: cred.credentials.email, password: cred.credentials.password },
  })
  const headers = { Authorization: `Bearer ${signin.access_token}` }

  const companies = await $fetch<any[]>(`${BASE_URL}/users/me/companies`, { headers })
  if (!companies?.length) {
    throw createError({ statusCode: 400, message: 'Geen bedrijf gevonden in Sundata' })
  }

  return { headers, companyId: companies[0].id as number }
}

/** Convert Sundata's validation error payload into a readable Dutch message. */
export function parseSundataError(err: any, prefix = ''): string {
  const msg = err?.data?.error?.messages
    ? Object.entries(err.data.error.messages)
        .map(([k, v]: any) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
        .join(' · ')
    : err?.data?.message || err?.message || 'Onbekende fout'
  return prefix ? `${prefix}: ${msg}` : msg
}

/**
 * Find an existing plant in Sundata by case-insensitive name match.
 * Sundata paginates plants, so we walk up to 5 pages before giving up.
 */
export async function findExistingPlantByName(
  headers: Record<string, string>,
  companyId: number,
  plantName: string,
): Promise<any | null> {
  const target = plantName.trim().toLowerCase()
  let url: string | null = `${BASE_URL}/companies/${companyId}/plants?per_page=100`
  for (let page = 0; page < 5 && url; page++) {
    try {
      const res: any = await $fetch(url, { headers })
      const items: any[] = res.data || (Array.isArray(res) ? res : [])
      const match = items.find((p: any) => (p.name || '').trim().toLowerCase() === target)
      if (match) return match
      url = res.next_page_url || null
    } catch {
      return null
    }
  }
  return null
}
