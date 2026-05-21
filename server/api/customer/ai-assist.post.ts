import { getServiceRoleClient } from '~~/server/utils/supabase'
import { SUNDATA_BASE_URL, sundataSession } from '~~/server/utils/sundata'

/**
 * Customer-facing AI helper.
 *
 * Matches the customer's question against known topics (solar, heat pump, EV,
 * invoicing, appointment, cancellation) and returns a helpful reply. For solar
 * questions we enrich the reply with live Sundata yield data so the customer
 * sees real numbers for their own system.
 *
 * When the question can't be answered automatically, `shouldEscalate: true` is
 * returned so the UI can offer a "persoonlijk contact"-button that creates a
 * real service ticket.
 */
interface AiReply {
  content: string
  systemCheck: boolean
  dataPoints: { label: string; value: string }[]
  shouldEscalate: boolean
  escalateReason?: string
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw))
}

function formatKwh(wh?: number) {
  if (wh === undefined || wh === null) return '—'
  const v = wh / 1000
  if (v >= 100) return `${v.toFixed(0)} kWh`
  return `${v.toFixed(1)} kWh`
}

async function fetchSolarContext(event: any, customerId: string, partnerId: string): Promise<any | null> {
  const supabase = getServiceRoleClient(event)
  const { data: products } = await supabase
    .from('customer_products')
    .select('serial_number')
    .eq('customer_id', customerId)
    .eq('category', 'solar_panel')
    .order('created_at', { ascending: false })
  const link = (products || []).map(p => p.serial_number || '').find(s => s.startsWith('sundata:'))
  if (!link) return null
  const [companyId, plantId, meterId] = link.slice('sundata:'.length).split('/').map(Number)
  if (!companyId || !plantId || !meterId) return null

  try {
    const { headers } = await sundataSession(event, partnerId)
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const today = `${yyyy}-${mm}-${dd}`
    const monthStart = `${yyyy}-${mm}-01`

    const [meter, monthData] = await Promise.all([
      $fetch<any>(`${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/meters/${meterId}`, { headers }).catch(() => null),
      $fetch<any>(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}/yield` +
          `?start_date=${monthStart}&end_date=${today}&period_type=day&yield_type=actual-yield`,
        { headers },
      ).catch(() => null),
    ])

    const days: any[] = monthData?.data || []
    const todayEntry = days.find((d: any) => (d.time || '').startsWith(today))
    const monthSum = days.reduce((s, d) => s + (d.yield_in_wh || 0), 0)
    return {
      peakInWatt: meter?.peak_in_watt,
      orientationDeg: meter?.orientation_in_degrees,
      tiltDeg: meter?.angle_in_degrees,
      operationalSince: meter?.operational_since,
      todayWh: todayEntry?.yield_in_wh || 0,
      monthWh: monthSum,
      hasData: days.some(d => (d.yield_in_wh || 0) > 0),
    }
  } catch {
    return null
  }
}

export default defineEventHandler(async (event): Promise<AiReply> => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)
  const message: string = (body?.message || '').toString().trim()
  const hintedModule: string | null = body?.moduleType || null

  if (!message) {
    throw createError({ statusCode: 400, message: 'Bericht is verplicht' })
  }

  const { data: customer } = await supabase
    .from('customers')
    .select('id, partner_id, full_name')
    .eq('auth_user_id', user.id)
    .single()

  const { data: partner } = customer?.partner_id
    ? await supabase.from('partners').select('name').eq('id', customer.partner_id).single()
    : { data: null }

  const partnerName = partner?.name || 'je installateur'
  const msg = message.toLowerCase()

  // --- Solar / zonnepanelen ---
  if (hintedModule === 'solar' || matchesAny(msg, ['opbrengst', 'productie', 'panelen', 'zonnepaneel', 'zonnepanelen', 'solar', 'weinig opgewekt', 'minder stroom', 'omvormer'])) {
    const ctx = customer ? await fetchSolarContext(event, customer.id, customer.partner_id) : null
    if (!ctx) {
      return {
        content: `Ik kan nog geen meetgegevens van je zonnepanelen ophalen. Je installatie is mogelijk nog niet gekoppeld, of er is nog geen data beschikbaar. Wil je dat ik dit doorstuur naar ${partnerName}?`,
        systemCheck: false, dataPoints: [], shouldEscalate: true,
        escalateReason: 'Klant heeft vraag over zonnepanelen maar koppeling ontbreekt',
      }
    }
    if (!ctx.hasData) {
      return {
        content: `Je installatie is gekoppeld (${(ctx.peakInWatt / 1000).toFixed(1)} kWp, operationeel sinds ${ctx.operationalSince || 'recent'}), maar er komt nog geen meetdata binnen. Dat kan tot 24 uur duren na de eerste koppeling. Duurt het langer? Laat het me weten dan schakel ik ${partnerName} in.`,
        systemCheck: true,
        dataPoints: [
          { label: 'Vermogen', value: `${(ctx.peakInWatt / 1000).toFixed(1)} kWp` },
          { label: 'Status', value: 'Wachten op data' },
          { label: 'Sinds', value: ctx.operationalSince || '—' },
        ],
        shouldEscalate: false,
      }
    }
    return {
      content: `Ik heb je zonnepanelen gecheckt. Je systeem is gekoppeld en actief. Vandaag is er ${formatKwh(ctx.todayWh)} opgewekt, deze maand ${formatKwh(ctx.monthWh)}. Lijkt dat afwijkend van wat je verwacht? Dat kan komen door bewolking, schaduw of de tijd van het jaar — op deze schaal is één dag niet altijd representatief.`,
      systemCheck: true,
      dataPoints: [
        { label: 'Vandaag', value: formatKwh(ctx.todayWh) },
        { label: 'Deze maand', value: formatKwh(ctx.monthWh) },
        { label: 'Vermogen', value: `${(ctx.peakInWatt / 1000).toFixed(1)} kWp` },
      ],
      shouldEscalate: false,
    }
  }

  // --- Heat pump ---
  if (hintedModule === 'heat_pump' || matchesAny(msg, ['warmtepomp', 'verwarming', 'koud', 'warm', 'temperatuur', 'tikt', 'bromm', 'buitenunit'])) {
    const hasIssue = matchesAny(msg, ['storing', 'geluid', 'tikt', 'bromm', 'kapot', 'fout', 'werkt niet', 'lekt'])
    return {
      content: hasIssue
        ? `Dat klinkt als iets wat technische inspectie vereist. Ik kan de warmtepomp-monitoring nog niet live uitlezen — laat me dit doorsturen naar ${partnerName} zodat een monteur kan kijken. Heb je al een idee wanneer het begon?`
        : `Voor je warmtepomp heb ik nog geen live monitoring beschikbaar. Wil je informatie over instellingen of onderhoud? Dan verwijs ik je door naar ${partnerName}.`,
      systemCheck: false, dataPoints: [], shouldEscalate: hasIssue,
      escalateReason: hasIssue ? 'Mogelijk warmtepomp-storing' : undefined,
    }
  }

  // --- EV charger ---
  if (hintedModule === 'ev_charger' || matchesAny(msg, ['laadpaal', 'laden', 'opladen', 'auto', 'charger', 'easee'])) {
    return {
      content: `Voor je laadpaal heb ik nog geen live monitoring. Voor vragen over laadmodi, slim laden of laadgedrag kan ${partnerName} je het beste helpen. Wil je dat ik het doorstuur?`,
      systemCheck: false, dataPoints: [], shouldEscalate: false,
    }
  }

  // --- Invoice ---
  if (matchesAny(msg, ['factuur', 'betaling', 'incasso', 'kosten', 'prijs', 'bedrag', 'rekening', 'duur'])) {
    return {
      content: `Je facturen vind je in je account onder "Facturen". Als je een bedrag niet herkent of de incasso is geweigerd, dan help ik je door te verwijzen naar ${partnerName}. Zal ik dat doen?`,
      systemCheck: false, dataPoints: [], shouldEscalate: false,
    }
  }

  // --- Cancel ---
  if (matchesAny(msg, ['opzeggen', 'stoppen', 'annuleren', 'beëindigen'])) {
    return {
      content: `Een wijziging of opzegging van je servicecontract regel ik niet zelf. Ik stuur je vraag door naar ${partnerName} — zij nemen persoonlijk contact met je op.`,
      systemCheck: false, dataPoints: [], shouldEscalate: true,
      escalateReason: 'Klant wil servicecontract wijzigen/opzeggen',
    }
  }

  // --- Appointment ---
  if (matchesAny(msg, ['afspraak', 'monteur', 'langskomen', 'bezoek', 'inspectie', 'onderhoud'])) {
    return {
      content: `Ik plan graag een afspraak voor je in. Ik stuur je verzoek door naar ${partnerName}, zij nemen contact op voor een passend moment.`,
      systemCheck: false, dataPoints: [], shouldEscalate: true,
      escalateReason: 'Klant wil afspraak inplannen',
    }
  }

  // --- Thanks / resolved ---
  if (matchesAny(msg, ['bedankt', 'dankjewel', 'top', 'opgelost', 'helder', 'duidelijk', 'geholpen', 'prima'])) {
    return {
      content: 'Graag gedaan! Als er nog iets is kun je altijd een nieuwe vraag stellen. Fijne dag!',
      systemCheck: false, dataPoints: [], shouldEscalate: false,
    }
  }

  // --- Fallback ---
  return {
    content: `Bedankt voor je bericht. Ik kan hier zelf niet direct op antwoorden. Als je wilt stuur ik je vraag door naar ${partnerName}. Zij reageren doorgaans binnen 1 werkdag.`,
    systemCheck: false, dataPoints: [], shouldEscalate: true,
    escalateReason: 'Vraag niet automatisch te beantwoorden',
  }
})
