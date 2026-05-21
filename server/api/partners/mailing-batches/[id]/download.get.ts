import { getServiceRoleClient } from '~~/server/utils/supabase'
import { createWelcomeToken } from '~~/server/utils/welcome-token'

/**
 * Re-download the CSV for an existing batch. Useful when the partner lost the
 * original file or wants to refresh the login-tokens (which are 30 days from
 * generation, not from batch-creation).
 *
 * The customer list is taken from the batch's join-rows — same people get the
 * same membership. Tokens are regenerated each call.
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
  const { user } = await requireRole(event, 'partner_admin')
  const batchId = getRouterParam(event, 'id')
  if (!batchId) throw createError({ statusCode: 400, message: 'batch id ontbreekt' })

  const supabase = getServiceRoleClient(event)

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

  // Verify the batch belongs to this partner
  const { data: batch } = await supabase
    .from('mailing_batches')
    .select('id, partner_id, name, mailchimp_tag')
    .eq('id', batchId)
    .eq('partner_id', partnerId)
    .single()
  if (!batch) throw createError({ statusCode: 404, message: 'Batch niet gevonden' })

  // Fetch the customer ids from the join table
  const { data: joinRows } = await supabase
    .from('mailing_batch_customers')
    .select('customer_id')
    .eq('batch_id', batch.id)

  const customerIds = (joinRows || []).map(r => r.customer_id)
  if (!customerIds.length) throw createError({ statusCode: 404, message: 'Batch is leeg' })

  const [{ data: customers }, { data: products }, { data: partner }] = await Promise.all([
    supabase.from('customers').select('id, email, full_name, city').in('id', customerIds),
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

  const header = ['email', 'first_name', 'last_name', 'full_name', 'login_url', 'modules', 'city', 'batch_name', 'mailchimp_tag']
  const rows: string[] = [header.join(',')]
  for (const c of customers || []) {
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
      csvCell(batch.name),
      csvCell(batch.mailchimp_tag || ''),
    ].join(','))
  }
  const csv = '﻿' + rows.join('\n') + '\n'

  await auditLog(event, 'mailing.batch_redownloaded', 'partner', partnerId, {
    batch_id: batch.id,
    customer_count: customerIds.length,
  })

  const safeFileName = batch.name.replace(/[^A-Za-z0-9-_]+/g, '-').slice(0, 60) || 'batch'
  const dateStr = new Date().toISOString().slice(0, 10)
  setHeader(event, 'Content-Type', 'text/csv; charset=utf-8')
  setHeader(event, 'Content-Disposition', `attachment; filename="${safeFileName}-${dateStr}.csv"`)
  setHeader(event, 'Cache-Control', 'no-store')
  return csv
})
