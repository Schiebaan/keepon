// Mock AI Service Engine voor demo
// Keyword-gebaseerde response generator die systeemdata raadpleegt

import type { MockSolarData, MockHeatPumpData, MockEvChargerData } from '~/composables/useMockData'

export interface AiResponse {
  content: string
  systemCheck: boolean
  dataPoints: { label: string; value: string }[]
  shouldEscalate: boolean
  escalateReason?: string
}

interface SystemContext {
  solarData: MockSolarData
  heatPumpData: MockHeatPumpData
  evChargerData: MockEvChargerData
  partnerName: string
  activeModules: string[]
}

export function generateAiResponse(message: string, moduleType: string | null, ctx: SystemContext): AiResponse {
  const msg = message.toLowerCase()

  // --- Zonnepanelen checks ---
  if (matchesAny(msg, ['opbrengst', 'productie', 'panelen', 'zonnepaneel', 'solar', 'weinig opgewekt', 'minder stroom'])) {
    const status = ctx.solarData.status === 'online' ? 'online en functioneert normaal' : 'offline. Dit kan de oorzaak zijn'
    return {
      content: `Ik heb je zonnepanelen gecheckt. Je systeem is ${status}. Op dit moment wordt er ${formatW(ctx.solarData.currentProductionW)} geproduceerd. Vandaag is de totale opbrengst ${ctx.solarData.todayKwh.toFixed(1)} kWh, goed voor een besparing van €${(ctx.solarData.todayEuro / 100).toFixed(2)}.\n\nDe piek vandaag was ${formatW(ctx.solarData.peakTodayW)} om ${ctx.solarData.peakTodayTime}. ${ctx.solarData.selfConsumptionPercent}% van de opgewekte energie gebruik je zelf.\n\nOp basis van deze gegevens werkt je systeem naar verwachting. Als je toch een verschil merkt, kan het komen door bewolking of schaduw.`,
      systemCheck: true,
      dataPoints: [
        { label: 'Huidige productie', value: formatW(ctx.solarData.currentProductionW) },
        { label: 'Vandaag opgewekt', value: `${ctx.solarData.todayKwh.toFixed(1)} kWh` },
        { label: 'Status', value: ctx.solarData.status },
        { label: 'Eigen verbruik', value: `${ctx.solarData.selfConsumptionPercent}%` },
      ],
      shouldEscalate: ctx.solarData.status !== 'online',
    }
  }

  // --- Warmtepomp checks ---
  if (matchesAny(msg, ['warmtepomp', 'verwarming', 'temperatuur', 'koud', 'warm', 'storing', 'geluid', 'tikt', 'bromm'])) {
    const hasIssue = matchesAny(msg, ['storing', 'geluid', 'tikt', 'bromm', 'kapot', 'fout', 'werkt niet'])
    const statusText = ctx.heatPumpData.status === 'storing' ? 'Er is een storing gedetecteerd.' : `Status: ${ctx.heatPumpData.status}. Geen storingen gedetecteerd.`

    if (hasIssue && ctx.heatPumpData.status !== 'storing') {
      return {
        content: `Ik heb je warmtepomp gecontroleerd. ${statusText} De COP is ${ctx.heatPumpData.copCurrent.toFixed(1)} (${ctx.heatPumpData.copRating}), wat betekent dat het systeem efficiënt draait.\n\nBinnentemperatuur: ${ctx.heatPumpData.actualTemperature}°C (ingesteld: ${ctx.heatPumpData.setTemperature}°C).\nWarmwater: ${ctx.heatPumpData.hotWaterStatus === 'gereed' ? 'gereed' : 'wordt opgewarmd'} (${ctx.heatPumpData.hotWaterTemp}°C).\n\nTechnisch lijkt alles in orde. Omdat je aangeeft dat er een probleem is, raad ik aan om dit te laten nakijken door een monteur. Zal ik dit doorsturen naar ${ctx.partnerName}?`,
        systemCheck: true,
        dataPoints: [
          { label: 'Status', value: ctx.heatPumpData.status },
          { label: 'COP', value: `${ctx.heatPumpData.copCurrent.toFixed(1)} (${ctx.heatPumpData.copRating})` },
          { label: 'Binnen', value: `${ctx.heatPumpData.actualTemperature}°C` },
          { label: 'Ingesteld', value: `${ctx.heatPumpData.setTemperature}°C` },
        ],
        shouldEscalate: false, // Bied optie, escaleer niet automatisch
      }
    }

    return {
      content: `Ik heb je warmtepomp gecheckt. ${statusText}\n\nBinnentemperatuur: ${ctx.heatPumpData.actualTemperature}°C (ingesteld: ${ctx.heatPumpData.setTemperature}°C). Buitentemperatuur: ${ctx.heatPumpData.outsideTemperature}°C. Modus: ${ctx.heatPumpData.mode}.\n\nJe warmtepomp werkt normaal.`,
      systemCheck: true,
      dataPoints: [
        { label: 'Status', value: ctx.heatPumpData.status },
        { label: 'Binnen', value: `${ctx.heatPumpData.actualTemperature}°C` },
        { label: 'Buiten', value: `${ctx.heatPumpData.outsideTemperature}°C` },
        { label: 'Modus', value: ctx.heatPumpData.mode },
      ],
      shouldEscalate: ctx.heatPumpData.status === 'storing',
    }
  }

  // --- Laadpaal checks ---
  if (matchesAny(msg, ['laadpaal', 'laden', 'auto', 'opladen', 'charger', 'easee', 'laadsessie'])) {
    const statusText = ctx.evChargerData.status === 'laden'
      ? `Je auto wordt momenteel geladen met ${formatW(ctx.evChargerData.currentPowerW)}.`
      : 'Je laadpaal staat op stand-by en is klaar om te laden.'
    return {
      content: `${statusText}\n\nVandaag is er ${ctx.evChargerData.chargedTodayKwh.toFixed(1)} kWh geladen (€${(ctx.evChargerData.chargedTodayEuro / 100).toFixed(2)}). Deze maand: ${ctx.evChargerData.chargedMonthKwh} kWh.\n\nJe laadmodus staat op "${ctx.evChargerData.chargeMode}". ${ctx.evChargerData.chargeMode === 'slim' ? 'Dit betekent dat er zoveel mogelijk op zonne-energie wordt geladen.' : ''}`,
      systemCheck: true,
      dataPoints: [
        { label: 'Status', value: ctx.evChargerData.status },
        { label: 'Vandaag geladen', value: `${ctx.evChargerData.chargedTodayKwh.toFixed(1)} kWh` },
        { label: 'Laadmodus', value: ctx.evChargerData.chargeMode },
      ],
      shouldEscalate: ctx.evChargerData.status === 'storing',
    }
  }

  // --- Factuur / betaling ---
  if (matchesAny(msg, ['factuur', 'betaling', 'incasso', 'kosten', 'prijs', 'bedrag', 'rekening'])) {
    const modules = ctx.activeModules.map(m =>
      m === 'solar' ? 'Zonnepanelen' : m === 'heat_pump' ? 'Warmtepomp' : 'Laadpaal'
    ).join(' + ')
    return {
      content: `Je facturen vind je op de pagina "Facturen" in je account. Je huidige servicecontract dekt: ${modules}.\n\nDe betaling verloopt via automatische incasso. Als je een afwijking ziet, controleer dan de factuurpagina voor details. Klopt er iets niet? Dan help ik je graag verder.`,
      systemCheck: false,
      dataPoints: [],
      shouldEscalate: false,
    }
  }

  // --- Opzeggen ---
  if (matchesAny(msg, ['opzeggen', 'stoppen', 'annuleren', 'beëindigen'])) {
    return {
      content: `Ik begrijp dat je je servicecontract wilt wijzigen of opzeggen. Dit kan ik niet zelf voor je regelen. Ik stuur je vraag door naar ${ctx.partnerName} zodat zij je persoonlijk kunnen helpen met de mogelijkheden.`,
      systemCheck: false,
      dataPoints: [],
      shouldEscalate: true,
      escalateReason: 'Klant wil servicecontract opzeggen of wijzigen',
    }
  }

  // --- Afspraak / monteur ---
  if (matchesAny(msg, ['afspraak', 'monteur', 'langskomen', 'bezoek', 'inspectie', 'onderhoud'])) {
    return {
      content: `Ik plan graag een afspraak voor je in. Ik stuur je verzoek door naar ${ctx.partnerName}. Zij nemen contact op om een geschikt moment af te spreken.`,
      systemCheck: false,
      dataPoints: [],
      shouldEscalate: true,
      escalateReason: 'Klant wil een afspraak inplannen',
    }
  }

  // --- Bedankt / opgelost ---
  if (matchesAny(msg, ['bedankt', 'dankjewel', 'top', 'opgelost', 'helder', 'duidelijk', 'geholpen'])) {
    return {
      content: `Graag gedaan! Fijn dat ik je kon helpen. Mocht je later nog vragen hebben, dan ben ik er altijd. Een fijne dag!`,
      systemCheck: false,
      dataPoints: [],
      shouldEscalate: false,
    }
  }

  // --- Fallback: niet herkend ---
  return {
    content: `Bedankt voor je bericht. Ik kan je hier niet direct mee helpen. Ik stuur je vraag door naar ${ctx.partnerName} zodat zij je persoonlijk kunnen helpen. Ze reageren meestal binnen 1 werkdag.`,
    systemCheck: false,
    dataPoints: [],
    shouldEscalate: true,
    escalateReason: 'Vraag niet automatisch te beantwoorden',
  }
}

