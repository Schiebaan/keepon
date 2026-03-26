import type { DeviceSummary, DeviceStatus, DeviceDataPoint, LinkResult } from '~~/shared/types/modules'
import type { IntegrationType } from '~~/shared/types/database'

export interface IntegrationConnector {
  type: IntegrationType
  verifyCredentials(credentials: Record<string, string>): Promise<boolean>
  listDevices(credentials: Record<string, string>): Promise<DeviceSummary[]>
  linkDevice(credentials: Record<string, string>, deviceId: string): Promise<LinkResult>
  getDeviceStatus(credentials: Record<string, string>, deviceId: string): Promise<DeviceStatus>
  getDeviceData(credentials: Record<string, string>, deviceId: string, from: string, to: string): Promise<DeviceDataPoint[]>
}

const connectors: Record<string, IntegrationConnector> = {}

export function registerConnector(connector: IntegrationConnector) {
  connectors[connector.type] = connector
}

export function getConnector(type: IntegrationType): IntegrationConnector {
  const connector = connectors[type]
  if (!connector) {
    throw createError({ statusCode: 400, message: `Onbekende integratie: ${type}` })
  }
  return connector
}
