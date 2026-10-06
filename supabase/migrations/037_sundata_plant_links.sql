-- Welke Sundata-plant hoort bij welke klant.
--
-- De plants staan al als "light" in Sundata (adres, plant_code en meter zijn er),
-- maar zonder monitored_since haalt Sundata geen data op. Dat zetten we pas op
-- het moment dat de klant akkoord geeft.
--
-- Let op: activeren is onomkeerbaar. Sundata antwoordt op een poging om
-- monitored_since weer leeg te maken met
--   4033 plant_turn_off_monitored_since_not_allowed: "Monitoring can only be turned on"
-- Daarom koppelen we op e-mailadres en activeren we uitsluitend na een akkoord;
-- nooit vooruitlopend en nooit "om te testen".
--
-- Eén klant kan meerdere plants hebben (klant_aantal_installaties > 1); dan
-- worden ze allemaal geactiveerd.

CREATE TABLE IF NOT EXISTS sundata_plant_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,

  -- Het e-mailadres uit de aangeleverde lijst. Hierop matchen we de klant zodra
  -- die akkoord geeft; de klant bestaat op het moment van importeren vaak nog niet.
  email            TEXT NOT NULL,

  sundata_company_id INTEGER NOT NULL DEFAULT 7,
  sundata_plant_id   INTEGER NOT NULL,
  sundata_meter_id   INTEGER,
  plant_code         TEXT,
  plant_name         TEXT,

  -- Gevuld zodra de plant daadwerkelijk op monitored is gezet.
  activated_at     TIMESTAMPTZ,
  -- De klant die het akkoord gaf; pas bekend bij activering.
  customer_id      UUID REFERENCES customers(id) ON DELETE SET NULL,

  source           TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Eén regel per plant per partner.
CREATE UNIQUE INDEX IF NOT EXISTS sundata_plant_links_plant
  ON sundata_plant_links(partner_id, sundata_plant_id);

-- Zoeken op e-mail bij het akkoord; kleine letters, want de lijst is niet
-- consistent in hoofdlettergebruik.
CREATE INDEX IF NOT EXISTS sundata_plant_links_email
  ON sundata_plant_links(partner_id, lower(email));

ALTER TABLE sundata_plant_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS sundata_plant_links_partner_read ON sundata_plant_links;
CREATE POLICY sundata_plant_links_partner_read ON sundata_plant_links
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('partner_admin', 'platform_admin')
    )
  );
