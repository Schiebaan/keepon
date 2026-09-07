import { SUNDATA_BASE_URL, sundataSession } from '~~/server/utils/sundata'

/**
 * Vertaalt de status van een leverancier naar "is dit een storing?".
 *
 * Elke fabrikant zegt het anders, en geen van hen zegt "storing". Easee geeft
 * een nummer, Weheat een tekstuele toestand, en Sundata geeft helemaal geen
 * status — daar moeten we het uit de opbrengst afleiden.
 */
export type FaultKind = 'error' | 'unreachable' | 'stale'
export interface Fault { kind: FaultKind; detail: string; raw: string }

/**
 * Easee, chargerOpMode. Zelfde nummers als in de klantweergave.
 * 0 = niet bereikbaar, 5 = storing. De rest zijn normale laadtoestanden.
 */
export function easeeFault(state: string): Fault | null {
  const mode = Number(state)
  if (mode === 0) {
    return { kind: 'unreachable', detail: 'Laadpaal is niet bereikbaar — geen stroom of geen internet.', raw: state }
  }
  if (mode === 5) {
    return { kind: 'error', detail: 'Laadpaal meldt een storing en kan niet laden.', raw: state }
  }
  return null
}

/**
 * Weheat, heat_pump_state.
 *
 * Bewust een lijst van wat fout is, en niet "alles wat niet in de goede lijst
 * staat". Weheat kan morgen een nieuwe normale toestand introduceren, en dan
 * wil je niet dat alle warmtepompen tegelijk als storing binnenkomen.
 */
const WEHEAT_FOUT = ['error', 'fault', 'alarm', 'failure', 'blocked', 'lockout']

export function weheatFault(state: string): Fault | null {
  const s = (state || '').toLowerCase()
  if (!s || s === 'unknown') {
    return { kind: 'unreachable', detail: 'Warmtepomp geeft geen status door.', raw: state }
  }
  if (WEHEAT_FOUT.some(f => s.includes(f))) {
    return { kind: 'error', detail: `Warmtepomp meldt een storing (${state}).`, raw: state }
  }
  return null
}

/**
 * Zonnepanelen: geen storingsveld beschikbaar, dus afleiden uit de opbrengst.
 *
 * De drempel staat op 3 dagen. Eén dag zonder opbrengst is winter of bewolking;
 * drie dagen op rij is dat vrijwel nooit, ook niet in december. En we melden
 * alleen als de installatie ooit iets heeft geproduceerd — anders krijg je een
 * storing op elke net gekoppelde installatie waar de data nog moet binnenkomen.
 */
const ZONNE_DAGEN_DREMPEL = 3

export async function sundataFault(
  event: any,
  partnerId: string,
  link: string,
): Promise<Fault | null> {
  const [companyId, plantId] = link.slice('sundata:'.length).split('/').map(Number)
  if (!companyId || !plantId) return null

  const { headers } = await sundataSession(event, partnerId)
  const nu = new Date()
  const eind = nu.toISOString().slice(0, 10)
  const start = new Date(nu.getTime() - 21 * 24 * 3600 * 1000).toISOString().slice(0, 10)

  const res = await $fetch<any>(
    `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/yield`
      + `?start_date=${start}&end_date=${eind}&period_type=day&yield_type=actual-yield`,
    { headers },
  ).catch(() => null)

  const dagen: any[] = res?.data || []
  const metOpbrengst = dagen.filter(d => (d.yield_in_wh || 0) > 0)

  // Nooit iets geproduceerd in drie weken? Dan is dit geen storing maar een
  // installatie die nog moet gaan draaien of nog niet goed gekoppeld is.
  if (!metOpbrengst.length) return null

  const laatste = metOpbrengst[metOpbrengst.length - 1]
  const laatsteDatum = new Date(String(laatste.time).slice(0, 10))
  const dagenGeleden = Math.floor((nu.getTime() - laatsteDatum.getTime()) / 86400000)

  if (dagenGeleden >= ZONNE_DAGEN_DREMPEL) {
    return {
      kind: 'stale',
      detail: `Geen opbrengst sinds ${String(laatste.time).slice(0, 10)} (${dagenGeleden} dagen).`,
      raw: `last_yield:${String(laatste.time).slice(0, 10)}`,
    }
  }
  return null
}
