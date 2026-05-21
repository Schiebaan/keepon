-- Payments + Mollie linkage for the booking-model setup.
--
-- UPsol is the merchant-of-record: customers pay UPsol (via Mollie), UPsol
-- pays partners separately. So `mollie_customer_id` / `mollie_mandate_id`
-- live on the customers row; there is no per-partner Mollie account.

-- Mollie references on customer
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS mollie_mandate_id TEXT;

-- (`mollie_customer_id` already exists on the customers table per the original schema.)

-- Payments table — one row per Mollie payment. Mirrors the data we care about
-- so we can render the admin overview without round-tripping to Mollie.
CREATE TABLE IF NOT EXISTS payments (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      UUID         NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,
  customer_id    UUID         NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,

  -- Mollie identifiers
  mollie_payment_id TEXT       NOT NULL UNIQUE,
  mollie_mandate_id TEXT,
  mollie_method     TEXT,

  -- Money
  amount_cents    INTEGER      NOT NULL,
  currency        TEXT         NOT NULL DEFAULT 'EUR',
  description     TEXT,

  -- Status — mirrors Mollie's enum (open, pending, authorized, paid, failed,
  -- canceled, expired, chargeback)
  status          TEXT         NOT NULL DEFAULT 'open',

  -- Timestamps
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  paid_at         TIMESTAMPTZ,
  failed_at       TIMESTAMPTZ,
  refunded_at     TIMESTAMPTZ,
  charged_back_at TIMESTAMPTZ,

  -- Period this payment was for (e.g. service-month covered) — optional
  period_start    DATE,
  period_end      DATE,

  -- Full Mollie payload at last webhook for debug / audit
  raw             JSONB
);

CREATE INDEX IF NOT EXISTS idx_payments_partner_created
  ON payments(partner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_customer_created
  ON payments(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_status
  ON payments(status)
  WHERE status IN ('open', 'pending', 'failed');

-- RLS — partner_admin sees their own partner's payments, customer sees their own
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS payments_partner_read ON payments;
CREATE POLICY payments_partner_read ON payments
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('partner_admin', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS payments_customer_read ON payments;
CREATE POLICY payments_customer_read ON payments
  FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth_user_id = auth.uid()
    )
  );
