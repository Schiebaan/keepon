import { getServiceRoleClient } from '~~/server/utils/supabase'
import { listEaseeSites } from '~~/server/utils/easee'
import { resolvePartnerId } from '~~/server/utils/partner-scope'

/**
 * De installaties waar het Easee-installateursaccount bij kan.
 *
 * Eerder liep de koppelwizard via /api/chargers, en dat geeft alleen de palen
 * die het account zélf bezit — bij Volt4U twee, terwijl er 115 klantsites zijn.
 * Vandaar deze route.
 */
/**
 * Kort gecachet per partner. Easee doet er ~8 seconden over en de installateur
 * opent deze wizard meerdere keren achter elkaar bij het koppelen van klanten.
 * Vijf minuten is ruim genoeg: er komt zelden een installatie bij tijdens één
 * koppelsessie, en de wizard toont sowieso wat Easee ons geeft.
 */
const cache = new Map<string, { at: number; data: any }>()
const CACHE_MS = 5 * 60 * 1000

export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const supabase = getServiceRoleClient(event)
  const partnerId = await resolvePartnerId(event, supabase, user.id)

  const { data: creds } = await supabase
    .from('integration_credentials')
    .select('credentials')
    .eq('partner_id', partnerId)
    .eq('integration_type', 'easee')
    .eq('is_active', true)
    .maybeSingle()

  if (!creds) {
    throw createError({
      statusCode: 404,
      message: 'Easee is nog niet gekoppeld. Ga naar Instellingen → Monitoring integraties om je Easee-account te verbinden.',
    })
  }

  const gecachet = cache.get(partnerId)
  if (gecachet && Date.now() - gecachet.at < CACHE_MS) return gecachet.data

  try {
    const sites = await listEaseeSites(creds.credentials)
    cache.set(partnerId, { at: Date.now(), data: sites })
    return sites
  } catch (e: any) {
    throw createError({ statusCode: 502, message: e?.message || 'Kon de installaties niet ophalen bij Easee.' })
  }
})
