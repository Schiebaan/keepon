import { getServiceRoleClient } from '~~/server/utils/supabase'
import { createWelcomeToken } from '~~/server/utils/welcome-token'

/**
 * Create a new mailing batch and immediately return the CSV.
 *
 * Body:
 *   {
 *     name: string,                 // human label, e.g. "Uitnodigingen mei 2026"
 *     description?: string,
 *     customer_ids: string[],       // pre-filtered selection from the UI
 *     segment_filter?: object,      // remember WHAT was filtered, for audit
 *     mailchimp_tag?: string        // optional, suggested to the partner
 *   }
 *
 * Behavior:
 *   - Validates every customer_id actually belongs to this partner (defense
 *     against id-tampering from a malicious admin client).
 *   - Stores the batch + join rows.
 *   - Audit-logs the creation.
 *   - Streams a CSV back with fresh 30-day welcome tokens per customer.
 *
 * The batch row is immutable after creation. Re-downloading via the
 * `/api/partners/mailing-batches/[id]/download` endpoint regenerates a fresh
 * CSV (with new tokens) for the same customer list.
 */

const MODULE_LABELS: Record<string, string> = {
  solar_panel: 'Zonnepanelen',
  heat_pump: 'Warmtepomp',
  ev_charger: 'Laadpaal',
  battery: 'Thuisbatterij',
}

function csvCell(value: any): string {
  const s = value === null || value === undefined ? '' : String(value)
  if (/[",\n\r;]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

function splitName(full: string | null | undefined): { first: string; last: string } {
  const trimmed = (full || '').trim()
  if (!trimmed) return { first: '', last: '' }
  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: '' }
  return { first: parts[0], last: parts.slice(1).join(' ') }
}

export default defineEventHandler(async (event) => {
  try {
    return await handle(event)
  } catch (e: any) {
    // Verkeer uit deze endpoint kwam soms terug als kale 500 zonder bruikbare
    // logregel, omdat de UI 'responseType:blob' gebruikt en de error-body
    // dan in de browser verdwijnt. Hier loggen we 'm expliciet zodat we 'm
    // altijd kunnen vinden in pm2-error.log.
    console.error('[mailing-batches.post] error:', {
      statusCode: e?.statusCode,
      message: e?.message || e?.data?.message,
      cause: e?.cause?.message,
      stack: e?.stack,
    })
    throw e
  }
})

async function handle(event: any) {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event).catch(() => ({} as any))

  // Resolve partner id
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

  const name = String(body?.name || '').trim()
  if (!name) throw createError({ statusCode: 400, message: 'Geef de batch een naam' })

  const submittedIds: string[] = Array.isArray(body?.customer_ids) ? body.customer_ids.filter((x: any) => typeof x === 'string') : []
  if (!submittedIds.length) throw createError({ statusCode: 400, message: 'Selecteer ten minste één klant' })

  // Defense-in-depth: re-fetch the customers and only keep those that actually
  // belong to this partner. Prevents a forged customer_id from leaking another
  // partner's data into Volt4u's CSV.
  const { data: customers } = await supabase
    .from('customers')
    .select('id, email, full_name, city')
    .eq('partner_id', partnerId)
    .in('id', submittedIds)

  const safeCustomers = customers || []
  if (!safeCustomers.length) throw createError({ statusCode: 400, message: 'Geen geldige klanten in selectie' })

  const customerIds = safeCustomers.map(c => c.id)

  // Insert batch row
  const { data: batch, error: batchErr } = await supabase
    .from('mailing_batches')
    .insert({
      partner_id: partnerId,
      name,
      description: body?.description || null,
      customer_count: customerIds.length,
      segment_filter: body?.segment_filter || null,
      mailchimp_tag: body?.mailchimp_tag || null,
      created_by: user.id,
    })
    .select()
    .single()
  if (batchErr || !batch) throw createError({ statusCode: 500, message: batchErr?.message || 'Batch aanmaken mislukt' })

  // Insert join rows
  const joinRows = customerIds.map(cid => ({ batch_id: batch.id, customer_id: cid }))
  const { error: joinErr } = await supabase.from('mailing_batch_customers').insert(joinRows)
  if (joinErr) {
    // Roll back the batch row so we don't leave an orphan
    await supabase.from('mailing_batches').delete().eq('id', batch.id)
    throw createError({ statusCode: 500, message: 'Batch-koppeling mislukt: ' + joinErr.message })
  }

  // Fetch enrichments for the CSV (products per customer, partner slug)
  const [{ data: products }, { data: partner }] = await Promise.all([
    supabase.from('customer_products').select('customer_id, category').in('customer_id', customerIds),
    supabase.from('partners').select('slug, name').eq('id', partnerId).single(),
  ])

  const productsByCustomer = new Map<string, string[]>()
  for (const p of products || []) {
    const arr = productsByCustomer.get(p.customer_id) || []
    const label = MODULE_LABELS[p.category as string]
    if (label && !arr.includes(label)) arr.push(label)
    productsByCustomer.set(p.customer_id, arr)
  }

  const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
  const baseUrl = `https://${partner?.slug ? partner.slug + '.' : ''}${baseDomain}`

  // Build CSV
  const header = ['email', 'first_name', 'last_name', 'full_name', 'login_url', 'modules', 'city', 'batch_name', 'mailchimp_tag']
  const rows: string[] = [header.join(',')]
  for (const c of safeCustomers) {
    const { first, last } = splitName(c.full_name)
    const token = createWelcomeToken(c.id, 30)
    const loginUrl = `${baseUrl}/api/welkom/start?token=${token}`
    const modules = (productsByCustomer.get(c.id) || []).join(' / ')
    rows.push([
      csvCell(c.email),
      csvCell(first),
      csvCell(last),
      csvCell(c.full_name),
      csvCell(loginUrl),
      csvCell(modules),
      csvCell(c.city),
      csvCell(name),
      csvCell(body?.mailchimp_tag || ''),
    ].join(','))
  }
  const csv = '﻿' + rows.join('\n') + '\n'

  await auditLog(event, 'mailing.batch_created', 'partner', partnerId, {
    batch_id: batch.id,
    name,
    customer_count: customerIds.length,
    mailchimp_tag: body?.mailchimp_tag || null,
  })

  // Stream as CSV download
  const safeFileName = name.replace(/[^A-Za-z0-9-_]+/g, '-').slice(0, 60) || 'batch'
  const dateStr = new Date().toISOString().slice(0, 10)
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${safeFileName}-${dateStr}.csv"`)
  setHeader(event, 'Cache-Control', 'no-store')
  // Custom header so the UI can read the new batch id without parsing the body
  setHeader(event, 'X-Batch-Id', batch.id)
  return csv
}
