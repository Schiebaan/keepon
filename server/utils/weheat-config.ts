/**
 * Weheat-configuratie op één plek.
 *
 * Sinds ~11 september 2026 blokkeert Weheat de client waar we op draaiden
 * (`weheat-third-party-debugger`) voor alle data-endpoints:
 *
 *   {"message":"This endpoint is not available for third-party API clients."}
 *
 * Dat is beleid, geen storing. Voor structurele toegang moet UPsol bij Weheat
 * een eigen, geregistreerde API-client aanvragen. Zodra die er is, is dat een
 * kwestie van deze waarden in .env zetten — geen codewijziging:
 *
 *   WEHEAT_CLIENT_ID=...
 *   WEHEAT_CLIENT_SECRET=...     (alleen als Weheat een vertrouwelijke client uitgeeft)
 *   WEHEAT_REDIRECT_URI=...      (de redirect die bij die client geregistreerd is)
 *   WEHEAT_API_URL=...           (alleen als Weheat een ander pad opgeeft)
 *
 * Tot dat moment stonden de URL's verspreid over vijf bestanden, met drie
 * verschillende basispaden. Vandaar dit bestand.
 */
export const WEHEAT_REALM = 'https://auth.weheat.nl/realms/Weheat/protocol/openid-connect'
export const WEHEAT_TOKEN_URL = `${WEHEAT_REALM}/token`

export const WEHEAT_CLIENT_ID = process.env.WEHEAT_CLIENT_ID || 'weheat-third-party-debugger'
export const WEHEAT_CLIENT_SECRET = process.env.WEHEAT_CLIENT_SECRET || ''
export const WEHEAT_REDIRECT_URI = process.env.WEHEAT_REDIRECT_URI || 'https://api.weheat.nl/third_party/api/debugger'

// Het pad voor externe clients. /api/v1 antwoordt sinds 11 september letterlijk
// met "not available for third-party API clients", dus daar horen wij niet.
export const WEHEAT_API_URL = (process.env.WEHEAT_API_URL || 'https://api.weheat.nl/third_party/api/v1').replace(/\/$/, '')

/** client_id plus, als die er is, client_secret — voor elke token-aanvraag. */
export function weheatClientParams(): Record<string, string> {
  const p: Record<string, string> = { client_id: WEHEAT_CLIENT_ID }
  if (WEHEAT_CLIENT_SECRET) p.client_secret = WEHEAT_CLIENT_SECRET
  return p
}

/**
 * Herken Weheat's blokkade, zodat de melding op het dashboard zegt wat er echt
 * aan de hand is in plaats van "opnieuw verbinden" — dat helpt hier niet.
 */
export class WeheatAccessBlockedError extends Error {
  constructor() {
    super('Weheat blokkeert deze toegang voor externe koppelingen. Opnieuw verbinden helpt niet: UPsol heeft een eigen, geregistreerde API-toegang bij Weheat nodig.')
    this.name = 'WeheatAccessBlockedError'
  }
}

export function isWeheatBlocked(e: any): boolean {
  const msg = e?.data?.message || e?.response?._data?.message || ''
  if (/not available for third-party API clients/i.test(String(msg))) return true
  // Het third-party-pad geeft bij dezelfde blokkade vaak een kale nginx-403
  // zonder JSON-body. Met een geldige token betekent 403 hier: geen recht, en
  // dat los je niet op met opnieuw inloggen.
  const status = e?.status ?? e?.statusCode ?? e?.response?.status
  return status === 403
}
