-- Mailing batches: snapshots of who was sent which campaign, partner-scoped.
--
-- A batch is immutable after creation: it records the customers included at
-- export time, the partner who created it, the segment filter used, and an
-- optional Mailchimp tag so the partner can correlate the same audience inside
-- Mailchimp. The CSV with login-tokens is regenerated on demand (tokens are
-- 30-day HMAC, not stored).
--
-- The join table `mailing_batch_customers` makes "what batches was this
-- customer in?" a single indexed query — used by the UI to show a per-row
-- chip ("Laatste batch: 12 dagen geleden") and to warn before re-mailing.

CREATE TABLE IF NOT EXISTS mailing_batches (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id       UUID         NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name             TEXT         NOT NULL,
  description      TEXT,
  customer_count   INTEGER      NOT NULL DEFAULT 0,
  segment_filter   JSONB,
  mailchimp_tag    TEXT,
  created_by       UUID,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mailing_batches_partner_created
  ON mailing_batches(partner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mailing_batch_customers (
  batch_id     UUID NOT NULL REFERENCES mailing_batches(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  PRIMARY KEY (batch_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_mailing_batch_customers_customer
  ON mailing_batch_customers(customer_id);

-- RLS: partner_admins can read their own partner's batches. Inserts/updates go
-- through the service-role API endpoints, so we don't need write policies here.
ALTER TABLE mailing_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailing_batch_customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mailing_batches_partner_read ON mailing_batches;
CREATE POLICY mailing_batches_partner_read ON mailing_batches
  FOR SELECT
  USING (
    partner_id IN (
      SELECT partner_id FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('partner_admin', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS mailing_batch_customers_partner_read ON mailing_batch_customers;
CREATE POLICY mailing_batch_customers_partner_read ON mailing_batch_customers
  FOR SELECT
  USING (
    batch_id IN (
      SELECT id FROM mailing_batches
      WHERE partner_id IN (
        SELECT partner_id FROM user_roles
        WHERE user_id = auth.uid() AND role IN ('partner_admin', 'platform_admin')
      )
    )
  );
