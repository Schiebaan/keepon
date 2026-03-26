// Mock data voor development — vervangt Supabase queries
// Verwijder dit bestand zodra Supabase is aangesloten

import { reactive } from 'vue'
import type { Partner, Customer, Installation, ModuleDefinition, PartnerModuleConfig, Subscription } from '~~/shared/types/database'
import { generateAiResponse, generateAiSummary } from '~/utils/ai-service'

// --- LocalStorage persistence for demo ---
const STORAGE_KEY = 'keepon-demo-state'

function loadPersistedState(): Record<string, any> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function applyPersistedState(saved: Record<string, any>) {
  // Restore partner overrides
  if (saved.partners) {
    saved.partners.forEach((sp: any) => {
      const p = PARTNERS.find(x => x.id === sp.id)
      if (p) Object.assign(p, sp)
    })
  }
  // Restore module config overrides (prices, enabled)
  if (saved.moduleConfigs) {
    saved.moduleConfigs.forEach((sc: any) => {
      const configs = [...PMC_VOLTVIA, ...PMC_SOLARWISE, ...PMC_GREENCHARGE]
      const c = configs.find(x => x.id === sc.id)
      if (c) {
        c.price_monthly = sc.price_monthly
        c.price_yearly = sc.price_yearly
        c.is_enabled = sc.is_enabled
        if (sc.min_contract_months != null) c.min_contract_months = sc.min_contract_months
      }
    })
  }
  // Restore customer overrides
  if (saved.customers) {
    saved.customers.forEach((sc: any) => {
      const c = ALL_CUSTOMERS.find(x => x.id === sc.id)
      if (c) Object.assign(c, sc)
    })
  }
}

