import { getServiceRoleClient } from '~~/server/utils/supabase'
import { SUNDATA_BASE_URL, sundataSession } from '~~/server/utils/sundata'
import { getAnthropic, isAiAvailable, AI_MODEL, AI_MAX_TOKENS } from '~~/server/utils/ai'
import {
  getCustomerProducts, getKbArticles, getPastTickets, renderContext, normalizeModule,
} from '~~/server/utils/ai-context'

/**
 * De servicechat van de klant.
 *
 * Alle serviceverzoeken lopen hierlangs. Het doel is niet om zoveel mogelijk
 * tickets te voorkomen, maar om een ticket af te leveren waar de monteur iets
 * mee kan. "Zonnepaneel is kapot" kost een telefoontje voordat er iemand kan
 * rijden; "sinds dinsdag geen productie, omvormer knippert rood, display toont
 * E013" niet.
 *
 * Vandaar dat het model doorvraagt vóór het escaleert. Het krijgt daarbij mee:
 * welke producten de klant heeft en of ze gekoppeld zijn, de actuele meetdata,
 * de storingsartikelen uit de kennisbank, en hoe vergelijkbare klachten eerder
 * zijn opgelost.
 *
 * Zonder ANTHROPIC_API_KEY valt alles terug op de oude trefwoordregels
 * (ruleBasedReply). Die zijn beperkt, maar beter dan een foutmelding.
 */
interface AiReply {
  content: string
  systemCheck: boolean
  dataPoints: { label: string; value: string }[]
  shouldEscalate: boolean
  escalateReason?: string
  /** Door het model opgestelde ticketinhoud, klaar om aan te maken. */
  ticketDraft?: { subject: string; description: string; urgency: string; module_type: string | null }
  source: 'ai' | 'rules'
}

interface InkomendBericht { role: 'user' | 'assistant'; content: string }

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

    // Laatste dag mét opbrengst. Juist dát is het signaal bij een storing: als
    // dat drie dagen geleden was, is er iets aan de hand.
    const metOpbrengst = days.filter(d => (d.yield_in_wh || 0) > 0)
    const laatsteProductie = metOpbrengst.length ? metOpbrengst[metOpbrengst.length - 1].time : null

    return {
      peakInWatt: meter?.peak_in_watt,
      operationalSince: meter?.operational_since,
      todayWh: todayEntry?.yield_in_wh || 0,
      monthWh: monthSum,
      hasData: metOpbrengst.length > 0,
      laatsteProductie,
    }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Terugvalpad: de oorspronkelijke trefwoordregels.
// ---------------------------------------------------------------------------
function ruleBasedReply(msg: string, partnerName: string, solarCtx: any, hintedModule: string | null): AiReply {
  const basis = { systemCheck: false, dataPoints: [], shouldEscalate: false, source: 'rules' as const }

  if (hintedModule === 'solar' || matchesAny(msg, ['opbrengst', 'productie', 'panelen', 'zonnepaneel', 'zonnepanelen', 'solar', 'omvormer'])) {
    if (!solarCtx) {
      return {
        ...basis,
        content: `Ik kan nog geen meetgegevens van je zonnepanelen ophalen. Je installatie is mogelijk nog niet gekoppeld. Wil je dat ik dit doorstuur naar ${partnerName}?`,
        shouldEscalate: true,
        escalateReason: 'Vraag over zonnepanelen maar koppeling ontbreekt',
      }
    }
    return {
      ...basis,
      content: `Vandaag is er ${formatKwh(solarCtx.todayWh)} opgewekt, deze maand ${formatKwh(solarCtx.monthWh)}. Klopt dat niet met wat je verwacht? Dan stuur ik het door naar ${partnerName}.`,
      systemCheck: true,
      dataPoints: [
        { label: 'Vandaag', value: formatKwh(solarCtx.todayWh) },
        { label: 'Deze maand', value: formatKwh(solarCtx.monthWh) },
      ],
    }
  }

  if (matchesAny(msg, ['opzeggen', 'stoppen', 'annuleren', 'beëindigen'])) {
    return {
      ...basis,
      content: `Een wijziging of opzegging van je servicecontract regel ik niet zelf. Ik stuur je vraag door naar ${partnerName}.`,
      shouldEscalate: true,
      escalateReason: 'Klant wil servicecontract wijzigen/opzeggen',
    }
  }

  if (matchesAny(msg, ['bedankt', 'dankjewel', 'top', 'opgelost', 'helder', 'duidelijk', 'geholpen'])) {
    return { ...basis, content: 'Graag gedaan! Als er nog iets is, stel gerust een nieuwe vraag.' }
  }

  return {
    ...basis,
    content: `Bedankt voor je bericht. Ik stuur je vraag door naar ${partnerName}. Zij reageren doorgaans binnen 1 werkdag.`,
    shouldEscalate: true,
    escalateReason: 'Vraag niet automatisch te beantwoorden',
  }
}

