import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Returns the logged-in customer's products with derived linkage status.
 * Used on /klant to decide which module cards to surface (solar, laadpaal, etc.)
 * and on the deep pages to show the "Gekoppeld" state.
 *
 * Linkage is encoded today in the `serial_number` field as `<integration>:<id>`:
 *   solar_panel → 'sundata:companyId/plantId/meterId'
 *   ev_charger  → 'easee:chargerId'
 */
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)

  const { data: customer } = await supabase
    .from('customers')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()
  if (!customer) return []

  const { data: products } = await supabase
    .from('customer_products')
    .select('id, category, name, brand, model, serial_number, notes, installation_date')
    .eq('customer_id', customer.id)
    .order('category')

  return (products || []).map((p) => {
    const s = typeof p.serial_number === 'string' ? p.serial_number : ''
    let integration: 'sundata' | 'easee' | 'weheat' | null = null
    let externalId: string | null = null
    if (p.category === 'solar_panel' && s.startsWith('sundata:')) {
      integration = 'sundata'
      externalId = s.slice('sundata:'.length)
    } else if (p.category === 'ev_charger' && s.startsWith('easee:')) {
      integration = 'easee'
      externalId = s.slice('easee:'.length)
    } else if (p.category === 'heat_pump' && s.startsWith('weheat:')) {
      integration = 'weheat'
      externalId = s.slice('weheat:'.length)
    }
    return {
      id: p.id,
      category: p.category,
      name: p.name,
      brand: p.brand,
      model: p.model,
      notes: p.notes,
      installation_date: p.installation_date,
      linked: !!integration,
      integration,
      external_id: externalId,
    }
  })
})
