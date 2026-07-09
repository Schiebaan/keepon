-- Support kennisbank — publiek leesbare artikelen op /support, beheerd door
-- platform-admins (UPsol) en niet door partners. Content in markdown, full-
-- text-search via PostgreSQL's tsvector (Nederlandse taal).

CREATE TABLE IF NOT EXISTS support_articles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT        NOT NULL UNIQUE,          -- URL: /support/<slug>
  title        TEXT        NOT NULL,
  excerpt      TEXT,                                 -- Korte samenvatting voor lijst-view + SEO
  body_md      TEXT        NOT NULL,                 -- Markdown-inhoud
  category     TEXT,                                 -- bv 'Aan de slag', 'Onboarding', 'Betalingen'
  tags         TEXT[]      DEFAULT '{}'::text[],
  sort_order   INTEGER     NOT NULL DEFAULT 100,     -- Lager = hoger in de lijst
  published_at TIMESTAMPTZ,                          -- NULL = concept, niet publiek
  author_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  view_count   INTEGER     NOT NULL DEFAULT 0,       -- Voor future "populaire artikelen"
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_articles_published
  ON support_articles(published_at DESC NULLS LAST)
  WHERE published_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_support_articles_category
  ON support_articles(category, sort_order);

-- --- Full-text search index -----------------------------------------------
-- We indexeren title (weight A), excerpt (B), body_md (C). Zoeken via
-- `to_tsquery('dutch', ...)`. Simple/english fallback is niet nodig — een
-- match op title alleen is al genoeg dankzij de weights.
CREATE INDEX IF NOT EXISTS idx_support_articles_fts
  ON support_articles USING GIN (
    (
      setweight(to_tsvector('dutch', coalesce(title,   '')), 'A') ||
      setweight(to_tsvector('dutch', coalesce(excerpt, '')), 'B') ||
      setweight(to_tsvector('dutch', coalesce(body_md, '')), 'C')
    )
  );

-- --- RLS --------------------------------------------------------------------
-- Publieke lees-toegang op alleen gepubliceerde artikelen; schrijven gaat
-- via service-role endpoints, dus geen write-policy nodig.
ALTER TABLE support_articles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_articles_public_read ON support_articles;
CREATE POLICY support_articles_public_read ON support_articles
  FOR SELECT USING (published_at IS NOT NULL);

-- Platform-admins zien ook concepten (voor de admin-UI)
DROP POLICY IF EXISTS support_articles_admin_read ON support_articles;
CREATE POLICY support_articles_admin_read ON support_articles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );

-- --- Trigger: updated_at auto-updaten --------------------------------------
CREATE OR REPLACE FUNCTION support_articles_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_articles_updated_at ON support_articles;
CREATE TRIGGER trg_support_articles_updated_at
  BEFORE UPDATE ON support_articles
  FOR EACH ROW EXECUTE FUNCTION support_articles_set_updated_at();

-- --- Seed: eerste artikel (starthandleiding) -------------------------------
INSERT INTO support_articles (slug, title, excerpt, category, sort_order, body_md, published_at)
VALUES (
  'starthandleiding',
  'Starthandleiding: hoe UPsol werkt',
  'De basis: hoe UPsol jou als installateur helpt om klanten een strak service-portaal te bieden, en welke stappen je zelf zet om ermee te beginnen.',
  'Aan de slag',
  1,
  E'## Waar UPsol voor bedoeld is\n\nUPsol geeft je als installateur een gebrand klantportaal. Je klant ziet daarin z\'\'n zonnepanelen, warmtepomp en laadpaal, kan tickets aanmaken en betaalt maandelijks een servicecontract dat jij bepaalt.\n\nJij ziet aan de andere kant het admin-portaal: klantenlijst, tickets, betalingen en instellingen.\n\n## De flow in 5 stappen\n\n**1. Je zet je merk in.** Ga naar Instellingen → upload je logo, kies je primaire kleur en zet je contactgegevens. Alles wat je klant ziet krijgt jouw look.\n\n**2. Je nodigt een klant uit.** Op Uitnodigingen klik je "Klant uitnodigen". Vul naam en e-mail in en **kies minstens één module** (zonnepanelen, warmtepomp of laadpaal). De klant krijgt een welkomstmail met een inlog-link.\n\n**3. De klant activeert het portaal.** Via de mail komt de klant op /welkom en ziet je voorstel: welke modules met welke prijs. Ze geven akkoord op de servicevoorwaarden en het contract.\n\n**4. Incasso wordt ingesteld.** Direct na akkoord vult de klant z\'\'n IBAN in. Er wordt een SEPA-mandaat aangemaakt bij Mollie zodat je iedere maand automatisch kunt incasseren. Als de klant "later" kiest, sturen we automatisch reminders na 3 en 10 dagen.\n\n**5. Jij monitort + reageert op tickets.** Via Klanten zie je de portefeuille, via Service komen de meldingen binnen. Je koppelt monitoring aan modules (Sundata voor zon, Weheat voor warmtepomp, Easee voor laden) zodat de klant realtime data ziet.\n\n## De visie: strak, transparant, geen ruis\n\n- **De klant krijgt één plek**, met jouw logo. Geen 4 apps voor 4 apparaten.\n- **Jij bent het merk**, wij zijn onzichtbaar. Zowel in het portaal als in de e-mails.\n- **Incasso is voorspelbaar**. Vaste maandbedragen of jaarbetaling met korting — geen gedoe met losse factuurtjes.\n- **Service loopt via het portaal**. Klant meldt via /service, jouw team reageert vanuit het admin — niet via losse mail-heen-en-weer.\n\n## Wat NIET de bedoeling is\n\n- **Klanten zonder modules aanmaken** — dan hebben ze niks te activeren in het portaal en wordt de welkomstmail een dood spoor. Vandaar dat we sinds kort minstens één module verplicht maken bij uitnodigen.\n- **Klanten zelf laten kiezen welke modules ze hebben** — dat leidt tot chaos (klant koppelt een laadpaal van een ander merk). Jij als installateur weet wat er ligt.\n- **Reageren op ticket-mails vanuit je eigen mailbox** — die worden niet automatisch in het ticket opgenomen. Gebruik altijd het portaal.\n\n## Waar vind ik wat?\n\n- **Overzicht van je portefeuille** → Klanten\n- **Nieuwe uitnodigingen versturen** → Uitnodigingen\n- **Openstaande tickets** → Service\n- **Betalingen bekijken** → Payments\n- **Instellingen (branding, tarieven, tickets)** → Instellingen\n\nVragen? Mail support@upsol.nl of gebruik het chat-icoontje rechtsonder.',
  NOW()
)
ON CONFLICT (slug) DO NOTHING;
