#!/usr/bin/env node
/**
 * One-shot: overschrijft body_md + excerpt + title van de starthandleiding
 * met de warmere walkthrough-versie uit ./starthandleiding-body.md.
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

const bodyPath = resolve('/var/www/runon/scripts/starthandleiding-body.md')
const body_md = readFileSync(bodyPath, 'utf-8').trim()
const excerpt =
  'Rustige walkthrough voor je eerste klant: hoe je UPsol inricht, iemand uitnodigt, en wat er daarna gebeurt. Voor als je nog nergens gedrukt hebt en niet zeker weet welke knop wat doet.'
const title = 'Starthandleiding — je eerste klant aanmelden'

async function main() {
  const r = await fetch(`${URL}/rest/v1/support_articles?slug=eq.starthandleiding`, {
    method: 'PATCH',
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ body_md, excerpt, title }),
  })
  const txt = await r.text()
  if (!r.ok) {
    console.error('Update faalde:', r.status, txt)
    process.exit(1)
  }
  const arr = JSON.parse(txt)
  if (!arr?.length) {
    console.error('Geen artikel met slug "starthandleiding" gevonden. Heb je migratie 029 al gedraaid?')
    process.exit(1)
  }
  console.log(`✓ Bijgewerkt: "${arr[0].title}"`)
  console.log(`  Slug:       ${arr[0].slug}`)
  console.log(`  Bytes:      ${body_md.length}`)
  console.log(`  Updated at: ${arr[0].updated_at}`)
}

main().catch(e => { console.error(e); process.exit(1) })
