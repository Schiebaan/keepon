-- Kennisbank opsplitsen naar publiek.
--
-- Tot nu toe was support_articles één verzameling: handleidingen voor de
-- installateur, zichtbaar op /support. Voor de AI-servicechat is er een tweede
-- soort nodig — storingsartikelen gericht op de eindklant ("je omvormer
-- knippert rood", "je warmtepomp maakt een tikkend geluid"). Die horen niet
-- tussen de partner-handleidingen te staan.
--
-- Eén tabel met een audience-kolom in plaats van een tweede tabel: dezelfde
-- editor, dezelfde seed-pipeline, dezelfde zoekfunctie.

ALTER TABLE support_articles
  ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'partner';

ALTER TABLE support_articles
  DROP CONSTRAINT IF EXISTS support_articles_audience_check;
ALTER TABLE support_articles
  ADD CONSTRAINT support_articles_audience_check
  CHECK (audience IN ('partner', 'customer'));

-- Symptomen waarop de assistent een artikel terugvindt. Los van `tags`, dat
-- voor de menselijke navigatie op /support wordt gebruikt.
ALTER TABLE support_articles
  ADD COLUMN IF NOT EXISTS symptoms TEXT[] NOT NULL DEFAULT '{}';

-- Waar het artikel over gaat: solar_panel, heat_pump, ev_charger, battery,
-- of NULL voor algemeen (facturen, afspraken, contract).
ALTER TABLE support_articles
  ADD COLUMN IF NOT EXISTS module_type TEXT;

CREATE INDEX IF NOT EXISTS idx_support_articles_audience
  ON support_articles(audience, module_type);

-- Bestaande artikelen zijn allemaal partner-handleidingen; de default dekt dat
-- al, maar expliciet is beter dan impliciet bij een herhaalde migratie.
UPDATE support_articles SET audience = 'partner' WHERE audience IS NULL;
