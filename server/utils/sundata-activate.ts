import type { H3Event } from 'h3'
import { SUNDATA_BASE_URL, sundataSession } from './sundata'
import { getServiceRoleClient } from './supabase'

/**
 * Een Sundata-plant van "light" naar monitored zetten.
 *
 * Light betekent: de plant staat er met adres, plant_code en meter, maar
 * monitored_since is leeg en Sundata haalt nog geen data op. Zodra we
 * monitored_since zetten begint Sundata te verzamelen, met historie vanaf de
 * startdatum van de meter.
 *
 * ONOMKEERBAAR. Een poging om monitored_since weer leeg te maken geeft:
 *   4033 plant_turn_off_monitored_since_not_allowed — "Monitoring can only be
 *   turned on"
 * Dus alleen aanroepen na een echt akkoord van de klant. Niet vooruitlopend,
 * niet om te testen.
 *
 * De PUT verwacht de hele plant terug, niet alleen het gewijzigde veld: naam,
 * prijs, tag-id's en het volledige adres moeten mee, anders raak je ze kwijt.
 * Daarom eerst GET met address en tags erbij. Getest: zonder `id` en
 * `is_owner` in de body werkt het (die stuurt de Sundata-app zelf wel mee).
 */
export interface ActivationResult {
  plantId: number
  status: 'activated' | 'already_active' | 'failed'
  monitoredSince?: string | null
  error?: string
}

export async function activateSundataPlant(
  event: H3Event,
  partnerId: string,
  plantId: number,
  akkoordDatum: string,
  companyId = 7,
): Promise<ActivationResult> {
  try {
    const { headers } = await sundataSession(event, partnerId)
    const base = `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plantId}`

    const plant = await $fetch<any>(`${base}?with=address,tags`, { headers })

    // Al actief? Dan niets doen. Scheelt een onnodige schrijfactie en maakt de
    // hele operatie herhaalbaar.
    if (plant?.monitored_since) {
      return { plantId, status: 'already_active', monitoredSince: plant.monitored_since }
    }

    const a = plant.address || {}
    await $fetch(base, {
      method: 'PUT',
      headers,
      body: {
        name: plant.name,
        amount_in_cents_per_kwh: plant.amount_in_cents_per_kwh,
        tag_ids: (plant.tags || []).map((t: any) => t.id),
        address: {
          id: a.id,
          street: a.street,
          street_number: a.street_number,
          city: a.city,
          postal_code: a.postal_code,
          latitude: a.latitude,
          longitude: a.longitude,
        },
        monitored_since: akkoordDatum,
      },
    })

    // Controleren of het echt is gezet, en of adres en tags intact zijn. Een
    // 200 zonder effect zou hier anders onopgemerkt blijven.
    const na = await $fetch<any>(`${base}?with=address,tags`, { headers })
    if (!na?.monitored_since) {
      return { plantId, status: 'failed', error: 'Sundata gaf 200 maar monitored_since bleef leeg' }
    }
    if (na.address?.postal_code !== a.postal_code || na.address?.street !== a.street) {
      console.error(`[sundata] LET OP: adres van plant ${plantId} is gewijzigd door de activering`)
    }

    return { plantId, status: 'activated', monitoredSince: na.monitored_since }
  } catch (e: any) {
    const msg = e?.data?.error?.messages
      ? Object.values(e.data.error.messages).join('; ')
      : (e?.data?.message || e?.message || 'onbekende fout')
    return { plantId, status: 'failed', error: String(msg) }
  }
}

/**
 * Alle plants van deze klant activeren, op basis van zijn e-mailadres.
 *
 * Zorgt er daarna ook voor dat het zonnepanelen-product de Sundata-koppeling
 * draagt (`sundata:<company>/<plant>/<meter>`), want daar leest het klantportaal
 * de opbrengst mee uit.
 */
export async function activatePlantsForCustomer(
  event: H3Event,
  partnerId: string,
  customer: { id: string; email: string },
  akkoordDatum: string,
): Promise<ActivationResult[]> {
  const supabase = getServiceRoleClient(event)

  const { data: links } = await supabase
    .from('sundata_plant_links')
    .select('id, sundata_company_id, sundata_plant_id, sundata_meter_id, activated_at')
    .eq('partner_id', partnerId)
    .ilike('email', customer.email)

  if (!links?.length) return []

  const resultaten: ActivationResult[] = []
  for (const link of links) {
    const r = await activateSundataPlant(
      event, partnerId, link.sundata_plant_id, akkoordDatum, link.sundata_company_id ?? 7,
    )
    resultaten.push(r)

    if (r.status === 'failed') continue

    await supabase.from('sundata_plant_links')
      .update({ activated_at: link.activated_at || new Date().toISOString(), customer_id: customer.id })
      .eq('id', link.id)

    // Koppeling op het product zetten zodat het portaal data toont.
    const marker = `sundata:${link.sundata_company_id ?? 7}/${link.sundata_plant_id}/${link.sundata_meter_id ?? ''}`
    const { data: bestaand } = await supabase
      .from('customer_products')
      .select('id, serial_number')
      .eq('customer_id', customer.id)
      .eq('category', 'solar_panel')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const velden = {
      integration_type: 'sundata',
      external_id: String(link.sundata_plant_id),
      serial_number: marker,
      linked_at: new Date().toISOString(),
    }
    if (bestaand) {
      await supabase.from('customer_products').update(velden).eq('id', bestaand.id)
    } else {
      await supabase.from('customer_products').insert({
        customer_id: customer.id,
        partner_id: partnerId,
        category: 'solar_panel',
        name: 'Zonnepanelen',
        ...velden,
      })
    }
  }

  return resultaten
}
