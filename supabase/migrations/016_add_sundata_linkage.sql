-- Link a customer_product to its Sundata plant + meter so we can reuse/retry
-- creation without spawning duplicate plants on each attempt.

ALTER TABLE customer_products
  ADD COLUMN IF NOT EXISTS sundata_company_id INTEGER,
  ADD COLUMN IF NOT EXISTS sundata_plant_id INTEGER,
  ADD COLUMN IF NOT EXISTS sundata_meter_id INTEGER,
  ADD COLUMN IF NOT EXISTS sundata_status TEXT
    CHECK (sundata_status IN ('pending', 'plant_created', 'connected', 'error') OR sundata_status IS NULL);

CREATE INDEX IF NOT EXISTS idx_customer_products_sundata_plant
  ON customer_products(sundata_plant_id)
  WHERE sundata_plant_id IS NOT NULL;
