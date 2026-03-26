-- Seed module definitions
INSERT INTO module_definitions (type, name, description, icon, integration_type, default_price_monthly, default_price_yearly, sort_order)
VALUES
  ('solar', 'Zonnepanelen monitoring', 'Realtime inzicht in de opbrengst van je zonnepanelen', 'sun', 'sundata', 499, 4990, 1),
  ('heat_pump', 'Warmtepomp monitoring', 'Monitor de status en prestaties van je warmtepomp', 'thermometer', 'weheat', 499, 4990, 2),
  ('ev_charger', 'Laadpaal monitoring', 'Overzicht van laadsessies en energieverbruik', 'zap', 'easee', 499, 4990, 3);

-- ============================================================
-- Seed Volt4U as default partner (matches useMockData)
-- ============================================================
INSERT INTO partners (
  name, slug, primary_color, secondary_color,
  support_email, support_phone, terms_url,
  terms_content, terms_placeholders
)
VALUES (
  'Volt4U',
  'volt4u',
  '#f97316',
  '#fff7ed',
  'info@volt4u.nl',
  '085-1234567',
  'https://volt4u.nl/servicevoorwaarden',
  'Servicevoorwaarden {{bedrijfsnaam}}

Laatst bijgewerkt: maart 2026

1. Algemeen

Deze servicevoorwaarden zijn van toepassing op alle servicecontracten afgesloten bij {{bedrijfsnaam}}, gevestigd te {{adres}}, ingeschreven bij de Kamer van Koophandel onder nummer {{kvk}}.

2. Definities

Serviceprovider: {{bedrijfsnaam}}, bereikbaar via {{email}} en {{telefoon}}.
Klant: de natuurlijke persoon die een servicecontract heeft afgesloten.
Installatie: het energiesysteem (zonnepanelen, warmtepomp en/of laadpaal) waarop het servicecontract betrekking heeft.

3. Servicecontract

3.1 Het servicecontract omvat monitoring, storingsanalyse en indien van toepassing proactief onderhoud van de installatie.
3.2 De exacte diensten zijn afhankelijk van het gekozen servicepakket (Start, Slim of Max).
3.3 {{bedrijfsnaam}} spant zich in om storingen binnen de afgesproken termijn te analyseren en op te lossen.

4. Looptijd en opzegging

4.1 Het servicecontract heeft een minimale looptijd zoals vermeld bij het afsluiten van het contract.
4.2 Na afloop van de minimale looptijd is het contract maandelijks opzegbaar met een opzegtermijn van 1 maand.
4.3 Opzegging kan via het klantportaal of per e-mail naar {{email}}.

5. Betaling

5.1 Betaling geschiedt maandelijks via automatische incasso.
5.2 Bij het uitblijven van betaling wordt de klant per e-mail herinnerd.
5.3 Na twee mislukte incasso''s kan {{bedrijfsnaam}} het servicecontract opschorten.

6. Monitoring en data

6.1 {{bedrijfsnaam}} monitort de installatie via het RunON-platform in samenwerking met gespecialiseerde monitoringpartners.
6.2 Klantgegevens worden verwerkt conform de AVG en zijn uitsluitend toegankelijk voor {{bedrijfsnaam}} en de klant zelf.
6.3 Gegevens van klanten van {{bedrijfsnaam}} zijn nooit zichtbaar voor andere installateurs of derden.

7. Aansprakelijkheid

7.1 {{bedrijfsnaam}} is niet aansprakelijk voor schade als gevolg van storingen in de installatie, tenzij sprake is van grove nalatigheid.
7.2 De aansprakelijkheid van {{bedrijfsnaam}} is beperkt tot het bedrag van het servicecontract over de voorafgaande 12 maanden.

8. Wijzigingen

8.1 {{bedrijfsnaam}} behoudt zich het recht voor deze voorwaarden te wijzigen. Klanten worden hiervan minimaal 30 dagen van tevoren per e-mail op de hoogte gesteld.
8.2 Bij ingrijpende wijzigingen heeft de klant het recht het contract kosteloos op te zeggen.

9. Contact

Voor vragen over deze voorwaarden kunt u contact opnemen met:
{{bedrijfsnaam}}
{{adres}}
{{email}}
{{telefoon}}
KvK: {{kvk}}',
  '{"bedrijfsnaam": "Volt4U B.V.", "kvk": "12345678", "adres": "Energieweg 10, 3011 AB Rotterdam", "email": "info@volt4u.nl", "telefoon": "088-DEMO123"}'::jsonb
);

-- Keep legacy demo partner for backward compat
INSERT INTO partners (name, slug, primary_color, secondary_color, support_email, terms_url)
VALUES (
  'Demo Installateur',
  'demo',
  '#1a56db',
  '#f3f4f6',
  'info@demo-installateur.nl',
  'https://demo-installateur.nl/voorwaarden'
);

-- Link modules to Volt4U with default pricing and 12-month contract
INSERT INTO partner_module_configs (partner_id, module_definition_id, is_enabled, price_monthly, price_yearly, min_contract_months)
SELECT
  p.id,
  md.id,
  true,
  md.default_price_monthly,
  md.default_price_yearly,
  12
FROM partners p
CROSS JOIN module_definitions md
WHERE p.slug = 'volt4u';

-- Link modules to demo partner with default pricing
INSERT INTO partner_module_configs (partner_id, module_definition_id, is_enabled, price_monthly, price_yearly, min_contract_months)
SELECT
  p.id,
  md.id,
  true,
  md.default_price_monthly,
  md.default_price_yearly,
  12
FROM partners p
CROSS JOIN module_definitions md
WHERE p.slug = 'demo';
