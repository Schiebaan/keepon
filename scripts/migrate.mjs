#!/usr/bin/env node
/**
 * Draait SQL-migraties tegen de Supabase-database.
 *
 * Tot nu toe moesten migraties met de hand in de SQL Editor geplakt worden: de
 * service-role key praat via PostgREST en dat kent geen DDL. Met DATABASE_URL
 * (de Session pooler-URI) kan het wel rechtstreeks.
 *
 * Houdt bij wat al gedraaid is in schema_migrations, zodat opnieuw draaien
 * niets stukmaakt. Elke migratie zit in een transactie — half toegepast is
 * erger dan niet toegepast.
 *
 * Gebruik:
 *   node scripts/migrate.mjs            → toont wat er open staat (dry-run)
 *   node scripts/migrate.mjs --commit   → voert de openstaande migraties uit
 *   node scripts/migrate.mjs --commit 031_kb_audience.sql   → alleen die ene
 */
import 'dotenv/config'
import pg from 'pg'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const DIR = new URL('../supabase/migrations/', import.meta.url).pathname
const commit = process.argv.includes('--commit')
// Markeer migraties als toegepast zónder ze te draaien. Nodig bij de overstap
// naar dit script: 001-029 zaten al in de database (met de hand geplakt in de
// SQL Editor), en opnieuw uitvoeren zou schadelijk zijn — 015 herschrijft
// RLS-policies, 027 wist PII uit bestaande rijen.
const baseline = process.argv.includes('--baseline')
const only = process.argv.slice(2).filter(a => a.endsWith('.sql'))

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL ontbreekt in .env — zie Supabase → Database → Connection string → Session pooler')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})
await client.connect()

await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    filename    TEXT PRIMARY KEY,
    applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`)

const { rows } = await client.query('SELECT filename FROM schema_migrations')
const gedaan = new Set(rows.map(r => r.filename))

const alle = readdirSync(DIR).filter(f => f.endsWith('.sql')).sort()
const teDoen = (only.length ? alle.filter(f => only.includes(f)) : alle).filter(f => !gedaan.has(f))

console.log(`Modus: ${baseline ? 'BASELINE (markeren, niet uitvoeren)' : commit ? 'COMMIT' : 'DRY-RUN'}`)
console.log(`${alle.length} migraties, ${gedaan.size} al toegepast, ${teDoen.length} open\n`)

if (!teDoen.length) {
  console.log('Niets te doen.')
  await client.end()
  process.exit(0)
}

if (baseline) {
  for (const f of teDoen) {
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1) ON CONFLICT DO NOTHING', [f])
    console.log(`  gemarkeerd als toegepast: ${f}`)
  }
  await client.end()
  console.log(`\n✓ ${teDoen.length} gemarkeerd. Er is niets uitgevoerd.`)
  process.exit(0)
}

for (const f of teDoen) {
  if (!commit) { console.log(`  OPEN     ${f}`); continue }
  process.stdout.write(`  ${f} ... `)
  try {
    await client.query('BEGIN')
    await client.query(readFileSync(join(DIR, f), 'utf-8'))
    await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [f])
    await client.query('COMMIT')
    console.log('✓')
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {})
    console.log('✗ ' + e.message)
    console.log('\nGestopt. Niets van deze migratie is toegepast.')
    await client.end()
    process.exit(1)
  }
}

await client.end()
if (commit) console.log(`\n✓ ${teDoen.length} migratie${teDoen.length === 1 ? '' : 's'} toegepast.`)
else console.log(`\nDraai met --commit om deze ${teDoen.length} uit te voeren.`)
