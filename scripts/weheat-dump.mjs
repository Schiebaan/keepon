#!/usr/bin/env node
/**
 * One-shot: dump alle Weheat heat-pumps van een partner met alle velden die
 * de API teruggeeft. Gebruik dit om te zien of er klant-info (email, adres,
 * naam) in de Weheat-respons zit — dat bepaalt of we de "29 installaties als
 * eerste klanten"-lijst direct kunnen genereren of dat we elders moeten
 * kijken.
 *
 * Run als:
 *   node scripts/weheat-dump.mjs              → eerste partner met weheat-koppeling
 *   node scripts/weheat-dump.mjs <slug>       → specifieke partner via slug
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// .env handmatig inlezen — geen dotenv-pakket nodig
function loadEnv() {
  const envFile = resolve('/var/www/runon/.env')
  for (const line of readFileSync(envFile, 'utf-8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
}
loadEnv()

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const TOKEN_URL = 'https://auth.weheat.nl/realms/Weheat/protocol/openid-connect/token'
const API_URL = 'https://api.weheat.nl/third_party/api/v1'

async function supaFetch(path, opts = {}) {
  return (await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })).json()
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: 'weheat-backend',
    refresh_token: refreshToken,
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`)
  return res.json()
}

async function main() {
  const targetSlug = process.argv[2]

  // 1. Vind partner + bijbehorende weheat-creds
  let partnerRow
  if (targetSlug) {
    const partners = await supaFetch(`partners?slug=eq.${encodeURIComponent(targetSlug)}&select=id,slug,name`)
    partnerRow = partners?.[0]
    if (!partnerRow) {
      console.error(`Partner met slug "${targetSlug}" niet gevonden.`)
      process.exit(1)
    }
  }

  const credsQuery = partnerRow
    ? `integration_credentials?partner_id=eq.${partnerRow.id}&integration_type=eq.weheat&select=partner_id,credentials,partners(slug,name)`
    : `integration_credentials?integration_type=eq.weheat&select=partner_id,credentials,partners(slug,name)&limit=1`
  const credsRows = await supaFetch(credsQuery)
  const row = credsRows?.[0]
  if (!row) {
    console.error('Geen weheat-koppeling gevonden in integration_credentials.')
    process.exit(1)
  }
  console.error(`Partner: ${row.partners?.name} (${row.partners?.slug})`)

  // 2. Refresh access token
  const creds = row.credentials || {}
  if (!creds.refresh_token) {
    console.error('Geen refresh_token in credentials. Re-connect via /admin/settings → Verbinden via Weheat.')
    process.exit(1)
  }
  console.error('Access token verversen...')
  const tokens = await refreshAccessToken(creds.refresh_token)
  const accessToken = tokens.access_token

  // 3. Pageer /heat-pumps
  const all = []
  let page = 1
  let totalPages = 1
  do {
    console.error(`  Page ${page}/${totalPages || '?'} ophalen...`)
    const res = await fetch(`${API_URL}/heat-pumps?page=${page}&pageSize=50`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    if (!res.ok) {
      console.error(`/heat-pumps faalde: ${res.status} ${await res.text()}`)
      process.exit(1)
    }
    const resp = await res.json()
    const list = Array.isArray(resp) ? resp : (resp?.data || [])
    for (const hp of list) all.push(hp)
    totalPages = resp?.metadata?.totalPages ?? 1
    page++
  } while (page <= totalPages && page < 20)

  console.error(`Totaal: ${all.length} installaties.\n`)

  // 4. Dump volledige JSON naar stdout (voor debug)
  if (process.argv.includes('--json')) {
    process.stdout.write(JSON.stringify(all, null, 2))
    process.stdout.write('\n')
    return
  }

  // 5. Default: CSV met de velden die we voor de eerste-klanten-import nodig
  //    hebben. Email/naam/adres staat NIET in Weheat — die kolommen blijven
  //    leeg en Volt4u vult ze handmatig in vanuit z'n eigen CRM.
  const header = [
    'weheat_id',
    'serial_number',
    'part_number',
    'model_code',
    'firmware',
    'commissioned_at',
    'name_in_weheat',
    // Lege kolommen om handmatig aan te vullen voordat we import doen
    'klant_naam',
    'klant_email',
    'klant_adres',
    'klant_postcode',
    'klant_plaats',
  ]
  function csv(v) {
    const s = v === null || v === undefined ? '' : String(v)
    return /[",\n\r;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const rows = [header.join(',')]
  // Sorteer op commissioning-datum (oudste eerst) zodat de eerste-klanten-
  // batch de oudste installaties bevat — die zijn doorgaans waar de demo
  // het hardst landt.
  const sorted = [...all].sort((a, b) => {
    const ax = a.commissionedAt ? new Date(a.commissionedAt).getTime() : 0
    const bx = b.commissionedAt ? new Date(b.commissionedAt).getTime() : 0
    return ax - bx
  })
  for (const hp of sorted) {
    rows.push([
      csv(hp.id),
      csv(hp.serialNumber),
      csv(hp.partNumber),
      csv(hp.model),
      csv(hp.firmwareVersion),
      csv(hp.commissionedAt),
      csv(hp.name),
      '', '', '', '', '',
    ].join(','))
  }
  process.stdout.write('﻿' + rows.join('\n') + '\n')
}

main().catch((e) => {
  console.error('Fout:', e.message)
  process.exit(1)
})
