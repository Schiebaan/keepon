-- Customers (end users)
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE RESTRICT,

  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,

  -- Mollie
  mollie_customer_id TEXT,

  -- Address
  street TEXT,
  house_number TEXT,
  postal_code TEXT,
  city TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(email, partner_id)
);

CREATE INDEX idx_customers_partner ON customers(partner_id);
CREATE INDEX idx_customers_auth_user ON customers(auth_user_id);
