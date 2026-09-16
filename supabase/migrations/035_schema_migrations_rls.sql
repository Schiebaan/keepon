-- schema_migrations afschermen van de publieke API.
--
-- Deze tabel is aangemaakt door scripts/migrate.mjs, in `public`, zonder RLS.
-- Supabase geeft anon en authenticated standaard volledige rechten op nieuwe
-- tabellen in public, dus via PostgREST kon iedereen met de anon-sleutel — die
-- publiek in de frontend staat — de tabel lezen én rijen toevoegen of wissen.
--
-- Wissen laat de runner een migratie opnieuw uitvoeren (015 herschrijft
-- RLS-policies, 027 wist PII); toevoegen laat een toekomstige migratie stil
-- overslaan. Geverifieerd: beide lukten met de anon-sleutel.
--
-- RLS aan zonder policies = geen toegang voor API-rollen. De runner verbindt als
-- `postgres`, eigenaar van de tabel, en valt daar niet onder (RLS is niet
-- FORCED). De REVOKE is een tweede slot, voor het geval er ooit een policy bij
-- komt.

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.schema_migrations FROM anon, authenticated;
