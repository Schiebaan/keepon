#!/usr/bin/env node
/**
 * Genereert /tmp/weheat-volt4u-29-with-matches.csv: zelfde 29 installaties
 * als weheat-dump.mjs maar met klantgegevens vooringevuld voor de warmtepompen
 * die al aan een klant in onze DB gekoppeld zijn (via customer_products
 * serial_number='weheat:<id>'). De rest blijft leeg zodat Volt4u 'm
 * handmatig kan aanvullen uit Gripp/projectadmin.
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnv() {
  for (const line of readFileSync(resolve('/var/www/runon/.env'), 'utf-8').split('\n')) {
    const t = line.trim(); if (!t || t.startsWith('#')) continue
    const i = t.indexOf('='); if (i === -1) continue
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
}
loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function supa(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  const text = await r.text()
  if (!r.ok) { console.error(`Supabase ${r.status}:`, text); process.exit(1) }
  return text ? JSON.parse(text) : []
}

function csv(v) {
  const s = v === null || v === undefined ? '' : String(v)
  return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

async function main() {
  // 1. Lees de bestaande dump (heeft de 29 installaties op volgorde)
  const src = readFileSync('/tmp/weheat-volt4u-29.csv', 'utf-8').replace(/^﻿/, '')
  const lines = src.split('\n').filter(Boolean)
  const header = lines.shift().split(',')
  const idIdx = header.indexOf('weheat_id')

  // 2. Haal klant-koppelingen uit DB
  const products = await supa(
    `customer_products?serial_number=like.weheat%3A*&select=serial_number,customer:customers(full_name,email,street,house_number,postal_code,city)`
  )
  const byId = new Map()
  for (const p of products) {
    const wid = (p.serial_number || '').replace(/^weheat:/, '')
    if (wid && p.customer) byId.set(wid, p.customer)
  }

  // 3. Genereer nieuwe CSV met klantgegevens ingevuld waar bekend
  const out = [header.join(',')]
  let matched = 0
  for (const row of lines) {
    const cols = row.split(',')
    const wid = cols[idIdx]
    const c = byId.get(wid)
    if (c) {
      matched++
      const adres = [c.street, c.house_number].filter(Boolean).join(' ')
      cols[header.indexOf('klant_naam')] = csv(c.full_name || '')
      cols[header.indexOf('klant_email')] = csv(c.email || '')
      cols[header.indexOf('klant_adres')] = csv(adres)
      cols[header.indexOf('klant_postcode')] = csv(c.postal_code || '')
      cols[header.indexOf('klant_plaats')] = csv(c.city || '')
    }
    out.push(cols.join(','))
  }

  const outPath = '/tmp/weheat-volt4u-29-with-matches.csv'
  writeFileSync(outPath, '﻿' + out.join('\n') + '\n', 'utf-8')
  console.log(`Geschreven: ${outPath}`)
  console.log(`Ingevuld vanuit onze DB: ${matched}`)
  console.log(`Nog handmatig in te vullen: ${lines.length - matched}`)
}

main().catch(e => { console.error(e); process.exit(1) })
