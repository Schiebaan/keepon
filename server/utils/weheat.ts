import type { IntegrationConnector } from './connectors'
import type { DeviceSummary, DeviceStatus, DeviceDataPoint, LinkResult } from '~~/shared/types/modules'

const AUTH_URL = 'https://auth.weheat.nl/auth/realms/Weheat/protocol/openid-connect/token'
const API_URL = 'https://api.weheat.nl/third_party'

async function getToken(credentials: Record<string, string>): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
  })

  const response = await $fetch<{ access_token: string }>(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  return response.access_token
}

export const weheatConnector: IntegrationConnector = {
  type: 'weheat',

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
    const heatPumps = await $fetch<any[]>(`${API_URL}/heat-pumps`, {
      headers: { Authorization: `Bearer ${token}` },
    })

    return heatPumps.map((hp: any) => ({
      id: hp.id,
      name: hp.name || `Warmtepomp ${hp.serial_number}`,
      serial: hp.serial_number,
      type: 'weheat' as const,
    }))
  },

  async linkDevice(credentials, deviceId) {
    const token = await getToken(credentials)
    await $fetch(`${API_URL}/heat-pumps/${deviceId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return { success: true, device_id: deviceId }
  },

  async getDeviceStatus(credentials, deviceId) {
    const token = await getToken(credentials)
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
    const token = await getToken(credentials)
    const data = await $fetch<any[]>(
      `${API_URL}/heat-pumps/${deviceId}/energy?from=${from}&to=${to}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    return (data || []).map((d: any) => ({
      timestamp: d.timestamp,
      value: d.energy_output || 0,
      unit: 'kWh',
    }))
  },
}

registerConnector(weheatConnector)
