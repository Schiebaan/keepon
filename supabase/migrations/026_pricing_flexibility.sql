-- Pricing-flexibility: per-klant termijn, jaar-korting, proefperiode + per-module override.
--
-- Eén centrale plek (computeCustomerCharge) leest deze velden om uit te rekenen
-- wat we voor een klant moeten incasseren. Snapshot-vriendelijk: een latere
-- partner-prijswijziging raakt bestaande klanten niet automatisch, want we
-- kijken eerst naar customer_module_prices (override) en pas daarna naar
-- partner_module_configs.

-- --- Per-klant instellingen --------------------------------------------------
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS billing_interval         TEXT          NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'yearly')),
  ADD COLUMN IF NOT EXISTS yearly_discount_months   NUMERIC(4,2)  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS trial_months             INTEGER       NOT NULL DEFAULT 0
    CHECK (trial_months >= 0 AND trial_months <= 60);

-- --- Partner-default (UI komt later; data-laag staat alvast klaar) ----------
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS default_yearly_discount_months NUMERIC(4,2) NOT NULL DEFAULT 0;

-- --- Afwijkende tarieven per klant per module --------------------------------
-- Eén rij = override voor exact één module bij exact één klant. Geen rij =
-- standaardtarief uit partner_module_configs.price_monthly.
CREATE TABLE IF NOT EXISTS customer_module_prices (
  customer_id          UUID         NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  module_type          TEXT         NOT NULL,
  price_monthly_cents  INTEGER      NOT NULL CHECK (price_monthly_cents >= 0),
  reason               TEXT,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  PRIMARY KEY (customer_id, module_type)
);

CREATE INDEX IF NOT EXISTS idx_customer_module_prices_customer
  ON customer_module_prices(customer_id);

-- RLS — klant ziet eigen overrides, partner_admin ziet alle overrides bij
-- klanten van z'n partner.
ALTER TABLE customer_module_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS customer_module_prices_read ON customer_module_prices;
CREATE POLICY customer_module_prices_read ON customer_module_prices
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
    OR customer_id IN (
      SELECT c.id FROM customers c
      JOIN user_roles ur ON ur.partner_id = c.partner_id
      WHERE ur.user_id = auth.uid() AND ur.role IN ('partner_admin', 'platform_admin')
    )
  );

-- Schrijven gaat via service-role endpoints, dus geen INSERT/UPDATE-policy.
