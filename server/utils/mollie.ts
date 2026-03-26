import { createMollieClient } from '@mollie/api-client'
import type { H3Event } from 'h3'

export function getMollieClient(apiKey: string) {
  return createMollieClient({ apiKey })
}

export async function getPartnerMollieClient(event: H3Event) {
  const tenant = event.context.tenant
  if (!tenant) {
    throw createError({ statusCode: 400, message: 'Geen partner omgeving gevonden' })
  }

  const supabase = getServiceRoleClient(event)
  const { data } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', tenant.id)
    .eq('integration_type', 'mollie')
    .eq('is_active', true)
    .single()

  if (!data?.credentials?.api_key) {
    throw createError({ statusCode: 500, message: 'Mollie niet geconfigureerd voor deze partner' })
  }

  return getMollieClient(data.credentials.api_key)
}

export function formatMollieAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}