// ---------------------------------------------------------------------------

const SYSTEEMPROMPT = `Je bent de servicemedewerker van {{PARTNER}}, een installatiebedrijf. Je helpt {{KLANT}} via de chat in hun klantportaal.

## Je opdracht

Achterhaal wát er precies aan de hand is, voordat er een monteur bij gehaald wordt. Een monteur die langskomt met "zonnepanelen kapot" moet ter plekke nog alles uitzoeken. Jij zorgt dat er in plaats daarvan staat: sinds wanneer, welk symptoom, welke foutcode, wat de klant al geprobeerd heeft.

## Hoe je dat doet

Stel **één vraag tegelijk**. Een rijtje van vier vragen leest als een formulier en dan krijg je één antwoord op de laatste.

Begin bij het symptoom, niet bij de oorzaak. "Wat zie je precies?" komt vóór "is de omvormer defect?".

Vraag door tot je weet: sinds wanneer, wat de klant waarneemt (lampjes, geluid, display, foutcode), of het steeds gebeurt of af en toe, en wat er eventueel veranderd is. Meestal ben je er in twee tot vier vragen.

Gebruik de meetgegevens die je krijgt. Zie je dat er sinds dinsdag geen productie meer is, benoem dat — dan hoeft de klant het niet zelf te ontdekken. Verzin nooit metingen die je niet hebt gekregen.

**Leg nooit uit wat een specifieke foutcode betekent.** Codes verschillen per merk: een E013 betekent bij het ene merk iets heel anders dan bij het andere. Noteer de code, zeg dat de monteur eraan genoeg heeft, en vraag door op wat de klant zelf kan waarnemen. Alleen als de kennisbank die code expliciet noemt mag je uitleggen wat 'ie betekent. Hetzelfde geldt voor de oorzaak: je stelt geen diagnose, je verzamelt waarnemingen.

Staat er in de kennisbank een stap die de klant zelf kan zetten, leg die dan uit en vraag of het hielp. Veel storingen zijn een gevallen zekering of een omvormer die opnieuw opgestart moet worden.

## Wanneer je doorstuurt

Roep \`escalate_to_installer\` aan zodra je genoeg weet, én in deze gevallen meteen:
- de klant vraagt erom, of is duidelijk klaar met vragen
- er is gevaar: brandlucht, rook, water bij elektra, een hete of gezwollen batterij
- het gaat over contract, opzegging, facturen of een afspraak
- na vier vragen ben je er nog niet uit

Schrijf de \`description\` alsof je 'm aan de monteur overdraagt: symptoom, sinds wanneer, waarneming van de klant, wat al geprobeerd is, en wat de meetgegevens laten zien. Vat samen wat de klant je vertelde — verzin niets bij.

Bij gevaar: zeg eerst wat de klant nu moet doen, en escaleer met urgency 'hoog'.

## Toon

Nederlands, je-vorm, warm en kort. Geen jargon zonder uitleg: zeg "de kast waar je zonnepanelen op aangesloten zijn" in plaats van "de omvormer", tenzij de klant dat woord zelf gebruikt. Geen opsommingen van drie regels als één zin volstaat. Beloof nooit een tijdstip of een prijs.

Je bent niet van UPsol en noemt UPsol niet. Je werkt namens {{PARTNER}}.`

