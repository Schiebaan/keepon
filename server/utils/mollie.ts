// Named import i.p.v. default — @mollie/api-client is een CJS-pakket en
// Node's ESM-interop wikkelt het hele `exports`-object als `default`, waardoor
// een default-import géén functie is maar `{ createMollieClient, default }`.
// Resultaat: TypeError "createMollieClient is not a function" bij eerste call.
import { createMollieClient, type MollieClient } from '@mollie/api-client'

/**
 * UPsol uses the *booking model*: UPsol is the merchant-of-record, customers
 * pay UPsol, UPsol pays partners separately under a B2B agreement. So there's
 * ONE Mollie account (UPsol's), keyed by the MOLLIE_API_KEY env var.
 *
 * (We previously had a per-partner Mollie scheme; that's removed.)
 */
let _client: MollieClient | null = null

export function getMollie(): MollieClient {
  if (!_client) {
    const key = process.env.MOLLIE_API_KEY
    if (!key) {
      throw createError({ statusCode: 500, message: 'MOLLIE_API_KEY ontbreekt op de server.' })
    }
    _client = createMollieClient({ apiKey: key })
  }
  return _client
}

export function isMollieTestMode(): boolean {
  return (process.env.MOLLIE_API_KEY || '').startsWith('test_')
}

/** Cents → Mollie's "0.00"-formatted string. */
export function formatMollieAmount(cents: number): string {
  return (cents / 100).toFixed(2)
}

/**
 * Staat SEPA Direct Debit aan op het Mollie-profiel?
 *
 * Dit is geen theoretische vraag. De Mandates-API maakt gewoon een mandaat aan
 * met status 'valid', óók als de methode niet geactiveerd is — je merkt het
 * pas op de dag dat je écht wil incasseren, en krijgt dan een 403. Dat kan
 * maanden na het afgeven van het mandaat zijn.
 *
 * Daarom checken we het vooraf. Uitkomst 15 minuten gecached: dit verandert
 * hooguit één keer, wanneer de activering bij Mollie rondkomt.
 */
let _ddCache: { value: boolean; at: number } | null = null
const DD_CACHE_MS = 15 * 60 * 1000

export async function isDirectDebitEnabled(): Promise<boolean> {
  if (_ddCache && Date.now() - _ddCache.at < DD_CACHE_MS) return _ddCache.value

  let enabled = false
  try {
    const res = await fetch('https://api.mollie.com/v2/methods/directdebit', {
      headers: { Authorization: `Bearer ${process.env.MOLLIE_API_KEY}` },
    })
    enabled = res.ok
  } catch (e: any) {
    // Netwerkprobleem is geen bewijs dat de methode uitstaat. Niet cachen, en
    // de flow niet blokkeren op iets wat onze kant kan zijn.
    console.error('[mollie] directdebit-check mislukt:', e?.message)
    return true
  }

  _ddCache = { value: enabled, at: Date.now() }
  return enabled
}

/**
 * Verwijder PII-velden uit een Mollie-payment-response voordat we 'm in
 * `payments.raw` JSONB opslaan. Data-minimalisatie: het IBAN + de naam op de
 * rekening + de BIC zitten al bij Mollie en hebben we niet nodig voor onze
 * eigen UI of debug-flow. Card-holders idem.
 *
 * We bewaren wel alle andere velden onder `details` (settlementAmount,
 * paidAt, etc.) — die geven waardevolle context bij forensisch onderzoek
 * zonder dat het PII bevat.
 *
 * Niet-destructief: input wordt niet gemuteerd, we leveren een diepe kopie.
 */
const REDACTED_DETAIL_FIELDS = new Set([
  // SEPA direct debit
  'consumerAccount',
  'consumerName',
  'consumerBic',
  // Creditcard (toekomstige uitbreiding — Mollie levert hier de naam op kaart)
  'cardHolder',
  // PayPal (e-mail van de betaler — verlate koppeling met onze customers.email)
  'billingEmail',
])

export function redactMollieResponse<T extends Record<string, any>>(payment: T): T {
  if (!payment || typeof payment !== 'object') return payment
  // Diepe kopie via JSON-roundtrip — Mollie-objecten zijn JSON-serializable.
  let cloned: T
  try {
    cloned = JSON.parse(JSON.stringify(payment))
  } catch {
    // Onverwacht type — beter veilig dan PII opslaan; lever leeg object.
    return {} as T
  }

  const details = (cloned as any).details
  if (details && typeof details === 'object') {
    for (const k of Object.keys(details)) {
      if (REDACTED_DETAIL_FIELDS.has(k)) delete details[k]
    }
  }

  return cloned
}
