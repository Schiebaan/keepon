-- Afleverstatus van uitgaande mail, overgenomen uit Resend.
--
-- Resend houdt per mail de laatste gebeurtenis bij (afgeleverd, geweigerd,
-- geopend, geklikt). We halen die periodiek op via GET /emails, zodat een
-- installateur in UPsol ziet of zijn uitnodiging is aangekomen zonder in te
-- loggen bij Resend. Er is geen webhook nodig.
--
-- Eén rij per Resend-mail. De koppeling met de klant loopt via het adres:
-- het Resend-account is gedeeld, dus het endpoint filtert altijd op de
-- e-mailadressen van de klanten van de eigen partner.

CREATE TABLE IF NOT EXISTS email_status (
  resend_id   TEXT PRIMARY KEY,
  to_email    TEXT NOT NULL,
  subject     TEXT,
  last_event  TEXT,
  sent_at     TIMESTAMPTZ NOT NULL,
  synced_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_status_to_idx ON email_status (lower(to_email), sent_at DESC);

-- Alleen de service-role leest en schrijft; geen policies voor anon/authenticated.
ALTER TABLE email_status ENABLE ROW LEVEL SECURITY;
