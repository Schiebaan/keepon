import { getServiceRoleClient } from '~~/server/utils/supabase'

/**
 * Verzamelt alles wat de assistent over déze klant en dit probleem moet weten,
 * vóór het gesprek naar Claude gaat.
 *
 * Vier bronnen:
 *   1. de producten van de klant, mét of ze gekoppeld zijn
 *   2. live meetdata waar we die hebben
 *   3. storingsartikelen uit de kennisbank voor de betrokken module
 *   4. hoe vergelijkbare klachten eerder zijn opgelost
 *
 * Zonder deze context stelt het model generieke vragen. Mét deze context kan
 * het zeggen "ik zie dat je omvormer sinds dinsdag niets meer doorgeeft".
 */

export interface CustomerProduct {
  category: string
  name: string | null
  brand: string | null
  model: string | null
  linked: boolean
  linked_via: string | null
}

export interface KbArticle {
  slug: string
  title: string
  body_md: string
}

export interface PastTicket {
  subject: string
  description: string | null
  resolution: string | null
}

export interface AiContext {
  products: CustomerProduct[]
  articles: KbArticle[]
  pastTickets: PastTicket[]
}

/** Losse categorienamen uit de UI en de database naar één noemer. */
const MODULE_ALIASES: Record<string, string> = {
  solar: 'solar_panel',
  solar_panel: 'solar_panel',
  zonnepanelen: 'solar_panel',
  heat_pump: 'heat_pump',
  warmtepomp: 'heat_pump',
  ev_charger: 'ev_charger',
  laadpaal: 'ev_charger',
  battery: 'battery',
  thuisbatterij: 'battery',
}

export function normalizeModule(m?: string | null): string | null {
  if (!m) return null
  return MODULE_ALIASES[m.toLowerCase()] || null
}

export async function getCustomerProducts(event: any, customerId: string): Promise<CustomerProduct[]> {
  const supabase = getServiceRoleClient(event)
  const { data } = await supabase
    .from('customer_products')
    .select('category, name, brand, model, integration_type, external_id, serial_number')
    .eq('customer_id', customerId)

  return (data || []).map((p: any) => {
    // Koppeling is op twee manieren vastgelegd: de nette kolommen, en de
    // oudere `serial_number`-marker (`sundata:…`, `easee:…`, `weheat:…`).
    const legacy = (p.serial_number || '').includes(':')
    const linked = !!p.integration_type || legacy
    return {
      category: p.category,
      name: p.name,
      brand: p.brand,
      model: p.model,
      linked,
      linked_via: p.integration_type || (legacy ? String(p.serial_number).split(':')[0] : null),
    }
  })
}

/**
 * Storingsartikelen voor de betrokken module, plus de algemene.
 *
 * Geen embeddings of vectorzoeken: het gaat om enkele tientallen korte
 * artikelen. Die passen gewoon in de context, en dat is nauwkeuriger dan een
 * semantische zoekopdracht over zo'n kleine verzameling.
 */
export async function getKbArticles(event: any, moduleType: string | null): Promise<KbArticle[]> {
  const supabase = getServiceRoleClient(event)
  let q = supabase
    .from('support_articles')
    .select('slug, title, body_md, module_type')
    .eq('audience', 'customer')
    .not('published_at', 'is', null)

  if (moduleType) q = q.or(`module_type.eq.${moduleType},module_type.is.null`)

  const { data, error } = await q.order('sort_order', { ascending: true }).limit(12)
  if (error) {
    // Draait migratie 031 nog niet, dan bestaat de audience-kolom niet. Dat mag
    // het gesprek niet laten klappen — dan werkt de assistent zonder kennisbank.
    console.error('[ai-context] kennisbank niet beschikbaar:', error.message)
    return []
  }
  return (data || []).map((a: any) => ({ slug: a.slug, title: a.title, body_md: a.body_md }))
}

/**
 * Hoe eerdere, vergelijkbare klachten zijn afgehandeld.
 *
 * Alleen opgeloste tickets van dezelfde partner, en uitsluitend de inhoud van
 * de klacht en de oplossing — geen namen, adressen of e-mailadressen. De
 * assistent praat met klant A; die hoort niets te weten over klant B.
 */
export async function getPastTickets(
  event: any,
  partnerId: string,
  moduleType: string | null,
  excludeCustomerId: string,
): Promise<PastTicket[]> {
  const supabase = getServiceRoleClient(event)
  let q = supabase
    .from('service_tickets')
    .select('subject, description, response, module_type, status')
    .eq('partner_id', partnerId)
    .in('status', ['opgelost', 'gesloten'])
    .not('response', 'is', null)
    .neq('customer_id', excludeCustomerId)

  if (moduleType) q = q.eq('module_type', moduleType)

  const { data } = await q.order('updated_at', { ascending: false }).limit(5)
  return (data || []).map((t: any) => ({
    subject: t.subject,
    description: t.description,
    resolution: t.response,
  }))
}

/** Bouwt het contextblok dat als tekst aan het systeemprompt hangt. */
export function renderContext(ctx: AiContext, live: { label: string; value: string }[]): string {
  const delen: string[] = []

  if (ctx.products.length) {
    delen.push(
      '## Producten van deze klant\n' +
      ctx.products.map(p =>
        `- ${p.name || p.category}${p.brand ? ` (${p.brand}${p.model ? ' ' + p.model : ''})` : ''}` +
        ` — ${p.linked ? `gekoppeld via ${p.linked_via}` : 'NIET gekoppeld, geen meetgegevens beschikbaar'}`,
      ).join('\n'),
    )
  } else {
    delen.push('## Producten van deze klant\nGeen producten geregistreerd.')
  }

  if (live.length) {
    delen.push('## Actuele meetgegevens\n' + live.map(d => `- ${d.label}: ${d.value}`).join('\n'))
  }

  if (ctx.articles.length) {
    delen.push(
      '## Kennisbank\n' +
      ctx.articles.map(a => `### ${a.title}\n${a.body_md}`).join('\n\n'),
    )
  }

  if (ctx.pastTickets.length) {
    delen.push(
      '## Hoe vergelijkbare klachten eerder zijn opgelost\n' +
      'Dit zijn geanonimiseerde eerdere meldingen bij dezelfde installateur. Gebruik ze als ' +
      'richting voor je vervolgvragen, niet als zekerheid over dit geval.\n\n' +
      ctx.pastTickets.map(t =>
        `- Klacht: ${t.subject}${t.description ? ` — ${t.description.slice(0, 200)}` : ''}\n` +
        `  Oplossing: ${(t.resolution || '').slice(0, 300)}`,
      ).join('\n'),
    )
  }

  return delen.join('\n\n')
}