function persistCurrentState() {
  if (typeof window === 'undefined') return
  try {
    const state = {
      partners: PARTNERS.map(p => ({
        id: p.id, name: p.name, slug: p.slug, logo_url: p.logo_url,
        primary_color: p.primary_color, secondary_color: p.secondary_color,
        support_email: p.support_email, support_phone: p.support_phone,
        terms_url: p.terms_url,
        terms_content: p.terms_content,
        terms_placeholders: p.terms_placeholders,
      })),
      moduleConfigs: [...PMC_VOLTVIA, ...PMC_SOLARWISE, ...PMC_GREENCHARGE].map(c => ({
        id: c.id, price_monthly: c.price_monthly, price_yearly: c.price_yearly, min_contract_months: c.min_contract_months, is_enabled: c.is_enabled,
      })),
      customers: ALL_CUSTOMERS.map(c => ({
        id: c.id, full_name: c.full_name, email: c.email, phone: c.phone,
        street: c.street, house_number: c.house_number, postal_code: c.postal_code, city: c.city,
      })),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

// Auto-persist: set up on first call
let _persistInitialized = false
function initPersistence() {
  if (_persistInitialized || typeof window === 'undefined') return
  _persistInitialized = true

  // Restore on first load
  const saved = loadPersistedState()
  if (saved) applyPersistedState(saved)

  // Auto-save every 2 seconds (simple & reliable for demo)
  setInterval(persistCurrentState, 2000)

  // Also save on page unload
  window.addEventListener('beforeunload', persistCurrentState)
}

// --- Partners (reactive for CRUD) ---
const PARTNERS: Partner[] = reactive([
  {
    id: 'partner-1',
    name: 'Volt4U',
    slug: 'volt4u',
    custom_domain: null,
    logo_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%23f97316'/%3E%3Cpath d='M20 6l-8 18h6l-2 10 12-16h-7l5-12z' fill='white'/%3E%3C/svg%3E",
    primary_color: '#f97316',
    secondary_color: '#fff7ed',
    terms_url: 'https://volt4u.nl/servicevoorwaarden',
    terms_placeholders: {
      bedrijfsnaam: 'Volt4U B.V.',
      kvk: '12345678',
      adres: 'Energieweg 10, 3011 AB Rotterdam',
      email: 'info@volt4u.nl',
      telefoon: '088-DEMO123',
    },
    terms_content: `Servicevoorwaarden {{bedrijfsnaam}}

Laatst bijgewerkt: maart 2026

1. Algemeen

Deze servicevoorwaarden zijn van toepassing op alle servicecontracten afgesloten bij {{bedrijfsnaam}}, gevestigd te {{adres}}, ingeschreven bij de Kamer van Koophandel onder nummer {{kvk}}.

2. Definities

Serviceprovider: {{bedrijfsnaam}}, bereikbaar via {{email}} en {{telefoon}}.
Klant: de natuurlijke persoon die een servicecontract heeft afgesloten.
Installatie: het energiesysteem (zonnepanelen, warmtepomp en/of laadpaal) waarop het servicecontract betrekking heeft.

3. Servicecontract

3.1 Het servicecontract omvat monitoring, storingsanalyse en indien van toepassing proactief onderhoud van de installatie.
3.2 De exacte diensten zijn afhankelijk van het gekozen servicepakket (Start, Slim of Max).
3.3 {{bedrijfsnaam}} spant zich in om storingen binnen de afgesproken termijn te analyseren en op te lossen.

4. Looptijd en opzegging

4.1 Het servicecontract heeft een minimale looptijd zoals vermeld bij het afsluiten van het contract.
4.2 Na afloop van de minimale looptijd is het contract maandelijks opzegbaar met een opzegtermijn van 1 maand.
4.3 Opzegging kan via het klantportaal of per e-mail naar {{email}}.

5. Betaling

5.1 Betaling geschiedt maandelijks via automatische incasso.
5.2 Bij het uitblijven van betaling wordt de klant per e-mail herinnerd.
5.3 Na twee mislukte incasso's kan {{bedrijfsnaam}} het servicecontract opschorten.

6. Monitoring en data

6.1 {{bedrijfsnaam}} monitort de installatie via het KeepON-platform in samenwerking met gespecialiseerde monitoringpartners.
6.2 Klantgegevens worden verwerkt conform de AVG en zijn uitsluitend toegankelijk voor {{bedrijfsnaam}} en de klant zelf.
6.3 Gegevens van klanten van {{bedrijfsnaam}} zijn nooit zichtbaar voor andere installateurs of derden.

7. Aansprakelijkheid

7.1 {{bedrijfsnaam}} is niet aansprakelijk voor schade als gevolg van storingen in de installatie, tenzij sprake is van grove nalatigheid.
7.2 De aansprakelijkheid van {{bedrijfsnaam}} is beperkt tot het bedrag van het servicecontract over de voorafgaande 12 maanden.

8. Wijzigingen

8.1 {{bedrijfsnaam}} behoudt zich het recht voor deze voorwaarden te wijzigen. Klanten worden hiervan minimaal 30 dagen van tevoren per e-mail op de hoogte gesteld.
8.2 Bij ingrijpende wijzigingen heeft de klant het recht het contract kosteloos op te zeggen.

9. Contact

Voor vragen over deze voorwaarden kunt u contact opnemen met:
{{bedrijfsnaam}}
{{adres}}
{{email}}
{{telefoon}}
KvK: {{kvk}}`,
    support_email: 'info@volt4u.nl',
    support_phone: '085-1234567',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'partner-2',
    name: 'SolarWise',
    slug: 'solarwise',
    custom_domain: null,
    logo_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%23059669'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-size='20' font-weight='bold' fill='white' font-family='Arial'%3ES%3C/text%3E%3C/svg%3E",
    primary_color: '#059669',
    secondary_color: '#ecfdf5',
    terms_url: 'https://solarwise.nl/voorwaarden',
    terms_content: '',
    terms_placeholders: {
      bedrijfsnaam: 'SolarWise Nederland B.V.',
      kvk: '87654321',
      adres: 'Zonnebloemstraat 5, 2011 CD Haarlem',
      email: 'info@solarwise.nl',
      telefoon: '020-1234567',
    },
    support_email: 'info@solarwise.nl',
    support_phone: '030-9876543',
    is_active: true,
    created_at: '2025-02-15T00:00:00Z',
    updated_at: '2025-02-15T00:00:00Z',
  },
  {
    id: 'partner-3',
    name: 'GreenCharge',
    slug: 'greencharge',
    custom_domain: null,
    logo_url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='%237c3aed'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-size='20' font-weight='bold' fill='white' font-family='Arial'%3EG%3C/text%3E%3C/svg%3E",
    primary_color: '#7c3aed',
    secondary_color: '#f5f3ff',
    terms_url: 'https://greencharge.nl/voorwaarden',
    terms_content: '',
    terms_placeholders: {
      bedrijfsnaam: 'GreenCharge B.V.',
      kvk: '11223344',
      adres: 'Laadplein 1, 9711 AB Groningen',
      email: 'info@greencharge.nl',
      telefoon: '050-9876543',
    },
    support_email: 'support@greencharge.nl',
    support_phone: '050-5551234',
    is_active: true,
    created_at: '2025-04-01T00:00:00Z',
    updated_at: '2025-04-01T00:00:00Z',
  },
])

// --- Module definitions (global, shared across partners) ---
const MODULE_DEFINITIONS: ModuleDefinition[] = [
  {
    id: 'mod-solar',
    type: 'solar',
    name: 'Zonnepanelen',
    description: 'Realtime inzicht in de opbrengst van je zonnepanelen',
    icon: 'solar',
    integration_type: 'sundata',
    default_price_monthly: 499,
    default_price_yearly: 4990,
    is_active: true,
    sort_order: 1,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'mod-heatpump',
    type: 'heat_pump',
    name: 'Warmtepomp',
    description: 'Monitor de status en prestaties van je warmtepomp',
    icon: 'heatpump',
    integration_type: 'weheat',
    default_price_monthly: 499,
    default_price_yearly: 4990,
    is_active: true,
    sort_order: 2,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'mod-ev',
    type: 'ev_charger',
    name: 'Laadpaal',
    description: 'Overzicht van laadsessies en energieverbruik',
    icon: 'ev',
    integration_type: 'easee',
    default_price_monthly: 499,
    default_price_yearly: 4990,
    is_active: true,
    sort_order: 3,
    created_at: '2025-01-01T00:00:00Z',
  },
]

// --- Partner module configs (per partner pricing) ---
// Volt4U
const PMC_VOLTVIA: PartnerModuleConfig[] = MODULE_DEFINITIONS.map((md, i) => ({
  id: `pmc-${i + 1}`,
  partner_id: 'partner-1',
  module_definition_id: md.id,
  is_enabled: true,
  price_monthly: md.default_price_monthly!,
  price_yearly: md.default_price_yearly!,
  min_contract_months: 12,
  custom_terms: null,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  module_definition: md,
}))

// SolarWise — slightly higher prices
const PMC_SOLARWISE: PartnerModuleConfig[] = MODULE_DEFINITIONS.map((md, i) => ({
  id: `pmc-sw-${i + 1}`,
  partner_id: 'partner-2',
  module_definition_id: md.id,
  is_enabled: i < 2, // only solar + heat_pump enabled
  price_monthly: 549,
  price_yearly: 5490,
  min_contract_months: 12,
  custom_terms: null,
  created_at: '2025-02-15T00:00:00Z',
  updated_at: '2025-02-15T00:00:00Z',
  module_definition: md,
}))

// GreenCharge — lower prices, focus on ev + solar
const PMC_GREENCHARGE: PartnerModuleConfig[] = MODULE_DEFINITIONS.map((md, i) => ({
  id: `pmc-gc-${i + 1}`,
  partner_id: 'partner-3',
  module_definition_id: md.id,
  is_enabled: i !== 1, // solar + ev_charger enabled (not heat_pump)
  price_monthly: 399,
  price_yearly: 3990,
  min_contract_months: 12,
  custom_terms: null,
  created_at: '2025-04-01T00:00:00Z',
  updated_at: '2025-04-01T00:00:00Z',
  module_definition: md,
}))

const ALL_PARTNER_MODULE_CONFIGS = [...PMC_VOLTVIA, ...PMC_SOLARWISE, ...PMC_GREENCHARGE]

// --- Customers ---
const CUSTOMERS_VOLTVIA: Customer[] = reactive([
  { id: 'cust-1', auth_user_id: 'auth-1', partner_id: 'partner-1', email: 'jan.devries@gmail.com', full_name: 'Jan de Vries', phone: '06-12345678', mollie_customer_id: null, street: 'Kerkstraat', house_number: '12', postal_code: '1234 AB', city: 'Amsterdam', created_at: '2025-03-15T10:00:00Z', updated_at: '2025-03-15T10:00:00Z' },
  { id: 'cust-2', auth_user_id: 'auth-2', partner_id: 'partner-1', email: 'lisa.bakker@outlook.com', full_name: 'Lisa Bakker', phone: '06-98765432', mollie_customer_id: null, street: 'Dorpsweg', house_number: '45a', postal_code: '5678 CD', city: 'Utrecht', created_at: '2025-04-20T14:00:00Z', updated_at: '2025-04-20T14:00:00Z' },
  { id: 'cust-3', auth_user_id: 'auth-3', partner_id: 'partner-1', email: 'piet.janssen@hotmail.com', full_name: 'Piet Janssen', phone: '06-55512345', mollie_customer_id: null, street: 'Hoofdstraat', house_number: '78', postal_code: '9012 EF', city: 'Rotterdam', created_at: '2025-05-10T09:00:00Z', updated_at: '2025-05-10T09:00:00Z' },
  { id: 'cust-4', auth_user_id: 'auth-4', partner_id: 'partner-1', email: 'maria.vandijk@gmail.com', full_name: 'Maria van Dijk', phone: '06-44498765', mollie_customer_id: null, street: 'Molenweg', house_number: '3', postal_code: '3456 GH', city: 'Den Haag', created_at: '2025-06-01T11:00:00Z', updated_at: '2025-06-01T11:00:00Z' },
  { id: 'cust-5', auth_user_id: 'auth-5', partner_id: 'partner-1', email: 'tom.smit@ziggo.nl', full_name: 'Tom Smit', phone: '06-33345678', mollie_customer_id: null, street: 'Lindelaan', house_number: '22', postal_code: '7890 IJ', city: 'Eindhoven', created_at: '2025-07-12T16:00:00Z', updated_at: '2025-07-12T16:00:00Z' },
  { id: 'cust-new-demo', auth_user_id: 'auth-demo', partner_id: 'partner-1', email: 'henk.vanderberg@gmail.com', full_name: 'Henk van der Berg', phone: '06-28394756', mollie_customer_id: null, street: 'Eikenlaan', house_number: '7', postal_code: '3511 KZ', city: 'Utrecht', created_at: new Date(Date.now() - 3600000).toISOString(), updated_at: new Date(Date.now() - 3600000).toISOString() },
])

const CUSTOMERS_SOLARWISE: Customer[] = reactive([
  { id: 'cust-6', auth_user_id: 'auth-6', partner_id: 'partner-2', email: 'erik.vanberg@gmail.com', full_name: 'Erik van Berg', phone: '06-11122233', mollie_customer_id: null, street: 'Zonnelaan', house_number: '8', postal_code: '2011 AB', city: 'Haarlem', created_at: '2025-03-01T10:00:00Z', updated_at: '2025-03-01T10:00:00Z' },
  { id: 'cust-7', auth_user_id: 'auth-7', partner_id: 'partner-2', email: 'anna.dewit@outlook.com', full_name: 'Anna de Wit', phone: '06-44455566', mollie_customer_id: null, street: 'Parkstraat', house_number: '15', postal_code: '2312 CD', city: 'Leiden', created_at: '2025-04-10T14:00:00Z', updated_at: '2025-04-10T14:00:00Z' },
  { id: 'cust-8', auth_user_id: 'auth-8', partner_id: 'partner-2', email: 'marco.visser@gmail.com', full_name: 'Marco Visser', phone: '06-77788899', mollie_customer_id: null, street: 'Waterweg', house_number: '32', postal_code: '2600 EF', city: 'Delft', created_at: '2025-05-20T09:00:00Z', updated_at: '2025-05-20T09:00:00Z' },
  { id: 'cust-9', auth_user_id: 'auth-9', partner_id: 'partner-2', email: 'sophie.mulder@ziggo.nl', full_name: 'Sophie Mulder', phone: '06-22233344', mollie_customer_id: null, street: 'Boslaan', house_number: '6', postal_code: '1324 GH', city: 'Almere', created_at: '2025-06-15T11:00:00Z', updated_at: '2025-06-15T11:00:00Z' },
])

const CUSTOMERS_GREENCHARGE: Customer[] = reactive([
  { id: 'cust-10', auth_user_id: 'auth-10', partner_id: 'partner-3', email: 'daan.hendricks@gmail.com', full_name: 'Daan Hendricks', phone: '06-55566677', mollie_customer_id: null, street: 'Stationsweg', house_number: '44', postal_code: '9711 AB', city: 'Groningen', created_at: '2025-05-01T10:00:00Z', updated_at: '2025-05-01T10:00:00Z' },
  { id: 'cust-11', auth_user_id: 'auth-11', partner_id: 'partner-3', email: 'floor.dejong@outlook.com', full_name: 'Floor de Jong', phone: '06-88899900', mollie_customer_id: null, street: 'Markstraat', house_number: '17', postal_code: '4811 CD', city: 'Breda', created_at: '2025-06-01T14:00:00Z', updated_at: '2025-06-01T14:00:00Z' },
  { id: 'cust-12', auth_user_id: 'auth-12', partner_id: 'partner-3', email: 'niels.vermeer@hotmail.com', full_name: 'Niels Vermeer', phone: '06-11100022', mollie_customer_id: null, street: 'Rijnkade', house_number: '9', postal_code: '6811 EF', city: 'Arnhem', created_at: '2025-07-01T09:00:00Z', updated_at: '2025-07-01T09:00:00Z' },
])

const ALL_CUSTOMERS: Customer[] = reactive([...CUSTOMERS_VOLTVIA, ...CUSTOMERS_SOLARWISE, ...CUSTOMERS_GREENCHARGE])

// --- Installations ---
const INSTALLATIONS_VOLTVIA: Installation[] = reactive([
  { id: 'inst-1', customer_id: 'cust-1', partner_id: 'partner-1', name: 'Woning Kerkstraat', address_street: 'Kerkstraat', address_house_number: '12', address_postal_code: '1234 AB', address_city: 'Amsterdam', created_at: '2025-03-15T10:00:00Z', updated_at: '2025-03-15T10:00:00Z' },
  { id: 'inst-2', customer_id: 'cust-2', partner_id: 'partner-1', name: 'Woning Dorpsweg', address_street: 'Dorpsweg', address_house_number: '45a', address_postal_code: '5678 CD', address_city: 'Utrecht', created_at: '2025-04-20T14:00:00Z', updated_at: '2025-04-20T14:00:00Z' },
  { id: 'inst-3', customer_id: 'cust-3', partner_id: 'partner-1', name: 'Woning Hoofdstraat', address_street: 'Hoofdstraat', address_house_number: '78', address_postal_code: '9012 EF', address_city: 'Rotterdam', created_at: '2025-05-10T09:00:00Z', updated_at: '2025-05-10T09:00:00Z' },
])

const INSTALLATIONS_SOLARWISE: Installation[] = [
  { id: 'inst-4', customer_id: 'cust-6', partner_id: 'partner-2', name: 'Woning Zonnelaan', address_street: 'Zonnelaan', address_house_number: '8', address_postal_code: '2011 AB', address_city: 'Haarlem', created_at: '2025-03-01T10:00:00Z', updated_at: '2025-03-01T10:00:00Z' },
  { id: 'inst-5', customer_id: 'cust-7', partner_id: 'partner-2', name: 'Woning Parkstraat', address_street: 'Parkstraat', address_house_number: '15', address_postal_code: '2312 CD', address_city: 'Leiden', created_at: '2025-04-10T14:00:00Z', updated_at: '2025-04-10T14:00:00Z' },
  { id: 'inst-6', customer_id: 'cust-8', partner_id: 'partner-2', name: 'Woning Waterweg', address_street: 'Waterweg', address_house_number: '32', address_postal_code: '2600 EF', address_city: 'Delft', created_at: '2025-05-20T09:00:00Z', updated_at: '2025-05-20T09:00:00Z' },
  { id: 'inst-7', customer_id: 'cust-9', partner_id: 'partner-2', name: 'Woning Boslaan', address_street: 'Boslaan', address_house_number: '6', address_postal_code: '1324 GH', address_city: 'Almere', created_at: '2025-06-15T11:00:00Z', updated_at: '2025-06-15T11:00:00Z' },
]

const INSTALLATIONS_GREENCHARGE: Installation[] = [
  { id: 'inst-8', customer_id: 'cust-10', partner_id: 'partner-3', name: 'Woning Stationsweg', address_street: 'Stationsweg', address_house_number: '44', address_postal_code: '9711 AB', address_city: 'Groningen', created_at: '2025-05-01T10:00:00Z', updated_at: '2025-05-01T10:00:00Z' },
  { id: 'inst-9', customer_id: 'cust-11', partner_id: 'partner-3', name: 'Woning Markstraat', address_street: 'Markstraat', address_house_number: '17', address_postal_code: '4811 CD', address_city: 'Breda', created_at: '2025-06-01T14:00:00Z', updated_at: '2025-06-01T14:00:00Z' },
  { id: 'inst-10', customer_id: 'cust-12', partner_id: 'partner-3', name: 'Woning Rijnkade', address_street: 'Rijnkade', address_house_number: '9', address_postal_code: '6811 EF', address_city: 'Arnhem', created_at: '2025-07-01T09:00:00Z', updated_at: '2025-07-01T09:00:00Z' },
]

const ALL_INSTALLATIONS: Installation[] = reactive([...INSTALLATIONS_VOLTVIA, ...INSTALLATIONS_SOLARWISE, ...INSTALLATIONS_GREENCHARGE])

// --- Subscriptions ---
const SUBSCRIPTIONS_VOLTVIA: Subscription[] = [
  { id: 'sub-1', customer_id: 'cust-1', installation_id: 'inst-1', partner_module_config_id: 'pmc-1', status: 'active', billing_interval: 'monthly', price_cents: 499, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'sundata-plant-101', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-03-15T10:05:00Z', terms_version: '1.0', activated_at: '2025-03-15T10:10:00Z', cancelled_at: null, expires_at: null, created_at: '2025-03-15T10:05:00Z', updated_at: '2025-03-15T10:10:00Z', partner_module_config: PMC_VOLTVIA[0] },
  { id: 'sub-2', customer_id: 'cust-1', installation_id: 'inst-1', partner_module_config_id: 'pmc-2', status: 'active', billing_interval: 'yearly', price_cents: 4990, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'weheat-hp-201', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-04-01T12:00:00Z', terms_version: '1.0', activated_at: '2025-04-01T12:05:00Z', cancelled_at: null, expires_at: null, created_at: '2025-04-01T12:00:00Z', updated_at: '2025-04-01T12:05:00Z', partner_module_config: PMC_VOLTVIA[1] },
  { id: 'sub-3', customer_id: 'cust-2', installation_id: 'inst-2', partner_module_config_id: 'pmc-1', status: 'active', billing_interval: 'monthly', price_cents: 499, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'sundata-plant-102', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-04-20T14:05:00Z', terms_version: '1.0', activated_at: '2025-04-20T14:10:00Z', cancelled_at: null, expires_at: null, created_at: '2025-04-20T14:05:00Z', updated_at: '2025-04-20T14:10:00Z', partner_module_config: PMC_VOLTVIA[0] },
  { id: 'sub-4', customer_id: 'cust-3', installation_id: 'inst-3', partner_module_config_id: 'pmc-3', status: 'active', billing_interval: 'monthly', price_cents: 499, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'easee-charger-301', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-05-10T09:05:00Z', terms_version: '1.0', activated_at: '2025-05-10T09:10:00Z', cancelled_at: null, expires_at: null, created_at: '2025-05-10T09:05:00Z', updated_at: '2025-05-10T09:10:00Z', partner_module_config: PMC_VOLTVIA[2] },
]

const SUBSCRIPTIONS_SOLARWISE: Subscription[] = [
  { id: 'sub-sw-1', customer_id: 'cust-6', installation_id: 'inst-4', partner_module_config_id: 'pmc-sw-1', status: 'active', billing_interval: 'monthly', price_cents: 549, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'sundata-plant-201', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-03-01T10:05:00Z', terms_version: '1.0', activated_at: '2025-03-01T10:10:00Z', cancelled_at: null, expires_at: null, created_at: '2025-03-01T10:05:00Z', updated_at: '2025-03-01T10:10:00Z', partner_module_config: PMC_SOLARWISE[0] },
  { id: 'sub-sw-2', customer_id: 'cust-6', installation_id: 'inst-4', partner_module_config_id: 'pmc-sw-2', status: 'active', billing_interval: 'yearly', price_cents: 5490, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'weheat-hp-301', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-03-15T12:00:00Z', terms_version: '1.0', activated_at: '2025-03-15T12:05:00Z', cancelled_at: null, expires_at: null, created_at: '2025-03-15T12:00:00Z', updated_at: '2025-03-15T12:05:00Z', partner_module_config: PMC_SOLARWISE[1] },
  { id: 'sub-sw-3', customer_id: 'cust-7', installation_id: 'inst-5', partner_module_config_id: 'pmc-sw-1', status: 'active', billing_interval: 'monthly', price_cents: 549, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'sundata-plant-202', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-04-10T14:05:00Z', terms_version: '1.0', activated_at: '2025-04-10T14:10:00Z', cancelled_at: null, expires_at: null, created_at: '2025-04-10T14:05:00Z', updated_at: '2025-04-10T14:10:00Z', partner_module_config: PMC_SOLARWISE[0] },
  { id: 'sub-sw-4', customer_id: 'cust-8', installation_id: 'inst-6', partner_module_config_id: 'pmc-sw-1', status: 'active', billing_interval: 'monthly', price_cents: 549, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'sundata-plant-203', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-05-20T09:05:00Z', terms_version: '1.0', activated_at: '2025-05-20T09:10:00Z', cancelled_at: null, expires_at: null, created_at: '2025-05-20T09:05:00Z', updated_at: '2025-05-20T09:10:00Z', partner_module_config: PMC_SOLARWISE[0] },
]

const SUBSCRIPTIONS_GREENCHARGE: Subscription[] = [
  { id: 'sub-gc-1', customer_id: 'cust-10', installation_id: 'inst-8', partner_module_config_id: 'pmc-gc-3', status: 'active', billing_interval: 'monthly', price_cents: 399, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'easee-charger-401', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-05-01T10:05:00Z', terms_version: '1.0', activated_at: '2025-05-01T10:10:00Z', cancelled_at: null, expires_at: null, created_at: '2025-05-01T10:05:00Z', updated_at: '2025-05-01T10:10:00Z', partner_module_config: PMC_GREENCHARGE[2] },
  { id: 'sub-gc-2', customer_id: 'cust-10', installation_id: 'inst-8', partner_module_config_id: 'pmc-gc-1', status: 'active', billing_interval: 'monthly', price_cents: 399, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'sundata-plant-301', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-05-15T12:00:00Z', terms_version: '1.0', activated_at: '2025-05-15T12:05:00Z', cancelled_at: null, expires_at: null, created_at: '2025-05-15T12:00:00Z', updated_at: '2025-05-15T12:05:00Z', partner_module_config: PMC_GREENCHARGE[0] },
  { id: 'sub-gc-3', customer_id: 'cust-11', installation_id: 'inst-9', partner_module_config_id: 'pmc-gc-3', status: 'active', billing_interval: 'monthly', price_cents: 399, mollie_subscription_id: null, mollie_mandate_id: null, external_device_id: 'easee-charger-402', integration_status: 'active', integration_meta: {}, terms_accepted_at: '2025-06-01T14:05:00Z', terms_version: '1.0', activated_at: '2025-06-01T14:10:00Z', cancelled_at: null, expires_at: null, created_at: '2025-06-01T14:05:00Z', updated_at: '2025-06-01T14:10:00Z', partner_module_config: PMC_GREENCHARGE[2] },
]

// --- Mock Payments (simplified type for demo) ---
export interface MockPayment {
  id: string
  partner_id: string
  customer_id: string
  customer_name: string
  module_name: string
  module_type: string
  amount_cents: number
  status: 'paid' | 'pending' | 'failed' | 'refunded'
  paid_at: string | null
  created_at: string
}

const PAYMENTS_VOLTVIA: MockPayment[] = [
  { id: 'pay-1', partner_id: 'partner-1', customer_id: 'cust-1', customer_name: 'Jan de Vries', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 499, status: 'paid', paid_at: '2025-07-01T10:00:00Z', created_at: '2025-07-01T09:00:00Z' },
  { id: 'pay-2', partner_id: 'partner-1', customer_id: 'cust-1', customer_name: 'Jan de Vries', module_name: 'Warmtepomp', module_type: 'heat_pump', amount_cents: 4990, status: 'paid', paid_at: '2025-07-01T10:01:00Z', created_at: '2025-07-01T09:00:00Z' },
  { id: 'pay-3', partner_id: 'partner-1', customer_id: 'cust-2', customer_name: 'Lisa Bakker', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 499, status: 'paid', paid_at: '2025-07-01T12:00:00Z', created_at: '2025-07-01T09:00:00Z' },
  { id: 'pay-4', partner_id: 'partner-1', customer_id: 'cust-3', customer_name: 'Piet Janssen', module_name: 'Laadpaal', module_type: 'ev_charger', amount_cents: 499, status: 'paid', paid_at: '2025-07-02T08:30:00Z', created_at: '2025-07-02T08:00:00Z' },
  { id: 'pay-5', partner_id: 'partner-1', customer_id: 'cust-4', customer_name: 'Maria van Dijk', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 499, status: 'failed', paid_at: null, created_at: '2025-07-03T09:00:00Z' },
  { id: 'pay-6', partner_id: 'partner-1', customer_id: 'cust-5', customer_name: 'Tom Smit', module_name: 'Warmtepomp', module_type: 'heat_pump', amount_cents: 499, status: 'pending', paid_at: null, created_at: '2025-07-04T14:00:00Z' },
  { id: 'pay-7', partner_id: 'partner-1', customer_id: 'cust-1', customer_name: 'Jan de Vries', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 499, status: 'paid', paid_at: '2025-06-01T10:00:00Z', created_at: '2025-06-01T09:00:00Z' },
  { id: 'pay-8', partner_id: 'partner-1', customer_id: 'cust-2', customer_name: 'Lisa Bakker', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 499, status: 'paid', paid_at: '2025-06-01T12:00:00Z', created_at: '2025-06-01T09:00:00Z' },
  { id: 'pay-9', partner_id: 'partner-1', customer_id: 'cust-3', customer_name: 'Piet Janssen', module_name: 'Laadpaal', module_type: 'ev_charger', amount_cents: 499, status: 'refunded', paid_at: '2025-06-02T08:30:00Z', created_at: '2025-06-02T08:00:00Z' },
]

const PAYMENTS_SOLARWISE: MockPayment[] = [
  { id: 'pay-sw-1', partner_id: 'partner-2', customer_id: 'cust-6', customer_name: 'Erik van Berg', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 549, status: 'paid', paid_at: '2025-07-01T10:00:00Z', created_at: '2025-07-01T09:00:00Z' },
  { id: 'pay-sw-2', partner_id: 'partner-2', customer_id: 'cust-7', customer_name: 'Anna de Wit', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 549, status: 'paid', paid_at: '2025-07-01T12:00:00Z', created_at: '2025-07-01T09:00:00Z' },
  { id: 'pay-sw-3', partner_id: 'partner-2', customer_id: 'cust-8', customer_name: 'Marco Visser', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 549, status: 'pending', paid_at: null, created_at: '2025-07-02T09:00:00Z' },
  { id: 'pay-sw-4', partner_id: 'partner-2', customer_id: 'cust-6', customer_name: 'Erik van Berg', module_name: 'Warmtepomp', module_type: 'heat_pump', amount_cents: 5490, status: 'paid', paid_at: '2025-07-01T10:01:00Z', created_at: '2025-07-01T09:00:00Z' },
]

const PAYMENTS_GREENCHARGE: MockPayment[] = [
  { id: 'pay-gc-1', partner_id: 'partner-3', customer_id: 'cust-10', customer_name: 'Daan Hendricks', module_name: 'Laadpaal', module_type: 'ev_charger', amount_cents: 399, status: 'paid', paid_at: '2025-07-01T10:00:00Z', created_at: '2025-07-01T09:00:00Z' },
  { id: 'pay-gc-2', partner_id: 'partner-3', customer_id: 'cust-10', customer_name: 'Daan Hendricks', module_name: 'Zonnepanelen', module_type: 'solar', amount_cents: 399, status: 'paid', paid_at: '2025-07-01T10:01:00Z', created_at: '2025-07-01T09:00:00Z' },
  { id: 'pay-gc-3', partner_id: 'partner-3', customer_id: 'cust-11', customer_name: 'Floor de Jong', module_name: 'Laadpaal', module_type: 'ev_charger', amount_cents: 399, status: 'paid', paid_at: '2025-07-02T14:00:00Z', created_at: '2025-07-02T09:00:00Z' },
  { id: 'pay-gc-4', partner_id: 'partner-3', customer_id: 'cust-12', customer_name: 'Niels Vermeer', module_name: 'Laadpaal', module_type: 'ev_charger', amount_cents: 399, status: 'failed', paid_at: null, created_at: '2025-07-03T09:00:00Z' },
]

const ALL_PAYMENTS: MockPayment[] = reactive([...PAYMENTS_VOLTVIA, ...PAYMENTS_SOLARWISE, ...PAYMENTS_GREENCHARGE])

// --- Reactive subscriptions for demo add/cancel ---
const _reactiveSubscriptions = reactive([...SUBSCRIPTIONS_VOLTVIA])
const _allReactiveSubscriptions = reactive([...SUBSCRIPTIONS_VOLTVIA, ...SUBSCRIPTIONS_SOLARWISE, ...SUBSCRIPTIONS_GREENCHARGE])

// --- Mock Invoices (for customer portal) ---
export interface MockInvoice {
  id: string
  invoice_number: string
  customer_id: string
  description: string
  amount_cents: number
  status: 'paid' | 'open' | 'overdue'
  payment_method: 'automatische_incasso' | 'ideal' | 'handmatig'
  invoice_date: string
  due_date: string
  paid_at: string | null
}

const INVOICES: MockInvoice[] = reactive([
  { id: 'inv-1', invoice_number: 'V4U-2025-001', customer_id: 'cust-1', description: 'Servicecontract Zonnepanelen — januari 2025', amount_cents: 499, status: 'paid', payment_method: 'automatische_incasso', invoice_date: '2025-01-01T00:00:00Z', due_date: '2025-01-15T00:00:00Z', paid_at: '2025-01-03T10:00:00Z' },
  { id: 'inv-2', invoice_number: 'V4U-2025-002', customer_id: 'cust-1', description: 'Servicecontract Zonnepanelen — februari 2025', amount_cents: 499, status: 'paid', payment_method: 'automatische_incasso', invoice_date: '2025-02-01T00:00:00Z', due_date: '2025-02-15T00:00:00Z', paid_at: '2025-02-03T10:00:00Z' },
  { id: 'inv-3', invoice_number: 'V4U-2025-003', customer_id: 'cust-1', description: 'Servicecontract Zonnepanelen — maart 2025', amount_cents: 499, status: 'paid', payment_method: 'automatische_incasso', invoice_date: '2025-03-01T00:00:00Z', due_date: '2025-03-15T00:00:00Z', paid_at: '2025-03-04T10:00:00Z' },
  { id: 'inv-4', invoice_number: 'V4U-2025-004', customer_id: 'cust-1', description: 'Servicecontract Warmtepomp — maart 2025', amount_cents: 4990, status: 'paid', payment_method: 'automatische_incasso', invoice_date: '2025-03-15T00:00:00Z', due_date: '2025-03-29T00:00:00Z', paid_at: '2025-03-17T10:00:00Z' },
  { id: 'inv-5', invoice_number: 'V4U-2025-005', customer_id: 'cust-1', description: 'Servicecontract Zonnepanelen — april 2025', amount_cents: 499, status: 'paid', payment_method: 'automatische_incasso', invoice_date: '2025-04-01T00:00:00Z', due_date: '2025-04-15T00:00:00Z', paid_at: '2025-04-02T10:00:00Z' },
  { id: 'inv-6', invoice_number: 'V4U-2025-006', customer_id: 'cust-1', description: 'Servicecontract Zonnepanelen + Warmtepomp — mei 2025', amount_cents: 998, status: 'open', payment_method: 'automatische_incasso', invoice_date: '2025-05-01T00:00:00Z', due_date: '2025-05-15T00:00:00Z', paid_at: null },
])

// --- Mock Notifications (communication log) ---
export interface MockNotification {
  id: string
  type: 'factuur_verzonden' | 'contract_bevestiging' | 'opzegging_bevestiging' | 'verhuizing_melding' | 'incasso_alert' | 'welkomstmail'
  recipient_name: string
  recipient_email: string
  subject: string
  channel: 'email' | 'sms'
  status: 'verzonden' | 'gepland' | 'mislukt'
  created_at: string
}

const NOTIFICATIONS: MockNotification[] = [
  { id: 'notif-1', type: 'factuur_verzonden', recipient_name: 'Jan de Vries', recipient_email: 'jan.devries@gmail.com', subject: 'Factuur V4U-2025-006 — mei 2025', channel: 'email', status: 'verzonden', created_at: '2025-05-01T08:00:00Z' },
  { id: 'notif-2', type: 'verhuizing_melding', recipient_name: 'Servicedesk Volt4U', recipient_email: 'servicedesk@volt4u.nl', subject: 'Adreswijziging Jan de Vries — Kerkstraat 12 → nieuw adres', channel: 'email', status: 'verzonden', created_at: '2025-04-28T14:30:00Z' },
  { id: 'notif-3', type: 'contract_bevestiging', recipient_name: 'Jan de Vries', recipient_email: 'jan.devries@gmail.com', subject: 'Bevestiging servicecontract Warmtepomp', channel: 'email', status: 'verzonden', created_at: '2025-04-01T12:05:00Z' },
  { id: 'notif-4', type: 'factuur_verzonden', recipient_name: 'Lisa Bakker', recipient_email: 'lisa.bakker@outlook.com', subject: 'Factuur V4U-2025-005 — april 2025', channel: 'email', status: 'verzonden', created_at: '2025-04-01T08:00:00Z' },
  { id: 'notif-5', type: 'welkomstmail', recipient_name: 'Piet Janssen', recipient_email: 'piet.janssen@hotmail.com', subject: 'Welkom bij Volt4U — je account is aangemaakt', channel: 'email', status: 'verzonden', created_at: '2025-05-10T09:00:00Z' },
  { id: 'notif-6', type: 'incasso_alert', recipient_name: 'Servicedesk Volt4U', recipient_email: 'servicedesk@volt4u.nl', subject: 'Automatische incasso geweigerd — Maria van Dijk', channel: 'email', status: 'verzonden', created_at: '2025-04-16T10:00:00Z' },
  { id: 'notif-7', type: 'factuur_verzonden', recipient_name: 'Jan de Vries', recipient_email: 'jan.devries@gmail.com', subject: 'Factuur V4U-2025-004 — maart 2025', channel: 'email', status: 'verzonden', created_at: '2025-03-15T08:00:00Z' },
  { id: 'notif-8', type: 'opzegging_bevestiging', recipient_name: 'Tom Smit', recipient_email: 'tom.smit@ziggo.nl', subject: 'Bevestiging opzegging servicecontract Laadpaal', channel: 'email', status: 'verzonden', created_at: '2025-03-20T16:00:00Z' },
  { id: 'notif-9', type: 'factuur_verzonden', recipient_name: 'Piet Janssen', recipient_email: 'piet.janssen@hotmail.com', subject: 'Factuur V4U-2025-003 — maart 2025', channel: 'email', status: 'mislukt', created_at: '2025-03-01T08:00:00Z' },
  { id: 'notif-10', type: 'welkomstmail', recipient_name: 'Jan de Vries', recipient_email: 'jan.devries@gmail.com', subject: 'Welkom bij Volt4U — je account is aangemaakt', channel: 'email', status: 'verzonden', created_at: '2025-03-15T10:00:00Z' },
]

// --- Consumer Dashboard Mock Data ---

export interface MockEnergyFlow {
  solarProductionW: number
  houseConsumptionW: number
  gridImportW: number // positive = importing, negative = exporting
  evChargingW: number
  heatPumpW: number
  savingsToday: number // cents
  savingsMonth: number // cents
  savingsYear: number // cents
  selfConsumptionPercent: number
  feedInPercent: number
}

export interface MockSolarData {
  currentProductionW: number
  status: 'online' | 'offline' | 'deels_online'
  todayKwh: number
  monthKwh: number
  yearKwh: number
  todayEuro: number // cents
  monthEuro: number // cents
  yearEuro: number // cents
  selfConsumptionPercent: number
  feedInPercent: number
  peakTodayW: number
  peakTodayTime: string
  panelCount: number
  inverterBrand: string
  inverterStatus: string
  alerts: { message: string; type: 'info' | 'warning' | 'error'; date: string }[]
}

export interface MockHeatPumpData {
  status: 'verwarmen' | 'koelen' | 'warmwater' | 'standby' | 'storing'
  setTemperature: number
  actualTemperature: number
  outsideTemperature: number
  hotWaterStatus: 'gereed' | 'opwarmen'
  hotWaterTemp: number
  mode: 'comfort' | 'eco' | 'vakantie'
  copCurrent: number
  copRating: 'uitstekend' | 'goed' | 'matig' | 'laag'
  consumptionTodayKwh: number
  consumptionMonthKwh: number
  nextScheduledAction: string
  alerts: { message: string; type: 'info' | 'warning' | 'error'; date: string }[]
}

export interface MockEvChargerData {
  status: 'laden' | 'standby' | 'gepland' | 'storing'
  currentPowerW: number
  chargedTodayKwh: number
  chargedTodayEuro: number // cents
  chargedMonthKwh: number
  chargedMonthEuro: number // cents
  estimatedCompletion: string | null
  chargeMode: 'direct' | 'gepland' | 'slim'
  batteryPercent: number | null
  sessions: { id: string; date: string; durationMin: number; kwh: number; costCents: number; mode: string }[]
  alerts: { message: string; type: 'info' | 'warning' | 'error'; date: string }[]
}

export interface MockServiceTicket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in_behandeling' | 'opgelost' | 'gesloten'
  urgency: 'laag' | 'normaal' | 'hoog'
  created_at: string
  updated_at: string
  module_type: string | null
  response: string | null
}

export interface MockMaintenanceRecord {
  id: string
  date: string
  description: string
  technician: string
  type: 'onderhoud' | 'reparatie' | 'inspectie'
  module_type: string | null
}

export interface MockSystemStatus {
  overall: 'ok' | 'warning' | 'error'
  modules: { type: string; status: 'ok' | 'warning' | 'error'; message: string }[]
  lastChecked: string
}

// --- AI Conversatie model ---
export interface MockMessage {
  id: string
  role: 'customer' | 'ai' | 'installer'
  content: string
  timestamp: string
  metadata?: {
    systemCheck?: boolean
    dataPoints?: { label: string; value: string }[]
  }
}

export interface MockConversation {
  id: string
  customer_id: string
  customer_name: string
  subject: string
  status: 'actief' | 'ai_opgelost' | 'geescaleerd' | 'gesloten'
  started_at: string
  updated_at: string
  module_type: string | null
  messages: MockMessage[]
  ai_summary: string | null
  ai_resolution: string | null
  requires_visit: boolean
}

// --- Service Tiers ---
export interface ServiceFeature {
  label: string
  included: boolean
  detail?: string
}

export interface ServiceTier {
  id: string
  name: string
  slug: string
  price_cents: number
  recommended: boolean
  features: ServiceFeature[]
}

const SERVICE_TIERS: ServiceTier[] = [
  {
    id: 'tier-start',
    name: 'Start',
    slug: 'start',
    price_cents: 0,
    recommended: false,
    features: [
      { label: 'Monitoring portal', included: true },
      { label: 'Proactieve monitoring 24/7', included: false },
      { label: 'Storingsanalyse', included: false },
      { label: 'Rapportages', included: false },
      { label: 'Oplosservice', included: false },
      { label: 'Jaarlijkse inspectie (APK)', included: false },
      { label: 'Super Service', included: false },
    ],
  },
  {
    id: 'tier-slim',
    name: 'Slim',
    slug: 'slim',
    price_cents: 350,
    recommended: true,
    features: [
      { label: 'Monitoring portal', included: true },
      { label: 'Proactieve monitoring 24/7', included: true },
      { label: 'Storingsanalyse', included: true },
      { label: 'Rapportages', included: true, detail: 'Jaarlijks' },
      { label: 'Oplosservice', included: true, detail: 'Binnen 3 werkdagen' },
      { label: 'Jaarlijkse inspectie (APK)', included: false },
      { label: 'Super Service', included: false },
    ],
  },
  {
    id: 'tier-max',
    name: 'Max',
    slug: 'max',
    price_cents: 950,
    recommended: false,
    features: [
      { label: 'Monitoring portal', included: true },
      { label: 'Proactieve monitoring 24/7', included: true },
      { label: 'Storingsanalyse', included: true },
      { label: 'Rapportages', included: true, detail: 'Maandelijks' },
      { label: 'Oplosservice', included: true, detail: 'Binnen 1 werkdag' },
      { label: 'Jaarlijkse inspectie (APK)', included: true },
      { label: 'Super Service', included: true, detail: 'Geen extra kosten bij veelvoorkomende storingen' },
    ],
  },
]

// --- Onboarding ---
export interface OnboardingRecord {
  token: string
  partner_id: string
  customer_id: string
  module_type: string
  gripp_project_id: string | null
  service_tier: string
  status: 'pending' | 'activated'
  created_at: string
  activated_at: string | null
}

const ONBOARDING_RECORDS: OnboardingRecord[] = reactive([
  {
    token: 'demo-welkom',
    partner_id: 'partner-1',
    customer_id: 'cust-new-demo',
    module_type: 'solar',
    gripp_project_id: 'GRP-2024-0912',
    service_tier: 'slim',
    status: 'pending' as const,
    created_at: new Date(Date.now() - 3600000).toISOString(),
    activated_at: null,
  },
])

const ENERGY_FLOW: MockEnergyFlow = reactive({
  solarProductionW: 2140,
  houseConsumptionW: 1380,
  gridImportW: -760, // exporting to grid
  evChargingW: 0,
  heatPumpW: 820,
  savingsToday: 485,
  savingsMonth: 6820,
  savingsYear: 82400,
  selfConsumptionPercent: 67,
  feedInPercent: 33,
})

const SOLAR_DATA: MockSolarData = reactive({
  currentProductionW: 2140,
  status: 'online',
  todayKwh: 12.4,
  monthKwh: 286,
  yearKwh: 3240,
  todayEuro: 485,
  monthEuro: 6820,
  yearEuro: 82400,
  selfConsumptionPercent: 67,
  feedInPercent: 33,
  peakTodayW: 3200,
  peakTodayTime: '12:45',
  panelCount: 12,
  inverterBrand: 'SolarEdge SE5000H',
  inverterStatus: 'Optimaal',
  alerts: [],
})

const HEATPUMP_DATA: MockHeatPumpData = reactive({
  status: 'verwarmen',
  setTemperature: 21,
  actualTemperature: 20.4,
  outsideTemperature: 8,
  hotWaterStatus: 'gereed',
  hotWaterTemp: 52,
  mode: 'comfort',
  copCurrent: 4.2,
  copRating: 'uitstekend',
  consumptionTodayKwh: 6.8,
  consumptionMonthKwh: 142,
  nextScheduledAction: 'Nachtverwarming om 23:00',
  alerts: [],
})

const EVCHARGER_DATA: MockEvChargerData = reactive({
  status: 'standby',
  currentPowerW: 0,
  chargedTodayKwh: 18.4,
  chargedTodayEuro: 460,
  chargedMonthKwh: 156,
  chargedMonthEuro: 3900,
  estimatedCompletion: null,
  chargeMode: 'slim',
  batteryPercent: 82,
  sessions: [
    { id: 'ses-1', date: '2026-03-25T06:30:00Z', durationMin: 195, kwh: 18.4, costCents: 460, mode: 'slim' },
    { id: 'ses-2', date: '2026-03-23T22:00:00Z', durationMin: 240, kwh: 22.1, costCents: 553, mode: 'gepland' },
    { id: 'ses-3', date: '2026-03-21T19:15:00Z', durationMin: 90, kwh: 11.2, costCents: 280, mode: 'direct' },
    { id: 'ses-4', date: '2026-03-19T07:00:00Z', durationMin: 180, kwh: 16.8, costCents: 420, mode: 'slim' },
    { id: 'ses-5', date: '2026-03-17T23:00:00Z', durationMin: 300, kwh: 28.5, costCents: 713, mode: 'gepland' },
  ],
  alerts: [],
})

const SERVICE_TICKETS: MockServiceTicket[] = reactive([
  { id: 'ticket-1', subject: 'Warmtepomp maakt geluid', description: 'Sinds vorige week maakt de buitenunit een tikkend geluid bij het opstarten.', status: 'in_behandeling', urgency: 'normaal', created_at: '2026-03-20T10:00:00Z', updated_at: '2026-03-21T14:00:00Z', module_type: 'heat_pump', response: 'We hebben uw melding ontvangen. Een monteur neemt binnen 2 werkdagen contact op.' },
  { id: 'ticket-2', subject: 'Vraag over factuur februari', description: 'Het bedrag op de factuur van februari lijkt hoger dan verwacht.', status: 'opgelost', urgency: 'laag', created_at: '2026-03-10T09:00:00Z', updated_at: '2026-03-12T16:00:00Z', module_type: null, response: 'Het verschil komt door de jaarlijkse indexering per 1 februari. Dit is conform uw servicecontract.' },
  { id: 'ticket-3', subject: 'Zonnepanelen opbrengst lager dan verwacht', description: 'De opbrengst van mijn zonnepanelen is de afgelopen week 30% lager dan normaal.', status: 'opgelost', urgency: 'normaal', created_at: '2026-02-15T11:00:00Z', updated_at: '2026-02-18T10:00:00Z', module_type: 'solar', response: 'Na inspectie bleek er sneeuw op de panelen te liggen. Na het smelten is de opbrengst weer normaal.' },
])

// --- AI Conversaties (vervangt tickets conceptueel) ---
const CONVERSATIONS: MockConversation[] = reactive([
  {
    id: 'conv-1',
    customer_id: 'cust-1',
    customer_name: 'Jan de Vries',
    subject: 'Warmtepomp maakt geluid',
    status: 'geescaleerd',
    started_at: '2026-03-20T10:00:00Z',
    updated_at: '2026-03-21T14:00:00Z',
    module_type: 'heat_pump',
    requires_visit: true,
    ai_summary: 'Klant meldt tikkend geluid bij opstarten buitenunit. Systeem automatisch gecontroleerd: geen technische storing. COP normaal (4.2). Mogelijk mechanisch probleem dat fysieke inspectie vereist.',
    ai_resolution: null,
    messages: [
      { id: 'msg-1a', role: 'customer', content: 'Sinds vorige week maakt de buitenunit van mijn warmtepomp een tikkend geluid bij het opstarten.', timestamp: '2026-03-20T10:00:00Z' },
      { id: 'msg-1b', role: 'ai', content: 'Ik heb je warmtepomp gecontroleerd. Status: verwarmen. Geen storingen gedetecteerd. De COP is 4.2 (uitstekend), wat betekent dat het systeem efficiënt draait.\n\nBinnentemperatuur: 20,4°C (ingesteld: 21°C). Warmwater: gereed (52°C).\n\nTechnisch lijkt alles in orde. Omdat je aangeeft dat er een geluid is, raad ik aan om dit te laten nakijken door een monteur. Zal ik dit doorsturen naar Volt4U?', timestamp: '2026-03-20T10:00:05Z', metadata: { systemCheck: true, dataPoints: [{ label: 'Status', value: 'verwarmen' }, { label: 'COP', value: '4.2 (uitstekend)' }, { label: 'Binnen', value: '20,4°C' }] } },
      { id: 'msg-1c', role: 'customer', content: 'Ja graag, het geluid wordt steeds erger.', timestamp: '2026-03-20T10:02:00Z' },
      { id: 'msg-1d', role: 'ai', content: 'Ik heb je melding doorgestuurd naar Volt4U. Op basis van mijn analyse adviseer ik een inspectie ter plaatse. Ze nemen zo snel mogelijk contact op om een afspraak in te plannen.', timestamp: '2026-03-20T10:02:05Z' },
      { id: 'msg-1e', role: 'installer', content: 'Hoi Jan, we hebben je melding ontvangen. Een monteur neemt morgen contact op om een afspraak in te plannen. Bij twijfel kun je de warmtepomp tijdelijk op eco-modus zetten.', timestamp: '2026-03-21T14:00:00Z' },
    ],
  },
  {
    id: 'conv-2',
    customer_id: 'cust-1',
    customer_name: 'Jan de Vries',
    subject: 'Vraag over factuur',
    status: 'ai_opgelost',
    started_at: '2026-03-10T09:00:00Z',
    updated_at: '2026-03-10T09:01:00Z',
    module_type: null,
    requires_visit: false,
    ai_summary: 'Klant had vraag over factuurbedrag. AI heeft uitleg gegeven over servicecontract en verwezen naar factuurpagina.',
    ai_resolution: 'Vraag beantwoord over facturatie. Klant verwezen naar factuurpagina met uitleg over automatische incasso.',
    messages: [
      { id: 'msg-2a', role: 'customer', content: 'Het bedrag op mijn factuur van februari lijkt hoger dan normaal. Klopt dit?', timestamp: '2026-03-10T09:00:00Z' },
      { id: 'msg-2b', role: 'ai', content: 'Je facturen vind je op de pagina "Facturen" in je account. Je huidige servicecontract dekt: Zonnepanelen + Warmtepomp.\n\nDe betaling verloopt via automatische incasso. Als je een afwijking ziet, controleer dan de factuurpagina voor details. Het kan zijn dat er een jaarlijkse indexering heeft plaatsgevonden per 1 februari.', timestamp: '2026-03-10T09:00:05Z' },
      { id: 'msg-2c', role: 'customer', content: 'Ah oke, dat kan kloppen dan. Bedankt!', timestamp: '2026-03-10T09:01:00Z' },
      { id: 'msg-2d', role: 'ai', content: 'Graag gedaan! Fijn dat ik je kon helpen. Mocht je later nog vragen hebben, dan ben ik er altijd. Een fijne dag!', timestamp: '2026-03-10T09:01:05Z' },
    ],
  },
  {
    id: 'conv-3',
    customer_id: 'cust-1',
    customer_name: 'Jan de Vries',
    subject: 'Opbrengst check zonnepanelen',
    status: 'ai_opgelost',
    started_at: '2026-02-15T11:00:00Z',
    updated_at: '2026-02-15T11:02:00Z',
    module_type: 'solar',
    requires_visit: false,
    ai_summary: 'Klant vroeg naar lagere opbrengst. AI heeft systeem gecheckt en bevestigd dat alles normaal werkt. Opbrengstverschil verklaard door seizoensinvloeden.',
    ai_resolution: 'Systeem automatisch gecheckt. Alle waarden normaal. Klant gerustgesteld met data.',
    messages: [
      { id: 'msg-3a', role: 'customer', content: 'Mijn zonnepanelen lijken minder op te wekken dan vorige maand. Is er iets mis?', timestamp: '2026-02-15T11:00:00Z' },
      { id: 'msg-3b', role: 'ai', content: 'Ik heb je zonnepanelen gecheckt. Je systeem is online en functioneert normaal. Op dit moment wordt er 1,8 kW geproduceerd. Vandaag is de totale opbrengst 8,2 kWh.\n\nJe panelen presteren normaal voor deze tijd van het jaar. In de winter is de opbrengst lager door kortere dagen en een lagere zonnestand. In het voorjaar stijgt de opbrengst weer.', timestamp: '2026-02-15T11:00:05Z', metadata: { systemCheck: true, dataPoints: [{ label: 'Status', value: 'online' }, { label: 'Productie', value: '1,8 kW' }, { label: 'Vandaag', value: '8,2 kWh' }] } },
      { id: 'msg-3c', role: 'customer', content: 'Top, dan is het normaal. Dankjewel!', timestamp: '2026-02-15T11:02:00Z' },
      { id: 'msg-3d', role: 'ai', content: 'Graag gedaan! Fijn dat ik je kon helpen. Mocht je later nog vragen hebben, dan ben ik er altijd. Een fijne dag!', timestamp: '2026-02-15T11:02:05Z' },
    ],
  },
])

const MAINTENANCE_RECORDS: MockMaintenanceRecord[] = [
  { id: 'maint-1', date: '2026-01-15T10:00:00Z', description: 'Jaarlijkse inspectie warmtepomp — filters gereinigd, koelmiddel gecontroleerd', technician: 'Peter van Dalen', type: 'onderhoud', module_type: 'heat_pump' },
  { id: 'maint-2', date: '2025-11-20T14:00:00Z', description: 'Zonnepanelen schoongemaakt en bekabeling gecontroleerd', technician: 'Mark Hendriks', type: 'onderhoud', module_type: 'solar' },
  { id: 'maint-3', date: '2025-09-05T09:00:00Z', description: 'Firmware update laadpaal naar versie 4.2.1', technician: 'Easee Service', type: 'onderhoud', module_type: 'ev_charger' },
  { id: 'maint-4', date: '2025-06-12T11:00:00Z', description: 'Installatiecheck na oplevering — alle systemen correct werkend', technician: 'Peter van Dalen', type: 'inspectie', module_type: null },
]

const SYSTEM_STATUS: MockSystemStatus = reactive({
  overall: 'ok',
  modules: [
    { type: 'solar', status: 'ok', message: 'Zonnepanelen werken normaal' },
    { type: 'heat_pump', status: 'ok', message: 'Warmtepomp draait normaal' },
    { type: 'ev_charger', status: 'ok', message: 'Laadpaal stand-by' },
  ],
  lastChecked: new Date().toISOString(),
})

export function useMockData() {
  // Initialize persistence on first call (client-side only)
  if (typeof window !== 'undefined') initPersistence()

  return {
    // --- Backward compatible: scoped to Volt4U (partner-1) ---
    partner: PARTNERS[0],
    customers: CUSTOMERS_VOLTVIA,
    installations: INSTALLATIONS_VOLTVIA,
    moduleDefinitions: MODULE_DEFINITIONS,
    partnerModuleConfigs: PMC_VOLTVIA,
    subscriptions: _reactiveSubscriptions,
    payments: PAYMENTS_VOLTVIA,

    // --- Platform-level: all partners ---
    partners: PARTNERS,
    allCustomers: ALL_CUSTOMERS,
    allInstallations: ALL_INSTALLATIONS,
    allSubscriptions: _allReactiveSubscriptions,
    allPayments: ALL_PAYMENTS,
    allPartnerModuleConfigs: ALL_PARTNER_MODULE_CONFIGS,

    // Helper: get partner by slug
    getPartnerBySlug(slug: string) {
      return PARTNERS.find(p => p.slug === slug) || null
    },

    // Helper: get customer installations
    getCustomerInstallations(customerId: string) {
      return ALL_INSTALLATIONS.filter(i => i.customer_id === customerId)
    },

    // Helper: get installation subscriptions
    getInstallationSubscriptions(installationId: string) {
      return _reactiveSubscriptions.filter(s => s.installation_id === installationId)
    },

    // Helper: get active module count for Voltvia
    getActiveModuleCount() {
      return _reactiveSubscriptions.filter(s => s.status === 'active').length
    },

    // Helper: calculate monthly revenue for Voltvia
    getMonthlyRevenue() {
      return _reactiveSubscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => {
          if (s.billing_interval === 'monthly') return sum + s.price_cents
          return sum + Math.round(s.price_cents / 12)
        }, 0)
    },

    // Helper: get payment stats for Voltvia
    getPaymentStats() {
      const thisMonth = PAYMENTS_VOLTVIA.filter(p => p.created_at >= '2025-07-01')
      return {
        totalThisMonth: thisMonth.reduce((sum, p) => p.status === 'paid' ? sum + p.amount_cents : sum, 0),
        pendingCount: thisMonth.filter(p => p.status === 'pending').length,
        pendingAmount: thisMonth.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount_cents, 0),
        failedCount: thisMonth.filter(p => p.status === 'failed').length,
        failedAmount: thisMonth.filter(p => p.status === 'failed').reduce((sum, p) => sum + p.amount_cents, 0),
      }
    },

    // Helper: get recent payments for Voltvia
    getRecentPayments(limit = 10) {
      return [...PAYMENTS_VOLTVIA].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit)
    },

    // Demo action: cancel subscription
    cancelSubscription(id: string) {
      const sub = _reactiveSubscriptions.find(s => s.id === id)
      if (sub) {
        sub.status = 'cancelled' as any
        sub.cancelled_at = new Date().toISOString()
      }
    },

    // Demo action: add subscription
    addSubscription(installationId: string, configId: string) {
      const config = PMC_VOLTVIA.find(c => c.id === configId)
      if (!config) return
      const installation = INSTALLATIONS_VOLTVIA.find(i => i.id === installationId)
      if (!installation) return
      const newSub: Subscription = {
        id: `sub-${Date.now()}`,
        customer_id: installation.customer_id,
        installation_id: installationId,
        partner_module_config_id: configId,
        status: 'active',
        billing_interval: 'monthly',
        price_cents: config.price_monthly,
        mollie_subscription_id: null,
        mollie_mandate_id: null,
        external_device_id: `demo-device-${Date.now()}`,
        integration_status: 'active',
        integration_meta: {},
        terms_accepted_at: new Date().toISOString(),
        terms_version: '1.0',
        activated_at: new Date().toISOString(),
        cancelled_at: null,
        expires_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        partner_module_config: config,
      }
      _reactiveSubscriptions.push(newSub)
    },

    // Current "logged in" customer (for demo) — reactive for edits
    currentCustomer: reactive({ ...CUSTOMERS_VOLTVIA[0] }),
    currentCustomerInstallations: INSTALLATIONS_VOLTVIA.filter(i => i.customer_id === 'cust-1'),

    // Mock invoices for customer portal
    invoices: INVOICES,
    getCustomerInvoices(customerId: string) {
      return INVOICES.filter(i => i.customer_id === customerId).sort((a, b) => b.invoice_date.localeCompare(a.invoice_date))
    },

    // Mock notifications / communication log
    notifications: NOTIFICATIONS,
    getNotifications() {
      return [...NOTIFICATIONS].sort((a, b) => b.created_at.localeCompare(a.created_at))
    },

    // Demo action: update customer details (for address change)
    updateCurrentCustomer(data: Partial<typeof CUSTOMERS_VOLTVIA[0]>) {
      const customer = this.currentCustomer
      Object.assign(customer, data, { updated_at: new Date().toISOString() })
    },

    // --- Platform-level helpers ---

    getPartnerCustomers(partnerId: string) {
      return ALL_CUSTOMERS.filter(c => c.partner_id === partnerId)
    },

    getPartnerInstallations(partnerId: string) {
      return ALL_INSTALLATIONS.filter(i => i.partner_id === partnerId)
    },

    getPartnerSubscriptions(partnerId: string) {
      const partnerCustomerIds = ALL_CUSTOMERS.filter(c => c.partner_id === partnerId).map(c => c.id)
      return _allReactiveSubscriptions.filter(s => partnerCustomerIds.includes(s.customer_id))
    },

    getPartnerActiveModuleCount(partnerId: string) {
      const partnerCustomerIds = ALL_CUSTOMERS.filter(c => c.partner_id === partnerId).map(c => c.id)
      return _allReactiveSubscriptions.filter(s => partnerCustomerIds.includes(s.customer_id) && s.status === 'active').length
    },

    getPartnerMonthlyRevenue(partnerId: string) {
      const partnerCustomerIds = ALL_CUSTOMERS.filter(c => c.partner_id === partnerId).map(c => c.id)
      return _allReactiveSubscriptions
        .filter(s => partnerCustomerIds.includes(s.customer_id) && s.status === 'active')
        .reduce((sum, s) => {
          if (s.billing_interval === 'monthly') return sum + s.price_cents
          return sum + Math.round(s.price_cents / 12)
        }, 0)
    },

    getPartnerPayments(partnerId: string) {
      return ALL_PAYMENTS.filter(p => p.partner_id === partnerId)
    },

    getPlatformStats() {
      const activePartners = PARTNERS.filter(p => p.is_active).length
      const totalCustomers = ALL_CUSTOMERS.length
      const totalActiveSubscriptions = _allReactiveSubscriptions.filter(s => s.status === 'active').length
      const totalMRR = _allReactiveSubscriptions
        .filter(s => s.status === 'active')
        .reduce((sum, s) => {
          if (s.billing_interval === 'monthly') return sum + s.price_cents
          return sum + Math.round(s.price_cents / 12)
        }, 0)
      const thisMonth = ALL_PAYMENTS.filter(p => p.created_at >= '2025-07-01')
      const revenueThisMonth = thisMonth.reduce((sum, p) => p.status === 'paid' ? sum + p.amount_cents : sum, 0)
      return { activePartners, totalCustomers, totalActiveSubscriptions, totalMRR, revenueThisMonth }
    },

    // --- Partner CRUD ---

    updatePartner(id: string, data: Partial<Partner>) {
      const partner = PARTNERS.find(p => p.id === id)
      if (partner) {
        Object.assign(partner, data, { updated_at: new Date().toISOString() })
      }
    },

    addPartner(data: { name: string; slug: string; primary_color: string; secondary_color: string; support_email: string; support_phone: string }) {
      const letter = data.name.charAt(0).toUpperCase()
      const color = encodeURIComponent(data.primary_color)
      const newPartner: Partner = {
        id: `partner-${Date.now()}`,
        name: data.name,
        slug: data.slug,
        custom_domain: null,
        logo_url: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='8' fill='${color}'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' font-size='20' font-weight='bold' fill='white' font-family='Arial'%3E${letter}%3C/text%3E%3C/svg%3E`,
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
        terms_url: null,
        support_email: data.support_email || null,
        support_phone: data.support_phone || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      PARTNERS.push(newPartner)
      return newPartner
    },

    // --- Consumer Dashboard Data ---
    energyFlow: ENERGY_FLOW,
    solarData: SOLAR_DATA,
    heatPumpData: HEATPUMP_DATA,
    evChargerData: EVCHARGER_DATA,
    serviceTickets: SERVICE_TICKETS,
    maintenanceRecords: MAINTENANCE_RECORDS,
    systemStatus: SYSTEM_STATUS,
    conversations: CONVERSATIONS,

    // AI Conversatie functies
    startConversation(subject: string, message: string, moduleType: string | null = null) {
      const conv: MockConversation = {
        id: `conv-${Date.now()}`,
        customer_id: 'cust-1',
        customer_name: CUSTOMERS_VOLTVIA[0].full_name || 'Klant',
        subject,
        status: 'actief',
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        module_type: moduleType,
        messages: [],
        ai_summary: null,
        ai_resolution: null,
        requires_visit: false,
      }
      // Add customer message
      conv.messages.push({
        id: `msg-${Date.now()}-c`,
        role: 'customer',
        content: message,
        timestamp: new Date().toISOString(),
      })
      // Generate AI response
      const aiResp = generateAiResponse(message, moduleType, {
        solarData: SOLAR_DATA,
        heatPumpData: HEATPUMP_DATA,
        evChargerData: EVCHARGER_DATA,
        partnerName: PARTNERS[0].name,
        activeModules: _reactiveSubscriptions.filter(s => s.customer_id === 'cust-1' && s.status === 'active').map(s => s.partner_module_config?.module_definition?.type).filter(Boolean) as string[],
      })
      conv.messages.push({
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: aiResp.content,
        timestamp: new Date(Date.now() + 2000).toISOString(),
        metadata: aiResp.systemCheck ? { systemCheck: true, dataPoints: aiResp.dataPoints } : undefined,
      })
      if (aiResp.shouldEscalate) {
        conv.status = 'geescaleerd'
        conv.ai_summary = aiResp.escalateReason || 'Geescaleerd naar installateur'
      }
      CONVERSATIONS.unshift(conv)
      return conv
    },

    sendMessage(conversationId: string, message: string) {
      const conv = CONVERSATIONS.find(c => c.id === conversationId)
      if (!conv) return
      conv.messages.push({
        id: `msg-${Date.now()}-c`,
        role: 'customer',
        content: message,
        timestamp: new Date().toISOString(),
      })
      conv.updated_at = new Date().toISOString()
      // Generate AI response
      const aiResp = generateAiResponse(message, conv.module_type, {
        solarData: SOLAR_DATA,
        heatPumpData: HEATPUMP_DATA,
        evChargerData: EVCHARGER_DATA,
        partnerName: PARTNERS[0].name,
        activeModules: _reactiveSubscriptions.filter(s => s.customer_id === 'cust-1' && s.status === 'active').map(s => s.partner_module_config?.module_definition?.type).filter(Boolean) as string[],
      })
      conv.messages.push({
        id: `msg-${Date.now()}-ai`,
        role: 'ai',
        content: aiResp.content,
        timestamp: new Date(Date.now() + 2000).toISOString(),
        metadata: aiResp.systemCheck ? { systemCheck: true, dataPoints: aiResp.dataPoints } : undefined,
      })
      if (aiResp.shouldEscalate && conv.status === 'actief') {
        conv.status = 'geescaleerd'
        conv.ai_summary = generateAiSummary(conv.messages, conv.module_type)
        conv.requires_visit = message.toLowerCase().includes('monteur') || message.toLowerCase().includes('afspraak') || message.toLowerCase().includes('langskomen')
      }
      // Check if resolved
      if (!aiResp.shouldEscalate && (message.toLowerCase().includes('bedankt') || message.toLowerCase().includes('opgelost') || message.toLowerCase().includes('duidelijk'))) {
        conv.status = 'ai_opgelost'
        conv.ai_resolution = 'Vraag beantwoord door AI-assistent.'
      }
    },

    sendInstallerMessage(conversationId: string, message: string) {
      const conv = CONVERSATIONS.find(c => c.id === conversationId)
      if (!conv) return
      conv.messages.push({
        id: `msg-${Date.now()}-inst`,
        role: 'installer',
        content: message,
        timestamp: new Date().toISOString(),
      })
      conv.updated_at = new Date().toISOString()
    },

    resolveConversation(conversationId: string) {
      const conv = CONVERSATIONS.find(c => c.id === conversationId)
      if (conv) {
        conv.status = 'gesloten'
        conv.updated_at = new Date().toISOString()
      }
    },

    escalateConversation(conversationId: string) {
      const conv = CONVERSATIONS.find(c => c.id === conversationId)
      if (conv) {
        conv.status = 'geescaleerd'
        conv.updated_at = new Date().toISOString()
        conv.messages.push({
          id: `msg-${Date.now()}-ai-esc`,
          role: 'ai',
          content: `Ik heb je vraag doorgestuurd naar ${PARTNERS[0].name}. Ze nemen zo snel mogelijk contact op.`,
          timestamp: new Date().toISOString(),
        })
      }
    },

    // Get active module types for current customer
    getActiveModuleTypes() {
      const customerSubs = _reactiveSubscriptions.filter(s => s.customer_id === 'cust-1' && s.status === 'active')
      return customerSubs.map(s => s.partner_module_config?.module_definition?.type).filter(Boolean) as string[]
    },

    // Demo action: update heat pump mode
    updateHeatPumpMode(mode: 'comfort' | 'eco' | 'vakantie') {
      HEATPUMP_DATA.mode = mode
      if (mode === 'eco') {
        HEATPUMP_DATA.setTemperature = 19
      } else if (mode === 'vakantie') {
        HEATPUMP_DATA.setTemperature = 15
        HEATPUMP_DATA.status = 'standby'
      } else {
        HEATPUMP_DATA.setTemperature = 21
        HEATPUMP_DATA.status = 'verwarmen'
      }
    },

    // Demo action: toggle EV charging
    toggleEvCharging() {
      if (EVCHARGER_DATA.status === 'laden') {
        EVCHARGER_DATA.status = 'standby'
        EVCHARGER_DATA.currentPowerW = 0
        EVCHARGER_DATA.estimatedCompletion = null
        ENERGY_FLOW.evChargingW = 0
      } else {
        EVCHARGER_DATA.status = 'laden'
        EVCHARGER_DATA.currentPowerW = 7400
        EVCHARGER_DATA.estimatedCompletion = '18:30'
        ENERGY_FLOW.evChargingW = 7400
      }
    },

    // Demo action: add service ticket
    addServiceTicket(ticket: { subject: string; description: string; urgency: 'laag' | 'normaal' | 'hoog'; module_type: string | null }) {
      SERVICE_TICKETS.unshift({
        id: `ticket-${Date.now()}`,
        ...ticket,
        status: 'open',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        response: null,
      })
    },

    // --- Service tiers ---
    serviceTiers: SERVICE_TIERS,

    // --- Onboarding functies ---
    onboardingRecords: ONBOARDING_RECORDS,

    onboardCustomer(data: {
      partner_id: string
      email: string
      full_name: string
      phone: string
      street: string
      house_number: string
      postal_code: string
      city: string
      module_type: 'solar' | 'heat_pump' | 'ev_charger'
      gripp_project_id?: string
    }) {
      const now = new Date().toISOString()
      const partnerId = data.partner_id

      // Find partner module config for this module type
      const pmc = ALL_PARTNER_MODULE_CONFIGS.find(
        p => p.partner_id === partnerId && p.module_definition?.type === data.module_type && p.is_enabled
      )
      if (!pmc) return null

      // Get the right partner-specific arrays
      const partnerCustomers = partnerId === 'partner-1' ? CUSTOMERS_VOLTVIA
        : partnerId === 'partner-2' ? CUSTOMERS_SOLARWISE
        : CUSTOMERS_GREENCHARGE
      const partnerInstallations = partnerId === 'partner-1' ? INSTALLATIONS_VOLTVIA
        : partnerId === 'partner-2' ? INSTALLATIONS_SOLARWISE
        : INSTALLATIONS_GREENCHARGE

      // Check if customer already exists
      const existingCustomer = ALL_CUSTOMERS.find(c => c.email === data.email && c.partner_id === partnerId)

      if (existingCustomer) {
        // Existing customer: add module
        const installation = ALL_INSTALLATIONS.find(i => i.customer_id === existingCustomer.id)
        if (!installation) return null

        // Check if they already have this module
        const alreadyHas = _allReactiveSubscriptions.find(
          s => s.customer_id === existingCustomer.id && s.partner_module_config?.module_definition?.type === data.module_type && s.status === 'active'
        )
        if (alreadyHas) return { customer: existingCustomer, token: null, isExisting: true, alreadyHasModule: true }

        const subId = `sub-onb-${Date.now()}`
        const newSub: Subscription = {
          id: subId, customer_id: existingCustomer.id, installation_id: installation.id,
          partner_module_config_id: pmc.id, status: 'active', billing_interval: 'monthly',
          price_cents: pmc.price_monthly, mollie_subscription_id: null, mollie_mandate_id: null,
          external_device_id: null, integration_status: 'pending', integration_meta: {},
          terms_accepted_at: now, terms_version: '1.0', activated_at: now,
          cancelled_at: null, expires_at: null, created_at: now, updated_at: now,
          partner_module_config: pmc,
        }
        _allReactiveSubscriptions.push(newSub)
        if (partnerId === 'partner-1') _reactiveSubscriptions.push(newSub)

        // Add notification for existing customer
        const moduleName = data.module_type === 'solar' ? 'Zonnepanelen' : data.module_type === 'heat_pump' ? 'Warmtepomp' : 'Laadpaal'
        NOTIFICATIONS.unshift({
          id: `notif-onb-${Date.now()}`,
          customer_id: existingCustomer.id,
          type: 'info',
          subject: `${moduleName} toegevoegd aan je account`,
          message: `${moduleName} is gekoppeld aan je woning. Bekijk de status op je dashboard.`,
          is_read: false,
          created_at: now,
        })

        return { customer: existingCustomer, token: null, isExisting: true, alreadyHasModule: false }
      }

      // New customer
      const custId = `cust-${Date.now()}`
      const newCustomer: Customer = {
        id: custId, auth_user_id: `auth-${Date.now()}`, partner_id: partnerId,
        email: data.email, full_name: data.full_name, phone: data.phone,
        mollie_customer_id: null, street: data.street, house_number: data.house_number,
        postal_code: data.postal_code, city: data.city,
        created_at: now, updated_at: now,
      }
      partnerCustomers.push(newCustomer)
      ALL_CUSTOMERS.push(newCustomer)

      // Create installation
      const instId = `inst-${Date.now()}`
      const newInstallation: Installation = {
        id: instId, customer_id: custId, partner_id: partnerId,
        name: `Woning ${data.street}`,
        address_street: data.street, address_house_number: data.house_number,
        address_postal_code: data.postal_code, address_city: data.city,
        created_at: now, updated_at: now,
      }
      partnerInstallations.push(newInstallation)
      ALL_INSTALLATIONS.push(newInstallation)

      // Create subscription
      const subId = `sub-onb-${Date.now()}`
      const newSub: Subscription = {
        id: subId, customer_id: custId, installation_id: instId,
        partner_module_config_id: pmc.id, status: 'active', billing_interval: 'monthly',
        price_cents: pmc.price_monthly, mollie_subscription_id: null, mollie_mandate_id: null,
        external_device_id: null, integration_status: 'pending', integration_meta: {},
        terms_accepted_at: null, terms_version: '1.0', activated_at: null,
        cancelled_at: null, expires_at: null, created_at: now, updated_at: now,
        partner_module_config: pmc,
      }
      _allReactiveSubscriptions.push(newSub)
      if (partnerId === 'partner-1') _reactiveSubscriptions.push(newSub)

      // Generate onboarding token
      const token = `onb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      ONBOARDING_RECORDS.push({
        token, partner_id: partnerId, customer_id: custId,
        module_type: data.module_type, gripp_project_id: data.gripp_project_id || null,
        service_tier: 'slim', status: 'pending', created_at: now, activated_at: null,
      })

      return { customer: newCustomer, token, isExisting: false, alreadyHasModule: false }
    },

    getOnboardingData(token: string) {
      const record = ONBOARDING_RECORDS.find(r => r.token === token)
      if (!record) return null
      const customer = ALL_CUSTOMERS.find(c => c.id === record.customer_id)
      const partner = PARTNERS.find(p => p.id === record.partner_id)
      const installation = ALL_INSTALLATIONS.find(i => i.customer_id === record.customer_id)
      const subscription = _allReactiveSubscriptions.find(
        s => s.customer_id === record.customer_id && s.partner_module_config?.module_definition?.type === record.module_type
      )
      if (!customer || !partner) return null
      const serviceTier = SERVICE_TIERS.find(t => t.slug === record.service_tier) || SERVICE_TIERS[1]
      return { record, customer, partner, installation, subscription, moduleType: record.module_type, serviceTier }
    },

    activateOnboarding(token: string, updatedCustomer?: Partial<Customer>) {
      const record = ONBOARDING_RECORDS.find(r => r.token === token)
      if (!record || record.status === 'activated') return false
      record.status = 'activated'
      record.activated_at = new Date().toISOString()

      // Update customer if data provided
      if (updatedCustomer) {
        const customer = ALL_CUSTOMERS.find(c => c.id === record.customer_id)
        if (customer) Object.assign(customer, updatedCustomer, { updated_at: new Date().toISOString() })
      }

      // Activate subscription
      const sub = _allReactiveSubscriptions.find(
        s => s.customer_id === record.customer_id && s.partner_module_config?.module_definition?.type === record.module_type
      )
      if (sub) {
        sub.status = 'active'
        sub.activated_at = new Date().toISOString()
        sub.terms_accepted_at = new Date().toISOString()
      }

      // Create welcome notification
      const moduleName = record.module_type === 'solar' ? 'Zonnepanelen' : record.module_type === 'heat_pump' ? 'Warmtepomp' : 'Laadpaal'
      NOTIFICATIONS.unshift({
        id: `notif-welcome-${Date.now()}`,
        customer_id: record.customer_id,
        type: 'info',
        subject: `Welkom! Je ${moduleName} account is actief`,
        message: `Je account is succesvol geactiveerd. Bekijk je ${moduleName.toLowerCase()} op het dashboard.`,
        is_read: false,
        created_at: new Date().toISOString(),
      })

      return true
    },

    deletePartner(id: string) {
      const idx = PARTNERS.findIndex(p => p.id === id)
      if (idx !== -1) PARTNERS.splice(idx, 1)
      // Clean up related data
      const customerIds = ALL_CUSTOMERS.filter(c => c.partner_id === id).map(c => c.id)
      for (let i = ALL_CUSTOMERS.length - 1; i >= 0; i--) {
        if (ALL_CUSTOMERS[i].partner_id === id) ALL_CUSTOMERS.splice(i, 1)
      }
      for (let i = ALL_INSTALLATIONS.length - 1; i >= 0; i--) {
        if (ALL_INSTALLATIONS[i].partner_id === id) ALL_INSTALLATIONS.splice(i, 1)
      }
      for (let i = _allReactiveSubscriptions.length - 1; i >= 0; i--) {
        if (customerIds.includes(_allReactiveSubscriptions[i].customer_id)) _allReactiveSubscriptions.splice(i, 1)
      }
      for (let i = ALL_PAYMENTS.length - 1; i >= 0; i--) {
        if (ALL_PAYMENTS[i].partner_id === id) ALL_PAYMENTS.splice(i, 1)
      }
    },
  }
}
