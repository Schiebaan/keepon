import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Centrale prijsberekenaar — DE bron van waarheid voor "wat kost deze klant?".
 * Gebruikt door zowel /api/customers/[id]/charge (om Mollie aan te sturen) als
 * /api/customer/contracts (om de klant te tonen wat 'ie krijgt).
 *
 * Cascade per module:
 *   1. customer_module_prices.price_monthly_cents  (override voor déze klant)
 *   2. partner_module_configs.price_monthly        (standaard van de partner)
 *
 * Totaal:
 *   billing_interval='monthly' → som van module-prijzen
 *   billing_interval='yearly'  → som × (12 − yearly_discount_months)
 *
 * Trial: als de klant een mandaat heeft en `mandate_at + trial_months` ligt in
 * de toekomst, geven we `skip_reason='trial'` terug — handmatig of via cron
 * een charge proberen levert dan niets op. Klant ziet wel een banner.
 *
 * NB: dit raakt expliciet niet de Mollie-interactie zelf — die blijft in
 * charge.post.ts. Hier zit alleen pricing-logic, geen netwerk-calls.
 */

export type ModuleLine = {
  module_type: string
  name: string
  /** Wat deze klant per maand betaalt voor deze module (override of standaard). */
  price_monthly_cents: number
  /** Indien override-actief: het standaardtarief van de partner, voor weergave. */
  default_price_monthly_cents: number | null
  /** Vrije tekst die admin invulde bij het instellen van de override. */
  override_reason: string | null
}

export type ChargeComputation = {
  /** Te incasseren bedrag — 0 indien skip_reason gezet is. */
  amount_cents: number
  /** Maand-totaal voor weergave ("Per jaar X (= Y/mnd)"); ongeacht interval. */
  monthly_total_cents: number
  /** Yearly-equivalent ongeacht interval (handig voor /klant/contracten label). */
  yearly_total_cents: number
  /** Hoeveel maanden korting bij jaar (alleen ≠ 0 als billing_interval='yearly'). */
  yearly_discount_months: number
  billing_interval: 'monthly' | 'yearly'
  /** Datums die we in de payments-rij stempelen. */
  period_start: string                          // YYYY-MM-DD
  period_end: string                            // YYYY-MM-DD (laatste dag van periode)
  lines: ModuleLine[]
  /** Trial-info — null als geen trial of trial voorbij. */
  trial: {
    months: number
    started_at: string | null                   // = mandate_at
    ends_at: string | null                      // = mandate_at + months
    active: boolean                             // = now < ends_at
  } | null
  /** Reden om niet te incasseren ondanks dat klant en mandaat alles in orde lijken. */
  skip_reason: 'trial' | 'no_modules' | 'no_price' | null
  /** Human-leesbare beschrijving — handig als description voor Mollie. */
  description: string
}

const MODULE_LABELS: Record<string, string> = {
  solar_panel: 'Zonnepanelen',
  heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal',
  battery: 'Thuisbatterij',
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getTime())
  r.setMonth(r.getMonth() + n)
  return r
}
function lastDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}
function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export async function computeCustomerCharge(
  supabase: SupabaseClient,
  customerId: string,
  opts?: { now?: Date; periodStart?: Date },
): Promise<ChargeComputation> {
  const now = opts?.now ?? new Date()

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, accepted_modules, billing_interval, yearly_discount_months, trial_months, mandate_at')
    .eq('id', customerId)
    .single()

  if (!customer) {
    return emptyResult({
      reason: 'no_modules',
      now,
      periodStart: opts?.periodStart,
      billing_interval: 'monthly',
      yearly_discount_months: 0,
      trial: null,
    })
  }

  const billing_interval: 'monthly' | 'yearly' =
    customer.billing_interval === 'yearly' ? 'yearly' : 'monthly'
  const yearly_discount_months = Math.max(0, Number(customer.yearly_discount_months) || 0)
  const trial_months = Math.max(0, Number(customer.trial_months) || 0)

  // Trial-status: telt vanaf mandate_at (= moment van IBAN/mandaat-afgifte).
  // Voor mandaat-loze klanten kan er sowieso niet geïncasseerd worden, dus de
  // trial-state heeft daar geen impact op charging — maar we melden 'm wel
  // terug zodat /klant/contracten 'm netjes kan tonen.
  let trial: ChargeComputation['trial'] = null
  if (trial_months > 0) {
    if (customer.mandate_at) {
      const startedAt = new Date(customer.mandate_at)
      const endsAt = addMonths(startedAt, trial_months)
      trial = {
        months: trial_months,
        started_at: customer.mandate_at,
        ends_at: endsAt.toISOString(),
        active: now < endsAt,
      }
    } else {
      trial = {
        months: trial_months,
        started_at: null,
        ends_at: null,
        active: false,
      }
    }
  }

  const accepted: string[] = Array.isArray(customer.accepted_modules) ? customer.accepted_modules : []
  if (!accepted.length) {
    return emptyResult({
      reason: 'no_modules',
      now,
      periodStart: opts?.periodStart,
      billing_interval,
      yearly_discount_months,
      trial,
    })
  }

  // Standaardtarieven van de partner (default per module)
  const { data: configs } = await supabase
    .from('partner_module_configs')
    .select('price_monthly, is_enabled, module_definition:module_definitions(type, name)')
    .eq('partner_id', customer.partner_id)
  const defaultByType = new Map<string, { price: number; name: string }>()
  for (const cfg of (configs || []) as any[]) {
    const t = cfg?.module_definition?.type
    if (!t) continue
    if (cfg.is_enabled === false) continue
    defaultByType.set(t, {
      price: cfg.price_monthly || 0,
      name: cfg.module_definition.name || MODULE_LABELS[t] || t,
    })
  }

  // Overrides voor déze klant
  const { data: overrides } = await supabase
    .from('customer_module_prices')
    .select('module_type, price_monthly_cents, reason')
    .eq('customer_id', customer.id)
  const overrideByType = new Map<string, { price: number; reason: string | null }>()
  for (const o of (overrides || []) as any[]) {
    overrideByType.set(o.module_type, {
      price: o.price_monthly_cents || 0,
      reason: o.reason || null,
    })
  }

  // Build lines — accepteer alleen modules die de klant heeft geaccepteerd
  const lines: ModuleLine[] = []
  let monthlyTotal = 0
  for (const t of accepted) {
    const ov = overrideByType.get(t)
    const def = defaultByType.get(t)
    const price = ov?.price ?? def?.price ?? 0
    const name = def?.name || MODULE_LABELS[t] || t
    lines.push({
      module_type: t,
      name,
      price_monthly_cents: price,
      default_price_monthly_cents: ov ? (def?.price ?? null) : null,
      override_reason: ov?.reason ?? null,
    })
    monthlyTotal += price
  }

  const yearlyTotal =
    monthlyTotal * Math.max(0, 12 - yearly_discount_months)

  // Periode-grenzen
  const periodStart = opts?.periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1)
  const periodEnd = billing_interval === 'yearly'
    ? new Date(periodStart.getFullYear() + 1, periodStart.getMonth(), periodStart.getDate() - 1)
    : lastDayOfMonth(periodStart)

  const amount_cents = billing_interval === 'yearly' ? yearlyTotal : monthlyTotal

  // Skip-redenen — pricing-helper bepaalt deze ook, charge-endpoint gebruikt 'm
  let skip_reason: ChargeComputation['skip_reason'] = null
  if (!lines.length) skip_reason = 'no_modules'
  else if (amount_cents <= 0) skip_reason = 'no_price'
  else if (trial?.active) skip_reason = 'trial'

  // Description voor Mollie (en als fallback voor admin)
  const moduleNames = lines.map(l => l.name).join(' + ')
  const description = billing_interval === 'yearly'
    ? `Servicekosten ${moduleNames} (jaarbedrag)`
    : `Servicekosten ${moduleNames}`

  return {
    amount_cents: skip_reason ? 0 : amount_cents,
    monthly_total_cents: monthlyTotal,
    yearly_total_cents: yearlyTotal,
    yearly_discount_months,
    billing_interval,
    period_start: isoDate(periodStart),
    period_end: isoDate(periodEnd),
    lines,
    trial,
    skip_reason,
    description,
  }
}

function emptyResult(args: {
  reason: ChargeComputation['skip_reason']
  now: Date
  periodStart?: Date
  billing_interval: 'monthly' | 'yearly'
  yearly_discount_months: number
  trial: ChargeComputation['trial']
}): ChargeComputation {
  const ps = args.periodStart ?? new Date(args.now.getFullYear(), args.now.getMonth(), 1)
  const pe = args.billing_interval === 'yearly'
    ? new Date(ps.getFullYear() + 1, ps.getMonth(), ps.getDate() - 1)
    : lastDayOfMonth(ps)
  return {
    amount_cents: 0,
    monthly_total_cents: 0,
    yearly_total_cents: 0,
    yearly_discount_months: args.yearly_discount_months,
    billing_interval: args.billing_interval,
    period_start: isoDate(ps),
    period_end: isoDate(pe),
    lines: [],
    trial: args.trial,
    skip_reason: args.reason,
    description: 'Servicekosten',
  }
}
