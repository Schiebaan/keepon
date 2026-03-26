import type { IntegrationType, ModuleType } from './database'

export interface DeviceSummary {
  id: string
  name: string
  serial?: string
  status?: string
  type: IntegrationType
}

export interface DeviceStatus {
  state: string
  metrics: Record<string, number | string>
}

export interface DeviceDataPoint {
  timestamp: string
  value: number
  unit: string
  duration?: number
}

export interface LinkResult {
  success: boolean
  device_id: string
  meta?: Record<string, unknown>
}

export interface ModuleInfo {
  type: ModuleType
  name: string
  description: string
  icon: string
  priceMonthly: number
  priceYearly: number
  isActive: boolean
}
