import Anthropic from '@anthropic-ai/sdk'

/**
 * Claude-client voor de klantgerichte servicechat.
 *
 * Bewust géén throw als de sleutel ontbreekt: de servicechat valt dan terug op
 * de oude regelgebaseerde antwoorden. Een klant met een kapotte omvormer mag
 * geen foutmelding krijgen omdat wij onze facturatie bij Anthropic niet op orde
 * hebben.
 */
let _client: Anthropic | null = null

export function isAiAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY
}

export function getAnthropic(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw createError({ statusCode: 503, message: 'ANTHROPIC_API_KEY ontbreekt' })
    _client = new Anthropic({ apiKey })
  }
  return _client
}

/**
 * Het model voor de servicechat.
 *
 * Haiku is hier de juiste keuze: de vragen zijn afgebakend, de context wordt
 * server-side aangeleverd, en het scheelt een orde van grootte in kosten en
 * wachttijd bij een klant die op antwoord zit te wachten.
 */
export const AI_MODEL = 'claude-haiku-4-5-20251001'
export const AI_MAX_TOKENS = 1024
