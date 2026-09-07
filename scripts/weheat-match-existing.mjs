#!/usr/bin/env node
/**
 * Match de 29 Weheat-IDs uit /tmp/weheat-volt4u-29.csv tegen onze Supabase-DB.
 * Geen Weheat-API-call meer nodig — alle IDs staan al in de CSV.
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

const SUPABASE_URL = process.env.SUPABASE_URL
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function supa(path) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: { apikey: KEY, Authorization: `Bearer ${KEY}` },
  })
  const text = await r.text()
  if (!r.ok) {
    console.error(`Supabase ${r.status}:`, text)
    process.exit(1)
  }
  return text ? JSON.parse(text) : []
}

async function main() {
  // 1. Lees Weheat-IDs uit de CSV
  const csv = readFileSync('/tmp/weheat-volt4u-29.csv', 'utf-8')
  const lines = csv.replace(/^﻿/, '').split('\n').filter(Boolean)
  const header = lines.shift().split(',')
  const idIdx = header.indexOf('weheat_id')
  const serialIdx = header.indexOf('serial_number')
  const weheatIds = lines.map(l => l.split(',')[idIdx])
  const serialById = new Map(lines.map(l => {
    const cols = l.split(',')
    return [cols[idIdx], cols[serialIdx]]
  }))
  console.log(`CSV bevat ${weheatIds.length} Weheat-IDs\n`)

  // 2. Alle customer_products met weheat:-koppeling
  const productsResp = await supa(
    `customer_products?serial_number=like.weheat%3A*&select=serial_number,customer:customers(id,full_name,email,street,house_number,postal_code,city)`
  )
  console.log(`In customer_products met weheat:-prefix: ${productsResp.length}\n`)

  const byId = new Map()
  for (const p of productsResp) {
    const wid = (p.serial_number || '').replace(/^weheat:/, '')
    if (wid && p.customer) byId.set(wid, p.customer)
  }

  // 3. Match
  const matched = []
  const unmatched = []
  for (const wid of weheatIds) {
    const c = byId.get(wid)
    if (c) matched.push({ wid, c })
    else unmatched.push({ wid, serial: serialById.get(wid) })
  }

  console.log(`✅ Al gekoppeld aan een klant in onze DB: ${matched.length}`)
  for (const { wid, c } of matched) {
    const addr = [c.street, c.house_number].filter(Boolean).join(' ')
    const place = [c.postal_code, c.city].filter(Boolean).join(' ')
    console.log(`   ${serialById.get(wid)}  →  ${c.full_name || '(geen naam)'} <${c.email}>`)
    if (addr || place) console.log(`     ${[addr, place].filter(Boolean).join(', ')}`)
  }

  console.log(`\n❓ Nog onbekend (geen klant in DB): ${unmatched.length}`)
  for (const { serial } of unmatched) {
    console.log(`   ${serial}`)
  }
}

main().catch(e => { console.error(e); process.exit(1) })
