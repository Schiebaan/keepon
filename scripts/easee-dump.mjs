#!/usr/bin/env node
/**
 * Vraagt de Easee /api/chargers endpoint op met de credentials van een
 * partner en dumpt de complete raw respons + samenvatting. Bedoeld om aan
 * Easee te kunnen laten zien wat hun API ons teruggeeft.
 *
 * Gebruik:
 *   node scripts/easee-dump.mjs              → eerste partner met easee-koppeling
 *   node scripts/easee-dump.mjs <slug>       → specifieke partner
 *   node scripts/easee-dump.mjs --json       → alleen ruwe JSON (voor scripting)
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
const TOKEN_URL = 'https://auth.easee.com/realms/easee/protocol/openid-connect/token'
const API_URL = 'https://api.easee.com/api'
const CLIENT = 'easee'

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

async function getAccessToken(creds) {
  // Bewust ALLEEN password-grant — refresh-token-grant zou de chain rotated
  // achterlaten zonder dat we de nieuwe terug-persisteren, zoals eerder met
  // Weheat gebeurd is.
  const username = (creds.username || creds.email || '').trim()
  const password = (creds.password || '').trim()
  if (!username || !password) {
    throw new Error('Geen username/password in integration_credentials.credentials')
  }
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: CLIENT,
    username,
    password,
    scope: 'email offline_access',
  })
  const r = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  if (!r.ok) {
    throw new Error(`Token request faalde: ${r.status} ${await r.text()}`)
  }
  const { access_token } = await r.json()
  return access_token
}

async function main() {
  const args = process.argv.slice(2)
  const jsonOnly = args.includes('--json')
  const slug = args.find(a => !a.startsWith('--'))

  // 1. Partner + creds
  let partner
  if (slug) {
    const rows = await supa(`partners?slug=eq.${encodeURIComponent(slug)}&select=id,slug,name`)
    partner = rows?.[0]
    if (!partner) { console.error(`Partner "${slug}" niet gevonden.`); process.exit(1) }
  }
  const credsQuery = partner
    ? `integration_credentials?partner_id=eq.${partner.id}&integration_type=eq.easee&select=partner_id,credentials,partners(slug,name)`
    : `integration_credentials?integration_type=eq.easee&select=partner_id,credentials,partners(slug,name)&limit=1`
  const credsRows = await supa(credsQuery)
  const row = credsRows?.[0]
  if (!row) {
    console.error('Geen easee-koppeling gevonden in integration_credentials.')
    process.exit(1)
  }
  const partnerLabel = `${row.partners?.name} (${row.partners?.slug})`

  // 2. Token + /chargers
  const log = []
  const now = new Date().toISOString()
  log.push(`Easee API dump — ${now}`)
  log.push(`Partner: ${partnerLabel}`)
  log.push(`Auth-account (username/email): ${row.credentials?.username || row.credentials?.email}`)
  log.push(`Endpoint:  GET ${API_URL}/chargers`)
  log.push(`Token-URL: POST ${TOKEN_URL} (grant_type=password, client_id=${CLIENT})`)
  log.push('')

  const token = await getAccessToken(row.credentials || {})
  const r = await fetch(`${API_URL}/chargers`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!r.ok) {
    console.error('chargers-endpoint faalde:', r.status, await r.text())
    process.exit(1)
  }
  const chargers = await r.json()

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(chargers, null, 2) + '\n')
    return
  }

  log.push(`HTTP ${r.status} ${r.statusText}`)
  log.push(`Aantal laadpalen in respons: ${Array.isArray(chargers) ? chargers.length : '?'}`)
  log.push('')

  if (Array.isArray(chargers) && chargers.length) {
    log.push('Laadpalen die de API teruggeeft:')
    log.push('─'.repeat(70))
    for (const [i, c] of chargers.entries()) {
      log.push(`#${i + 1}  ${c.name || '(geen naam)'}`)
      log.push(`     id:           ${c.id}`)
      log.push(`     serial:       ${c.serialNumber}`)
      if (c.partnerId !== undefined)  log.push(`     partnerId:    ${c.partnerId}`)
      if (c.createdOn !== undefined)  log.push(`     createdOn:    ${c.createdOn}`)
      if (c.updatedOn !== undefined)  log.push(`     updatedOn:    ${c.updatedOn}`)
      if (c.color !== undefined)      log.push(`     color:        ${c.color}`)
      log.push('')
    }
  } else {
    log.push('De API gaf een lege lijst terug — geen laadpalen gekoppeld aan dit account.')
  }

  log.push('─'.repeat(70))
  log.push('Volledige raw JSON-respons:')
  log.push(JSON.stringify(chargers, null, 2))

  process.stdout.write(log.join('\n') + '\n')
}

main().catch(e => { console.error('Fout:', e.message); process.exit(1) })
