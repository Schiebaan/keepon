import type { IntegrationConnector } from './connectors'
import type { DeviceSummary, DeviceStatus, DeviceDataPoint, LinkResult } from '~~/shared/types/modules'

const BASE_URL = 'https://api.easee.com/api'

async function getToken(credentials: Record<string, string>): Promise<string> {
  const response = await $fetch<{ accessToken: string }>(`${BASE_URL}/accounts/login`, {
    method: 'POST',
    body: {
      userName: credentials.username,
      password: credentials.password,
    },
  })
  return response.accessToken
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
    const chargers = await $fetch<any[]>(`${BASE_URL}/chargers`, {
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
    await $fetch(`${BASE_URL}/chargers/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, device_id: deviceId }
  },

  async getDeviceStatus(credentials, deviceId) {
    const token = await getToken(credentials)
    const state = await $fetch<any>(`${BASE_URL}/chargers/${deviceId}/state`, {
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
      `${BASE_URL}/chargers/${deviceId}/sessions?from=${from}&to=${to}`,
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
