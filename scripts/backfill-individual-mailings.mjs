#!/usr/bin/env node
/**
 * One-shot backfill: voor elke klant die in audit_log een succesvolle
 * welkomstmail heeft (email.welcome_sent of email.welcome_resent) maar nu
 * géén mailing_batch heeft → maak één retro-actieve size-1 batch aan met de
 * timestamp van de meest recente welkomstmail.
 *
 * Hierna toont /admin/uitnodigingen de echte datum i.p.v. "Nooit gemaild"
 * voor klanten die al gemaild zijn vóór de bug-fix.
 *
 * Gebruik:
 *   node scripts/backfill-individual-mailings.mjs            → dry-run
 *   node scripts/backfill-individual-mailings.mjs --commit   → schrijft echt
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  for (const line of readFileSync(resolve('/var/www/runon/.env'), 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
}
loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function supa(path, opts = {}) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await r.text()
  if (!r.ok) throw new Error(`Supabase ${r.status}: ${text}`)
  return text ? JSON.parse(text) : []
}

function fmt(dt) {
  return new Date(dt).toLocaleString('nl-NL', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

async function main() {
  const commit = process.argv.includes('--commit')
  console.log(`Modus: ${commit ? 'COMMIT (schrijft naar DB)' : 'DRY-RUN (toont alleen plan)'}\n`)

  // 1. Klanten zonder enige mailing_batch-koppeling
  //    PostgREST kent geen NOT IN sub-query, dus we halen beide sets op en
  //    filteren in JS. Voor 10k+ klanten zou je hier paginatie willen, voor
  //    Volt4u's huidige aantallen is dit prima.
  const allCustomers = await supa('customers?select=id,partner_id,full_name,email,created_at&order=created_at.asc&limit=10000')
  const allBatchJoins = await supa('mailing_batch_customers?select=customer_id&limit=10000')
  const knownIds = new Set(allBatchJoins.map(j => j.customer_id))
  const unmailed = allCustomers.filter(c => !knownIds.has(c.id))
  console.log(`Totaal klanten: ${allCustomers.length}`)
  console.log(`Klanten met al een batch-koppeling: ${knownIds.size}`)
  console.log(`Kandidaten voor backfill: ${unmailed.length}\n`)

  if (!unmailed.length) {
    console.log('Niets te doen — iedereen heeft al een batch.')
    return
  }

  // 2. Voor elke kandidaat: zoek de meest recente succesvolle welkomstmail
  //    in audit_log. We checken meta->>success = 'true' om mislukte sends
  //    over te slaan.
  let willBackfill = 0
  let noAuditEntry = 0
  const plan = []

  for (const c of unmailed) {
    const rows = await supa(
      `audit_log?entity_type=eq.customer&entity_id=eq.${c.id}` +
      `&action=in.(email.welcome_sent,email.welcome_resent)` +
      `&order=created_at.desc&limit=5&select=action,created_at,meta`
    )
    // Eerste succesvolle (meta.success true OF success ontbreekt = oude entries
    // van vóór we success-flag toevoegden — daar nemen we 'm voor lief)
    const hit = rows.find(r => r.meta?.success !== false)
    if (!hit) {
      noAuditEntry++
      continue
    }
    willBackfill++
    plan.push({
      customer_id: c.id,
      partner_id: c.partner_id,
      label: c.full_name || c.email,
      mailed_at: hit.created_at,
      action: hit.action,
    })
  }

  console.log(`Met audit-bewijs van verzending: ${willBackfill}`)
  console.log(`Zonder audit-spoor (geen actie): ${noAuditEntry}\n`)

  if (!commit) {
    console.log('Plan (eerste 20):')
    for (const p of plan.slice(0, 20)) {
      console.log(`  ${fmt(p.mailed_at).padEnd(22)}  ${p.action.padEnd(22)}  ${p.label}`)
    }
    if (plan.length > 20) console.log(`  ... en nog ${plan.length - 20} klanten`)
    console.log(`\nDraai met --commit om ${willBackfill} backfill-batches aan te maken.`)
    return
  }

  // 3. COMMIT — per klant één batch + één join. We zetten created_at op de
  //    audit-timestamp via een direct insert in JSONB. Helaas: PostgREST
  //    laat ons geen created_at overschrijven (default = NOW()). Truc:
  //    insert eerst, dan UPDATE created_at via aparte call.
  let ok = 0, fail = 0
  for (const p of plan) {
    try {
      const dateStr = fmt(p.mailed_at)
      const name = `Individueel — ${p.label} (${dateStr})  · backfill`
      const inserted = await supa('mailing_batches', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          partner_id: p.partner_id,
          name,
          description: 'Backfill van bestaande klant met audit-spoor van verzending',
          customer_count: 1,
          segment_filter: { kind: 'individual_send', backfilled: true, source_action: p.action },
        }),
      })
      const batch = Array.isArray(inserted) ? inserted[0] : inserted
      if (!batch?.id) throw new Error('Geen batch.id terug')

      // Backdate created_at naar de echte verzendtijd
      await supa(`mailing_batches?id=eq.${batch.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ created_at: p.mailed_at }),
      })

      // Join
      await supa('mailing_batch_customers', {
        method: 'POST',
        body: JSON.stringify({ batch_id: batch.id, customer_id: p.customer_id }),
      })
      ok++
    } catch (e) {
      console.error(`  ❌ ${p.label}: ${e.message}`)
      fail++
    }
  }
  console.log(`\nKlaar. Succes: ${ok}, faal: ${fail}`)
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1) })
