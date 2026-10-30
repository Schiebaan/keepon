-- Offline-storingsmail per partner, plus dedup van klantmeldingen.
--
-- Achtergrond: storingen worden gedetecteerd en belanden in device_alerts; de
-- partner krijgt een dagelijkse verzamelmail. Wat ontbreekt is een melding naar
-- de KLANT als zijn installatie offline is (geen data meer), namens de partner.
--
-- Regels (bewust in de data, niet in code verstopt):
--   offline_mail_enabled  schakelaar per partner, STANDAARD UIT. Alleen als dit
--                         aan staat gaat er een klantmail uit.
--   offline_manual        de handleiding "weer online krijgen", per partner.
--                         LEEG/NULL = niet sturen (handleiding volgt van Lex).
--   website_url           "link naar hun site" in de mail. Leeg = val terug op
--                         het klantportaal (custom_domain of slug.upsol.nl).
--
-- customer_notified_at op device_alerts staat los van notified_at (dat is de
-- partner-digest). Zo sturen we hooguit één instructiemail per storing naar de
-- klant, en pas weer een nieuwe bij een nieuwe storing.

ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS offline_mail_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offline_manual text,
  ADD COLUMN IF NOT EXISTS website_url text;

ALTER TABLE public.device_alerts
  ADD COLUMN IF NOT EXISTS customer_notified_at timestamptz;

-- sol_rw heeft al tabelbrede SELECT/INSERT/UPDATE op partners en device_alerts;
-- in PostgreSQL gelden die ook voor nieuwe kolommen, dus geen extra GRANT nodig.
