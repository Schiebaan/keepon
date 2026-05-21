import { getServiceRoleClient } from '~~/server/utils/supabase'
import { SUNDATA_BASE_URL, sundataSession, parseSundataError } from '~~/server/utils/sundata'

/**
 * Summary of the logged-in customer's solar installation:
 *   - Plant details (name, capacity, orientation, tilt, address)
 *   - Total yield for today, this month, this year
 *   - Predicted yield for this month/year (from Sundata's forecast)
 *   - Daily history for the last 30 days (for a small sparkline)
 *
 * Returns { connected: false } when the customer has no solar_panel product with a Sundata link.
 */
type ChartPeriod = 'week' | 'month' | 'year' | 'since_start' | 'custom'

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function pickBucket(days: number): 'day' | 'month' {
  return days > 62 ? 'month' : 'day'
}

function computeChartRange(
  period: ChartPeriod,
  today: Date,
  monitoredSince?: string | null,
  customStart?: string,
  customEnd?: string,
): { start: string; end: string; bucket: 'day' | 'month' } {
  const todayStr = fmtDate(today)
  if (period === 'week') {
    const s = new Date(today); s.setDate(s.getDate() - 6)
    return { start: fmtDate(s), end: todayStr, bucket: 'day' }
  }
  if (period === 'year') {
    return { start: `${today.getFullYear()}-01-01`, end: todayStr, bucket: 'month' }
  }
  if (period === 'since_start' && monitoredSince) {
    const ms = new Date(monitoredSince)
    const days = Math.round((today.getTime() - ms.getTime()) / (24 * 60 * 60 * 1000))
    return { start: monitoredSince.slice(0, 10), end: todayStr, bucket: pickBucket(days) }
  }
  if (period === 'custom' && customStart && customEnd) {
    const s = new Date(customStart), e = new Date(customEnd)
    const days = Math.round((e.getTime() - s.getTime()) / (24 * 60 * 60 * 1000))
    return { start: customStart, end: customEnd, bucket: pickBucket(days) }
  }
  // Default: month = last 30 days
  const s = new Date(today); s.setDate(s.getDate() - 29)
  return { start: fmtDate(s), end: todayStr, bucket: 'day' }
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)
  const query = getQuery(event)
  const chartPeriod = (query.chart_period as ChartPeriod) || 'month'
  const customStart = query.start_date as string | undefined
  const customEnd = query.end_date as string | undefined

  // Find the customer record for this auth user
  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name')
    .eq('auth_user_id', user.id)
    .single()

  if (!customer) {
    return { connected: false, reason: 'no_customer_record' }
  }

  // Find a solar_panel product with a sundata: link in serial_number
  const { data: products } = await supabase
    .from('customer_products')
    .select('id, name, brand, model, serial_number, notes, installation_date')
    .eq('customer_id', customer.id)
    .eq('category', 'solar_panel')
    .order('created_at', { ascending: false })

  const solar = (products || []).find(p => (p.serial_number || '').startsWith('sundata:'))
  if (!solar) {
    return { connected: false, reason: 'no_sundata_link' }
  }

  const [companyIdStr, plantIdStr, meterIdStr] = solar.serial_number!
    .slice('sundata:'.length)
    .split('/')
  const companyId = Number(companyIdStr)
  const plantId = Number(plantIdStr)
  const meterId = Number(meterIdStr)

  if (!companyId || !plantId || !meterId) {
    return { connected: false, reason: 'invalid_link', link: solar.serial_number }
  }

  // Get a Sundata session using the partner's stored credentials
  let headers: Record<string, string>
  try {
    const session = await sundataSession(event, customer.partner_id)
    headers = session.headers
  } catch (err: any) {
    return { connected: false, reason: 'sundata_auth_failed', error: parseSundataError(err) }
  }

  // Fetch plant + meter in parallel; fall back to minimal data if either fails
  const [plant, meter] = await Promise.all([
    $fetch<any>(`${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}`, { headers }).catch(() => null),
    $fetch<any>(`${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/meters/${meterId}`, { headers }).catch(() => null),
  ])

  const now = new Date()
  const today = fmtDate(now)
  const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
  const yearStart = `${now.getFullYear()}-01-01`

  // Compute chart range based on requested period
  const chartRange = computeChartRange(chartPeriod, now, plant?.monitored_since, customStart, customEnd)

  async function fetchYield(from: string, to: string, period: 'day' | 'month' | 'year', type: 'actual-yield' | 'predicted-yield') {
    try {
      const res = await $fetch<any>(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/yield` +
          `?start_date=${from}&end_date=${to}&period_type=${period}&yield_type=${type}`,
        { headers },
      )
      return res?.data || []
    } catch {
      return []
    }
  }

  const [chartData, monthActual, yearActual, monthPredicted] = await Promise.all([
    fetchYield(chartRange.start, chartRange.end, chartRange.bucket, 'actual-yield'),
    fetchYield(monthStart, today, 'day', 'actual-yield'),
    fetchYield(yearStart, today, 'month', 'actual-yield'),
    fetchYield(monthStart, today, 'month', 'predicted-yield'),
  ])

  const sum = (arr: any[]) => arr.reduce((s: number, d: any) => s + (d.yield_in_wh || 0), 0)
  // Today's value comes from the current-month daily breakdown (independent of chart range)
  const todayEntry = monthActual.find((d: any) => (d.time || '').startsWith(today))
  const hasAnyRecentData = monthActual.some((d: any) => (d.yield_in_wh || 0) > 0)

  return {
    connected: true,
    product: {
      id: solar.id,
      name: solar.name || `${solar.brand || ''} ${solar.model || ''}`.trim() || 'Zonnepanelen',
      brand: solar.brand,
      model: solar.model,
      notes: solar.notes,
      installation_date: solar.installation_date,
    },
    plant: plant && {
      id: plant.id,
      name: plant.name,
      plant_code: plant.plant_code,
      monitored_since: plant.monitored_since,
      address: plant.address ? {
        street: `${plant.address.street || ''} ${plant.address.street_number || ''}`.trim(),
        postal_code: plant.address.postal_code,
        city: plant.address.city,
      } : null,
    },
    meter: meter && {
      id: meter.id,
      peak_in_watt: meter.peak_in_watt,
      orientation_in_degrees: meter.orientation_in_degrees,
      angle_in_degrees: meter.angle_in_degrees,
      operational_since: meter.operational_since,
    },
    yield: {
      today_wh: todayEntry?.yield_in_wh || 0,
      today_reported: !!todayEntry,    // true when Sundata has a row for today (even if 0 Wh)
      has_any_recent_data: hasAnyRecentData,
      month_wh: sum(monthActual),
      year_wh: sum(yearActual),
      month_predicted_wh: sum(monthPredicted),
      // Back-compat: keep history_daily as last 30 days
      history_daily: chartRange.bucket === 'day'
        ? chartData.map((d: any) => ({ date: (d.time || '').slice(0, 10), wh: d.yield_in_wh || 0 }))
        : [],
    },
    chart: {
      period: chartPeriod,
      start: chartRange.start,
      end: chartRange.end,
      bucket: chartRange.bucket,
      data: chartData.map((d: any) => ({ date: (d.time || '').slice(0, 10), wh: d.yield_in_wh || 0 })),
    },
  }
})