export default defineEventHandler(async (event): Promise<AiReply> => {
  const user = await requireAuth(event)
  const supabase = getServiceRoleClient(event)
  const body = await readBody(event)

  // Nieuw formaat is een berichtenreeks; het oude single-message formaat blijft
  // werken zodat een openstaand tabblad tijdens een deploy niet stukgaat.
  const history: InkomendBericht[] = Array.isArray(body?.messages) ? body.messages : []
  const message: string = (body?.message || history[history.length - 1]?.content || '').toString().trim()
  const hintedModule: string | null = body?.moduleType || null
  // De klant heeft zelf op "stuur door" geklikt. Dan hoeft er niet meer
  // gevraagd te worden — dan moet er samengevat worden, met wat er ligt.
  const finalize: boolean = !!body?.finalize

  if (!message) throw createError({ statusCode: 400, message: 'Bericht is verplicht' })

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

  const solarCtx = customer ? await fetchSolarContext(event, customer.id, customer.partner_id) : null

  if (!isAiAvailable() || !customer) {
    return ruleBasedReply(msg, partnerName, solarCtx, hintedModule)
  }

  // --- Context verzamelen ---------------------------------------------------
  const moduleType = normalizeModule(hintedModule)
    || (matchesAny(msg, ['paneel', 'panelen', 'zonne', 'omvormer', 'opbrengst']) ? 'solar_panel'
      : matchesAny(msg, ['warmtepomp', 'verwarming', 'radiator', 'vloerverwarming']) ? 'heat_pump'
      : matchesAny(msg, ['laadpaal', 'laden', 'laadpunt', 'auto']) ? 'ev_charger'
      : matchesAny(msg, ['batterij', 'accu', 'thuisbatterij']) ? 'battery'
      : null)

  const [products, articles, pastTickets] = await Promise.all([
    getCustomerProducts(event, customer.id),
    getKbArticles(event, moduleType),
    getPastTickets(event, customer.partner_id, moduleType, customer.id),
  ])

  const live: { label: string; value: string }[] = []
  if (solarCtx) {
    live.push({ label: 'Zonnepanelen vandaag', value: formatKwh(solarCtx.todayWh) })
    live.push({ label: 'Zonnepanelen deze maand', value: formatKwh(solarCtx.monthWh) })
    if (solarCtx.peakInWatt) live.push({ label: 'Vermogen installatie', value: `${(solarCtx.peakInWatt / 1000).toFixed(1)} kWp` })
    live.push({
      label: 'Laatste dag met productie',
      value: solarCtx.laatsteProductie ? String(solarCtx.laatsteProductie).slice(0, 10) : 'geen productie deze maand',
    })
  }

  const systeem = SYSTEEMPROMPT
    .replaceAll('{{PARTNER}}', partnerName)
    .replaceAll('{{KLANT}}', customer.full_name || 'de klant')
    + '\n\n# Wat je over deze klant weet\n\n'
    + renderContext({ products, articles, pastTickets }, live)

  const messages = (history.length ? history : [{ role: 'user' as const, content: message }])
    .filter(m => m && typeof m.content === 'string' && m.content.trim())
    .slice(-12)   // genoeg voor de diagnose, en houdt de kosten voorspelbaar
    .map(m => ({ role: m.role === 'assistant' ? 'assistant' as const : 'user' as const, content: m.content }))

  // --- Claude ---------------------------------------------------------------
  //
  // Bij finalize dwingen we de tool-aanroep af. Zonder dat zou het model bij
  // een gesprek van één zin nóg een vervolgvraag stellen, terwijl de klant net
  // heeft aangegeven dat 'ie een mens wil. Dan komt er een ticket binnen met
  // alleen de ruwe openingszin — precies wat we wilden voorkomen.
  const finalizeInstructie = `

# De klant klikt nu op "stuur door"

Stel geen vragen meer. Roep escalate_to_installer aan met wat je nu weet.

Is dat weinig — bijvoorbeeld één zin zonder details — schrijf dat dan letterlijk in de description, zodat de monteur weet dat hij zelf moet uitvragen en waarnaar. Bijvoorbeeld: "Klant meldt alleen dat de zonnepanelen kapot zijn; symptoom, sinds wanneer en foutcode zijn nog niet bekend." Verzin niets bij.`

  try {
    const response = await getAnthropic().messages.create({
      model: AI_MODEL,
      max_tokens: AI_MAX_TOKENS,
      system: finalize ? systeem + finalizeInstructie : systeem,
      messages,
      ...(finalize ? { tool_choice: { type: 'tool' as const, name: 'escalate_to_installer' } } : {}),
      tools: [{
        name: 'escalate_to_installer',
        description: 'Maak een serviceticket aan voor de installateur. Roep dit aan zodra je genoeg weet om de monteur op weg te helpen, of direct bij gevaar, contractvragen of als de klant erom vraagt.',
        input_schema: {
          type: 'object',
          properties: {
            subject: { type: 'string', description: 'Korte omschrijving van de klacht, max 80 tekens. Concreet: "Geen productie sinds 3 sept, omvormer knippert rood" — niet "Probleem met zonnepanelen".' },
            description: { type: 'string', description: 'Overdracht aan de monteur: symptoom, sinds wanneer, waarneming van de klant, wat al geprobeerd is, en wat de meetgegevens laten zien.' },
            urgency: { type: 'string', enum: ['laag', 'normaal', 'hoog'], description: "'hoog' bij gevaar of volledige uitval, 'laag' bij een vraag zonder storing." },
            module_type: { type: 'string', enum: ['solar_panel', 'heat_pump', 'ev_charger', 'battery', 'other'] },
          },
          required: ['subject', 'description', 'urgency'],
        },
      }],
    })

    const tekst = response.content.filter(c => c.type === 'text').map((c: any) => c.text).join('\n').trim()
    const tool = response.content.find((c: any) => c.type === 'tool_use') as any

    if (tool?.name === 'escalate_to_installer') {
      const inp = tool.input || {}
      return {
        content: tekst || `Ik heb genoeg om je melding door te zetten naar ${partnerName}. Zal ik dat doen?`,
        systemCheck: !!solarCtx,
        dataPoints: live.slice(0, 3),
        shouldEscalate: true,
        escalateReason: inp.subject,
        ticketDraft: {
          subject: String(inp.subject || 'Serviceverzoek').slice(0, 120),
          description: String(inp.description || ''),
          urgency: ['laag', 'normaal', 'hoog'].includes(inp.urgency) ? inp.urgency : 'normaal',
          module_type: inp.module_type && inp.module_type !== 'other' ? inp.module_type : moduleType,
        },
        source: 'ai',
      }
    }

    return {
      content: tekst || 'Kun je dat iets uitgebreider omschrijven?',
      systemCheck: !!solarCtx,
      dataPoints: live.slice(0, 3),
      shouldEscalate: false,
      source: 'ai',
    }
  } catch (e: any) {
    // Rate limit, storing bij Anthropic, ontbrekend krediet — de klant hoort
    // daar niets van te merken behalve een wat botter antwoord.
    console.error('[ai-assist] Claude-aanroep mislukt:', e?.message)
    return ruleBasedReply(msg, partnerName, solarCtx, hintedModule)
  }
})
