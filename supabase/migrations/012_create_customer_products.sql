-- 012: Customer products (dossier)
CREATE TABLE customer_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id),
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  category TEXT NOT NULL CHECK (category IN ('solar_panel', 'inverter', 'heat_pump', 'ev_charger', 'battery', 'other')),
  serial_number TEXT,
  installation_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_products_customer ON customer_products(customer_id);
CREATE INDEX idx_customer_products_partner ON customer_products(partner_id);

-- Trigger for updated_at
CREATE TRIGGER set_updated_at_customer_products
  BEFORE UPDATE ON customer_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE customer_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers read own products" ON customer_products
  FOR SELECT USING (
    customer_id IN (SELECT id FROM customers WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "Partner admins manage products" ON customer_products
  FOR ALL USING (is_platform_admin() OR partner_id IN (
    SELECT partner_id FROM user_roles WHERE user_id = auth.uid() AND role = 'partner_admin'
  ));
