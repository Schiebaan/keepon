// Smart meter composable — dual mode
import type { SmartMeter, SmartMeterReading } from '~~/shared/types/database'

export function useSmartMeter(customerId: string) {
  const mock = useMockData()

  // Both modes use mock data for now
  return {
    meter: computed(() => mock.getCustomerMeter(customerId) as SmartMeter | null),
    getReadings: (meterId: string) => mock.getMeterReadings(meterId) as SmartMeterReading[],

    async linkMeter(partnerId: string, postcode: string, meterId: string) {
      return mock.linkSmartMeter(customerId, partnerId, postcode, meterId)
      // TODO: POST to /api/smart-meters/link with Sundata integration
    },

    unlinkMeter() {
      mock.unlinkSmartMeter(customerId)
      // TODO: DELETE /api/smart-meters/:id
    },
  }
}
