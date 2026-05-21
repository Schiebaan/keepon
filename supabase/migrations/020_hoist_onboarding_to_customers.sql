-- Hoist onboarding state from auth.user_metadata.onboarding onto the customers
-- table. The original design stored it on auth.users.raw_user_meta_data which
-- meant /admin/customers had to make one supabase.auth.admin.getUserById() call
-- per row to read it back — an N+1 that dominated the list page's latency
-- (~30-100 ms per call × N customers).
--
-- With the data on `customers`, GET /api/customers becomes a single SELECT.
--
-- We keep writing the same fields to user_metadata as well (in the API
-- endpoints) so the middleware — which reads from the Supabase user-ref — keeps
-- working without an extra fetch.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS onboarding_step  TEXT       DEFAULT 'hero',
  ADD COLUMN IF NOT EXISTS accepted_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_modules TEXT[],
  ADD COLUMN IF NOT EXISTS mandate_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mandate_skipped  BOOLEAN    DEFAULT FALSE;

-- One-time backfill from auth.users.raw_user_meta_data.onboarding
UPDATE customers c SET
  onboarding_step  = COALESCE(u.raw_user_meta_data->'onboarding'->>'step', c.onboarding_step, 'hero'),
  accepted_at      = NULLIF(u.raw_user_meta_data->'onboarding'->>'accepted_at', '')::timestamptz,
  mandate_at       = NULLIF(u.raw_user_meta_data->'onboarding'->>'mandate_at', '')::timestamptz,
  mandate_skipped  = COALESCE((u.raw_user_meta_data->'onboarding'->>'mandate_skipped')::boolean, FALSE),
  accepted_modules = CASE
    WHEN jsonb_typeof(u.raw_user_meta_data->'onboarding'->'accepted_modules') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements_text(u.raw_user_meta_data->'onboarding'->'accepted_modules'))
    ELSE NULL
  END
FROM auth.users u
WHERE c.auth_user_id = u.id;

-- Index used by /admin/uitnodigingen ("not yet accepted") and /admin/customers
-- ("accepted only") filters.
CREATE INDEX IF NOT EXISTS idx_customers_partner_accepted
  ON customers(partner_id, accepted_at);
