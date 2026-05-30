-- Ticketlabels — interne workflow-tags op service_tickets, per partner beheerd.
--
-- Twee tabellen:
--   ticket_labels         = de catalogus (partner kiest namen + kleuren)
--   service_ticket_labels = join (welke labels hangen aan welk ticket)
--
-- Labels zijn admin-intern: ze verschijnen NIET op het klantportaal. "RMA
-- onderweg" is werkstroom-info voor de installateur, niet voor de klant.

CREATE TABLE IF NOT EXISTS ticket_labels (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID        NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  -- Kleur-token (gray|blue|green|amber|orange|red|purple|sky|pink|teal).
  -- De UI mapt dit naar Tailwind-klassen — geen losse hexes in de DB.
  color       TEXT        NOT NULL DEFAULT 'gray',
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  is_active   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (partner_id, name)
);

CREATE INDEX IF NOT EXISTS idx_ticket_labels_partner
  ON ticket_labels(partner_id, sort_order);

CREATE TABLE IF NOT EXISTS service_ticket_labels (
  ticket_id UUID NOT NULL REFERENCES service_tickets(id) ON DELETE CASCADE,
  label_id  UUID NOT NULL REFERENCES ticket_labels(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (ticket_id, label_id)
);

CREATE INDEX IF NOT EXISTS idx_service_ticket_labels_label
  ON service_ticket_labels(label_id);

-- --- Seed: 7 default labels per bestaande partner -------------------------
INSERT INTO ticket_labels (partner_id, name, color, sort_order)
SELECT p.id, x.name, x.color, x.sort_order
FROM partners p
CROSS JOIN (VALUES
  ('Controle op werking',             'blue',   1),
  ('Wacht op antwoord klant',         'amber',  2),
  ('Wacht op antwoord leverancier',   'orange', 3),
  ('Offerte gestuurd',                'purple', 4),
  ('Servicebon gemaakt',              'green',  5),
  ('RMA onderweg',                    'red',    6),
  ('Informatie raadplegen/uitzoeken', 'gray',   7)
) AS x(name, color, sort_order)
ON CONFLICT (partner_id, name) DO NOTHING;

-- --- RLS -------------------------------------------------------------------
ALTER TABLE ticket_labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_ticket_labels ENABLE ROW LEVEL SECURITY;

-- Partner-admins lezen de labels van hun eigen partner. Schrijven gaat via
-- service-role endpoints, dus geen write-policy nodig.
DROP POLICY IF EXISTS ticket_labels_partner_read ON ticket_labels;
CREATE POLICY ticket_labels_partner_read ON ticket_labels
  FOR SELECT USING (
    partner_id IN (
      SELECT partner_id FROM user_roles
      WHERE user_id = auth.uid() AND role IN ('partner_admin', 'platform_admin')
    )
  );

DROP POLICY IF EXISTS service_ticket_labels_partner_read ON service_ticket_labels;
CREATE POLICY service_ticket_labels_partner_read ON service_ticket_labels
  FOR SELECT USING (
    ticket_id IN (
      SELECT st.id FROM service_tickets st
      JOIN user_roles ur ON ur.partner_id = st.partner_id
      WHERE ur.user_id = auth.uid() AND ur.role IN ('partner_admin', 'platform_admin')
    )
  );
