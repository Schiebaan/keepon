-- Houdt bij welke incasso-reminders al per klant verstuurd zijn.
--
-- We willen idempotente cron-runs: als de daily job twee keer per ongeluk
-- draait of als de mail-provider faalt en we opnieuw moeten draaien, mag
-- één klant niet plotseling drie reminders op één dag krijgen.
--
-- Gebruik JSONB i.p.v. een aparte tabel: er zijn maximaal ~3 entries per
-- klant en we hoeven er niet across-klanten op te joinen. Format:
--   [{ "kind": "confirm" | "day3" | "day10", "at": "2026-05-21T10:00:00Z" }]

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS mandate_reminders_sent JSONB NOT NULL DEFAULT '[]'::jsonb;
