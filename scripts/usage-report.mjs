#!/usr/bin/env node
/**
 * Snapshot van UPsol-gebruik sinds een cutoff-datum. Kijkt naar:
 *   - Customer-funnel (aangemaakt → akkoord → mandaat actief)
 *   - Payments (open/paid/failed verhouding)
 *   - Tickets (open/opgelost verhouding, oudste openstaande)
 *   - Mail-verzendingen (succes/faal)
 *   - Recente server-errors uit pm2-error.log
 *
 * Gebruik: node scripts/usage-report.mjs
 *          node scripts/usage-report.mjs --since 2026-07-09
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  for (const line of readFileSync(resolve('/var/www/runon/.env'), 'utf-8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const i = t.indexOf('='); if (i === -1) continue
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
}
loadEnv()
const URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function q(path) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  const text = await r.text()
  if (!r.ok) { console.error(`Supabase ${r.status} for ${path}:`, text); return null }
  return text ? JSON.parse(text) : []
}

function ago(iso) {
  if (!iso) return '—'
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (d === 0) return 'vandaag'
  if (d === 1) return 'gisteren'
  return `${d} dagen geleden`
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toISOString().slice(0, 10)
}

function pct(n, total) {
  if (!total) return '0%'
  return `${Math.round((n / total) * 100)}%`
}

async function main() {
  const args = process.argv.slice(2)
  const sinceIdx = args.indexOf('--since')
  const since = sinceIdx >= 0 ? args[sinceIdx + 1] : '2026-07-09'
  const sinceIso = `${since}T00:00:00Z`
  console.log(`\n╭─ UPsol usage-rapport — sinds ${since} ────────────────────────╮\n`)

  // ─── Customers ─────────────────────────────────────────────────────────
  const allCustomers = await q('customers?select=id,created_at,accepted_at,mandate_at,mollie_mandate_id,mandate_skipped,partner_id,partners(slug,name)&order=created_at.desc')
  const recent = (allCustomers || []).filter(c => c.created_at >= sinceIso)
  const totalAll = (allCustomers || []).length
  const totalNew = recent.length
  const accepted = (allCustomers || []).filter(c => c.accepted_at)
  const mandateSubmitted = accepted.filter(c => c.mandate_at)
  const mandateActive = mandateSubmitted.filter(c => c.mollie_mandate_id)
  const mandateSkipped = accepted.filter(c => c.mandate_skipped)

  console.log('KLANTEN')
  console.log('─'.repeat(70))
  console.log(`  Totaal klanten in DB          : ${totalAll}`)
  console.log(`  Nieuw sinds ${since}          : ${totalNew}`)
  console.log()
  console.log('  Funnel:')
  console.log(`    aangemaakt                  : ${totalAll}`)
  console.log(`    → akkoord gegeven           : ${accepted.length}  (${pct(accepted.length, totalAll)})`)
  console.log(`      → IBAN ingevuld           : ${mandateSubmitted.length}  (${pct(mandateSubmitted.length, accepted.length)} van akkoorden)`)
  console.log(`        → Mollie-mandaat actief : ${mandateActive.length}  (${pct(mandateActive.length, mandateSubmitted.length)} van IBANs)`)
  console.log(`      → "doe ik later" gekozen  : ${mandateSkipped.length}`)
  console.log()

  // Per partner: hoeveel klanten
  const byPartner = new Map()
  for (const c of allCustomers || []) {
    const key = c.partners?.slug || 'onbekend'
    const p = byPartner.get(key) || { slug: key, name: c.partners?.name || 'Onbekend', total: 0, accepted: 0, mandate: 0 }
    p.total++
    if (c.accepted_at) p.accepted++
    if (c.mollie_mandate_id) p.mandate++
    byPartner.set(key, p)
  }
  console.log('  Per partner:')
  for (const p of byPartner.values()) {
    console.log(`    ${p.name.padEnd(20)}  ${String(p.total).padStart(3)} klanten, ${p.accepted} akkoord, ${p.mandate} actief mandaat`)
  }
  console.log()

  // Waar zitten klanten "vast"?
  const stuck = accepted.filter(c => !c.mandate_at && !c.mandate_skipped)
  const iban_pending = accepted.filter(c => c.mandate_at && !c.mollie_mandate_id)
  console.log('  Waar loopt het vast:')
  console.log(`    Akkoord maar nooit langs incasso geweest : ${stuck.length}`)
  if (stuck.length) {
    for (const c of stuck.slice(0, 5)) console.log(`      ${c.id.slice(0,8)}  ${c.partners?.slug || '?'} · akkoord ${ago(c.accepted_at)}`)
  }
  console.log(`    IBAN ingediend maar mandaat niet actief  : ${iban_pending.length}`)
  if (iban_pending.length) {
    for (const c of iban_pending.slice(0, 5)) console.log(`      ${c.id.slice(0,8)}  ${c.partners?.slug || '?'} · IBAN ${ago(c.mandate_at)}`)
  }
  console.log()

  // ─── Payments ──────────────────────────────────────────────────────────
  const payments = await q('payments?select=id,amount_cents,status,created_at,description&order=created_at.desc&limit=500')
  const paidCount = (payments || []).filter(p => p.status === 'paid').length
  const openCount = (payments || []).filter(p => ['open','pending','authorized'].includes(p.status)).length
  const failedCount = (payments || []).filter(p => ['failed','expired','canceled','chargeback'].includes(p.status)).length
  const totalPaidCents = (payments || []).filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount_cents || 0), 0)
  const recentPayments = (payments || []).filter(p => p.created_at >= sinceIso)

  console.log('BETALINGEN')
  console.log('─'.repeat(70))
  console.log(`  Totaal payments-rijen         : ${payments?.length || 0}`)
  console.log(`  Sinds ${since}                : ${recentPayments.length}`)
  console.log(`    → betaald                   : ${paidCount}`)
  console.log(`    → in behandeling            : ${openCount}`)
  console.log(`    → mislukt/verlopen          : ${failedCount}`)
  console.log(`  Omzet (paid)                  : € ${(totalPaidCents / 100).toFixed(2)}`)
  console.log()

  // ─── Tickets ───────────────────────────────────────────────────────────
  const tickets = await q('service_tickets?select=id,status,urgency,created_at,updated_at,subject,customer:customers(full_name,partners(slug))&order=updated_at.desc&limit=500')
  const openTickets = (tickets || []).filter(t => !['opgelost', 'gesloten'].includes(t.status))
  const oldOpen = openTickets.filter(t => new Date(t.updated_at) < new Date(Date.now() - 7 * 86400000))
  const newSince = (tickets || []).filter(t => t.created_at >= sinceIso)

  console.log('TICKETS')
  console.log('─'.repeat(70))
  console.log(`  Totaal tickets                : ${tickets?.length || 0}`)
  console.log(`  Nieuw sinds ${since}          : ${newSince.length}`)
  console.log(`  Open (nieuw/in_behandeling)   : ${openTickets.length}`)
  console.log(`  Open + >7 dagen niet aangeraakt: ${oldOpen.length}`)
  if (oldOpen.length) {
    console.log('  Oudste openstaande:')
    for (const t of oldOpen.slice(0, 5)) {
      console.log(`    "${t.subject.slice(0, 45)}" · ${t.status} · ${ago(t.updated_at)} · ${t.customer?.partners?.slug || '?'}`)
    }
  }
  console.log()

  // ─── Mails ─────────────────────────────────────────────────────────────
  const mails = await q(`audit_log?entity_type=eq.customer&action=like.email.*&created_at=gte.${sinceIso}&select=action,meta,created_at&order=created_at.desc&limit=1000`)
  const totalMails = (mails || []).length
  const failedMails = (mails || []).filter(m => m.meta?.success === false)
  const byActionMap = new Map()
  for (const m of mails || []) {
    byActionMap.set(m.action, (byActionMap.get(m.action) || 0) + 1)
  }

  console.log('MAILS')
  console.log('─'.repeat(70))
  console.log(`  Verzonden sinds ${since}      : ${totalMails}`)
  console.log(`  Waarvan mislukt               : ${failedMails.length}`)
  console.log()
  console.log('  Per type:')
  for (const [action, n] of [...byActionMap.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`    ${action.padEnd(38)} ${n}`)
  }
  console.log()

  // ─── Server errors ─────────────────────────────────────────────────────
  console.log('SERVER-ERRORS (pm2-error.log, laatste 200 regels)')
  console.log('─'.repeat(70))
  try {
    const log = readFileSync('/var/log/runon/pm2-error.log', 'utf-8').split('\n').slice(-200)
    const errorMap = new Map()
    for (const line of log) {
      // Detect [500]/[502]/[401] messages of algemene errors
      const m = line.match(/\[nuxt\] \[request error\] \[unhandled\] \[(\d+)\] (.+)$/)
      if (m) {
        const key = `[${m[1]}] ${m[2].slice(0, 80)}`
        errorMap.set(key, (errorMap.get(key) || 0) + 1)
      }
    }
    if (!errorMap.size) {
      console.log('  Geen unhandled errors in de laatste 200 regels.')
    } else {
      const sorted = [...errorMap.entries()].sort((a, b) => b[1] - a[1])
      for (const [msg, count] of sorted.slice(0, 10)) {
        console.log(`  ${String(count).padStart(3)}×  ${msg}`)
      }
    }
  } catch (e) {
    console.log(`  Kon logfile niet lezen: ${e.message}`)
  }

  console.log('\n╰────────────────────────────────────────────────────────────────╯\n')
}

main().catch(e => { console.error('Fout:', e); process.exit(1) })
