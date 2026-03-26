export interface ModuleBenefit {
  icon: string  // AppIcon name
  text: string  // Consumer-friendly Dutch text
}

export interface ModuleInfo {
  pitch: string  // One-line pitch for upsell cards
  benefits: ModuleBenefit[]
  detailUrl: string  // Link to detail page
}

export const moduleBenefits: Record<string, ModuleInfo> = {
  solar: {
    pitch: 'Wek je eigen stroom op en bespaar direct op je energierekening',
    benefits: [
      { icon: 'zap', text: 'Bespaar tot \u20ac800 per jaar op je energierekening' },
      { icon: 'activity', text: 'Volg je opbrengst realtime in je dashboard' },
      { icon: 'check-circle', text: 'Wij houden je systeem 24/7 in de gaten' },
      { icon: 'tool', text: 'Bij een storing zijn we er snel bij' },
      { icon: 'file-text', text: 'Ontvang duidelijke rapportages over je opbrengst' },
    ],
    detailUrl: '/klant/zonnepanelen',
  },
  heat_pump: {
    pitch: 'Verwarm je huis effici\u00ebnt en bespaar tot 60% op verwarmingskosten',
    benefits: [
      { icon: 'home', text: 'Tot 60% besparing op je verwarmingskosten' },
      { icon: 'settings', text: 'Kies tussen comfort, eco en vakantiemodus' },
      { icon: 'activity', text: 'Volg je temperatuur en verbruik realtime' },
      { icon: 'check-circle', text: 'Wij monitoren je warmtepomp continu' },
      { icon: 'tool', text: 'Snelle service bij storingen' },
    ],
    detailUrl: '/klant/warmtepomp',
  },
  ev_charger: {
    pitch: 'Laad je auto slim op met je eigen zonne-energie',
    benefits: [
      { icon: 'zap', text: 'Laad slim op zonne-energie en bespaar tot \u20ac50 per maand' },
      { icon: 'clock', text: 'Plan je laadsessies of laad direct' },
      { icon: 'activity', text: 'Zie exact hoeveel je laadt en wat het kost' },
      { icon: 'check-circle', text: 'Automatische meldingen bij problemen' },
      { icon: 'settings', text: 'Kies tussen direct, gepland of slim laden' },
    ],
    detailUrl: '/klant/laadpaal',
  },
}

export function getModuleBenefits(type: string): ModuleInfo {
  return moduleBenefits[type] || moduleBenefits.solar
}
