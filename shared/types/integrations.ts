// Sundata API types
export interface SundataPlant {
  id: number
  name: string
  company_id: number
  meters: SundataMeter[]
}

export interface SundataMeter {
  id: number
  name: string
  type: string
}

export interface SundataYieldPoint {
  date: string
  yield_in_wh: number
}

// Weheat API types
export interface WeheatHeatPump {
  id: string
  name: string
  serial_number: string
  model: string
}

export interface WeheatStatus {
  heat_pump_state: string
  output_power: number
  cop: number
  dhw_temperature: number
  compressor_percentage: number
}

// Easee API types
export interface EaseeCharger {
  id: string
  name: string
  serialNumber: string
  chargerOpMode: number
}

export interface EaseeSession {
  id: string
  startTime: string
  endTime: string
  energyUsed: number
  duration: number
}
