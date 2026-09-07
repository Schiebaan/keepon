#!/usr/bin/env node
/**
 * Seedt/updatet support-artikelen vanuit scripts/support-articles/*.md
 *
 * Elk bestand heeft een YAML-achtige frontmatter met slug, title, category,
 * sort_order en excerpt. De rest is de markdown-body.
 *
 * Idempotent: bestaat de slug al, dan wordt 'ie bijgewerkt (PATCH). Anders
 * aangemaakt (POST). Artikelen worden direct gepubliceerd.
 *
 * Gebruik:
 *   node scripts/seed-support-articles.mjs            → dry-run
 *   node scripts/seed-support-articles.mjs --commit   → schrijft echt
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { resolve, join } from 'node:path'

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
const DIR = '/var/www/runon/scripts/support-articles'

async function supa(path, opts = {}) {
  const r = await fetch(`${URL}/rest/v1/${path}`, {
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

/** Simpele frontmatter-parser — genoeg voor onze eigen bestanden. */
function parseArticle(raw) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!m) throw new Error('Geen frontmatter gevonden')
  const meta = {}
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let val = line.slice(idx + 1).trim()
    if (key === 'sort_order') meta[key] = Number(val)
    else if (key === 'symptoms') {
      // ["a", "b"] → array
      try { meta[key] = JSON.parse(val) } catch { meta[key] = [] }
    }
    else meta[key] = val === 'null' ? null : val
  }
  return { meta, body: m[2].trim() }
}

async function main() {
  const commit = process.argv.includes('--commit')
  console.log(`Modus: ${commit ? 'COMMIT' : 'DRY-RUN'}\n`)

  // Ook submappen: scripts/support-articles/klant/ bevat de storingsartikelen
  // voor eindklanten, die de AI-servicechat raadpleegt.
  const files = []
  for (const entry of readdirSync(DIR).sort()) {
    const full = join(DIR, entry)
    if (statSync(full).isDirectory()) {
      for (const f of readdirSync(full).sort()) if (f.endsWith('.md')) files.push(join(entry, f))
    } else if (entry.endsWith('.md')) files.push(entry)
  }
  const existing = await supa('support_articles?select=id,slug')
  const bySlug = new Map(existing.map(a => [a.slug, a.id]))

  let created = 0, updated = 0
  for (const file of files) {
    const raw = readFileSync(join(DIR, file), 'utf-8')
    let parsed
    try { parsed = parseArticle(raw) } catch (e) {
      console.error(`  ❌ ${file}: ${e.message}`)
      continue
    }
    const { meta, body } = parsed
    const exists = bySlug.has(meta.slug)
    const action = exists ? 'UPDATE' : 'CREATE'
    console.log(`  ${action.padEnd(7)} ${(meta.audience || 'partner').padEnd(8)} ${meta.category.padEnd(20)} ${meta.slug}`)
    console.log(`          "${meta.title}" · ${body.length} tekens`)

    if (!commit) continue

    const payload = {
      slug: meta.slug,
      title: meta.title,
      excerpt: meta.excerpt,
      category: meta.category,
      sort_order: meta.sort_order || 100,
      body_md: body,
      audience: meta.audience || 'partner',
      module_type: meta.module_type || null,
      symptoms: meta.symptoms || [],
      published_at: new Date().toISOString(),
    }

    if (exists) {
      // published_at niet overschrijven bij update — behoud originele
      // publicatiedatum, alleen inhoud verversen
      const { published_at, ...rest } = payload
      await supa(`support_articles?slug=eq.${encodeURIComponent(meta.slug)}`, {
        method: 'PATCH',
        body: JSON.stringify(rest),
      })
      updated++
    } else {
      await supa('support_articles', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      created++
    }
  }

  console.log()
  if (commit) {
    console.log(`✓ ${created} aangemaakt, ${updated} bijgewerkt`)
  } else {
    console.log(`${files.length} bestanden gevonden. Draai met --commit om weg te schrijven.`)
  }
}

main().catch(e => { console.error('Fout:', e.message); process.exit(1) })
