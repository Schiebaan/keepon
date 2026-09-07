-- Storingen op het niveau van de koppeling, niet van één apparaat.
--
-- Aanleiding: de Weheat-koppeling bleek 59 dagen stuk te staan (token verlopen
-- op 10 juli, vernieuwing loopt vast op een gewijzigd inlogformulier). Vijf
-- klanten zagen al die tijd geen data, en niemand wist het.
--
-- De storingscontrole slaat een apparaat bewust over als de leverancier niet
-- antwoordt — anders krijg je bij elke API-storing een lawine aan valse
-- meldingen bij klanten die niets mankeren. Maar dan valt het geval "de hele
-- koppeling ligt eruit" juist tussen wal en schip. Dat is precies het geval
-- dat je wél wil weten, en het is er één, geen vijf.

ALTER TABLE device_alerts
  ALTER COLUMN customer_product_id DROP NOT NULL;
ALTER TABLE device_alerts
  ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE device_alerts
  ADD COLUMN IF NOT EXISTS integration_type TEXT;

ALTER TABLE device_alerts
  DROP CONSTRAINT IF EXISTS device_alerts_kind_check;
ALTER TABLE device_alerts
  ADD CONSTRAINT device_alerts_kind_check
  CHECK (kind IN ('error', 'unreachable', 'stale', 'integration_down'));

-- Eén open melding per partner per koppeling.
CREATE UNIQUE INDEX IF NOT EXISTS device_alerts_open_per_integration
  ON device_alerts(partner_id, integration_type)
  WHERE resolved_at IS NULL AND customer_product_id IS NULL;
