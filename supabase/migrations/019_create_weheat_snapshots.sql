-- Daily-ish snapshots of Weheat lifetime totals per heat pump.
--
-- Weheat's third-party API does NOT expose daily/monthly/weekly time-series
-- endpoints (the per-period routes return 403). To build our own history we
-- snapshot the running totals on each customer-portal visit, no more than
-- once per heat pump per ~12 hours.
--
-- Differences between snapshots = consumption + production in that interval,
-- which lets us chart "deze week / deze maand" over time even without API
-- support.

CREATE TABLE IF NOT EXISTS weheat_snapshots (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID         NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  heatpump_id     TEXT         NOT NULL,
  taken_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  -- Totals (sums across all use-cases)
  e_in_total      NUMERIC,
  e_out_total     NUMERIC,

  -- Breakdown by use-case (kWh in)
  e_in_heating    NUMERIC,
  e_in_standby    NUMERIC,
  e_in_dhw        NUMERIC,
  e_in_defrost    NUMERIC,
  e_in_cooling    NUMERIC,

  -- Breakdown by use-case (kWh out)
  e_out_heating   NUMERIC,
  e_out_dhw       NUMERIC,
  e_out_defrost   NUMERIC,
  e_out_cooling   NUMERIC
);

CREATE INDEX IF NOT EXISTS idx_weheat_snapshots_pump_time
  ON weheat_snapshots(heatpump_id, taken_at DESC);

CREATE INDEX IF NOT EXISTS idx_weheat_snapshots_partner_time
  ON weheat_snapshots(partner_id, taken_at DESC);

-- All writes happen via the service-role API endpoint. Customers shouldn't
-- read it directly either (we expose aggregates only).
ALTER TABLE weheat_snapshots ENABLE ROW LEVEL SECURITY;
