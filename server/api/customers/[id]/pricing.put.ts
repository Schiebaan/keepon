import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Update pricing-instellingen voor één klant — na uitnodigen wijzigen.
 *
 * Body (alles optioneel; alleen meegegeven velden worden gewijzigd):
 *   billing_interval: 'monthly' | 'yearly'
 *   yearly_discount_months: number
 *   trial_months: number
 *   module_price_overrides: [{ module_type, price_monthly_cents, reason? }]
 *     → Vervangt het hele override-setje voor deze klant. Stuur lege array
 *       om alle overrides te verwijderen, of laat 'm weg om ongewijzigd te
 *       laten.
 *
 * Alleen partner_admins van de partner van deze klant mogen wijzigen.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const customerId = getRouterParam(event, 'id')
  if (!customerId) throw createError({ statusCode: 400, message: 'customer id ontbreekt' })

  const supabase = getServiceRoleClient(event)
  const body = await readBody(event).catch(() => ({} as any))

  // Resolve partner scope (zelfde patroon als de andere admin-endpoints)
  const tenant = (event.context as any).tenant
  let partnerId = tenant?.id
  if (!partnerId) {
    const { data: role } = await supabase.from('user_roles').select('partner_id, role').eq('user_id', user.id).single()
    partnerId = role?.partner_id
    if (role?.role === 'platform_admin' && !partnerId) {
      const { data: fp } = await supabase.from('partners').select('id').limit(1).single()
      partnerId = fp?.id
    }
  }
  if (!partnerId) throw createError({ statusCode: 400, message: 'Geen partner context' })

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id')
    .eq('id', customerId)
    .eq('partner_id', partnerId)
    .single()
  if (!customer) throw createError({ statusCode: 404, message: 'Klant niet gevonden' })

  // --- Bouw customer-update -----------------------------------------------
  const updates: Record<string, any> = {}
  if (body?.billing_interval === 'monthly' || body?.billing_interval === 'yearly') {
    updates.billing_interval = body.billing_interval
  }
  if (body?.yearly_discount_months !== undefined) {
    const v = Math.max(0, Math.min(12, Number(body.yearly_discount_months) || 0))
    updates.yearly_discount_months = v
  }
  if (body?.trial_months !== undefined) {
    const v = Math.max(0, Math.min(60, Math.floor(Number(body.trial_months) || 0)))
    updates.trial_months = v
  }

  if (Object.keys(updates).length) {
    const { error } = await supabase.from('customers').update(updates).eq('id', customerId)
    if (error) throw createError({ statusCode: 500, message: 'Tarief opslaan mislukt: ' + error.message })
  }

  // --- Module-overrides ----------------------------------------------------
  // Vervangstrategie: stuurt admin een module_price_overrides-array mee, dan
  // is dat de NIEUWE complete set voor deze klant. Niet meegestuurde modules
  // worden verwijderd.
  let overrideStats: { kept: number; removed: number } | null = null
  if (Array.isArray(body?.module_price_overrides)) {
    const rows = (body.module_price_overrides as any[])
      .map((o) => {
        const t = String(o?.module_type || '').trim()
        const price = Math.max(0, Math.floor(Number(o?.price_monthly_cents) || 0))
        if (!t || !price) return null
        return {
          customer_id: customerId,
          module_type: t,
          price_monthly_cents: price,
          reason: typeof o?.reason === 'string' ? o.reason.trim().slice(0, 200) || null : null,
        }
      })
      .filter(Boolean) as any[]

    // Eerst alles wissen, dan opnieuw insert — eenvoudiger dan diff-strategie
    // en wij hoeven niet bang te zijn voor concurrency (één admin tegelijk per
    // klantdossier, geen high-velocity writes).
    const { error: delErr } = await supabase
      .from('customer_module_prices')
      .delete()
      .eq('customer_id', customerId)
    if (delErr) throw createError({ statusCode: 500, message: 'Oude overrides wissen mislukt: ' + delErr.message })

    if (rows.length) {
      const { error: insErr } = await supabase.from('customer_module_prices').insert(rows)
      if (insErr) throw createError({ statusCode: 500, message: 'Overrides opslaan mislukt: ' + insErr.message })
    }
    overrideStats = { kept: rows.length, removed: 0 /* niet exact, maar volstaat voor audit */ }
  }

  await auditLog(event, 'customer.pricing_updated', 'customer', customerId, {
    updates,
    override_count: overrideStats?.kept ?? null,
  })

  return { ok: true, updates, override_count: overrideStats?.kept ?? null }
})
