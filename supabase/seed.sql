-- Seed module definitions
INSERT INTO module_definitions (type, name, description, icon, integration_type, default_price_monthly, default_price_yearly, sort_order)
VALUES
  ('solar', 'Zonnepanelen monitoring', 'Realtime inzicht in de opbrengst van je zonnepanelen', 'sun', 'sundata', 499, 4990, 1),
  ('heat_pump', 'Warmtepomp monitoring', 'Monitor de status en prestaties van je warmtepomp', 'thermometer', 'weheat', 499, 4990, 2),
  ('ev_charger', 'Laadpaal monitoring', 'Overzicht van laadsessies en energieverbruik', 'zap', 'easee', 499, 4990, 3);

-- Seed a test partner
INSERT INTO partners (name, slug, primary_color, secondary_color, support_email, terms_url)
VALUES (
  'Demo Installateur',
  'demo',
  '#1a56db',
  '#f3f4f6',
  'info@demo-installateur.nl',
  'https://demo-installateur.nl/voorwaarden'
);

-- Link modules to test partner with pricing
INSERT INTO partner_module_configs (partner_id, module_definition_id, is_enabled, price_monthly, price_yearly)
SELECT
  p.id,
  md.id,
  true,
  md.default_price_monthly,
  md.default_price_yearly
FROM partners p
CROSS JOIN module_definitions md
WHERE p.slug = 'demo';
