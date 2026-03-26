import type { IntegrationConnector } from './connectors'
import type { DeviceSummary, DeviceStatus, DeviceDataPoint, LinkResult } from '~~/shared/types/modules'

const BASE_URL = 'https://api.sundata.nl/api/v0'

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
