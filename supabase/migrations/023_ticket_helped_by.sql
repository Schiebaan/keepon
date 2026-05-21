-- Lightweight feedback signal: when the customer marks a ticket as solved,
-- they can optionally name the medewerker who helped them. Voornaam is genoeg.
--
-- Stored as plain TEXT on the ticket row — no link to a users-table because the
-- monteur often isn't a registered user yet (could be a subcontractor). The
-- partner gets a simple per-medewerker view "wie wordt het meest genoemd?"
-- without us having to build a review-system.

ALTER TABLE service_tickets
  ADD COLUMN IF NOT EXISTS helped_by_name TEXT;
