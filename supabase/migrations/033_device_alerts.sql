-- Storingen die we zelf detecteren op gekoppelde installaties.
--
-- Tot nu toe werd er niets gedetecteerd: er draaide geen enkele controle, en
-- het bestaande alerts/check-endpoint las uit `subscriptions` — een tabel die
-- leeg is sinds het model naar customer_products verhuisde. Een omvormer die
-- er dagen uit lag zag niemand, tenzij de klant belde.
--
-- Eén rij per installatie, niet per waarneming: een storing die drie dagen
-- duurt is één storing. first_seen_at/last_seen_at leggen de duur vast,
-- resolved_at het herstel. Dat maakt het ook mogelijk om alleen te mailen over
-- wat nieuw is.

CREATE TABLE IF NOT EXISTS device_alerts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id          UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  customer_product_id UUID NOT NULL REFERENCES customer_products(id) ON DELETE CASCADE,

  -- 'error' = de leverancier meldt een storing
  -- 'unreachable' = apparaat niet bereikbaar (stroom of internet weg)
  -- 'stale' = geen meetdata meer terwijl die er wel hoort te zijn
  kind                TEXT NOT NULL CHECK (kind IN ('error', 'unreachable', 'stale')),
  detail              TEXT,
  raw_state           TEXT,

  first_seen_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ,
  -- Wanneer hierover een mail is verstuurd; NULL = nog niet gemeld.
  notified_at         TIMESTAMPTZ,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Eén open storing per installatie. Een tweede detectie werkt de bestaande rij
-- bij in plaats van er een nieuwe naast te zetten.
CREATE UNIQUE INDEX IF NOT EXISTS device_alerts_open_per_product
  ON device_alerts(customer_product_id)
  WHERE resolved_at IS NULL;

CREATE INDEX IF NOT EXISTS device_alerts_partner_open
  ON device_alerts(partner_id, resolved_at, last_seen_at DESC);

ALTER TABLE device_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS device_alerts_partner_read ON device_alerts;
CREATE POLICY device_alerts_partner_read ON device_alerts
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('partner_admin', 'platform_admin')
    )
  );
