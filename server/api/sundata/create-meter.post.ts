import {
  SUNDATA_BASE_URL,
  resolvePartnerId,
  sundataSession,
  parseSundataError,
} from '~~/server/utils/sundata'
import { getServiceRoleClient } from '~~/server/utils/supabase'
import { sendEmail, buildInstallationConnectedEmail } from '~~/server/utils/email'

const ORIENTATION_DEGREES: Record<string, number> = {
  'north': 0, 'north-east': 45, 'east': 90, 'south-east': 135,
  'south': 180, 'south-west': 225, 'west': 270, 'north-west': 315,
}

/**
 * Create (or retry creating) a meter on an existing Sundata plant.
 * This is called separately from create-plant so we don't spin up a new plant
 * every time the user fixes a typo in their credentials and retries.
 */
export default defineEventHandler(async (event) => {
  const { user } = await requireRole(event, 'partner_admin')
  const body = await readBody(event)

  const {
    customer_id,
    plant_id,
    driver_id,                  // Sundata driver_name, e.g. "solaredge"
    composition_alias,          // e.g. "solaredge_default"
    driver_credentials,         // { siteId: "...", apiKey: "..." }
    capacity_kwp,
    orientation,
    tilt,
  } = body

  if (!plant_id || !driver_id || !composition_alias || !driver_credentials) {
    throw createError({
      statusCode: 400,
      message: 'plant_id, driver_id, composition_alias en driver_credentials zijn verplicht',
    })
  }

  const partnerId = await resolvePartnerId(event, user.id)
  const { headers, companyId } = await sundataSession(event, partnerId)

  // Find driver account (to get the driver_account_name)
  const driverAccounts = await $fetch<any[]>(`${SUNDATA_BASE_URL}/companies/${companyId}/driver-accounts`, { headers })
  const driverAccount = driverAccounts.find(d => d.driver_name === driver_id)
  if (!driverAccount) {
    throw createError({ statusCode: 400, message: `Merk "${driver_id}" is niet actief in jullie Sundata account` })
  }

  const peak_in_watt = capacity_kwp ? Math.round(capacity_kwp * 1000) : undefined
  const orientation_deg = orientation ? ORIENTATION_DEGREES[orientation] ?? undefined : undefined
  const angle_deg = tilt ? parseFloat(String(tilt)) : undefined

  const meterBody: any = {
    driver_name: driver_id,
    driver_account_name: driverAccount.name,
    credential_composition_alias: composition_alias,
    credential_fields: driver_credentials,
    peak_in_watt,
    orientation_in_degrees: orientation_deg,
    angle_in_degrees: angle_deg,
  }

  // Helper: after the meter exists, attach a panel_group with peak/azimuth/tilt.
  // Sundata's API expects a wrapped body `{ panel_groups: [{...}] }` here — unwrapped
  // payloads (both single and array) return 500. We also skip if the meter already has
  // a panel_group to avoid duplicates on retry.
  async function ensurePanelGroup(meterId: number) {
    if (!peak_in_watt && orientation_deg === undefined && angle_deg === undefined) return
    try {
      const meterDetail = await $fetch<any>(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plant_id}/meters/${meterId}`,
        { headers },
      )
      if ((meterDetail?.panel_groups || []).length > 0) return
      await $fetch(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plant_id}/meters/${meterId}/panel-groups`,
        {
          method: 'POST',
          headers,
          body: {
            panel_groups: [{
              peak_in_watt,
              azimuth_in_degrees: orientation_deg,
              tilt_in_degrees: angle_deg,
            }],
          },
        },
      )
    } catch {
      // Non-fatal: meter is usable even if panel-group attach fails.
    }
  }

  // Idempotency: if the plant already has a meter for this driver_account, reuse it.
  // Sundata sometimes returns 500 Server Error AFTER actually creating the meter, which
  // confuses the wizard — checking first (and again after a failed create) fixes this.
  const checkExistingMeter = async () => {
    try {
      const existing = await $fetch<any>(
        `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plant_id}/meters`,
        { headers },
      )
      const list: any[] = Array.isArray(existing) ? existing : (existing?.data || [])
      return list.find(m => m.driver_account_id === driverAccount.id && !m.retired_on) || null
    } catch {
      return null
    }
  }

  const existingBeforeCreate = await checkExistingMeter()
  if (existingBeforeCreate) {
    // Still make sure the panel group is present for this meter
    await ensurePanelGroup(existingBeforeCreate.id)
    return {
      success: true,
      reused: true,
      plant_id,
      meter_id: existingBeforeCreate.id,
      company_id: companyId,
      device_id: `${companyId}:${plant_id}`,
      status: 'pending',
    }
  }

  let meter: any = null
  let createError: any = null
  try {
    meter = await $fetch<any>(
      `${SUNDATA_BASE_URL}/companies/${companyId}/plants/${plant_id}/meters`,
      { method: 'POST', headers, body: meterBody },
    )
  } catch (err: any) {
    createError = err
  }

  // If we got an error but the meter was actually created (Sundata quirk), accept it
  if (!meter) {
    const afterFailure = await checkExistingMeter()
    if (afterFailure) {
      meter = afterFailure
    }
  }

  if (!meter) {
    // Truly failed — return structured error so wizard can retry on the same plant
    return {
      success: false,
      step: 'meter',
      plant_id,
      company_id: companyId,
      error: parseSundataError(createError, 'Meter koppelen mislukt'),
    }
  }

  // Attach panel group with peak/azimuth/tilt (Sundata doesn't apply these from the
  // initial meter POST — they need a separate panel-groups call)
  await ensurePanelGroup(meter.id)

  // Persist the Sundata linkage on the customer's most-recent solar_panel product so the admin
  // UI can show a "✓ Connected" state. We reuse the serial_number field (empty for solar)
  // with a 'sundata:{company}/{plant}/{meter}' prefix to avoid a schema migration.
  let isFirstLink = false // used below to decide if we should email the customer
  if (customer_id) {
    try {
      const supabase = getServiceRoleClient(event)
      const { data: solarProducts } = await supabase
        .from('customer_products')
        .select('id, serial_number, integration_type')
        .eq('customer_id', customer_id)
        .eq('category', 'solar_panel')
        .order('created_at', { ascending: false })
        .limit(1)
      const solar = solarProducts?.[0]
      if (solar) {
        const externalId = `${companyId}/${plant_id}/${meter.id}`
        const linkId = `sundata:${externalId}`
        // First-time link means the product had no prior sundata marker
        isFirstLink = !solar.integration_type && !(solar.serial_number || '').startsWith('sundata:')
        if (solar.serial_number !== linkId || solar.integration_type !== 'sundata') {
          await supabase
            .from('customer_products')
            .update({
              integration_type: 'sundata',
              external_id: externalId,
              linked_at: new Date().toISOString(),
              serial_number: linkId,    // legacy field, kept for backwards compat
            })
            .eq('id', solar.id)
        }
      }
    } catch {
      // Non-fatal: wizard still succeeded even if we couldn't persist the link locally
    }

    await auditLog(event, 'sundata.meter_created', 'customer', customer_id, {
      plant_id,
      meter_id: meter.id,
      driver_id,
      composition_alias,
      company_id: companyId,
      recovered_from_500: !!createError,
      first_link: isFirstLink,
    })

    // --- Notify customer (one-shot, only on first-ever link) ---
    if (isFirstLink) {
      try {
        const supabase = getServiceRoleClient(event)
        const { data: customer } = await supabase
          .from('customers')
          .select('email, full_name, partner_id')
          .eq('id', customer_id)
          .single()

        if (customer?.email) {
          const { data: partner } = await supabase
            .from('partners')
            .select('name, slug, primary_color, logo_url, support_email')
            .eq('id', customer.partner_id)
            .single()

          const baseDomain = process.env.NUXT_PUBLIC_BASE_DOMAIN || 'upsol.nl'
          const dashboardUrl = `https://${partner?.slug || 'www'}.${baseDomain}/klant/zonnepanelen`

          const label = capacity_kwp
            ? `Zonnepanelen — ${Number(capacity_kwp).toFixed(1).replace('.', ',')} kWp`
            : 'Zonnepanelen'

          const email = buildInstallationConnectedEmail({
            customerName: customer.full_name || customer.email,
            installationLabel: label,
            dashboardUrl,
            partner: partner ? {
              name: partner.name,
              primary_color: partner.primary_color,
              logo_url: partner.logo_url,
              support_email: partner.support_email,
            } : undefined,
          })

          await sendEmail({
            to: customer.email,
            subject: email.subject,
            html: email.html,
            // Geen replyTo — replies horen niet in de partner-inbox.
          })

          await auditLog(event, 'email.installation_connected_sent', 'customer', customer_id, {
            to: customer.email,
            module: 'solar',
          })
        }
      } catch (e: any) {
        console.error('[sundata] Failed to send installation-connected email:', e?.message || e)
      }
    }
  }

  return {
    success: true,
    plant_id,
    meter_id: meter.id,
    company_id: companyId,
    device_id: `${companyId}:${plant_id}`,
    status: 'pending',
    recovered_from_500: !!createError,
  }
})
