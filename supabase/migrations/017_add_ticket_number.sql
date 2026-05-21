-- Human-friendly ticket numbers, per-partner sequence.
--
-- We keep the UUID `id` as the immutable primary key (used in URLs, audit logs,
-- email links) and add `ticket_number` as a SHORT, per-partner counter that we
-- show to the customer and the installer (e.g. "T-007").
--
-- A trigger atomically picks the next number for the row's partner_id at
-- INSERT time, so concurrent inserts can't collide.

ALTER TABLE service_tickets
  ADD COLUMN IF NOT EXISTS ticket_number INTEGER;

-- Backfill existing rows: number them by created_at within each partner.
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY partner_id ORDER BY created_at, id) AS rn
  FROM service_tickets
  WHERE ticket_number IS NULL
)
UPDATE service_tickets st
SET ticket_number = ranked.rn
FROM ranked
WHERE st.id = ranked.id;

-- Trigger to assign the next number per partner on insert.
CREATE OR REPLACE FUNCTION assign_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    -- Lock the partner's existing rows so two concurrent inserts can't grab
    -- the same number. SELECT ... FOR UPDATE is sufficient because the read
    -- is followed by an insert in the same transaction.
    SELECT COALESCE(MAX(ticket_number), 0) + 1
    INTO NEW.ticket_number
    FROM service_tickets
    WHERE partner_id = NEW.partner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assign_ticket_number ON service_tickets;
CREATE TRIGGER trg_assign_ticket_number
  BEFORE INSERT ON service_tickets
  FOR EACH ROW
  EXECUTE FUNCTION assign_ticket_number();

-- After backfill, enforce NOT NULL + uniqueness within a partner.
ALTER TABLE service_tickets
  ALTER COLUMN ticket_number SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS service_tickets_partner_ticket_number_key
  ON service_tickets(partner_id, ticket_number);
