import { getServiceRoleClient } from '~~/server/utils/supabase'
import { weheatConnector } from '~~/server/utils/weheat'
import { easeeConnector } from '~~/server/utils/easee'
import { easeeFault, weheatFault, sundataFault, type Fault } from '~~/server/utils/fault-detection'
import { sendEmail, buildDeviceAlertDigestEmail } from '~~/server/utils/email'

/**
 * Periodieke storingscontrole op alle gekoppelde installaties.
 *
 * Hiervoor gebeurde er niets: live data werd alleen opgehaald als iemand
 * toevallig een pagina opende. Een omvormer die er een week uit lag zag
 * niemand, tenzij de klant belde.
 *
 * Draait als cron met x-cron-secret, net als mandate-reminders. Het oude
 * alerts/check-endpoint vereiste platform_admin en kon daarom nooit door een
 * cron aangeroepen worden — een van de redenen dat het nooit gedraaid heeft.
 *
 * Per partner één verzamelmail met alleen wat nieuw is. Een storing die
 * gisteren al gemeld was levert geen tweede mail op; anders is de mail na een
 * week niets meer waard en gaat 'ie ongelezen weg.
 */
export default defineEventHandler(async (event) => {
  const expected = process.env.CRON_SECRET
  const got = getRequestHeader(event, 'x-cron-secret') || ''
  if (!expected || got !== expected) {
    throw createError({ statusCode: 401, message: 'Ongeldig cron-geheim' })
  }

  const supabase = getServiceRoleClient(event)
  const nu = new Date().toISOString()

  const { data: producten } = await supabase
    .from('customer_products')
    .select('id, customer_id, partner_id, category, name, integration_type, external_id, serial_number, customers(full_name, email)')
    .or('integration_type.not.is.null,serial_number.like.%:%')

  const gekoppeld = (producten || []).filter(p =>
    p.integration_type || (p.serial_number || '').includes(':'))

  // Credentials per partner+type, zodat we niet per installatie opnieuw
  // inloggen bij de leverancier.
  const credCache = new Map<string, any>()
  async function creds(partnerId: string, type: string) {
    const key = `${partnerId}:${type}`
    if (credCache.has(key)) return credCache.get(key)
    const { data } = await supabase
      .from('integration_credentials')
      .select('credentials')
      .eq('partner_id', partnerId)
      .eq('integration_type', type)
      .eq('is_active', true)
      .maybeSingle()
    credCache.set(key, data?.credentials || null)
    return data?.credentials || null
  }

  let gecontroleerd = 0
  let nieuw = 0
  let hersteld = 0
  const perPartner = new Map<string, any[]>()

  // Per partner+koppeling bijhouden hoeveel apparaten we konden uitlezen en
  // hoeveel er stukliepen. Faalt álles, dan ligt de koppeling eruit en is dat
  // één melding waard — niet vijf losse meldingen bij klanten die niets
  // mankeren. Precies dit geval hield de Weheat-koppeling 59 dagen verborgen.
  const perKoppeling = new Map<string, { ok: number; fout: number; laatsteFout: string }>()
  function tel(partnerId: string, type: string, gelukt: boolean, bericht = '') {
    const k = `${partnerId}|${type}`
    const v = perKoppeling.get(k) || { ok: 0, fout: 0, laatsteFout: '' }
    if (gelukt) v.ok++
    else { v.fout++; v.laatsteFout = bericht }
    perKoppeling.set(k, v)
  }

  for (const p of gekoppeld) {
    const type = p.integration_type || (p.serial_number || '').split(':')[0]
    const extern = p.external_id || (p.serial_number || '').split(':').slice(1).join(':')
    if (!type || !extern) continue

    let fout: Fault | null = null
    try {
      const c = await creds(p.partner_id, type)
      if (!c) continue

      if (type === 'easee') {
        const s = await easeeConnector.getDeviceStatus(c, extern)
        fout = easeeFault(s.state)
      } else if (type === 'weheat') {
        const s = await weheatConnector.getDeviceStatus(c, extern)
        fout = weheatFault(s.state)
      } else if (type === 'sundata') {
        fout = await sundataFault(event, p.partner_id, p.serial_number || '')
      } else {
        continue
      }
      gecontroleerd++
      tel(p.partner_id, type, true)
    } catch (e: any) {
      tel(p.partner_id, type, false, e?.message || 'onbekende fout')
      // Een leverancier die er even uit ligt is geen storing bij de klant.
      // Dat zou een storm aan valse meldingen geven precies op het moment dat
      // niemand er iets aan kan doen.
      console.error(`[check-alerts] ${type}/${extern} niet op te halen:`, e?.message)
      continue
    }

    const { data: open } = await supabase
      .from('device_alerts')
      .select('id, kind, notified_at')
      .eq('customer_product_id', p.id)
      .is('resolved_at', null)
      .maybeSingle()

    if (fout) {
      if (open) {
        await supabase.from('device_alerts')
          .update({ last_seen_at: nu, kind: fout.kind, detail: fout.detail, raw_state: fout.raw })
          .eq('id', open.id)
      } else {
        const { data: rij } = await supabase.from('device_alerts').insert({
          partner_id: p.partner_id,
          customer_id: p.customer_id,
          customer_product_id: p.id,
          kind: fout.kind,
          detail: fout.detail,
          raw_state: fout.raw,
          first_seen_at: nu,
          last_seen_at: nu,
        }).select('id').single()
        nieuw++
        const lijst = perPartner.get(p.partner_id) || []
        lijst.push({
          alertId: rij?.id,
          customerName: (p as any).customers?.full_name || (p as any).customers?.email || 'Klant',
          productName: p.name || p.category,
          detail: fout.detail,
          kind: fout.kind,
        })
        perPartner.set(p.partner_id, lijst)
      }
    } else if (open) {
      await supabase.from('device_alerts').update({ resolved_at: nu }).eq('id', open.id)
      hersteld++
    }
  }

  // --- Koppelingen die er volledig uit liggen ----------------------------
  for (const [sleutel, v] of perKoppeling) {
    const [partnerId, type] = sleutel.split('|')
    const stuk = v.ok === 0 && v.fout > 0

    const { data: open } = await supabase
      .from('device_alerts')
      .select('id')
      .eq('partner_id', partnerId)
      .eq('integration_type', type)
      .is('customer_product_id', null)
      .is('resolved_at', null)
      .maybeSingle()

    if (stuk) {
      const detail = `De koppeling met ${type} werkt niet meer: geen van de ${v.fout} gekoppelde installaties is uit te lezen. Ga naar Instellingen → Monitoring integraties om opnieuw te verbinden. (${v.laatsteFout})`
      if (open) {
        await supabase.from('device_alerts')
          .update({ last_seen_at: nu, detail })
          .eq('id', open.id)
      } else {
        const { data: rij } = await supabase.from('device_alerts').insert({
          partner_id: partnerId,
          integration_type: type,
          kind: 'integration_down',
          detail,
          raw_state: v.laatsteFout.slice(0, 200),
          first_seen_at: nu,
          last_seen_at: nu,
        }).select('id').single()
        nieuw++
        const lijst = perPartner.get(partnerId) || []
        lijst.push({
          alertId: rij?.id,
          customerName: 'Koppeling',
          productName: type,
          detail,
          kind: 'integration_down',
        })
        perPartner.set(partnerId, lijst)
      }
    } else if (open) {
      await supabase.from('device_alerts').update({ resolved_at: nu }).eq('id', open.id)
      hersteld++
    }
  }

  // --- Eén verzamelmail per partner over wat nieuw is ---------------------
  let mails = 0
  for (const [partnerId, items] of perPartner) {
    try {
      const { data: partner } = await supabase
        .from('partners')
        .select('name, slug, primary_color, logo_url, support_email')
        .eq('id', partnerId)
        .single()
      if (!partner?.support_email) continue

      const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
      const mail = buildDeviceAlertDigestEmail({
        alerts: items,
        dashboardUrl: `https://${partner.slug || 'www'}.${baseDomain}/admin`,
        partner: { name: partner.name, primary_color: partner.primary_color, logo_url: partner.logo_url },
      })
      await sendEmail({ to: partner.support_email, subject: mail.subject, html: mail.html })
      await supabase.from('device_alerts')
        .update({ notified_at: nu })
        .in('id', items.map(i => i.alertId).filter(Boolean))
      mails++
    } catch (e: any) {
      console.error('[check-alerts] digest mislukt voor partner', partnerId, e?.message)
    }
  }

  return { checked: gecontroleerd, new_alerts: nieuw, resolved: hersteld, digests_sent: mails }
})
