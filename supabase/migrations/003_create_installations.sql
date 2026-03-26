-- Installations (physical locations/systems)
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id),

  name TEXT NOT NULL,
  address_street TEXT,
  address_house_number TEXT,
  address_postal_code TEXT,
  address_city TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_installations_customer ON installations(customer_id);
CREATE INDEX idx_installations_partner ON installations(partner_id);
