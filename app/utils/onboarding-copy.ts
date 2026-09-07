/**
 * Per-module proposition copy for the welcome flow.
 * Each module has a punchy headline + the "wat krijg je"/"waarom" bullets.
 */

export interface ModuleCopy {
  module: 'solar' | 'heat_pump' | 'ev_charger' | 'battery'
  label: string
  icon: string
  bg: string
  text: string
  hero: string                 // one-liner for the hero scherm
  headline: string             // gepersonaliseerde tagline op de proposal-kaart
  why: string                  // korte waarom-zin
  whatYouGet: string[]         // bullets — wat je krijgt
}

export const MODULE_COPY: Record<string, ModuleCopy> = {
  solar: {
    module: 'solar',
    label: 'Zonnepanelen',
    icon: 'solar',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    hero: 'Maximale opbrengst, minimum gedoe',
    headline: 'Jouw zonnepanelen op autopilot',
    why: 'Je weet wanneer er iets mis is voordat het je geld kost. Een storing van een week kan zomaar honderden kWh opbrengst betekenen.',
    whatYouGet: [
      'Live opbrengst in je portaal',
      'Direct bericht bij een storing',
      'Vergelijking met de voorspelling — zie je of het systeem doet wat het hoort te doen',
      'Jaarrapport met opgewekte kWh + bespaarde euro\'s',
      'Voorrang bij service-aanvragen',
    ],
  },

  heat_pump: {
    module: 'heat_pump',
    label: 'Warmtepomp',
    icon: 'heat-pump',
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    hero: 'Zorg dat je niet in de kou zit',
    headline: 'Warmte zonder zorgen',
    why: 'Een warmtepomp die uitvalt op de koudste dag van het jaar — daar zit je niet op te wachten. Wij houden hem voor je in de gaten.',
    whatYouGet: [
      'Real-time monitoring (COP, temperatuur, vermogen)',
      'Storing? Wij zien het meteen, vaak nog vóór jij merkt dat het kouder wordt',
      'Advies over zuiniger draaien',
      'Voorrangsbeurt bij een spoed-monteur',
      'Jaarcheck inclusief filter en koudemiddel',
    ],
  },

  ev_charger: {
    module: 'ev_charger',
    label: 'Laadpaal',
    icon: 'ev-charger',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    hero: 'Slim laden, geen verrassingen',
    headline: 'Laden zoals jij wil',
    why: 'Hoeveel kost een vol opladen ‘s nachts versus overdag op je eigen zon? Je hoort er pas iets van als de rekening komt — tenzij je inzicht hebt.',
    whatYouGet: [
      'Overzicht van laadsessies en kosten',
      'Slim-laden op zonneoverschot',
      'Storing? Wij krijgen direct een melding',
      'Voorrang bij laadpaal-storingen',
      'Maandoverzicht voor zakelijke verrekening',
    ],
  },

  battery: {
    module: 'battery',
    label: 'Thuisbatterij',
    icon: 'battery',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    hero: 'Je eigen stroom, op het juiste moment',
    headline: 'Eigen energie als jij hem nodig hebt',
    why: 'Een batterij is alleen winstgevend als hij efficiënt laadt en ontlaadt. Wij houden de cycli en gezondheid in de gaten.',
    whatYouGet: [
      'Live laad- en ontlaadgegevens',
      'Inzicht in batterijgezondheid (cycles, capaciteit)',
      'Optimalisatie-advies bij dynamische tarieven',
      'Storing? Wij weten het direct',
    ],
  },
}

export function getModuleCopy(module: string): ModuleCopy | null {
  return MODULE_COPY[module] || null
}
