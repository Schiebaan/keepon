#!/usr/bin/env node
/**
 * Importeert de koppeling klant → Sundata-plant uit de aangeleverde CSV.
 *
 * Activeert niets. Het zet alleen vast welke plant bij welk e-mailadres hoort;
 * monitoring gaat pas aan als die klant akkoord geeft (zie
 * server/utils/sundata-activate.ts). Activeren is bij Sundata onomkeerbaar,
 * dus dat gebeurt nooit vanuit een import.
 *
 * Kolommen die gebruikt worden: email, sundata_plant_id, sundata_meter_id,
 * sundata_plant_code, naam. De kolom emails_derden wordt genegeerd — dat zijn
 * Fronius-medewerkers en servicepartijen, die horen nooit een uitnodiging te
 * krijgen of aan een klant gekoppeld te worden.
 *
 * Gebruik:
 *   node scripts/import-sundata-plants.mjs <bestand.csv>            → dry-run
 *   node scripts/import-sundata-plants.mjs <bestand.csv> --commit
 */
import { readFileSync } from 'node:fs'
import { createClient } from '@supabase/supabase-js'

function loadEnv() {
  for (const line of readFileSync('/var/www/runon/.env', 'utf-8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const i = t.indexOf('='); if (i === -1) continue
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
}
loadEnv()

const bestand = process.argv.find(a => a.endsWith('.csv'))
const commit = process.argv.includes('--commit')
if (!bestand) {
  console.error('Geef het CSV-bestand mee: node scripts/import-sundata-plants.mjs lijst.csv [--commit]')
  process.exit(1)
}

/** CSV met aanhalingstekens en komma's binnen velden. */
function parseCsv(tekst) {
  const rijen = []
  let veld = '', rij = [], inQuote = false
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst[i]
    if (inQuote) {
      if (c === '"' && tekst[i + 1] === '"') { veld += '"'; i++ }
      else if (c === '"') inQuote = false
      else veld += c
    } else if (c === '"') inQuote = true
    else if (c === ',') { rij.push(veld); veld = '' }
    else if (c === '\n') { rij.push(veld); rijen.push(rij); rij = []; veld = '' }
    else if (c !== '\r') veld += c
  }
  if (veld || rij.length) { rij.push(veld); rijen.push(rij) }
  return rijen.filter(r => r.some(v => v !== ''))
}

const rijen = parseCsv(readFileSync(bestand, 'utf-8'))
const kop = rijen.shift().map(h => h.trim())
const idx = (naam) => kop.indexOf(naam)
for (const vereist of ['email', 'sundata_plant_id']) {
  if (idx(vereist) === -1) { console.error(`Kolom "${vereist}" ontbreekt in de CSV.`); process.exit(1) }
}

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data: partner } = await sb.from('partners').select('id,name').ilike('name', '%volt%').single()
if (!partner) { console.error('Partner Volt4U niet gevonden.'); process.exit(1) }

const regels = []
const zonderEmail = []
for (const r of rijen) {
  const email = (r[idx('email')] || '').trim().toLowerCase()
  const plant = parseInt(r[idx('sundata_plant_id')], 10)
  if (!plant) continue
  if (!email) { zonderEmail.push({ plant, naam: (r[idx('naam')] || '').trim() }); continue }
  regels.push({
    partner_id: partner.id,
    email,
    sundata_company_id: 7,
    sundata_plant_id: plant,
    sundata_meter_id: idx('sundata_meter_id') > -1 ? (parseInt(r[idx('sundata_meter_id')], 10) || null) : null,
    plant_code: idx('sundata_plant_code') > -1 ? (r[idx('sundata_plant_code')] || null) : null,
    plant_name: idx('naam') > -1 ? (r[idx('naam')] || null) : null,
    source: `import ${bestand.split('/').pop()}`,
  })
}

const perEmail = new Map()
for (const r of regels) perEmail.set(r.email, (perEmail.get(r.email) || 0) + 1)
const meerdere = [...perEmail].filter(([, n]) => n > 1)

console.log(`Modus: ${commit ? 'COMMIT' : 'DRY-RUN'}   partner: ${partner.name}\n`)
console.log(`  plants in de lijst        : ${regels.length + zonderEmail.length}`)
console.log(`  met e-mailadres           : ${regels.length}`)
console.log(`  ZONDER e-mailadres        : ${zonderEmail.length}  (niet te koppelen)`)
zonderEmail.forEach(z => console.log(`      plant ${z.plant}  ${z.naam}`))
console.log(`  unieke klanten            : ${perEmail.size}`)
if (meerdere.length) {
  console.log(`  klanten met meer plants   : ${meerdere.length}`)
  meerdere.forEach(([e, n]) => console.log(`      ${e}: ${n} installaties`))
}

if (!commit) {
  console.log('\nDraai met --commit om op te slaan. Er wordt niets geactiveerd.')
  process.exit(0)
}

let nieuw = 0, bij = 0, fout = 0
for (const r of regels) {
  const { data: bestaand } = await sb.from('sundata_plant_links')
    .select('id, activated_at').eq('partner_id', r.partner_id).eq('sundata_plant_id', r.sundata_plant_id).maybeSingle()
  if (bestaand) {
    // activated_at en customer_id nooit overschrijven: die horen bij een
    // akkoord dat al gegeven is.
    const { error } = await sb.from('sundata_plant_links').update({
      email: r.email, sundata_meter_id: r.sundata_meter_id, plant_code: r.plant_code,
      plant_name: r.plant_name, source: r.source,
    }).eq('id', bestaand.id)
    error ? fout++ : bij++
  } else {
    const { error } = await sb.from('sundata_plant_links').insert(r)
    error ? (fout++, console.error(`  ✗ plant ${r.sundata_plant_id}: ${error.message}`)) : nieuw++
  }
}
console.log(`\n✓ ${nieuw} toegevoegd, ${bij} bijgewerkt, ${fout} mislukt. Niets geactiveerd.`)
