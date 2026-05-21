-- Replace the `serial_number = 'sundata:companyId/plantId/meterId'` /
-- `easee:chargerId` / `weheat:heatpumpId` hack with proper columns. Keep
-- serial_number for backwards-compat reads, but writes go to the new columns.

ALTER TABLE customer_products
  ADD COLUMN IF NOT EXISTS integration_type TEXT,
  ADD COLUMN IF NOT EXISTS external_id      TEXT,
  ADD COLUMN IF NOT EXISTS linked_at        TIMESTAMPTZ;

-- Backfill: parse `serial_number` prefixes into structured columns.
UPDATE customer_products
SET
  integration_type = CASE
    WHEN serial_number LIKE 'sundata:%' THEN 'sundata'
    WHEN serial_number LIKE 'easee:%'   THEN 'easee'
    WHEN serial_number LIKE 'weheat:%'  THEN 'weheat'
    ELSE NULL
  END,
  external_id = CASE
    WHEN serial_number LIKE 'sundata:%' THEN substring(serial_number FROM length('sundata:') + 1)
    WHEN serial_number LIKE 'easee:%'   THEN substring(serial_number FROM length('easee:') + 1)
    WHEN serial_number LIKE 'weheat:%'  THEN substring(serial_number FROM length('weheat:') + 1)
    ELSE NULL
  END,
  linked_at = COALESCE(linked_at,
    CASE WHEN serial_number LIKE 'sundata:%' OR serial_number LIKE 'easee:%' OR serial_number LIKE 'weheat:%' THEN updated_at ELSE NULL END
  )
WHERE integration_type IS NULL
  AND serial_number IS NOT NULL
  AND (serial_number LIKE 'sundata:%' OR serial_number LIKE 'easee:%' OR serial_number LIKE 'weheat:%');

-- Index for "all linked products for partner X" + module-status colouring on
-- /admin/customers (used by every list-render of the table).
CREATE INDEX IF NOT EXISTS idx_customer_products_partner_integration
  ON customer_products(partner_id, integration_type)
  WHERE integration_type IS NOT NULL;
