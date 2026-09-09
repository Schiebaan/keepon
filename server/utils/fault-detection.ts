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
export function easeeFault(signal: { state: string | null; stateAvailable: boolean }): Fault | null {
  // Geen live status beschikbaar op dit toegangsniveau. Dat is een beperking
  // van het Easee-account, geen storing bij de klant — dus melden we niets.
  // Zou dit wél een storing opleveren, dan stond er bij elke paal permanent
  // een melding en werd het hele signaal waardeloos.
  if (!signal.stateAvailable || signal.state === null) return null

  const mode = Number(signal.state)
  if (mode === 0) {
    return { kind: 'unreachable', detail: 'Laadpaal is niet bereikbaar — geen stroom of geen internet.', raw: signal.state }
  }
  if (mode === 5) {
    return { kind: 'error', detail: 'Laadpaal meldt een storing en kan niet laden.', raw: signal.state }
  }
  return null
}

/**
 * Weheat.
 *
 * Weheat geeft `state` als getal (bij Volt4U staat alles op 40) en publiceert
 * geen enum-documentatie — hun OpenAPI-spec staat achter een 403. Wij gaan die
 * nummers dus niet interpreteren: één verkeerde aanname en er gaan bij 29
 * warmtepompen tegelijk valse storingen uit.
 *
 * Wat wél hard is: hoe oud de laatste meting is. Een pomp die niet meer
 * rapporteert is aantoonbaar een probleem, en de laatste logregel blijft
 * gewoon staan als hij offline gaat — alleen de tijdstempel verraadt het.
 *
 * Drempel op 24 uur. Alle pompen bij Volt4U rapporteren nu binnen de minuut,
 * dus een etmaal stilte is ruim buiten normaal.
 */
const WEHEAT_UREN_DREMPEL = 24

export function weheatFault(state: string, measuredAt?: string | null): Fault | null {
  if (!measuredAt) {
    return { kind: 'unreachable', detail: 'Warmtepomp geeft geen meetgegevens door.', raw: String(state) }
  }
  const uren = (Date.now() - new Date(measuredAt).getTime()) / 3600000
  if (!Number.isFinite(uren)) return null
  if (uren >= WEHEAT_UREN_DREMPEL) {
    const dagen = Math.floor(uren / 24)
    return {
      kind: 'stale',
      detail: dagen >= 1
        ? `Warmtepomp rapporteert al ${dagen} ${dagen === 1 ? 'dag' : 'dagen'} niets meer.`
        : `Warmtepomp rapporteert al ${Math.floor(uren)} uur niets meer.`,
      raw: `last_log:${measuredAt}`,
    }
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