// AI samenvatting genereren voor installateur
export function generateAiSummary(messages: { role: string; content: string }[], moduleType: string | null): string {
  const customerMessages = messages.filter(m => m.role === 'customer').map(m => m.content).join(' ')
  const msg = customerMessages.toLowerCase()

  if (matchesAny(msg, ['storing', 'geluid', 'kapot', 'werkt niet', 'fout'])) {
    const module = moduleType === 'solar' ? 'zonnepanelen' : moduleType === 'heat_pump' ? 'warmtepomp' : moduleType === 'ev_charger' ? 'laadpaal' : 'systeem'
    return `Klant meldt een probleem met ${module}. Systeem is automatisch gecontroleerd, geen technische storing gedetecteerd. Mogelijk fysiek probleem dat inspectie vereist.`
  }
  if (matchesAny(msg, ['opzeggen', 'stoppen'])) {
    return 'Klant overweegt opzegging van servicecontract. Persoonlijk gesprek aanbevolen.'
  }
  if (matchesAny(msg, ['factuur', 'betaling', 'kosten'])) {
    return 'Klant heeft een vraag over facturatie. AI heeft verwezen naar factuurpagina.'
  }
  return 'Klantvraag die niet automatisch kon worden beantwoord. Menselijke reactie vereist.'
}

function matchesAny(text: string, keywords: string[]): boolean {
  return keywords.some(kw => text.includes(kw))
}

function formatW(watts: number): string {
  return `${(watts / 1000).toFixed(1).replace('.', ',')} kW`
}
